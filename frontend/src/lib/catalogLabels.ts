import type { Language } from '../../../shared/types';
import type { UiLocale } from './locale';

// Labels only: option values sent to the API always remain the catalogue's exact values.
const LABELS: Record<string, Record<UiLocale, string>> = {
  'Алматы': { ru: 'Алматы', kk: 'Алматы', en: 'Almaty' },
  'Астана': { ru: 'Астана', kk: 'Астана', en: 'Astana' },
  'Зарубежье': { ru: 'Зарубежье', kk: 'Шетел', en: 'Abroad' },
  'Банкетный зал': { ru: 'Банкетный зал', kk: 'Банкет залы', en: 'Banquet hall' },
  'Ведущий': { ru: 'Ведущий', kk: 'Жүргізуші', en: 'Host' },
  'Ведущий церемонии': { ru: 'Ведущий церемонии', kk: 'Рәсім жүргізушісі', en: 'Ceremony host' },
  'Видеограф': { ru: 'Видеограф', kk: 'Видеограф', en: 'Videographer' },
  'Декоратор': { ru: 'Декоратор', kk: 'Безендіруші', en: 'Decorator' },
  'Загородная площадка': { ru: 'Загородная площадка', kk: 'Қала сыртындағы алаң', en: 'Countryside venue' },
  'Инструменталист': { ru: 'Инструменталист', kk: 'Аспапшы', en: 'Instrumentalist' },
  'Лайв-бэнд': { ru: 'Лайв-бэнд', kk: 'Жанды музыка тобы', en: 'Live band' },
  'Национальный ансамбль': { ru: 'Национальный ансамбль', kk: 'Ұлттық ансамбль', en: 'Traditional ensemble' },
  'Отель': { ru: 'Отель', kk: 'Қонақүй', en: 'Hotel' },
  'Подарки и сувениры': { ru: 'Подарки и сувениры', kk: 'Сыйлықтар мен кәдесыйлар', en: 'Gifts and souvenirs' },
  'Ресторан': { ru: 'Ресторан', kk: 'Мейрамхана', en: 'Restaurant' },
  'Танцевальный коллектив': { ru: 'Танцевальный коллектив', kk: 'Би ұжымы', en: 'Dance group' },
  'Флорист': { ru: 'Флорист', kk: 'Флорист', en: 'Florist' },
  'Фото и видеобудки': { ru: 'Фото и видеобудки', kk: 'Фото және видеокабиналар', en: 'Photo and video booths' },
  'Шоу-программа': { ru: 'Шоу-программа', kk: 'Шоу-бағдарлама', en: 'Show programme' },
  'Скрипач': { ru: 'Скрипач', kk: 'Скрипкашы', en: 'Violinist' },
  'Фотограф': { ru: 'Фотограф', kk: 'Фотограф', en: 'Photographer' },
  'Свадьба': { ru: 'Свадьба', kk: 'Үйлену тойы', en: 'Wedding' },
  'Корпоратив': { ru: 'Корпоратив', kk: 'Корпоратив', en: 'Corporate event' },
  'день рождения': { ru: 'день рождения', kk: 'Туған күн', en: 'Birthday' },
  'конференция': { ru: 'конференция', kk: 'Конференция', en: 'Conference' },
  'корпоратив': { ru: 'корпоратив', kk: 'Корпоратив', en: 'Corporate event' },
  'свадьба': { ru: 'свадьба', kk: 'Үйлену тойы', en: 'Wedding' },
  'той': { ru: 'той', kk: 'Той', en: 'Toi (Kazakh celebration)' },
  'юбилей': { ru: 'юбилей', kk: 'Мерейтой', en: 'Anniversary' },
};
const LANGUAGES: Record<UiLocale, Record<Language, string>> = {
  ru: { kz: 'Қазақша', ru: 'Русский', en: 'English' },
  kk: { kz: 'Қазақша', ru: 'Орысша', en: 'Ағылшынша' },
  en: { kz: 'Kazakh', ru: 'Russian', en: 'English' },
};
export function catalogLabel(value: string, locale: UiLocale): string {
  return LABELS[value]?.[locale] ?? value;
}
export function languageLabel(value: Language, locale: UiLocale): string {
  return LANGUAGES[locale][value];
}
