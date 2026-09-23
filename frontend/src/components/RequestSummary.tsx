import { useState } from 'react';
import type { CatalogOptions, CreateMatchInput } from '../../../shared/types';
import { formatDate, formatMoney } from '../lib/format';
import { catalogLabel, languageLabel } from '../lib/catalogLabels';
import { useLocale } from './LocaleProvider';
import { localizeError } from '../lib/messages';
import { validateInput } from '../lib/validation';

interface Props {
  input: CreateMatchInput;
  catalog: CatalogOptions;
  pending: boolean;
  onSearch: (input: CreateMatchInput) => void;
}

export default function RequestSummary({ input, catalog, pending, onSearch }: Props) {
  const { locale, t } = useLocale();
  const [error, setError] = useState('');
  return <div className="panel">
    <h2 className="text-lg font-semibold">{t('summary')}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-700">
      {catalogLabel(input.city, locale)} · {catalogLabel(input.eventType, locale)} · {catalogLabel(input.category, locale)}<br />
      {formatDate(input.eventDate, locale)} · {t('budgetUpTo', { amount: formatMoney(input.budgetKzt, locale) })}
      {input.durationHours !== undefined && <> · {t('hours', { count: input.durationHours })}</>}
      {input.language && <> · {languageLabel(input.language, locale)}</>}
    </p>
    <form className="mt-4" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const next = { ...input, eventDate: String(data.get('eventDate')), budgetKzt: Number(data.get('budgetKzt')) };
      const issue = validateInput(next, catalog);
      setError(issue ?? '');
      if (!issue) onSearch(next);
    }}>
      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
        <label className="field">{t('editDate')}
          <input type="date" name="eventDate" defaultValue={input.eventDate} required />
        </label>
        <label className="field">{t('editBudget')}
          <input type="number" name="budgetKzt" defaultValue={input.budgetKzt} min="1" step="1" required />
        </label>
        {error && <p role="alert" className="text-sm text-red-800 sm:col-span-2">{localizeError(error, locale)}</p>}
        <button type="submit" className="secondary sm:col-span-2">{t(pending ? 'updating' : 'searchAgain')}</button>
      </fieldset>
    </form>
  </div>;
}
