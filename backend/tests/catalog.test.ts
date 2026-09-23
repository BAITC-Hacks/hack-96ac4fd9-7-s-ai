import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog, parseCatalog, isCalendarDate } from '../src/lib/catalog.js';

test('original CSV loads 66 unique profiles and normalizes list, boolean, language and null values', () => {
  const catalog = loadCatalog();
  assert.equal(catalog.contractors.length, 66);
  assert.equal(new Set(catalog.contractors.map(p => p.id)).size, 66);
  assert.equal(catalog.contractors.filter(p => p.synthetic).length, 13);
  assert.equal(catalog.contractors.filter(p => p.maxHours === null).length, 9);
  assert.deepEqual(catalog.options.languages, ['en', 'kz', 'ru']);
  const florist = catalog.contractors.find(p => p.id === 'HK-39372');
  assert.ok(florist);
  assert.equal(florist.priceFromKzt, 200000);
  assert.equal(florist.priceImputed, true);
  assert.ok(florist.busyDates.has('2026-10-01'));
  assert.equal(florist.busyDates.has('2026-10-04'), false);
  assert.ok(florist.description.includes('Trickster Café'));
  assert.equal(catalog.options.categories.includes('Банкетный зал'), true);
  assert.equal(catalog.options.categories.some(c => c.includes('|')), false);
});

test('quoted commas, escaped quotes and embedded newlines are parsed without losing description', () => {
  const csv = 'id,anon_name,categories,city,price_from_kzt,event_formats,languages,max_hours,busy_dates,description,synthetic,city_imputed,price_imputed\n'
    + 'TEST,Name,Флорист,Алматы,100,корпоратив,казахский,null,,"Первое, второе\nОн сказал ""да""",True,False,True\n';
  const p = parseCatalog(csv).contractors[0];
  assert.ok(p);
  assert.equal(p.description, 'Первое, второе\nОн сказал "да"');
  assert.equal(p.maxHours, null);
  assert.deepEqual(p.languages, ['kz']);
  assert.throws(() => parseCatalog(csv + csv.split('\n').slice(1).join('\n')), /Duplicate/);
});

test('invalid calendar dates do not silently overflow', () => {
  assert.equal(isCalendarDate('2026-02-30'), false);
  assert.equal(isCalendarDate('2026-11-31'), false);
  assert.equal(isCalendarDate('2026-10-01'), true);
  assert.equal(isCalendarDate('2026-1-1'), false);
});
