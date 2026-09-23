"""Deterministic catalog matching with hard constraints and inspectable evidence.

No booking availability is inferred outside the supplied calendar. Descriptions
inform ranking and explanations; structured fields remain the filter authority.
"""

import csv
import math
import re
from collections import Counter
from datetime import date, timedelta

from evidence import fact_for

CALENDAR_MIN = '2026-09-23'
CALENDAR_MAX = '2026-12-31'
FORMATS = ('свадьба', 'той', 'корпоратив', 'конференция', 'юбилей', 'день рождения')
LANGUAGES = ('русский', 'казахский', 'английский')
CITIES = ('Алматы', 'Астана', 'Зарубежье')
FAILURE_KEYS = ('busy_date', 'event_format', 'budget', 'language', 'duration')
LIST_FIELDS = ('categories', 'event_formats', 'languages', 'busy_dates')
FLAG_FIELDS = ('synthetic', 'city_imputed', 'price_imputed')
REQUIRED_FIELDS = ('id', 'anon_name', 'categories', 'city', 'city_imputed',
                   'synthetic', 'price_from_kzt', 'price_imputed', 'event_formats',
                   'languages', 'max_hours', 'busy_dates', 'description')

# Distinct groups, each counted once. These inspect description content rather
# than awarding identical points for the already-filtered event_formats field.
EVENT_GROUPS = {
    'свадьба': (('свад', 'невест', 'молодож', 'бракосочет', 'wedding'),
               ('истори', 'индивидуаль', 'персонал'), ('эмоци', 'естествен', 'искрен'),
               ('церемон', 'регистрац', 'букет')),
    'той': (('той', 'казах', 'националь', 'этник', 'домбр'),
            ('традици', 'культур', 'юрты'), ('свад', 'торжеств', 'праздник'),
            ('песн', 'музык', 'ансамбл', 'вокал')),
    'корпоратив': (('корпоратив', 'бизнес', 'делов', 'компани'),
                   ('бренд', 'логотип', 'презентац'),
                   ('интерактив', 'импровиза', 'диалог', 'взаимодейств'),
                   ('форум', 'технолог', 'сценограф', 'светов')),
    'конференция': (('конференц', 'форум', 'делов', 'бизнес'),
                    ('презентац', 'техническ', 'мультимед', 'звукореж'),
                    ('международ', 'бренд', 'технолог'),
                    ('организац', 'сценар', 'репортаж', 'президиум')),
    'юбилей': (('юбил', 'торжеств', 'семейн'), ('поколен', 'ретро', 'традици'),
               ('индивидуаль', 'персонал', 'истори'), ('гост', 'уют', 'тепл', 'тёпл')),
    'день рождения': (('день рожден', 'детск', 'праздник', 'частн'),
                      ('игр', 'конкурс', 'интерактив', 'развлеч'),
                      ('танц', 'фотобуд', 'фотозон', 'шоу'),
                      ('семейн', 'гост', 'улыб', 'подар')),
}

