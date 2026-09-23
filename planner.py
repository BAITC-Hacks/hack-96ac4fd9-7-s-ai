"""Deterministic event-team planning over the organizer's existing catalog.

The planner finds complete assignments for at most four requested categories.
Every assignment uses different profile IDs, respects all structured filters,
and fits one total starting-price budget. It never creates or books providers.
"""

from collections import Counter
from datetime import date, timedelta

from matcher import (CALENDAR_MIN, CALENDAR_MAX, _card, _first_failure,
                     _money, _normalize_query, _ranking_evidence)


_FILTERS = ('busy_date', 'event_format', 'language', 'duration')


def _localized(language, kk, ru):
    return kk if language == 'kk' else ru


def _normalize_plan(catalog, payload):
    if not isinstance(payload, dict):
        raise ValueError('Сұраныс пішімі қате / Некорректный запрос')
    language = payload.get('ui_language', 'kk')
    categories = payload.get('categories')
    if not isinstance(categories, list) or not 1 <= len(categories) <= 4:
        raise ValueError(_localized(language, '1–4 мердігер санатын таңдаңыз', 'Выберите от 1 до 4 категорий подрядчиков'))
    if any(not isinstance(category, str) or not category.strip() for category in categories):
        raise ValueError(_localized(language, 'Санаттарды каталог тізімінен таңдаңыз', 'Выберите категории из списка каталога'))
    categories = [category.strip() for category in categories]
    if len(categories) != len(set(categories)):
        raise ValueError(_localized(language, 'Әр санатты бір рет таңдаңыз', 'Выберите каждую категорию только один раз'))
    available = {category for profile in catalog for category in profile['categories']}
    if any(category not in available for category in categories):
        raise ValueError(_localized(language, 'Санаттарды каталог тізімінен таңдаңыз', 'Выберите категории из списка каталога'))
    # Reuse the same date, numeric, enum, optional-field and language validation
    # as single-contractor selection. Its budget is explicitly a total here.
    query = _normalize_query(catalog, dict(payload, category=categories[0]))
    query.pop('category')
    query['categories'] = categories
    return query


def _candidates_for_date(catalog, query):
    groups, results = {}, []
    language = query['ui_language']
    labels = ({'busy_date': 'күні бос емес', 'event_format': 'форматы сәйкес емес',
               'language': 'тілі сәйкес емес', 'duration': 'ұзақтық шегінен асады'} if language == 'kk' else
              {'busy_date': 'заняты в этот день', 'event_format': 'не подходит формат',
               'language': 'не подходит язык', 'duration': 'превышен лимит часов'})
    for category in query['categories']:
        base = [profile for profile in catalog if profile['city'] == query['city'] and category in profile['categories']]
        exclusions = Counter({key: 0 for key in _FILTERS})
        eligible = []
        for profile in base:
            failure = _first_failure(profile, query, ignore=('budget',))
            if failure is None:
                eligible.append(profile)
            else:
                exclusions[failure] += 1
        eligible.sort(key=lambda profile: (profile['price_from_kzt'], profile['id']))
        groups[category] = eligible
        if not base:
            message = _localized(language, 'Бұл қалада осы санат бойынша профиль жоқ.',
                                 'В этом городе нет профилей этой категории.')
        elif eligible:
            message = _localized(language,
                                 f'Күн, формат, тіл және ұзақтық шарттарына {len(eligible)} үміткер сай; жалпы бюджет құрам үшін тексеріледі.',
                                 f'По дате, формату, языку и длительности подходят {len(eligible)} кандидатов; общий бюджет проверяется для всей команды.')
        else:
            reasons = ', '.join(f'{labels[key]}: {exclusions[key]}' for key in _FILTERS if exclusions[key])
            message = _localized(language, 'Шарттарға сай үміткер жоқ; алғашқы сәйкес келмеген шарт бойынша: ',
                                 'Подходящих кандидатов нет; по первому неподходящему условию: ') + reasons + '.'
        results.append({'category': category, 'total_candidates': len(base), 'eligible_count': len(eligible),
                        'excluded_counts': dict(exclusions), 'message': message})
    return groups, results


def _search_order(groups):
    # Start with scarce roles so conflicts and impossible branches end early.
    return sorted(groups, key=lambda category: (len(groups[category]), category))


def _lower_bound(groups, order, depth, used):
    """Optimistic remaining cost: separate cheapest unused provider per role.

    A provider can occur in two minima, so this bound can be below the true
    assignment cost; it never prunes a feasible or cheaper complete assignment.
    """
    total = 0
    for category in order[depth:]:
        cheapest = next((profile for profile in groups[category] if profile['id'] not in used), None)
        if cheapest is None:
            return None
        total += cheapest['price_from_kzt']
    return total


