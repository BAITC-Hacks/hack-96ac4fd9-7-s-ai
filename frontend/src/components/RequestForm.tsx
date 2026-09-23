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
  /** Partial when a summary chip cleared a required field for the user to choose again. */
  initialInput?: Partial<CreateMatchInput>;
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
        {/* Widths follow content: long option labels get more room than the numeric inputs. */}
        <Dropdown name="city" label={t('city')} placeholder={t('chooseCity')} defaultValue={initialInput?.city ?? ''} className="lg:flex-[0.7]"
          options={catalog.cities.map((city) => ({ value: city, label: catalogLabel(city, locale) }))} />
        <DatePicker name="eventDate" label={t('date')} placeholder={t('chooseDate')} min={MIN_EVENT_DATE} max={MAX_EVENT_DATE} className="lg:flex-[1.05]"
          defaultValue={initialInput?.eventDate ?? (USE_MOCKS ? '2026-11-14' : '')} />
        <Dropdown name="eventType" label={t('eventType')} placeholder={t('chooseType')} defaultValue={initialInput?.eventType ?? ''} className="lg:flex-[1.1]"
          options={catalog.eventFormats.map((format) => ({ value: format, label: catalogLabel(format, locale) }))} />
        <Dropdown name="category" label={t('category')} placeholder={t('chooseCategory')} defaultValue={initialInput?.category ?? ''} className="lg:flex-[1.5]"
          options={catalog.categories.map((category) => ({ value: category, label: catalogLabel(category, locale) }))} />
        <label className="segment lg:flex-[0.7]"><span className="segment-label">{t('budget')}</span>
          <input name="budgetKzt" type="number" inputMode="numeric" min="1" step="1" required defaultValue={initialInput?.budgetKzt} placeholder={t('budgetPlaceholder')} />
        </label>
        <label className="segment lg:flex-[0.65]"><span className="segment-label">{t('duration')}</span>
          <input name="durationHours" type="number" min="0" step="any" defaultValue={initialInput?.durationHours} placeholder={t('anyDuration')} />
        </label>
        <Dropdown name="language" label={t('contractorLanguage')} defaultValue={initialInput?.language ?? ''} className="lg:flex-[0.8] lg:border-r-0"
          options={[{ value: '', label: t('anyLanguage') },
            ...catalog.languages.map((language) => ({ value: language, label: languageLabel(language, locale) }))]} />
        <button className="search-orb" type="submit">
          <svg aria-hidden="true" viewBox="0 0 32 32" className="size-4 fill-none stroke-current stroke-[4]"><path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" /></svg>
          <span className="lg:sr-only">{t(pending ? 'searching' : 'search')}</span>
        </button>
      </div>
      <p className="mt-3 px-2 text-sm text-muted">{t('required')} {t('budgetHelp')}</p>
      {error && <p role="alert" className="mt-3 px-2 text-sm font-medium text-error">{localizeError(error, locale)}</p>}
    </fieldset>
  </form>;
}
