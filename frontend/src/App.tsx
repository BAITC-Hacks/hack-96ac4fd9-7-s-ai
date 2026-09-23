import { useEffect, useRef, useState } from 'react';
import type { CatalogOptions, CreateMatchInput, MatchResult } from '../../shared/types';
import { createMatch, getCatalogOptions, USE_MOCKS } from './api/client';
import RequestForm from './components/RequestForm';
import RequestSummary from './components/RequestSummary';
import MatchResults from './components/MatchResults';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useLocale } from './components/LocaleProvider';
import { localizeError } from './lib/messages';

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

  async function search(input: CreateMatchInput) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setSubmitted({ ...input });
    setError('');
    setResult(null);
    try {
      const response = await createMatch(input);
      if (response.ok) setResult(response.data);
      else setError(response.error.message);
    } catch {
      setError('Не удалось выполнить запрос. Повторите поиск.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <main className="mx-auto max-w-6xl px-5 py-10">
    <div className="flex flex-wrap items-start justify-between gap-4"><p className="text-sm font-semibold text-teal-800">{t('brand')}</p><LanguageSwitcher /></div>
    <h1 className="mt-3 text-3xl font-semibold">{t('headline')}</h1>
    <p className="mt-3 text-slate-600">{t('intro')}</p>
    {USE_MOCKS && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('demo')}</p>}
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>{catalog ? <RequestForm key={JSON.stringify(submitted)} initialInput={submitted} catalog={catalog} pending={pending} onSearch={(input) => void search(input)} />
        : catalogError ? <div className="panel" role="alert"><p>{localizeError(catalogError, locale)}</p><button className="secondary mt-4" onClick={() => setCatalogAttempt((value) => value + 1)}>{t('catalogRetry')}</button></div>
          : <p role="status" className="panel">{t('catalogLoading')}</p>}</div>
      <section aria-label={t('results')} aria-busy={pending} aria-live="polite" className="space-y-4">
        {submitted && catalog && <RequestSummary key={JSON.stringify(submitted)} input={submitted} catalog={catalog} pending={pending} onSearch={(input) => void search(input)} />}
        {pending && <p role="status" className="panel">{t('checking')}</p>}
        {error && <div role="alert" className="panel text-red-800"><h2 className="font-semibold">{t('searchFailed')}</h2><p className="mt-2">{localizeError(error, locale)}</p>{submitted && <button className="secondary mt-4" onClick={() => void search(submitted)}>{t('retry')}</button>}</div>}
        {result && !USE_MOCKS && locale !== 'ru' && <p className="text-sm text-slate-600">{t('originalContent')}</p>}
        {result && <MatchResults result={result} />}
        {!pending && !result && !error && <div className="panel text-slate-600"><h2 className="font-semibold text-slate-900">{t('emptyTitle')}</h2><p className="mt-2">{t('emptyHelp')}</p></div>}
      </section>
    </div>
  </main>;
}
