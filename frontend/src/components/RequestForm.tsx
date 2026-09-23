import { useState } from 'react';
import type { CatalogOptions, CreateMatchInput } from '../../../shared/types';
import { USE_MOCKS } from '../api/client';
import { catalogLabel, languageLabel } from '../lib/catalogLabels';
import { useLocale } from './LocaleProvider';
import Dropdown from './Dropdown';
import DatePicker from './DatePicker';
import { localizeError } from '../lib/messages';
import { MAX_EVENT_DATE, MIN_EVENT_DATE, readForm, validateInput } from '../lib/validation';

interface Props {
  catalog: CatalogOptions;
  pending: boolean;
  onSearch: (input: CreateMatchInput) => void;
  initialInput?: CreateMatchInput;
}

export default function RequestForm({ catalog, pending, onSearch, initialInput }: Props) {
  const { locale, t } = useLocale();
  const [error, setError] = useState('');
  return <form noValidate onSubmit={(event) => {
    event.preventDefault();
    const input = readForm(event.currentTarget);
    const issue = validateInput(input, catalog);
    setError(issue ?? '');
    if (!issue) onSearch(input);
  }}>
    <h2 className="sr-only">{t('event')}</h2>
    <fieldset disabled={pending}>
      <div className="search-pill">
        <Dropdown name="city" label={t('city')} placeholder={t('chooseCity')} defaultValue={initialInput?.city ?? ''}
          options={catalog.cities.map((city) => ({ value: city, label: catalogLabel(city, locale) }))} />
        <DatePicker name="eventDate" label={t('date')} placeholder={t('chooseDate')} min={MIN_EVENT_DATE} max={MAX_EVENT_DATE}
          defaultValue={initialInput?.eventDate ?? (USE_MOCKS ? '2026-11-14' : '')} />
        <Dropdown name="eventType" label={t('eventType')} placeholder={t('chooseType')} defaultValue={initialInput?.eventType ?? ''}
          options={catalog.eventFormats.map((format) => ({ value: format, label: catalogLabel(format, locale) }))} />
        <Dropdown name="category" label={t('category')} placeholder={t('chooseCategory')} defaultValue={initialInput?.category ?? ''}
          options={catalog.categories.map((category) => ({ value: category, label: catalogLabel(category, locale) }))} />
        <label className="segment lg:border-r-0"><span className="segment-label">{t('budget')}</span>
          <input name="budgetKzt" type="number" inputMode="numeric" min="1" step="1" required defaultValue={initialInput?.budgetKzt} placeholder={t('budgetPlaceholder')} />
        </label>
        <button className="search-orb" type="submit">
          <svg aria-hidden="true" viewBox="0 0 32 32" className="size-4 fill-none stroke-current stroke-[4]"><path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" /></svg>
          <span className="lg:sr-only">{t(pending ? 'searching' : 'search')}</span>
        </button>
      </div>
      <p className="mt-3 px-2 text-sm text-muted">{t('required')} {t('budgetHelp')}</p>
      <details className="mt-3 px-2">
        <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">{t('additional')}</summary>
        <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
          <label className="field">{t('duration')}
            <input name="durationHours" type="number" min="0" step="any" defaultValue={initialInput?.durationHours} placeholder={t('unspecified')} />
          </label>
          <Dropdown variant="field" name="language" label={t('contractorLanguage')} defaultValue={initialInput?.language ?? ''}
            options={[{ value: '', label: t('anyLanguage') },
              ...catalog.languages.map((language) => ({ value: language, label: languageLabel(language, locale) }))]} />
        </div>
      </details>
      {error && <p role="alert" className="mt-3 px-2 text-sm font-medium text-error">{localizeError(error, locale)}</p>}
    </fieldset>
  </form>;
}
