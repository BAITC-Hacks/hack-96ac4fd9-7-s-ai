import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { CATALOG_LABELS, REAL_CATALOG, hasOption } from './fixtures/catalogLabels.mjs';

// A separate temporary Vite port leaves the team's existing dev server untouched.
process.env.VITE_USE_MOCKS = 'false';
const server = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false } });
const nativeFetch = globalThis.fetch;
try {
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const origin = 'http://127.0.0.1:' + address.port;
  const requests = [];
  globalThis.fetch = (url, init) => {
    const resolved = typeof url === 'string' && url.startsWith('/api') ? origin + url : url;
    if (init?.method === 'POST') requests.push(JSON.parse(init.body));
    return nativeFetch(resolved, init);
  };
  const { getHealth, getCatalogOptions, createMatch, USE_MOCKS } = await server.ssrLoadModule('/src/api/client.ts');
  const { LocaleProvider } = await server.ssrLoadModule('/src/components/LocaleProvider.tsx');
  const { default: RequestForm } = await server.ssrLoadModule('/src/components/RequestForm.tsx');
  const { default: RequestSummary } = await server.ssrLoadModule('/src/components/RequestSummary.tsx');
  const { default: MatchResults } = await server.ssrLoadModule('/src/components/MatchResults.tsx');
  const { catalogLabel } = await server.ssrLoadModule('/src/lib/catalogLabels.ts');
  const { formatMoney } = await server.ssrLoadModule('/src/lib/format.ts');
  const { MESSAGES } = await server.ssrLoadModule('/src/lib/messages.ts');
  const render = (locale, component, props) => renderToStaticMarkup(createElement(LocaleProvider, { initialLocale: locale }, createElement(component, props)));
  assert.equal(USE_MOCKS, false);
  assert.equal((await getHealth()).ok, true);
  const catalogResponse = await getCatalogOptions();
  assert.ok(catalogResponse.ok, JSON.stringify(catalogResponse));
  const catalog = catalogResponse.data;
  assert.deepEqual(catalog, REAL_CATALOG);
  for (const locale of ['kk', 'en']) {
    const form = render(locale, RequestForm, { catalog, pending: false, onSearch() {} });
    for (const [value, kk, en] of CATALOG_LABELS) {
      assert.ok(hasOption(form, value, locale === 'kk' ? kk : en), value);
    }
  }
  const input = { city: 'Алматы', eventDate: '2026-10-01', eventType: 'свадьба', category: 'Ведущий', budgetKzt: 1000000 };
  const found = await createMatch(input);
  assert.ok(found.ok, JSON.stringify(found));
  assert.equal(found.data.status, 'found', JSON.stringify(found.data));
  assert.deepEqual(requests[0], input);
  assert.ok(found.data.cards.length > 0 && found.data.cards.length <= 3);
  const foundIds = JSON.stringify(found.data.cards.map((card) => card.id));
  const perLocale = [];
  for (const locale of ['kz', 'ru', 'en']) {
    const response = await createMatch({ ...input, locale });
    assert.ok(response.ok, JSON.stringify(response));
    assert.equal(JSON.stringify(response.data.cards.map((card) => card.id)), foundIds, locale + ': same IDs in the same order');
    perLocale.push(response.data.message);
  }
  assert.equal(new Set(perLocale).size, 3, 'message differs per locale');
  for (const locale of ['kk', 'ru', 'en']) {
    const result = render(locale, MatchResults, { result: found.data });
    const summary = render(locale, RequestSummary, { input, catalog, pending: false, onSearch() {} });
    assert.ok(summary.includes(locale === 'en' ? '1,000,000 ₸' : '1 000 000 ₸'));
    if (locale === 'kk') assert.ok(summary.includes('1 қазан 2026'));
    for (const card of found.data.cards) {
      assert.ok(result.includes(catalogLabel(card.category, locale) + ' · ' + catalogLabel(card.city, locale)));
      assert.ok(result.includes(formatMoney(card.priceFromKzt, locale)));
    }
  }
  const noMatch = await createMatch({ ...input, budgetKzt: 1 });
  assert.ok(noMatch.ok, JSON.stringify(noMatch));
  assert.equal(noMatch.data.status, 'no_match', JSON.stringify(noMatch.data));
  assert.equal(noMatch.data.candidatesBeforeCut, 0);
  assert.ok(noMatch.data.message);
  for (const locale of ['kk', 'ru', 'en']) {
    const result = render(locale, MatchResults, { result: noMatch.data });
    assert.ok(!result.includes(MESSAGES[locale].candidateCount.split('{count}')[0]));
  }
  const report = {
    checkedAt: new Date().toISOString(), backend: 'http://localhost:8787', useMocks: USE_MOCKS,
    transport: 'frontend client -> temporary Vite /api proxy -> real backend',
    catalogue: { cities: catalog.cities.length, categories: catalog.categories.length, eventFormats: catalog.eventFormats.length },
    found: { cards: found.data.cards.length, candidatesBeforeCut: found.data.candidatesBeforeCut },
    noMatch: { candidatesBeforeCut: noMatch.data.candidatesBeforeCut, messagePresent: Boolean(noMatch.data.message) },
    locales: ['kk', 'ru', 'en'], result: 'PASS',
    limitation: 'Node API integration and React SSR checks; no interactive browser actions.',
  };
  await writeFile('.status/t14-backend-check.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  globalThis.fetch = nativeFetch;
  await server.close();
}
