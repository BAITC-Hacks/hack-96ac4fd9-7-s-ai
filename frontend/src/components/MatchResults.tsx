import { useState } from 'react';
import type { MatchResult } from '../../../shared/types';
import ContractorCard from './ContractorCard';
import NotShownList from './NotShownList';
import { useLocale } from './LocaleProvider';

export default function MatchResults({ result }: { result: MatchResult }) {
  const { t } = useLocale();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  if (result.status === 'no_category') return <div className="rounded-card bg-surface-soft p-8">
    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-canvas text-xl text-muted shadow-float">∅</span>
    <p className="micro-label mt-5 text-muted">{t('noCategoryLabel')}</p>
    <h2 className="mt-1 text-xl font-semibold">{t('noCategoryTitle')}</h2>
    <p className="mt-3 max-w-3xl leading-7 text-body">{result.message}</p>
    <p className="mt-4 text-sm text-muted">{t('noCategoryHelp')}</p>
  </div>;

  if (result.status === 'no_match') return <div className="panel shadow-float sm:p-8">
    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-accent-disabled text-xl font-bold text-error">!</span>
    <p className="micro-label mt-5 text-error">{t('noMatchLabel')}</p>
    <h2 className="mt-1 text-xl font-semibold">{t('noMatchTitle')}</h2>
    <p className="mt-3 max-w-3xl leading-7 text-body">{result.message}</p>
    {result.candidatesBeforeCut > 0 && <p className="chip mt-4 font-semibold">{t('candidateCount', { count: result.candidatesBeforeCut })}</p>}
    {result.notShown.length > 0 && <NotShownList defaultOpen items={result.notShown} title={t('candidatesTitle', { count: result.notShown.length })} />}
    <p className="mt-4 text-sm text-muted">{t('noMatchHelp')}</p>
  </div>;

  const cards = result.cards.slice(0, 3);
  const allFlipped = cards.every((card) => flipped[card.id]);
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-xl font-semibold">{t('foundTitle')}</h2>
        <p className="text-sm text-muted">
          {t(cards.length === result.candidatesBeforeCut ? 'shownAll' : 'shown', { shown: cards.length, total: result.candidatesBeforeCut })}
        </p>
      </div>
      <button type="button" className="secondary" aria-pressed={allFlipped}
        onClick={() => setFlipped(Object.fromEntries(cards.map((card) => [card.id, !allFlipped])))}>
        {t(allFlipped ? 'showFronts' : 'showReasons')}
      </button>
    </div>
    {result.message && <p className="mt-3 rounded-card bg-surface-soft px-5 py-4 text-sm leading-6 text-body">{result.message}</p>}
    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => <ContractorCard card={card} key={card.id} flipped={Boolean(flipped[card.id])}
        onFlipChange={(value) => setFlipped((current) => ({ ...current, [card.id]: value }))} />)}
    </div>
    {result.notShown.length > 0 && <NotShownList items={result.notShown} title={t('notShownTitle', { count: result.notShown.length })} />}
  </div>;
}
