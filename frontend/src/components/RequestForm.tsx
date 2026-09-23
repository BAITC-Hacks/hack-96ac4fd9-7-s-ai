import { useState } from 'react';
import type { CatalogOptions, CreateMatchInput } from '../../../shared/types';
import { USE_MOCKS } from '../api/client';
import { catalogLabel, languageLabel } from '../lib/catalogLabels';
import { useLocale } from './LocaleProvider';
import { localizeError } from '../lib/messages';
import { readForm, validateInput } from '../lib/validation';

interface Props {
  catalog: CatalogOptions;
  pending: boolean;
  onSearch: (input: CreateMatchInput) => void;
  initialInput?: CreateMatchInput;
}

export default function RequestForm({ catalog, pending, onSearch, initialInput }: Props) {
  const { locale, t } = useLocale();
  const [error, setError] = useState('');
  return <form noValidate className="panel" onSubmit={(event) => {
    event.preventDefault();
    const input = readForm(event.currentTarget);
    const issue = validateInput(input, catalog);
    setError(issue ?? '');
    if (!issue) onSearch(input);
  }}>
    <h2 className="text-xl font-semibold">{t('event')}</h2>
    <p className="mt-2 text-sm text-slate-600">{t('required')}</p>
    <fieldset disabled={pending} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="field">{t('city')}
        <select name="city" required defaultValue={initialInput?.city ?? ''}><option value="" disabled>{t('chooseCity')}</option>
          {catalog.cities.map((city) => <option key={city} value={city}>{catalogLabel(city, locale)}</option>)}
        </select>
      </label>
      <label className="field">{t('date')}
        <input name="eventDate" type="date" required defaultValue={initialInput?.eventDate ?? (USE_MOCKS ? '2026-11-14' : '')} />
      </label>
      <label className="field">{t('eventType')}
        <select name="eventType" required defaultValue={initialInput?.eventType ?? ''}><option value="" disabled>{t('chooseType')}</option>
          {catalog.eventFormats.map((format) => <option key={format} value={format}>{catalogLabel(format, locale)}</option>)}
        </select>
      </label>
      <label className="field">{t('category')}
        <select name="category" required defaultValue={initialInput?.category ?? ''}><option value="" disabled>{t('chooseCategory')}</option>
          {catalog.categories.map((category) => <option key={category} value={category}>{catalogLabel(category, locale)}</option>)}
        </select>
      </label>
      <label className="field sm:col-span-2">{t('budget')}
        <input name="budgetKzt" type="number" inputMode="numeric" min="1" step="1" required defaultValue={initialInput?.budgetKzt} placeholder={t('budgetPlaceholder')} />
        <span className="text-xs font-normal text-slate-500">{t('budgetHelp')}</span>
      </label>
      <details className="sm:col-span-2">
        <summary className="cursor-pointer text-sm font-semibold text-teal-800">{t('additional')}</summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="field">{t('duration')}
            <input name="durationHours" type="number" min="0" step="any" defaultValue={initialInput?.durationHours} placeholder={t('unspecified')} />
          </label>
          <label className="field">{t('contractorLanguage')}
            <select name="language" defaultValue={initialInput?.language ?? ''}><option value="">{t('anyLanguage')}</option>
              {catalog.languages.map((language) => <option key={language} value={language}>{languageLabel(language, locale)}</option>)}
            </select>
          </label>
        </div>
      </details>
      {error && <p role="alert" className="text-red-800 sm:col-span-2">{localizeError(error, locale)}</p>}
      <button className="primary sm:col-span-2" type="submit">{t(pending ? 'searching' : 'search')}</button>
    </fieldset>
  </form>;
}
