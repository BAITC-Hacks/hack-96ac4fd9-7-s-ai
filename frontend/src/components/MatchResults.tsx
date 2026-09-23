import type { MatchResult } from '../../../shared/types';
import ContractorCard from './ContractorCard';
import { useLocale } from './LocaleProvider';

export default function MatchResults({ result }: { result: MatchResult }) {
  const { t } = useLocale();
  if (result.status === 'no_category') return <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-6">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{t('noCategoryLabel')}</p>
    <h2 className="mt-2 text-xl font-semibold">{t('noCategoryTitle')}</h2>
    <p className="mt-3 leading-7">{result.message}</p>
    <p className="mt-4 text-sm text-slate-600">{t('noCategoryHelp')}</p>
  </div>;

  if (result.status === 'no_match') return <div className="rounded-2xl border border-amber-300 border-l-4 bg-amber-50 p-6">
    <p className="text-xs font-bold uppercase tracking-wide text-amber-900">{t('noMatchLabel')}</p>
    <h2 className="mt-2 text-xl font-semibold">{t('noMatchTitle')}</h2>
    <p className="mt-3 leading-7">{result.message}</p>
    <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm font-semibold">{t('candidateCount', { count: result.candidatesBeforeCut })}</p>
    <p className="mt-4 text-sm text-amber-950">{t('noMatchHelp')}</p>
  </div>;

  const cards = result.cards.slice(0, 3);
  return <div className="space-y-4">
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
      <h2 className="text-xl font-semibold text-teal-950">{t('foundTitle')}</h2>
      <p className="mt-1 text-sm text-teal-900">
        {t(cards.length === result.candidatesBeforeCut ? 'shownAll' : 'shown', { shown: cards.length, total: result.candidatesBeforeCut })}
      </p>
      {result.message && <p className="mt-3 leading-7 text-teal-950">{result.message}</p>}
    </div>
    {cards.map((card) => <ContractorCard card={card} key={card.id} />)}
  </div>;
}