# Query aliases include Kazakh; evidence patterns target the Russian source.
PREFERENCE_GROUPS = (
    (('импровиза',), ('импровиза',)),
    (('интерактив', 'қатыстыр', 'қонақтармен', 'гостями', 'диалог'), ('интерактив', 'диалог', 'взаимодейств', 'вовлека')),
    (('спокой', 'ненавяз', 'байсалды', 'тыныш', 'сабыр', 'без пафос'), ('спокой', 'ненавяз', 'незамет', 'без спешки', 'без пафос')),
    (('юмор', 'әзіл', 'смешн', 'квн'), ('юмор', 'квн', 'stand-up', 'стендап')),
    (('естествен', 'табиғи', 'живые эмоц', 'шынайы', 'постановк'), ('естествен', 'живые эмоц', 'честные эмоц', 'искрен', 'постановоч')),
    (('репортаж', 'документаль', 'фотожурнал'), ('репортаж', 'документаль', 'фотожурнал')),
    (('джаз', 'jazz'), ('джаз', 'jazz')),
    (('домбыра', 'домбра'), ('домбр',)),
    (('скрип', 'скрипка'), ('скрип',)),
    (('саксофон', 'саксафон'), ('саксофон',)),
    (('казахск', 'қазақ', 'ұлттық', 'националь', 'традиц', 'дәстүр'), ('казах', 'националь', 'традиц', 'этно', 'домбр')),
    (('горы', 'горн', 'тау', 'панорам', 'видом'), ('горы', 'гор', 'панорам')),
    (('террас', 'ашық ауа', 'загород', 'табиғат', 'природ'), ('террас', 'зелены', 'зелёны', 'природ', 'гольф')),
    (('бренд', 'логотип', 'мерч'), ('бренд', 'логотип', 'мерч')),
    (('светов', 'неон', 'жарық', 'пиксел'), ('светов', 'неон', 'пиксел')),
    (('индивидуаль', 'персональ', 'жеке сценар', 'авторск', 'жеке дизайн'), ('индивидуаль', 'персональ', 'авторск', 'историю пары')),
    (('детск', 'балалар', 'семейн', 'отбас'), ('детск', 'семейн', 'разные поколения', 'взрослым', 'молодеж')),
    (('печать', 'басып шығар', 'фотобуд', 'зеркал', 'айна'), ('печать', 'печати', 'фотобуд', 'зеркал')),
    (('кейтеринг',), ('кейтеринг',)),
    (('парков', 'тұрақ'), ('парков',)),
)
STOPWORDS = set(('хочу нужен нужна нужны нужно ищу желательно чтобы для на и или с со от до '
                 'без при по мне нам мой наша ваш есть очень жақсы керек қажет қалаймын '
                 'үшін және мен біз бар болсын with want need the a an').split())


def _normalized_text(value):
    return str(value).casefold().replace('ё', 'е')


def _contains(text, patterns):
    return any(_normalized_text(pattern) in text for pattern in patterns)


def _as_number(value, label, language, optional=False):
    if optional and (value is None or value == ''):
        return None
    try:
        if isinstance(value, bool):
            raise ValueError
        number = float(value)
        if not math.isfinite(number) or number <= 0:
            raise ValueError
    except (ValueError, TypeError, OverflowError):
        message = (f'{label}: нөлден үлкен сан енгізіңіз' if language == 'kk'
                   else f'{label}: введите число больше нуля')
        raise ValueError(message) from None
    return int(number) if number.is_integer() else number


