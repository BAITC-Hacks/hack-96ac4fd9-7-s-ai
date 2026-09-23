import { useLocale } from './LocaleProvider';
import JellyRadio from './JellyRadio';
import { isUiLocale, LOCALE_NAMES, UI_LOCALES } from '../lib/locale';
import type { UiLocale } from '../lib/locale';

const SHORT: Record<UiLocale, string> = { kk: 'KZ', ru: 'RU', en: 'ENG' };

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return <JellyRadio
    className="shrink-0"
    ariaLabel={t('interfaceLanguage')}
    items={UI_LOCALES.map((value) => ({
      value, label: <span lang={value} title={LOCALE_NAMES[value]}>{SHORT[value]}</span>,
    }))}
    value={locale}
    onChange={(value) => { if (isUiLocale(value)) setLocale(value); }}
    chipColor="#f2f2f2"
    activeColor="#222222"
    textColor="#6a6a6a"
    activeTextColor="#ffffff"
    size="md"
    gap={6}
    radius={18}
    swell={0.2}
    barge={6}
    shrink={0.05}
    jelly={1}
    bounce={0.25}
    stagger={22}
    stiffness={580}
  />;
}
