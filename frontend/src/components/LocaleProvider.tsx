import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getInitialLocale, LOCALE_STORAGE_KEY } from '../lib/locale';
import type { UiLocale } from '../lib/locale';
import { translate } from '../lib/messages';

const LocaleContext = createContext<{ locale: UiLocale; setLocale: (locale: UiLocale) => void }>({
  locale: 'ru', setLocale: () => undefined,
});

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: UiLocale }) {
  const [locale, setLocale] = useState<UiLocale>(() => initialLocale ?? getInitialLocale());
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, 'siteTitle');
    try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* Storage may be disabled. */ }
  }, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale, t: (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) => translate(locale, key, values) };
}
