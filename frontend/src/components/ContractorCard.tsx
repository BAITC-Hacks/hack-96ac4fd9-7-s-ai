import type { ContractorCard as ContractorCardData } from '../../../shared/types';
import { formatMoney } from '../lib/format';

import { useLocale } from './LocaleProvider';
import { catalogLabel } from '../lib/catalogLabels';

export default function ContractorCard({ card }: { card: ContractorCardData }) {
  const { locale, t } = useLocale();
  return <article className="panel">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-sm text-slate-600">{catalogLabel(card.category, locale)} · {catalogLabel(card.city, locale)}</p>
        <h3 className="mt-1 text-xl font-semibold">{card.name}</h3>
      </div>
      <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold">{t('fromPrice', { amount: formatMoney(card.priceFromKzt, locale) })}</p>
    </div>
    <div className="mt-5 border-l-2 border-teal-700 pl-4">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-800">{t('why')}</p>
      <p className="mt-2 whitespace-pre-line text-base leading-7 text-slate-800">{card.explanation}</p>
    </div>
    {card.dataFlags.length > 0 && <ul aria-label={t('dataNotes')} className="mt-4 flex flex-wrap gap-2">
      {card.dataFlags.map((flag) => <li key={flag} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950">{t(flag)}</li>)}
    </ul>}
  </article>;
}
