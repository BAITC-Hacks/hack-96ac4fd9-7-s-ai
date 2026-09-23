import { useState } from 'react';
import type { CatalogOptions, CreateMatchInput } from '../../../shared/types';
import { formatDate, formatMoney } from '../lib/format';
import { catalogLabel, languageLabel } from '../lib/catalogLabels';
import { useLocale } from './LocaleProvider';
import DatePicker from './DatePicker';
import { localizeError } from '../lib/messages';
import { MAX_EVENT_DATE, MIN_EVENT_DATE, validateInput } from '../lib/validation';

export type SummaryParam = Exclude<keyof CreateMatchInput, 'locale'>;

interface Props {
  input: CreateMatchInput;
  catalog: CatalogOptions;
  pending: boolean;
  onSearch: (input: CreateMatchInput) => void;
  onRemove?: (param: SummaryParam) => void;
}

export default function RequestSummary({ input, catalog, pending, onSearch, onRemove }: Props) {
  const { locale, t } = useLocale();
  const [error, setError] = useState('');
  const chips: { param: SummaryParam; label: string }[] = [
    { param: 'city', label: catalogLabel(input.city, locale) },
    { param: 'eventType', label: catalogLabel(input.eventType, locale) },
    { param: 'category', label: catalogLabel(input.category, locale) },
    { param: 'eventDate', label: formatDate(input.eventDate, locale) },
    { param: 'budgetKzt', label: t('budgetUpTo', { amount: formatMoney(input.budgetKzt, locale) }) },
    ...(input.durationHours !== undefined ? [{ param: 'durationHours' as const, label: t('hours', { count: input.durationHours }) }] : []),
    ...(input.language ? [{ param: 'language' as const, label: languageLabel(input.language, locale) }] : []),
  ];
  return <div className="flex flex-col gap-5 border-b border-hairline pb-6 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <h2 className="text-base font-semibold">{t('summary')}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">{chips.map(({ param, label }) => <li key={param}
        className="group chip relative pr-3 transition-[padding] duration-200 focus-within:pr-8 hover:pr-8 pointer-coarse:pr-8">
        {label}
        <button type="button" disabled={pending} aria-label={t('removeParam', { name: label })} onClick={() => onRemove?.(param)}
          className="absolute right-1 flex size-6 items-center justify-center rounded-full text-muted opacity-0 transition-opacity duration-200 hover:bg-surface-strong hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-none stroke-current stroke-2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </li>)}</ul>
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
