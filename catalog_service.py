"""Read-only catalog discovery, detailed profiles and calendar-aware comparison.

Source records come from matcher.load_catalog. This service neither changes the
source catalog nor applies the recommendation engine's filters implicitly.
"""

import re
from datetime import date

from evidence import fact_for
from matcher import CALENDAR_MIN, CALENDAR_MAX


def _language(value):
    if value not in ('kk', 'ru'):
        raise ValueError('Интерфейс тілін таңдаңыз / Выберите язык интерфейса')
    return value


def _message(language, kazakh, russian):
    return kazakh if language == 'kk' else russian


def _calendar():
    return {'min': CALENDAR_MIN, 'max': CALENDAR_MAX}


def _string(value, label, language, maximum=None):
    if value is None:
        return ''
    if not isinstance(value, str):
        raise ValueError(_message(language, f'{label}: мәтін енгізіңіз', f'{label}: введите текст'))
    value = value.strip()
    if maximum is not None and len(value) > maximum:
        raise ValueError(_message(language, f'{label}: ең көбі {maximum} таңба', f'{label}: не более {maximum} символов'))
    return value


def _positive_integer(value, label, language, maximum=None):
    # GET values are strings; integer callers are also safe. Floats (even 1.0),
    # booleans, exponent notation and nonfinite values are deliberately rejected.
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        valid = False
    else:
        text = str(value).strip()
        valid = bool(re.fullmatch(r'[0-9]{1,9}', text))
    if not valid:
        raise ValueError(_message(language, f'{label}: оң бүтін сан енгізіңіз', f'{label}: введите положительное целое число'))
    number = int(text)
    if number < 1 or (maximum is not None and number > maximum):
        bounds = f'1–{maximum}' if maximum is not None else '1+'
        raise ValueError(_message(language, f'{label}: рұқсат етілген аралық {bounds}', f'{label}: допустимый диапазон {bounds}'))
    return number


