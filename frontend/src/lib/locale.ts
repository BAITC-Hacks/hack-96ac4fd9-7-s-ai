export type UiLocale = 'kk' | 'ru' | 'en';
export const UI_LOCALES: UiLocale[] = ['kk', 'ru', 'en'];
export const LOCALE_NAMES: Record<UiLocale, string> = { kk: 'Қазақша', ru: 'Русский', en: 'English' };
export const INTL_LOCALES: Record<UiLocale, string> = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' };
export const LOCALE_STORAGE_KEY = 'contractorMatch.uiLocale';

export function isUiLocale(value: unknown): value is UiLocale {
  return value === 'kk' || value === 'ru' || value === 'en';
}
export function getInitialLocale(): UiLocale {
  try {
    const stored = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY);
    return isUiLocale(stored) ? stored : 'kk';
  } catch { return 'kk'; }
}
