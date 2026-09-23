import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { LocaleProvider } = await server.ssrLoadModule('/src/components/LocaleProvider.tsx');
  const { default: RequestForm } = await server.ssrLoadModule('/src/components/RequestForm.tsx');
  const { default: RequestSummary } = await server.ssrLoadModule('/src/components/RequestSummary.tsx');
  const { default: MatchResults } = await server.ssrLoadModule('/src/components/MatchResults.tsx');
  const { default: LanguageSwitcher } = await server.ssrLoadModule('/src/components/LanguageSwitcher.tsx');
  const { MESSAGES, localizeError } = await server.ssrLoadModule('/src/lib/messages.ts');
  const { getInitialLocale } = await server.ssrLoadModule('/src/lib/locale.ts');
  const { mockCreateMatch, MOCK_CATALOG, DEMO_INPUT } = await server.ssrLoadModule('/src/api/mocks.ts');
  const { localizeMatchResult } = await server.ssrLoadModule('/src/api/client.ts');
  const { validateInput } = await server.ssrLoadModule('/src/lib/validation.ts');
  const render = (locale, component, props) => renderToStaticMarkup(createElement(
    LocaleProvider, { initialLocale: locale }, createElement(component, props),
  ));
  const labels = { kk: 'Сәйкес мердігерлерді табу', ru: 'Найти подходящих', en: 'Find matches' };
  const unavailable = { kk: 'бос емес', ru: 'занят', en: 'unavailable' };
  const scenarios = [
    DEMO_INPUT,
    { ...DEMO_INPUT, eventDate: '2026-11-15' },
    { ...DEMO_INPUT, eventDate: '2026-11-16' },
    { ...DEMO_INPUT, city: 'Астана' },
    { ...DEMO_INPUT, category: 'Скрипач' },
    { ...DEMO_INPUT, budgetKzt: 99999 },
    { ...DEMO_INPUT, language: 'en', durationHours: 7 },
  ];
  for (const locale of ['kk', 'ru', 'en']) {
    assert.deepEqual(Object.keys(MESSAGES[locale]).sort(), Object.keys(MESSAGES.ru).sort());
    const initialInput = { ...DEMO_INPUT, language: 'kz', durationHours: 4 };
    const form = render(locale, RequestForm, { catalog: MOCK_CATALOG, initialInput, pending: false, onSearch() {} });
    assert.ok(form.includes(labels[locale]));
    assert.match(form, /value="Алматы" selected/);
    assert.match(form, /value="Ведущий" selected/);
    assert.match(form, /value="kz" selected/);
    assert.match(form, /name="durationHours"[^>]*value="4"/);
    assert.match(form, /name="budgetKzt"[^>]*value="200000"/);
    assert.doesNotMatch(form, /<details open/);
    const summary = render(locale, RequestSummary, { input: initialInput, catalog: MOCK_CATALOG, pending: false, onSearch() {} });
    assert.match(summary, /value="2026-11-14"/);
    assert.ok(summary.includes(locale === 'en' ? 'November' : locale === 'kk' ? 'қараша' : 'ноября'));
    const switcher = render(locale, LanguageSwitcher, {});
    assert.match(switcher, new RegExp('value="' + locale + '"[^>]*selected'));
    for (const input of scenarios) {
      const originalInput = structuredClone(input);
      const source = mockCreateMatch(input).data;
      const result = localizeMatchResult(source, input, locale);
      assert.equal(result.status, source.status);
      assert.equal(result.candidatesBeforeCut, source.candidatesBeforeCut);
      assert.deepEqual(result.cards.map(c => [c.id, c.priceFromKzt, c.city, c.category, c.dataFlags]),
        source.cards.map(c => [c.id, c.priceFromKzt, c.city, c.category, c.dataFlags]));
      assert.deepEqual(input, originalInput);
      const html = render(locale, MatchResults, { result });
      assert.doesNotMatch(html, /\{(?:amount|count|shown|total)\}/);
      if (input.eventDate === '2026-11-15') assert.ok(result.message.includes(unavailable[locale]));
      if (locale === 'en') {
        assert.doesNotMatch(html.replace(/<[^>]+>/g, ''), /[А-Яа-яЁё]/);
      }
    }
    const error = validateInput({ ...DEMO_INPUT, budgetKzt: -1 }, MOCK_CATALOG);
    assert.equal(localizeError(error, locale), MESSAGES[locale].invalidBudget);
  }
  const unknownCatalog = { ...MOCK_CATALOG, categories: ['Custom category'] };
  assert.match(render('en', RequestForm, { catalog: unknownCatalog, pending: false, onSearch() {} }), /value="Custom category">Custom category/);
  assert.equal(localizeError('Original backend message', 'kk'), 'Original backend message');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'en' } });
    assert.equal(getInitialLocale(), 'en');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'invalid' } });
    assert.equal(getInitialLocale(), 'kk');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    assert.equal(getInitialLocale(), 'kk');
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  }
  console.log('PASS: kk/ru/en interface; translated mocks across 7 scenarios; unchanged IDs, filters, prices and API values; dates; saved locale and blocked storage fallback; backend text preserved.');
} finally { await server.close(); }
