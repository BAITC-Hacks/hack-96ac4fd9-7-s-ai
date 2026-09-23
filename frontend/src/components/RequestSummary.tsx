import { useState } from 'react';
import type { CatalogOptions, CreateMatchInput } from '../../../shared/types';
import { formatDate, formatMoney } from '../lib/format';
import { catalogLabel, languageLabel } from '../lib/catalogLabels';
import { useLocale } from './LocaleProvider';
import DatePicker from './DatePicker';
import { localizeError } from '../lib/messages';
import { MAX_EVENT_DATE, MIN_EVENT_DATE, validateInput } from '../lib/validation';

interface Props {
  input: CreateMatchInput;
  catalog: CatalogOptions;
  pending: boolean;
  onSearch: (input: CreateMatchInput) => void;
}

export default function RequestSummary({ input, catalog, pending, onSearch }: Props) {
  const { locale, t } = useLocale();
  const [error, setError] = useState('');
  const chips = [
    catalogLabel(input.city, locale), catalogLabel(input.eventType, locale), catalogLabel(input.category, locale),
    formatDate(input.eventDate, locale), t('budgetUpTo', { amount: formatMoney(input.budgetKzt, locale) }),
    ...(input.durationHours !== undefined ? [t('hours', { count: input.durationHours })] : []),
    ...(input.language ? [languageLabel(input.language, locale)] : []),
  ];
  return <div className="flex flex-col gap-5 border-b border-hairline pb-6 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <h2 className="text-base font-semibold">{t('summary')}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">{chips.map((chip, index) => <li key={index} className="chip">{chip}</li>)}</ul>
    </div>
    <form noValidate className="shrink-0" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const next = { ...input, eventDate: String(data.get('eventDate')), budgetKzt: Number(data.get('budgetKzt')) };
      const issue = validateInput(next, catalog);
      setError(issue ?? '');
      if (!issue) onSearch(next);
    }}>
      <fieldset disabled={pending} className="flex flex-wrap items-end gap-3">
        <div className="w-48"><DatePicker variant="field" alignRight name="eventDate" label={t('editDate')}
          min={MIN_EVENT_DATE} max={MAX_EVENT_DATE} defaultValue={input.eventDate} /></div>
        <label className="field field-compact w-36">{t('editBudget')}
          <input type="number" name="budgetKzt" defaultValue={input.budgetKzt} min="1" step="1" required />
        </label>
        <button type="submit" className="secondary">{t(pending ? 'updating' : 'searchAgain')}</button>
        {error && <p role="alert" className="w-full text-sm font-medium text-error">{localizeError(error, locale)}</p>}
      </fieldset>
    </form>
  </div>;
}
