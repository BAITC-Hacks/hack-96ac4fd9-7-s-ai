import { INTL_LOCALES } from './locale';
import type { UiLocale } from './locale';

export const formatMoney = (value: number, locale: UiLocale = 'ru') => new Intl.NumberFormat(INTL_LOCALES[locale]).format(value) + ' ₸';
export function formatDate(value: string, locale: UiLocale = 'ru'): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(value + 'T00:00:00Z'));
}