def _minimum_total(groups):
    """Exact minimum complete cost, including the one-profile-one-role rule."""
    if not groups or any(not group for group in groups.values()):
        return None
    order = _search_order(groups)
    best = None

    def visit(depth, cost, used):
        nonlocal best
        if depth == len(order):
            if best is None or cost < best:
                best = cost
            return
        bound = _lower_bound(groups, order, depth, used)
        if bound is None or (best is not None and cost + bound >= best):
            return
        for profile in groups[order[depth]]:
            identifier = profile['id']
            if identifier in used:
                continue
            updated = cost + profile['price_from_kzt']
            if best is not None and updated >= best:
                continue
            visit(depth + 1, updated, used | {identifier})

    visit(0, 0, set())
    return best


def _budget_teams(groups, query, rankings):
    """Enumerate every budget-feasible assignment, deduplicated by member set."""
    if any(not group for group in groups.values()):
        return []
    order = _search_order(groups)
    by_members = {}
    requested = query['categories']
    budget = query['budget_kzt']

    def visit(depth, cost, score, used, assignment):
        if depth == len(order):
            members = tuple(sorted(used))
            assigned_ids = tuple(assignment[category]['id'] for category in requested)
            team = {'members': members, 'assignment': dict(assignment), 'cost': cost,
                    'score': score, 'tie': assigned_ids}
            previous = by_members.get(members)
            # Same people in different compatible slots are one team, not an
            # artificial alternative. Retain one stable category assignment.
            if previous is None or assigned_ids < previous['tie']:
                by_members[members] = team
            return
        bound = _lower_bound(groups, order, depth, used)
        if bound is None or cost + bound > budget:
            return
        category = order[depth]
        for profile in groups[category]:
            identifier = profile['id']
            updated = cost + profile['price_from_kzt']
            if identifier in used or updated > budget:
                continue
            assignment[category] = profile
            visit(depth + 1, updated, score + rankings[identifier]['score'], used | {identifier}, assignment)
            assignment.pop(category)

    visit(0, 0, 0, set(), {})
    return list(by_members.values())


def _select_teams(teams):
    if not teams:
        return []
    best = min(teams, key=lambda team: (-team['score'], team['cost'], team['tie']))
    selected = [('best_fit', best)]
    economy = min(teams, key=lambda team: (team['cost'], -team['score'], team['tie']))
    if economy['members'] != best['members']:
        selected.append(('economy', economy))
    remaining = [team for team in teams if all(team['members'] != chosen['members'] for _, chosen in selected)]
    if remaining:
        # An alternative changes as many people as possible relative to every
        # displayed choice, then favors evidence relevance and lower cost.
        alternative = min(remaining, key=lambda team: (
            -min(len(set(team['members']) - set(chosen['members'])) for _, chosen in selected),
            -team['score'], team['cost'], team['tie']))
        selected.append(('alternative', alternative))
    return selected


def _bundle(code, team, query, rankings):
    kk = query['ui_language'] == 'kk'
    labels = {'best_fit': ('Сәйкестігі жоғары құрам', 'Состав по соответствию'),
              'economy': ('Ең үнемді құрам', 'Самый экономный состав'),
              'alternative': ('Басқа құрам', 'Альтернативный состав')}
    proofs = Counter(rankings[profile['id']]['preference_match']['source_excerpt']
                     for profile in team['assignment'].values() if rankings[profile['id']]['preference_match'])
    items = []
    for category in query['categories']:
        profile = team['assignment'][category]
        ranking = dict(rankings[profile['id']])
        if ranking['preference_match']:
            ranking['include_fact'] = proofs[ranking['preference_match']['source_excerpt']] > 1
        # Each contractor card retains the matcher's source evidence and exact
        # optional preference excerpt. The bundle totals enforce the budget.
        item_query = dict(query, category=category)
        items.append(_card(profile, item_query, ranking))
    total = team['cost']
    remaining = query['budget_kzt'] - total
    explanation = (f'{len(items)} санаттың әрқайсысына бөлек мердігер таңдалды; бастапқы бағалар қосындысы {_money(total)} ₸, жалпы бюджеттен {_money(remaining)} ₸ қалады.' if kk else
                   f'Для каждой из {len(items)} категорий выбран отдельный подрядчик; сумма начальных цен {_money(total)} ₸, остаток общего бюджета {_money(remaining)} ₸.')
    return {'id': code, 'label': labels[code][0 if kk else 1], 'items': items,
            'total_price_from_kzt': total, 'budget_remaining_kzt': remaining,
            'explanation': explanation}


