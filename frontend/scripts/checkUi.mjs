import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: MatchResults } = await server.ssrLoadModule('/src/components/MatchResults.tsx');
  const { default: RequestForm } = await server.ssrLoadModule('/src/components/RequestForm.tsx');
  const { default: RequestSummary } = await server.ssrLoadModule('/src/components/RequestSummary.tsx');
  const { FOUND_FIXTURE, NO_CATEGORY_FIXTURE, NO_MATCH_FIXTURE, MOCK_CATALOG, DEMO_INPUT } = await server.ssrLoadModule('/src/api/mocks.ts');
  const { createMatch, getHealth, getCatalogOptions } = await server.ssrLoadModule('/src/api/client.ts');
  assert.equal((await getHealth()).ok, true);
  assert.deepEqual((await getCatalogOptions()).data, MOCK_CATALOG);
  assert.deepEqual((await createMatch(DEMO_INPUT)).data, FOUND_FIXTURE);
  const render = (component, props) => renderToStaticMarkup(createElement(component, props));
  const found = render(MatchResults, { result: FOUND_FIXTURE });
  assert.equal((found.match(/<article/g) ?? []).length, 3);
  assert.match(found, /Показаны все/);
  assert.match(found, /Синтетический профиль/);
  assert.match(found, /Город дополнен/);
  assert.match(found, /Цена дополнена/);
  assert.match(found, /Почему подходит/);
  assert.match(found, /от 120/);
  // Visible text only: attributes may hold encoded SVG avatars, but no fake ratings or "98% match" may be shown.
  assert.doesNotMatch(found.replace(/<[^>]+>/g, ' '), /рейтинг|звезд|звёзд|%|Керемет таңдау/i);
  const noCategory = render(MatchResults, { result: NO_CATEGORY_FIXTURE });
  assert.match(noCategory, /В этом городе нет такой категории/);
  assert.doesNotMatch(noCategory, /<article/);
  const noMatch = render(MatchResults, { result: { ...NO_MATCH_FIXTURE, candidatesBeforeCut: 3 } });
  assert.match(noMatch, /Кандидатов до ограничения выдачи: 3/);
  assert.match(noMatch, /занят/);
  assert.doesNotMatch(noMatch, /<article/);
  const form = render(RequestForm, { catalog: MOCK_CATALOG, pending: false, onSearch() {} });
  assert.match(form, /name="city"/);
  assert.match(form, /name="durationHours"/);
  assert.doesNotMatch(form, /<details open/);
  const busyForm = render(RequestForm, { catalog: MOCK_CATALOG, pending: true, onSearch() {} });
  assert.match(busyForm, /fieldset disabled/);
  const summary = render(RequestSummary, { input: { ...DEMO_INPUT, language: 'kz', durationHours: 4 }, catalog: MOCK_CATALOG, pending: false, onSearch() {} });
  assert.match(summary, /Қазақша/);
  assert.match(summary, /4 ч/);
  assert.match(summary, /value="2026-11-14"/);
  console.log('PASS: API mock boundary, rendered status distinction, counts, cards, catalog form, hidden optional fields, pending controls, request summary.');
} finally {
  await server.close();
}
