// Catalogue values reported by the tester from the real backend.
export const CATALOG_LABELS = [
  ['Алматы', 'Алматы', 'Almaty'],
  ['Астана', 'Астана', 'Astana'],
  ['Зарубежье', 'Шетел', 'Abroad'],
  ['Банкетный зал', 'Банкет залы', 'Banquet hall'],
  ['Ведущий', 'Жүргізуші', 'Host'],
  ['Ведущий церемонии', 'Рәсім жүргізушісі', 'Ceremony host'],
  ['Видеограф', 'Видеограф', 'Videographer'],
  ['Декоратор', 'Безендіруші', 'Decorator'],
  ['Загородная площадка', 'Қала сыртындағы алаң', 'Countryside venue'],
  ['Инструменталист', 'Аспапшы', 'Instrumentalist'],
  ['Лайв-бэнд', 'Жанды музыка тобы', 'Live band'],
  ['Национальный ансамбль', 'Ұлттық ансамбль', 'Traditional ensemble'],
  ['Отель', 'Қонақүй', 'Hotel'],
  ['Подарки и сувениры', 'Сыйлықтар мен кәдесыйлар', 'Gifts and souvenirs'],
  ['Ресторан', 'Мейрамхана', 'Restaurant'],
  ['Танцевальный коллектив', 'Би ұжымы', 'Dance group'],
  ['Флорист', 'Флорист', 'Florist'],
  ['Фото и видеобудки', 'Фото және видеокабиналар', 'Photo and video booths'],
  ['Фотограф', 'Фотограф', 'Photographer'],
  ['Шоу-программа', 'Шоу-бағдарлама', 'Show programme'],
  ['день рождения', 'Туған күн', 'Birthday'],
  ['конференция', 'Конференция', 'Conference'],
  ['корпоратив', 'Корпоратив', 'Corporate event'],
  ['свадьба', 'Үйлену тойы', 'Wedding'],
  ['той', 'Той', 'Toi (Kazakh celebration)'],
  ['юбилей', 'Мерейтой', 'Anniversary'],
];
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A custom dropdown option: <li role="option" … data-value="VALUE">[icon tags]<span>LABEL</span></li>
export const hasOption = (html, value, label) =>
  new RegExp('role="option"[^>]*data-value="' + escapeRegExp(value) + '"[^>]*>(?:<[^>]+>)*' + escapeRegExp(label) + '<').test(html);

export const REAL_CATALOG = {
  cities: CATALOG_LABELS.slice(0, 3).map(([value]) => value),
  categories: CATALOG_LABELS.slice(3, 20).map(([value]) => value),
  eventFormats: CATALOG_LABELS.slice(20).map(([value]) => value),
  languages: ['en', 'kz', 'ru'],
};
