import { useEffect, useRef, useState } from 'react';
import type { CatalogOptions, CreateMatchInput, MatchResult } from '../../shared/types';
import { createMatch, getCatalogOptions, localizeMatchResult, USE_MOCKS } from './api/client';
import RequestForm from './components/RequestForm';
import RequestSummary from './components/RequestSummary';
import MatchResults from './components/MatchResults';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useLocale } from './components/LocaleProvider';
import { localizeError } from './lib/messages';
import { API_LOCALES } from './lib/locale';
import HowItWorks from './components/HowItWorks';
import AnimatedBackground from './components/AnimatedBackground';

export default function App() {
  const { locale, t } = useLocale();
  const [catalog, setCatalog] = useState<CatalogOptions | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<CreateMatchInput>();
  const inFlight = useRef(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    setCatalogError('');
    void getCatalogOptions().then((response) => {
      if (!active) return;
      if (response.ok && response.data.cities.length && response.data.categories.length && response.data.eventFormats.length)
        setCatalog(response.data);
      else setCatalogError(response.ok ? 'Каталог пока пуст. Попробуйте загрузить его ещё раз.' : response.error.message);
    }).catch(() => {
      if (active) setCatalogError('Не удалось загрузить каталог. Попробуйте ещё раз.');
    });
    return () => { active = false; };
  }, [catalogAttempt]);

  // Backend texts are generated per locale, so a language switch re-asks for the same search.
  const lastLocale = useRef(locale);
  useEffect(() => {
    if (lastLocale.current === locale) return;
    lastLocale.current = locale;
    if (!USE_MOCKS && submitted && (result || error)) void search(submitted, true);
  }, [locale]);

  async function search(input: CreateMatchInput, keepResult = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setSubmitted({ ...input });
    setError('');
    if (!keepResult) {
      setResult(null);
      // On narrow screens the results render below the fold; bring them into view.
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
    try {
      const response = await createMatch({ ...input, locale: API_LOCALES[locale] });
      if (response.ok) setResult(response.data);
      else setError(response.error.message);
    } catch {
      setError('Не удалось выполнить запрос. Повторите поиск.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <>
    <AnimatedBackground />
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <p className="flex min-w-0 items-center gap-2.5 font-bold text-accent">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm text-white">M</span>
          <span className="truncate">{t('brand')}</span>
        </p>
        <LanguageSwitcher />
      </div>
    </header>
    <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <section className="pt-10 pb-10">
        <h1 className="text-[28px] font-bold leading-tight">{t('headline')}</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">{t('intro')}</p>
        {USE_MOCKS && <p className="chip mt-4 bg-surface-soft">{t('demo')}</p>}
        <div className="mt-8">{catalog ? <RequestForm key={JSON.stringify(submitted)} initialInput={submitted} catalog={catalog} pending={pending} onSearch={(input) => void search(input)} />
          : catalogError ? <div className="panel" role="alert"><p>{localizeError(catalogError, locale)}</p><button className="secondary mt-4" onClick={() => setCatalogAttempt((value) => value + 1)}>{t('catalogRetry')}</button></div>
            : <p role="status" className="panel text-muted">{t('catalogLoading')}</p>}</div>
      </section>
      <section ref={resultsRef} aria-label={t('results')} aria-busy={pending} aria-live="polite" className="scroll-mt-6 space-y-6">
        {submitted && catalog && <RequestSummary key={JSON.stringify(submitted)} input={submitted} catalog={catalog} pending={pending} onSearch={(input) => void search(input)} />}
        {pending && <div>
          <p role="status" className="text-sm text-muted">{t('checking')}</p>
          <div aria-hidden="true" className="mt-4 grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((index) => <div key={index} className="h-64 animate-pulse rounded-card bg-surface-soft" />)}
          </div>
        </div>}
        {error && <div role="alert" className="panel">
          <h2 className="text-xl font-semibold text-error">{t('searchFailed')}</h2>
          <p className="mt-2 text-body">{localizeError(error, locale)}</p>
          {submitted && <button className="secondary mt-4" onClick={() => void search(submitted)}>{t('retry')}</button>}
        </div>}
        {result && !pending && !USE_MOCKS && locale !== 'ru' && <p className="text-sm text-muted">{t('originalContent')}</p>}
        {result && !pending && submitted && <MatchResults result={localizeMatchResult(result, submitted, locale)} />}
        {!pending && !result && !error && <div className="rounded-card bg-surface-soft p-8">
          <h2 className="text-xl font-semibold">{t('emptyTitle')}</h2>
          <p className="mt-2 max-w-2xl text-body">{t('emptyHelp')}</p>
        </div>}
      </section>
      <HowItWorks />
    </main>
  </>;
}
