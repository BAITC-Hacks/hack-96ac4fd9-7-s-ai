import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { CATALOG_LABELS, REAL_CATALOG, hasOption } from './fixtures/catalogLabels.mjs';

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
  const { catalogLabel } = await server.ssrLoadModule('/src/lib/catalogLabels.ts');
  const { formatDate, formatMoney } = await server.ssrLoadModule('/src/lib/format.ts');
  const { default: ContractorCard } = await server.ssrLoadModule('/src/components/ContractorCard.tsx');
  const render = (locale, component, props) => renderToStaticMarkup(createElement(
    LocaleProvider, { initialLocale: locale }, createElement(component, props),
  ));
  const labels = { kk: 'Сәйкес мердігерлерді табу', ru: 'Найти подходящих', en: 'Find matches' };
  const originalDateTimeFormat = Intl.DateTimeFormat;
  try {
    Intl.DateTimeFormat = function () { throw new Error('Locale data unavailable'); };
    const months = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
    for (const [index, month] of months.entries()) {
      assert.equal(formatDate('2026-' + String(index + 1).padStart(2, '0') + '-01', 'kk'), '1 ' + month + ' 2026');
    }
    assert.equal(formatDate('2028-02-29', 'kk'), '29 ақпан 2028');
    const summary = render('kk', RequestSummary, { input: { ...DEMO_INPUT, eventDate: '2026-10-01' }, catalog: MOCK_CATALOG, pending: false, onSearch() {} });
    assert.ok(summary.includes('1 қазан 2026'));
    assert.doesNotMatch(summary, /M10/);
  } finally { Intl.DateTimeFormat = originalDateTimeFormat; }
  for (const locale of ['kk', 'en']) {
    const form = render(locale, RequestForm, { catalog: REAL_CATALOG, pending: false, onSearch() {} });
    for (const [value, kk, en] of CATALOG_LABELS) {
      const label = locale === 'kk' ? kk : en;
      assert.equal(catalogLabel(value, locale), label);
      assert.ok(hasOption(form, value, label), value);
    }
    for (const category of REAL_CATALOG.categories) {
      const input = { ...DEMO_INPUT, city: 'Зарубежье', category, eventType: 'свадьба' };
      const summary = render(locale, RequestSummary, { input, catalog: REAL_CATALOG, pending: false, onSearch() {} });
      const card = render(locale, ContractorCard, { card: { id: 'catalog-check', name: 'Test', city: input.city, category, priceFromKzt: 1000000, explanation: 'Test', dataFlags: [] } });
      assert.ok(summary.includes(catalogLabel(category, locale)));
      assert.ok(summary.includes(catalogLabel('свадьба', locale)));
      assert.ok(summary.includes(catalogLabel('Зарубежье', locale)));
      assert.ok(card.includes(catalogLabel(category, locale) + ' · ' + catalogLabel('Зарубежье', locale)));
    }
  }
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
    const million = locale === 'en' ? '1,000,000 ₸' : '1 000 000 ₸';
    assert.equal(formatMoney(1000000, locale), million);
    assert.equal(formatMoney(0, locale), '0 ₸');
    assert.equal(formatMoney(1234567.89, locale), locale === 'en' ? '1,234,567.89 ₸' : '1 234 567,89 ₸');
    const moneyInput = { ...DEMO_INPUT, budgetKzt: 1000000 };
    const moneyResult = mockCreateMatch(moneyInput, locale).data;
    assert.ok(moneyResult.cards[0].explanation.includes(million));
    const moneyCard = render(locale, ContractorCard, { card: { ...moneyResult.cards[0], priceFromKzt: 1000000 } });
    const moneySummary = render(locale, RequestSummary, { input: moneyInput, catalog: MOCK_CATALOG, pending: false, onSearch() {} });
    assert.ok(moneyCard.includes(million));
    assert.ok(moneySummary.includes(million));
    const noMatch = { status: 'no_match', cards: [], message: 'Original explanation', candidatesBeforeCut: 0, notShown: [] };
    const noMatchZero = render(locale, MatchResults, { result: noMatch });
    const countLabel = MESSAGES[locale].candidateCount.split('{count}')[0];
    assert.ok(noMatchZero.includes(noMatch.message));
    assert.ok(!noMatchZero.includes(countLabel));
    const noMatchPositive = render(locale, MatchResults, { result: { ...noMatch, candidatesBeforeCut: 3 } });
    assert.ok(noMatchPositive.includes(countLabel + '3'));
    assert.deepEqual(Object.keys(MESSAGES[locale]).sort(), Object.keys(MESSAGES.ru).sort());
    const initialInput = { ...DEMO_INPUT, language: 'kz', durationHours: 4 };
    const form = render(locale, RequestForm, { catalog: MOCK_CATALOG, initialInput, pending: false, onSearch() {} });
    assert.ok(form.includes(labels[locale]));
    assert.match(form, /name="city" value="Алматы"/);
    assert.match(form, /name="category" value="Ведущий"/);
    assert.match(form, /name="language" value="kz"/);
    assert.match(form, /data-value="Ведущий"[^>]*aria-selected="true"|aria-selected="true"[^>]*data-value="Ведущий"/);
    assert.match(form, /name="durationHours"[^>]*value="4"/);
    assert.match(form, /name="budgetKzt"[^>]*value="200000"/);
    assert.doesNotMatch(form, /<details open/);
    const summary = render(locale, RequestSummary, { input: initialInput, catalog: MOCK_CATALOG, pending: false, onSearch() {} });
    assert.match(summary, /value="2026-11-14"/);
    assert.ok(summary.includes(locale === 'en' ? 'November' : locale === 'kk' ? 'қараша' : 'ноября'));
    const switcher = render(locale, LanguageSwitcher, {});
    const short = { kk: 'KZ', ru: 'RU', en: 'ENG' };
    const chips = switcher.split('<button').slice(1);
    assert.equal(chips.length, 3);
    assert.match(switcher, /role="radiogroup"/);
    const checked = chips.filter((chip) => chip.includes('aria-checked="true"'));
    assert.equal(checked.length, 1, switcher);
    assert.ok(checked[0].includes('>' + short[locale] + '<'), switcher);
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
  assert.ok(hasOption(render('en', RequestForm, { catalog: unknownCatalog, pending: false, onSearch() {} }), 'Custom category', 'Custom category'));
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
