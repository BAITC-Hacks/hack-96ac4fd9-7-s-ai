import { INTL_LOCALES } from './locale.ts';
import type { UiLocale } from './locale';

const KAZAKH_MONTHS = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
] as const;

export function formatMoney(value: number, locale: UiLocale = 'ru'): string {
  const formatted = new Intl.NumberFormat('en-US').format(value);
  return (locale === 'en' ? formatted : formatted.replaceAll(',', ' ').replace('.', ',')) + ' ₸';
}
const MONTHS_NOMINATIVE: Record<UiLocale, string[]> = {
  kk: ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
/** Monday-first short weekday names. */
export const WEEKDAYS: Record<UiLocale, string[]> = {
  kk: ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};
export const formatMonth = (year: number, month: number, locale: UiLocale) => `${MONTHS_NOMINATIVE[locale][month - 1]} ${year}`;

export function formatDate(value: string, locale: UiLocale = 'ru'): string {
  if (locale === 'kk') {
    const [year, month, day] = value.split('-').map(Number);
    return day + ' ' + KAZAKH_MONTHS[month - 1] + ' ' + year;
  }
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(value + 'T00:00:00Z'));
}
