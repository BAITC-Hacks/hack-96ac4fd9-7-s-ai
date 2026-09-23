import type { CreateMatchInput, Language } from '../../../shared/types.js';

export type Locale = Language;
export const DEFAULT_LOCALE: Locale = 'kz';
export const localeOf = (input: CreateMatchInput): Locale => input.locale ?? DEFAULT_LOCALE;

const MONTHS: Record<Locale, string[]> = {
  kz: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export function formatDate(isoDate: string, locale: Locale): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[locale][month! - 1]} ${year}`;
}

export function formatMoney(amount: number, locale: Locale): string {
  const grouped = new Intl.NumberFormat('en-US').format(amount);
  return `${locale === 'en' ? grouped : grouped.replaceAll(',', ' ')} ₸`;
}

// Dataset values stay canonical in the API; only the text around them is localized.
const LABELS: Record<string, Record<Locale, string>> = {
  'Алматы': { kz: 'Алматы', ru: 'Алматы', en: 'Almaty' },
  'Астана': { kz: 'Астана', ru: 'Астана', en: 'Astana' },
  'Зарубежье': { kz: 'Шетел', ru: 'Зарубежье', en: 'Abroad' },
  'Банкетный зал': { kz: 'Банкет залы', ru: 'Банкетный зал', en: 'Banquet hall' },
  'Ведущий': { kz: 'Жүргізуші', ru: 'Ведущий', en: 'Host' },
  'Ведущий церемонии': { kz: 'Рәсім жүргізушісі', ru: 'Ведущий церемонии', en: 'Ceremony host' },
  'Видеограф': { kz: 'Видеограф', ru: 'Видеограф', en: 'Videographer' },
  'Декоратор': { kz: 'Безендіруші', ru: 'Декоратор', en: 'Decorator' },
  'Загородная площадка': { kz: 'Қала сыртындағы алаң', ru: 'Загородная площадка', en: 'Countryside venue' },
  'Инструменталист': { kz: 'Аспапшы', ru: 'Инструменталист', en: 'Instrumentalist' },
  'Лайв-бэнд': { kz: 'Жанды музыка тобы', ru: 'Лайв-бэнд', en: 'Live band' },
  'Национальный ансамбль': { kz: 'Ұлттық ансамбль', ru: 'Национальный ансамбль', en: 'Traditional ensemble' },
  'Отель': { kz: 'Қонақүй', ru: 'Отель', en: 'Hotel' },
  'Подарки и сувениры': { kz: 'Сыйлықтар мен кәдесыйлар', ru: 'Подарки и сувениры', en: 'Gifts and souvenirs' },
  'Ресторан': { kz: 'Мейрамхана', ru: 'Ресторан', en: 'Restaurant' },
  'Танцевальный коллектив': { kz: 'Би ұжымы', ru: 'Танцевальный коллектив', en: 'Dance group' },
  'Флорист': { kz: 'Флорист', ru: 'Флорист', en: 'Florist' },
  'Фото и видеобудки': { kz: 'Фото және видеокабиналар', ru: 'Фото и видеобудки', en: 'Photo and video booths' },
  'Фотограф': { kz: 'Фотограф', ru: 'Фотограф', en: 'Photographer' },
  'Шоу-программа': { kz: 'Шоу-бағдарлама', ru: 'Шоу-программа', en: 'Show programme' },
  'день рождения': { kz: 'туған күн', ru: 'день рождения', en: 'birthday' },
  'конференция': { kz: 'конференция', ru: 'конференция', en: 'conference' },
  'корпоратив': { kz: 'корпоратив', ru: 'корпоратив', en: 'corporate' },
  'свадьба': { kz: 'үйлену тойы', ru: 'свадьба', en: 'wedding' },
  'той': { kz: 'той', ru: 'той', en: 'toi' },
  'юбилей': { kz: 'мерейтой', ru: 'юбилей', en: 'anniversary' },
};
export const label = (value: string, locale: Locale): string => LABELS[value]?.[locale] ?? value;

const LANGUAGE_LIST: Record<Locale, Record<Language, string>> = {
  kz: { ru: 'орыс', kz: 'қазақ', en: 'ағылшын' },
  ru: { ru: 'русский', kz: 'казахский', en: 'английский' },
  en: { ru: 'Russian', kz: 'Kazakh', en: 'English' },
};
const LANGUAGE_IN: Record<Locale, Record<Language, string>> = {
  kz: { ru: 'орыс', kz: 'қазақ', en: 'ағылшын' },
  ru: { ru: 'русском', kz: 'казахском', en: 'английском' },
  en: { ru: 'Russian', kz: 'Kazakh', en: 'English' },
};

export interface FactParts {
  date: string; eventType: string; price: number; budget: number;
  requestedLanguage: Language | undefined; languages: Language[];
  durationHours: number | undefined; maxHours: number | null;
}

export function factSentences(locale: Locale, parts: FactParts): { base: string; language: string; duration: string | null } {
  const date = formatDate(parts.date, locale);
  const type = label(parts.eventType, locale);
  const price = formatMoney(parts.price, locale);
  const diff = formatMoney(parts.budget - parts.price, locale);
  const equal = parts.price === parts.budget;
  const list = parts.languages.map(item => LANGUAGE_LIST[locale][item]).join(', ');
  const h = parts.durationHours;
  if (locale === 'ru') return {
    base: `По календарю свободен ${date}; работает с форматом «${type}»; цена от ${price}, ${equal ? 'равна бюджету' : `на ${diff} ниже бюджета`}`,
    language: parts.requestedLanguage ? `работает на ${LANGUAGE_IN.ru[parts.requestedLanguage]} языке` : `языки работы: ${list}`,
    duration: h === undefined ? null : parts.maxHours === null
      ? `ограничение по длительности к запрошенным ${h} ч не применяется`
      : `покрывает запрошенные ${h} ч, максимум ${parts.maxHours} ч`,
  };
  if (locale === 'en') return {
    base: `Free on ${date} per the calendar; takes ${type} events; starting price ${price}, ${equal ? 'equal to the budget' : `${diff} under budget`}`,
    language: parts.requestedLanguage ? `works in ${LANGUAGE_IN.en[parts.requestedLanguage]}` : `working languages: ${list}`,
    duration: h === undefined ? null : parts.maxHours === null
      ? `no duration limit applies to the requested ${h} h`
      : `covers the requested ${h} h (up to ${parts.maxHours} h)`,
  };
  return {
    base: `Дерек күнтізбесінде ${date} күні бос; «${type}» форматын қабылдайды; бастапқы бағасы ${price}, ${equal ? 'бюджетке тең' : `бюджеттен ${diff} төмен`}`,
    language: parts.requestedLanguage ? `${LANGUAGE_IN.kz[parts.requestedLanguage]} тілінде жұмыс істейді` : `жұмыс тілдері: ${list}`,
    duration: h === undefined ? null : parts.maxHours === null
      ? `сұралған ${h} сағатқа қатысу ұзақтығы бойынша шектеу қолданылмайды`
      : `сұралған ${h} сағатқа жеткілікті, ең көбі ${parts.maxHours} сағат`,
  };
}

export function quotePrefix(locale: Locale, excerpt: string): string {
  if (locale === 'ru') return `Из профиля: «${excerpt}».`;
  if (locale === 'en') return `From the profile: “${excerpt}”.`;
  return `Профильдегі дерек: «${excerpt}».`;
}

export interface Exclusions { busy: number; budget: number; format: number; language: number; duration: number }

export function reasonText(locale: Locale, input: CreateMatchInput, excluded: Exclusions): string {
  const date = formatDate(input.eventDate, locale);
  const type = label(input.eventType, locale);
  const lines: Record<Locale, Record<keyof Exclusions, string>> = {
    kz: { busy: `${date} күні бос емес`, budget: 'бастапқы бағасы бюджеттен жоғары', format: `«${type}» форматын қабылдамайды`,
      language: 'сұралған тіл сәйкес емес', duration: 'сұралған ұзақтыққа жетпейді' },
    ru: { busy: `заняты ${date}`, budget: 'начальная цена выше бюджета', format: `не работают с форматом «${type}»`,
      language: 'нет нужного языка', duration: 'не покрывают нужную длительность' },
    en: { busy: `busy on ${date}`, budget: 'starting price above budget', format: `do not take ${type} events`,
      language: 'requested language not offered', duration: 'cannot cover the requested duration' },
  };
  const reasons = (Object.keys(excluded) as (keyof Exclusions)[])
    .filter(key => excluded[key] > 0).map(key => `${lines[locale][key]}: ${excluded[key]}`).join('; ');
  if (!reasons) return '';
  if (locale === 'ru') return ` Причины отсева: ${reasons}. У одного профиля может быть несколько причин.`;
  if (locale === 'en') return ` Reasons for exclusion: ${reasons}. One profile can have several reasons.`;
  return ` Өтпеу себептері: ${reasons}. Бір профильде бірнеше себеп қабаттасуы мүмкін.`;
}

export function noCategoryMessage(locale: Locale, input: CreateMatchInput): string {
  const city = label(input.city, locale);
  const category = label(input.category, locale);
  if (locale === 'ru') return `В каталоге нет профилей категории «${category}» в городе ${city}.`;
  if (locale === 'en') return `The catalogue has no ${category} profiles in ${city}.`;
  return `Берілген каталогта ${city} қаласында «${category}» санатындағы профиль жоқ.`;
}

export function noMatchMessage(locale: Locale, total: number): string {
  if (locale === 'ru') return `В городе и категории профилей: ${total}, но ни один не подходит под все условия.`;
  if (locale === 'en') return `There are ${total} profiles in this city and category, but none meets all the conditions.`;
  return `Қала мен санатта ${total} профиль бар, бірақ шарттардың бәріне сәйкес ешкім жоқ.`;
}

export function foundMessage(locale: Locale, total: number, eligible: number, shown: number): string {
  if (locale === 'ru') return `Из ${total} кандидатов условиям соответствуют ${eligible}; показано карточек: ${shown}.`;
  if (locale === 'en') return `${eligible} of ${total} candidates meet the conditions; showing ${shown}.`;
  return `${total} кандидаттың ${eligible}-і шарттардан өтті; ${shown} карточка көрсетілді.`;
}