def load_catalog(path):
    """Read UTF-8 CSV without modifying it; validate and normalize all field types."""
    catalog = []
    seen = set()
    with open(path, encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        if not reader.fieldnames or not set(REQUIRED_FIELDS).issubset(reader.fieldnames):
            raise ValueError('Catalog is missing required columns')
        for line, raw in enumerate(reader, 2):
            if None in raw or any(raw.get(key) is None for key in REQUIRED_FIELDS):
                raise ValueError(f'Invalid CSV record at row {line}')
            entry = {key: raw[key].strip() for key in REQUIRED_FIELDS}
            rid = entry['id']
            if not rid or rid in seen:
                raise ValueError(f'Missing or duplicate catalog ID at row {line}')
            seen.add(rid)
            for key in ('anon_name', 'city', 'description'):
                if not entry[key]:
                    raise ValueError(f'{rid}: missing {key}')
            # Source descriptions are retained exactly for inspectable evidence.
            entry['description'] = raw['description']
            for key in LIST_FIELDS:
                values = [item.strip() for item in entry[key].split('|') if item.strip()]
                if len(values) != len(set(values)):
                    raise ValueError(f'{rid}: repeated {key} value')
                if key != 'busy_dates' and not values:
                    raise ValueError(f'{rid}: missing {key}')
                entry[key] = values
            for key in FLAG_FIELDS:
                if entry[key] not in ('True', 'False'):
                    raise ValueError(f'{rid}: invalid {key}')
                entry[key] = entry[key] == 'True'
            try:
                entry['price_from_kzt'] = int(entry['price_from_kzt'])
                if entry['price_from_kzt'] <= 0:
                    raise ValueError
                entry['max_hours'] = _as_number(entry['max_hours'], 'max_hours', 'ru', optional=True)
            except ValueError:
                raise ValueError(f'{rid}: invalid price or max_hours') from None
            if entry['city'] not in CITIES or not set(entry['event_formats']).issubset(FORMATS) or not set(entry['languages']).issubset(LANGUAGES):
                raise ValueError(f'{rid}: unsupported catalog enum value')
            for day in entry['busy_dates']:
                try:
                    parsed = date.fromisoformat(day)
                    if str(parsed) != day or not CALENDAR_MIN <= day <= CALENDAR_MAX:
                        raise ValueError
                except ValueError:
                    raise ValueError(f'{rid}: invalid busy date {day}') from None
            entry['busy_dates'].sort()
            catalog.append(entry)
    if not catalog:
        raise ValueError('Catalog is empty')
    return catalog


def metadata(catalog):
    """The frontend's selectable values and supplied calendar scope."""
    present_cities = {profile['city'] for profile in catalog}
    categories = sorted({category for profile in catalog for category in profile['categories']})
    formats = {value for profile in catalog for value in profile['event_formats']}
    languages = {value for profile in catalog for value in profile['languages']}
    return {
        'cities': [city for city in CITIES if city in present_cities],
        'categories': categories,
        'event_formats': [value for value in FORMATS if value in formats],
        'languages': [value for value in LANGUAGES if value in languages],
        'calendar': {'min': CALENDAR_MIN, 'max': CALENDAR_MAX},
        'stats': {'profiles': len(catalog), 'categories': len(categories),
                  'synthetic': sum(profile['synthetic'] for profile in catalog)},
    }


def _normalize_query(catalog, query):
    if not isinstance(query, dict):
        raise ValueError('Сұраныс пішімі қате / Некорректный запрос')
    language = query.get('ui_language', 'kk')
    if language not in ('kk', 'ru'):
        language = 'kk'
    meta = metadata(catalog)
    result = {'ui_language': language}
    labels = {
        'city': ('Қаланы таңдаңыз', 'Выберите город'),
        'category': ('Санатты таңдаңыз', 'Выберите категорию'),
        'event_format': ('Іс-шара форматын таңдаңыз', 'Выберите формат мероприятия'),
    }
    for key, allowed in [('city', meta['cities']), ('category', meta['categories']), ('event_format', meta['event_formats'])]:
        value = query.get(key)
        if not isinstance(value, str) or value.strip() not in allowed:
            raise ValueError(labels[key][0 if language == 'kk' else 1])
        result[key] = value.strip()
    day = query.get('date')
    try:
        if not isinstance(day, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', day):
            raise ValueError
        parsed = date.fromisoformat(day)
        if str(parsed) != day or not CALENDAR_MIN <= day <= CALENDAR_MAX:
            raise ValueError
    except ValueError:
        raise ValueError('Күнді 2026-09-23 пен 2026-12-31 аралығынан таңдаңыз' if language == 'kk'
                         else 'Выберите дату с 2026-09-23 по 2026-12-31') from None
    result['date'] = day
    result['budget_kzt'] = _as_number(query.get('budget_kzt'), 'Бюджет', language)
    result['duration_hours'] = _as_number(query.get('duration_hours'), 'Ұзақтық' if language == 'kk' else 'Длительность', language, optional=True)
    desired_language = query.get('language') or ''
    if not isinstance(desired_language, str):
        raise ValueError('Тілді таңдаңыз' if language == 'kk' else 'Выберите язык')
    desired_language = desired_language.strip().casefold()
    desired_language = {'ru': 'русский', 'kk': 'казахский', 'kz': 'казахский', 'en': 'английский',
                        'қазақша': 'казахский', 'қазақ': 'казахский', 'орысша': 'русский', 'ағылшынша': 'английский'}.get(desired_language, desired_language)
    if desired_language and desired_language not in LANGUAGES:
        raise ValueError('Тілді таңдаңыз' if language == 'kk' else 'Выберите язык')
    result['language'] = desired_language
    preferences = query.get('preferences') or ''
    if not isinstance(preferences, str) or len(preferences) > 500:
        raise ValueError('Қалауды 500 таңбадан асырмай жазыңыз' if language == 'kk'
                         else 'Опишите пожелания не более чем в 500 символах')
    result['preferences'] = preferences.strip()
    return result


def _first_failure(profile, query, ignore=()):
    checks = (
        ('busy_date', query['date'] in profile['busy_dates']),
        ('event_format', query['event_format'] not in profile['event_formats']),
        ('budget', profile['price_from_kzt'] > query['budget_kzt']),
        ('language', bool(query['language']) and query['language'] not in profile['languages']),
        ('duration', query['duration_hours'] is not None and profile['max_hours'] is not None and query['duration_hours'] > profile['max_hours']),
    )
    return next((key for key, failed in checks if failed and key not in ignore), None)


def _score(profile, query):
    text = _normalized_text(profile['description'])
    # A profile saying a quiet formal evening would NOT suit it is not evidence
    # of quiet delivery. Keep that caveat visible in the raw source, not in rank.
    text = ' '.join(part for part in re.split(r'[.!?]', text) if 'не подойдем' not in part and 'не подойдет' not in part)
    event_matches = sum(_contains(text, group) for group in EVENT_GROUPS[query['event_format']])
    preferences = _normalized_text(query['preferences'])
    preference_matches = 0
    handled_words = set()
    for aliases, evidence in PREFERENCE_GROUPS:
        if _contains(preferences, aliases):
            direction = 1
            for alias in aliases:
                for match in re.finditer(re.escape(_normalized_text(alias)), preferences):
                    before = preferences[max(0, match.start() - 35):match.start()]
                    after = preferences[match.end():match.end() + 30]
                    if (re.search(r'(?:без|не\s+хочу|не\s+нуж\w*)\s+(?:\w+\s+){0,2}$', before)
                            or re.match(r'\w*(?:сыз|сіз)\b', after)
                            or re.match(r'\w*\s+(?:болмасын|керек емес|қажет емес)', after)):
                        direction = -1
            preference_matches += direction * int(_contains(text, evidence))
            for token in re.findall(r'[\w]+', preferences, flags=re.UNICODE):
                if any(_normalized_text(alias) in token or token in _normalized_text(alias) for alias in aliases):
                    handled_words.add(token)
    tokens = set(re.findall(r'[^\W\d_]+', preferences, flags=re.UNICODE)) - STOPWORDS - handled_words
    # Prefix matching handles common Russian/Kazakh inflections without a model.
    stems = {token[:6] for token in tokens if len(token) >= 4}
    source_words = re.findall(r'[^\W\d_]+', text, flags=re.UNICODE)
    literal_matches = sum(any(word.startswith(stem) for word in source_words) for stem in stems)
    return 3 * event_matches + 6 * preference_matches + 2 * literal_matches


def _money(value):
    if float(value).is_integer():
        return f'{int(value):,}'.replace(',', ' ')
    return f'{value:,.2f}'.replace(',', ' ').rstrip('0').rstrip('.')


def _card(profile, query):
    kk = query['ui_language'] == 'kk'
    fact = fact_for(profile, query['ui_language']).rstrip('.!?')
    price, budget = _money(profile['price_from_kzt']), _money(query['budget_kzt'])
    if kk:
        explanation = f'{fact}. {query["date"]} күні каталог бойынша бос, бастапқы бағасы {price} ₸ және {budget} ₸ бюджетке сыяды.'
    else:
        explanation = f'{fact}. По каталогу свободен на {query["date"]}, цена от {price} ₸ укладывается в бюджет {budget} ₸.'
    evidence = [{'label': 'Дереккөздегі сипаттама' if kk else 'Описание в каталоге', 'text': profile['description']}]
    evidence.append({'label': 'Формат' if kk else 'Формат', 'text': query['event_format']})
    if query['language']:
        evidence.append({'label': 'Тіл' if kk else 'Язык', 'text': query['language']})
    if query['duration_hours'] is not None:
        maximum = profile['max_hours']
        duration_text = (f'{query["duration_hours"]} сағат сұралды; шектеу қолданылмайды' if maximum is None
                         else f'{query["duration_hours"]} сағат сұралды; каталогтағы максимум {maximum} сағат') if kk else (
                         f'Запрошено {query["duration_hours"]} ч; ограничение не применяется' if maximum is None
                         else f'Запрошено {query["duration_hours"]} ч; максимум по каталогу {maximum} ч')
        evidence.append({'label': 'Ұзақтық' if kk else 'Длительность', 'text': duration_text})
    if profile['price_imputed']:
        evidence.append({'label': 'Бағаның дереккөзі' if kk else 'Источник цены', 'text': 'Бастапқы баға датасетті дайындау кезінде толықтырылған' if kk else 'Начальная цена проставлена при подготовке датасета'})
    if profile['city_imputed']:
        evidence.append({'label': 'Қаланың дереккөзі' if kk else 'Источник города', 'text': 'Қала датасетті дайындау кезінде толықтырылған' if kk else 'Город проставлен при подготовке датасета'})
    if profile['synthetic']:
        evidence.append({'label': 'Дерек түрі' if kk else 'Тип данных', 'text': 'Ұйымдастырушы берген синтетикалық профиль' if kk else 'Синтетический профиль из каталога организатора'})
    return {'id': profile['id'], 'name': profile['anon_name'], 'category': query['category'],
            'city': profile['city'], 'price_from_kzt': profile['price_from_kzt'],
            'explanation': explanation, 'languages': list(profile['languages']),
            'max_hours': profile['max_hours'], 'synthetic': profile['synthetic'],
            'city_imputed': profile['city_imputed'], 'price_imputed': profile['price_imputed'],
            'evidence': evidence}


def _suggestions(candidates, query):
    """Verify each single-field alternative against every other hard constraint."""
    kk = query['ui_language'] == 'kk'
    suggestions = []
    with_budget_only = [profile for profile in candidates if _first_failure(profile, query, ignore=('budget',)) is None]
    if with_budget_only:
        minimum = min(profile['price_from_kzt'] for profile in with_budget_only)
        if minimum > query['budget_kzt']:
            suggestions.append({'type': 'budget',
                                'label': (f'Бюджет {_money(minimum)} ₸ болғанда кемінде бір нұсқа табылады' if kk
                                          else f'При бюджете {_money(minimum)} ₸ найдётся хотя бы один вариант'),
                                'query_patch': {'budget_kzt': minimum}})
    current = date.fromisoformat(query['date'])
    found = None
    for distance in range(1, 15):
        # At equal distance prefer a later date.
        for direction in (1, -1):
            day = str(current + timedelta(days=distance * direction))
            if not CALENDAR_MIN <= day <= CALENDAR_MAX:
                continue
            alternative = dict(query, date=day)
            count = sum(_first_failure(profile, alternative) is None for profile in candidates)
            if count:
                found = {'type': 'date', 'label': (f'{day}: шарттарға сай {count} нұсқа бар' if kk
                                                   else f'{day}: подходят {count} вариантов'),
                         'query_patch': {'date': day}}
                break
        if found:
            suggestions.append(found)
            break
    return suggestions


def _summary_message(query, total, eligible, excluded):
    kk = query['ui_language'] == 'kk'
    if not total:
        return (f'{query["city"]} қаласында «{query["category"]}» санаты бойынша каталогта мердігер жоқ.' if kk
                else f'В городе {query["city"]} в каталоге нет подрядчиков категории «{query["category"]}».')
    if eligible >= 3:
        return (f'Барлық шартқа {eligible} мердігер сай келді; үздік 3 нұсқа көрсетілді.' if kk
                else f'Всем условиям соответствуют {eligible} подрядчиков; показаны 3 первых варианта.')
    if eligible:
        message = (f'Барлық шартқа тек {eligible} мердігер сай келді.' if kk
                   else f'Всем условиям соответствуют только {eligible} подрядчиков.')
    else:
        message = ('Бұл қалада санат бар, бірақ барлық шартқа сай келетін мердігер табылмады.' if kk
                   else 'В этом городе категория есть, но ни один подрядчик не подходит по всем условиям.')
    if total == eligible:
        return message + (f' Каталогта бұл қала мен санат бойынша барлығы {total} профиль бар.' if kk
                          else f' В каталоге всего {total} профилей этого города и категории.')
    labels = ({'busy_date': 'күні бос емес', 'event_format': 'форматы сәйкес емес', 'budget': 'бюджеттен жоғары',
               'language': 'тілі сәйкес емес', 'duration': 'ұзақтық шегінен асады'} if kk else
              {'busy_date': 'заняты в этот день', 'event_format': 'не подходит формат', 'budget': 'выше бюджета',
               'language': 'не подходит язык', 'duration': 'превышен лимит часов'})
    details = ', '.join(f'{labels[key]}: {excluded[key]}' for key in FAILURE_KEYS if excluded[key])
    return message + (' Алғашқы сәйкес келмеген шарт бойынша: ' if kk else ' По первому неподходящему условию: ') + details + '.'


def recommend(catalog, query):
    """Return at most three actual matches; never relax a constraint implicitly."""
    query = _normalize_query(catalog, query)
    candidates = [profile for profile in catalog if profile['city'] == query['city'] and query['category'] in profile['categories']]
    excluded = Counter({key: 0 for key in FAILURE_KEYS})
    eligible = []
    for profile in candidates:
        failure = _first_failure(profile, query)
        if failure:
            excluded[failure] += 1
        else:
            eligible.append(profile)
    eligible.sort(key=lambda profile: (-_score(profile, query), profile['price_from_kzt'], profile['id']))
    cards = [_card(profile, query) for profile in eligible[:3]]
    outcome = 'matches' if eligible else ('no_eligible_candidates' if candidates else 'no_category_in_city')
    kk = query['ui_language'] == 'kk'
    return {
        'outcome': outcome, 'query': query, 'cards': cards,
        'summary': {'total_candidates': len(candidates), 'eligible_count': len(eligible), 'shown_count': len(cards),
                    'excluded_counts': dict(excluded),
                    'message': _summary_message(query, len(candidates), len(eligible), excluded)},
        'suggestions': _suggestions(candidates, query) if candidates and not eligible else [],
        'ranking_method': ('Алдымен міндетті шарттар тексеріледі. Сипаттамадағы форматқа қатысты әр мағыналық топ — 3 ұпай, қалауға сәйкес әр топ — 6, қалған сөз сәйкестігі — 2 ұпай. Қажет емес деп көрсетілген топ үшін 6 ұпай шегеріледі. Тең ұпайда бастапқы баға, одан кейін ID қолданылады. Бұл тұрақты ереже; сыртқы AI моделі қолданылмайды.' if kk else
                           'Сначала проверяются обязательные условия. Каждая смысловая группа формата в описании даёт 3 балла, группа пожеланий — 6, прочее совпадение слова — 2. За явно нежелательную группу вычитается 6 баллов. При равенстве баллов идут меньшая начальная цена, затем ID. Это постоянные правила без внешней AI-модели.'),
    }
