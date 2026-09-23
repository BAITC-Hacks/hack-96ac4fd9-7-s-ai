import { useLocale } from './LocaleProvider';
import { isUiLocale, LOCALE_NAMES, UI_LOCALES } from '../lib/locale';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return <label className="field w-full sm:w-48">{t('interfaceLanguage')}
    <select name="uiLocale" value={locale} onChange={(event) => {
      if (isUiLocale(event.target.value)) setLocale(event.target.value);
    }}>
      {UI_LOCALES.map((value) => <option key={value} value={value} lang={value}>{LOCALE_NAMES[value]}</option>)}
    </select>
  </label>;
}