def _optional_date(value, language):
    if value is None or value == '':
        return None
    try:
        if not isinstance(value, str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', value):
            raise ValueError
        parsed = date.fromisoformat(value)
        if str(parsed) != value or not CALENDAR_MIN <= value <= CALENDAR_MAX:
            raise ValueError
    except ValueError:
        raise ValueError(_message(language,
                                 'Күнді 2026-09-23 пен 2026-12-31 аралығынан таңдаңыз',
                                 'Выберите дату с 2026-09-23 по 2026-12-31')) from None
    return value


def _item(profile, language):
    return {
        'id': profile['id'],
        'name': profile['anon_name'],
        'categories': list(profile['categories']),
        'city': profile['city'],
        'price_from_kzt': profile['price_from_kzt'],
        'languages': list(profile['languages']),
        'max_hours': profile['max_hours'],
        'synthetic': profile['synthetic'],
        'city_imputed': profile['city_imputed'],
        'price_imputed': profile['price_imputed'],
        'summary': fact_for(profile, language).rstrip('.!?') + '.',
    }


def _data_notes(profile, language):
    notes = []
    if profile['synthetic']:
        notes.append(_message(language, 'Ұйымдастырушы берген синтетикалық профиль.',
                              'Синтетический профиль из каталога организатора.'))
    if profile['city_imputed']:
        notes.append(_message(language, 'Қала датасетті дайындау кезінде толықтырылған.',
                              'Город проставлен при подготовке датасета.'))
    if profile['price_imputed']:
        notes.append(_message(language, 'Бастапқы баға датасетті дайындау кезінде толықтырылған.',
                              'Начальная цена проставлена при подготовке датасета.'))
    # These differences were checked against the supplied CSV and its HTML
    # preview. Explain them without rewriting organizer-provided source fields.
    conflicts = {
        'HK-35215': (
            'Сипаттамада конференциялар аталған, бірақ құрылымдық форматтар тізімінде жоқ; іріктеу форматтар тізіміне сүйенеді.',
            'В описании упомянуты конференции, но в списке форматов их нет; подбор опирается на список форматов.'),
        'HK-77838': (
            'Тілдер өрісінде орысша және қазақша көрсетілген, ал сипаттамада жүргізу тілі ретінде тек қазақша аталған; іріктеу тілдер өрісіне сүйенеді.',
            'В поле языков указаны русский и казахский, а описание называет языком проведения только казахский; подбор опирается на поле языков.'),
        'HK-90009': (
            'Сипаттамада жалға алу 3 сағаттан басталатыны көрсетілген; құрылымдық өрісте тек 6 сағаттық максимум бар.',
            'В описании аренда начинается от 3 часов; структурированное поле содержит только максимум 6 часов.'),
    }
    if profile['id'] in conflicts:
        notes.append(conflicts[profile['id']][0 if language == 'kk' else 1])
    return notes


def _detail(profile, language):
    result = _item(profile, language)
    result.update({
        'description': profile['description'],
        'event_formats': list(profile['event_formats']),
        'busy_dates': list(profile['busy_dates']),
        'calendar': _calendar(),
        'data_notes': _data_notes(profile, language),
    })
    return result


def browse_catalog(catalog, params):
    """Search source text and browse exact city/category filters with pagination.

    Out-of-range positive pages return an empty items list, not a substituted
    page. total_pages is zero when the filtered catalog is empty.
    """
    if not isinstance(params, dict):
        raise ValueError('Сұраныс пішімі қате / Некорректный запрос')
    language = _language(params.get('ui_language', 'kk'))
    city = _string(params.get('city', ''), 'Қала' if language == 'kk' else 'Город', language)
    category = _string(params.get('category', ''), 'Санат' if language == 'kk' else 'Категория', language)
    text_query = _string(params.get('q', ''), 'Іздеу' if language == 'kk' else 'Поиск', language, maximum=500).casefold()
    cities = {profile['city'] for profile in catalog}
    categories = {value for profile in catalog for value in profile['categories']}
    if city and city not in cities:
        raise ValueError(_message(language, 'Қаланы каталог тізімінен таңдаңыз', 'Выберите город из списка каталога'))
    if category and category not in categories:
        raise ValueError(_message(language, 'Санатты каталог тізімінен таңдаңыз', 'Выберите категорию из списка каталога'))
    sort = params.get('sort', 'price_asc')
    if sort not in ('price_asc', 'price_desc', 'name'):
        raise ValueError(_message(language, 'Баға немесе атау бойынша сұрыптауды таңдаңыз', 'Выберите сортировку по цене или имени'))
    page = _positive_integer(params.get('page', '1'), 'Бет' if language == 'kk' else 'Страница', language)
    page_size = _positive_integer(params.get('page_size', '12'), 'Бет өлшемі' if language == 'kk' else 'Размер страницы', language, maximum=24)

    def matches(profile):
        if city and profile['city'] != city:
            return False
        if category and category not in profile['categories']:
            return False
        if text_query:
            haystack = ' '.join((profile['id'], profile['anon_name'], profile['city'],
                                 ' '.join(profile['categories']), profile['description'])).casefold()
            if text_query not in haystack:
                return False
        return True

    profiles = [profile for profile in catalog if matches(profile)]
    if sort == 'name':
        profiles.sort(key=lambda profile: (profile['anon_name'].casefold(), profile['id']))
    elif sort == 'price_desc':
        profiles.sort(key=lambda profile: (-profile['price_from_kzt'], profile['id']))
    else:
        profiles.sort(key=lambda profile: (profile['price_from_kzt'], profile['id']))
    total = len(profiles)
    offset = (page - 1) * page_size
    return {
        'items': [_item(profile, language) for profile in profiles[offset:offset + page_size]],
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size,
    }


def contractor_detail(catalog, id, ui_language='kk'):
    """Return a source-complete profile; unknown IDs raise KeyError for HTTP 404."""
    language = _language(ui_language)
    if not isinstance(id, str) or not id.strip():
        raise KeyError(id)
    identifier = id.strip()
    profile = next((profile for profile in catalog if profile['id'] == identifier), None)
    if profile is None:
        raise KeyError(identifier)
    return _detail(profile, language)


def compare_contractors(catalog, ids, date_value=None, ui_language='kk'):
    """Compare up to three distinct profiles, keeping the caller's order.

    Without a date, availability is unknown (null). A selected in-window date
    gives a boolean derived only from the supplied complete busy_dates lists.
    """
    language = _language(ui_language)
    selected_date = _optional_date(date_value, language)
    if isinstance(ids, str):
        ids = ids.split(',') if ids else []
    if not isinstance(ids, (list, tuple)):
        raise ValueError(_message(language, 'Салыстыру үшін профильдер тізімін беріңіз', 'Передайте список профилей для сравнения'))
    if len(ids) > 3:
        raise ValueError(_message(language, 'Ең көбі үш мердігерді салыстыруға болады', 'Можно сравнить не более трёх подрядчиков'))
    identifiers = []
    for identifier in ids:
        if not isinstance(identifier, str) or not identifier.strip():
            raise ValueError(_message(language, 'Профиль идентификаторы қате', 'Некорректный идентификатор профиля'))
        identifiers.append(identifier.strip())
    if len(set(identifiers)) != len(identifiers):
        raise ValueError(_message(language, 'Салыстыру үшін әртүрлі мердігерлерді таңдаңыз', 'Выберите разных подрядчиков для сравнения'))
    by_id = {profile['id']: profile for profile in catalog}
    if any(identifier not in by_id for identifier in identifiers):
        raise ValueError(_message(language, 'Таңдалған профиль каталогта жоқ', 'Выбранного профиля нет в каталоге'))
    items = []
    for identifier in identifiers:
        profile = by_id[identifier]
        detail = _detail(profile, language)
        detail['available_on_date'] = None if selected_date is None else selected_date not in profile['busy_dates']
        items.append(detail)
    return {'items': items, 'date': selected_date, 'calendar': _calendar()}