def _date_radar(catalog, query):
    radar = []
    current = date.fromisoformat(query['date'])
    for offset in range(1, 15):
        day = str(current + timedelta(days=offset))
        if day > CALENDAR_MAX:
            break
        groups, _ = _candidates_for_date(catalog, dict(query, date=day))
        minimum = _minimum_total(groups)
        radar.append({'date': day, 'covered_categories': sum(bool(group) for group in groups.values()),
                      'total_categories': len(groups), 'complete_bundle_possible': minimum is not None,
                      'min_total_price_from_kzt': minimum,
                      'within_budget': minimum is not None and minimum <= query['budget_kzt'],
                      'candidate_counts': {category: len(group) for category, group in groups.items()}})
    return radar


def plan_event(catalog, payload):
    """Plan complete, distinct-provider teams and truthful nearby-date costs."""
    query = _normalize_plan(catalog, payload)
    language = query['ui_language']
    groups, category_results = _candidates_for_date(catalog, query)
    covered = sum(bool(group) for group in groups.values())
    minimum = _minimum_total(groups)
    rankings = {profile['id']: _ranking_evidence(profile, query)
                for group in groups.values() for profile in group}
    teams = _budget_teams(groups, query, rankings) if minimum is not None and minimum <= query['budget_kzt'] else []
    bundles = [_bundle(code, team, query, rankings) for code, team in _select_teams(teams)]
    if bundles:
        message = _localized(language,
                             f'Бюджетке сай {len(teams)} бөлек толық құрам табылды; {len(bundles)} нұсқа көрсетілді.',
                             f'Найдено {len(teams)} разных полных составов в бюджете; показано {len(bundles)} вариантов.')
    elif minimum is not None:
        message = _localized(language,
                             f'Барлық санатты бөлек мердігерлермен жабу үшін бастапқы бағалар бойынша кемінде {_money(minimum)} ₸ қажет; бюджетке {_money(minimum - query["budget_kzt"])} ₸ жетпейді.',
                             f'Чтобы закрыть все категории разными подрядчиками, по начальным ценам нужно минимум {_money(minimum)} ₸; бюджету не хватает {_money(minimum - query["budget_kzt"])} ₸.')
    elif covered < len(groups):
        message = _localized(language,
                             f'{len(groups)} санаттың {covered} санатында ғана шарттарға сай үміткер бар; толық құрам жиналмады.',
                             f'Подходящие кандидаты есть только в {covered} из {len(groups)} категорий; полный состав не собран.')
    else:
        message = _localized(language,
                             'Әр санатта үміткер бар, бірақ бір профильді екі рөлге қолданбай толық құрам жинау мүмкін емес.',
                             'В каждой категории есть кандидаты, но собрать полный состав без использования одного профиля в двух ролях невозможно.')
    return {
        'outcome': 'bundles' if bundles else 'no_complete_bundle',
        'query': query,
        'bundles': bundles,
        'summary': {'requested_categories': len(groups), 'covered_categories': covered,
                    'feasible_bundle_count': len(teams), 'minimum_feasible_total_kzt': minimum,
                    'category_results': category_results, 'message': message},
        'date_radar': _date_radar(catalog, query),
        'calendar': {'min': CALENDAR_MIN, 'max': CALENDAR_MAX},
        'pricing_note': _localized(language,
                                  'Бұл бір іс-шараға каталогтағы «бастап» бағаларының қосындысы; мердігерлердің соңғы ұсынысы немесе бронь емес.',
                                  'Это сумма каталожных цен «от» за одно мероприятие; она не является итоговым предложением подрядчиков или бронированием.'),
        'ranking_method': _localized(language,
                                     '1–4 санаттың барлық жарамды комбинациялары нақты тексеріледі: бір профиль бір рөлге ғана алынады. Бірінші құрам сипаттама мен қалауларға сәйкестік ұпайларының қосындысымен, үнемді құрам ең төмен бағамен таңдалады; бірдей құрам қайталанбайды. Балама құрамда адамдар көбірек өзгереді. Күндер шолуы келесі 14 күнмен және берілген күнтізбемен шектеледі; ең аз баға рөлдер қайшылығын да ескереді.',
                                     'Точно перебираются допустимые комбинации 1–4 категорий: один профиль может занять только одну роль. Первый состав выбирается по сумме баллов соответствия описаний и пожеланий, экономный — по минимальной цене; одинаковые команды не повторяются. Альтернатива меняет больше участников. Обзор дат ограничен следующими 14 днями и окном календаря; минимальная стоимость учитывает конфликты ролей.'),
    }
