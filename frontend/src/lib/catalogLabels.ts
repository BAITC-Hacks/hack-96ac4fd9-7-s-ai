import type { Language } from '../../../shared/types';
import type { UiLocale } from './locale';

// Labels only: option values sent to the API always remain the catalogue's exact values.
const LABELS: Record<string, Record<UiLocale, string>> = {
  'Алматы': { ru: 'Алматы', kk: 'Алматы', en: 'Almaty' },
  'Астана': { ru: 'Астана', kk: 'Астана', en: 'Astana' },
  'Ведущий': { ru: 'Ведущий', kk: 'Жүргізуші', en: 'Host' },
  'Скрипач': { ru: 'Скрипач', kk: 'Скрипкашы', en: 'Violinist' },
  'Фотограф': { ru: 'Фотограф', kk: 'Фотограф', en: 'Photographer' },
  'Свадьба': { ru: 'Свадьба', kk: 'Үйлену тойы', en: 'Wedding' },
  'Корпоратив': { ru: 'Корпоратив', kk: 'Корпоративтік іс-шара', en: 'Corporate event' },
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
