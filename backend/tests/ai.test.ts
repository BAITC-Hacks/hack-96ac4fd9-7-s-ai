import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { createExplainer, validateSelections } from '../src/ai/index.js';
import { createOpenAIProvider, OPENAI_MODEL } from '../src/ai/openai.js';
import { createNvidiaProvider, NVIDIA_MODEL } from '../src/ai/nvidia.js';
import { explanationChoices } from '../src/lib/explanations.js';
import { loadCatalog } from '../src/lib/catalog.js';
import { selectMatches } from '../src/lib/matching.js';
import type { CreateMatchInput } from '../../shared/types.js';

const catalog = loadCatalog();
const input: CreateMatchInput = { city: 'Алматы', category: 'Ведущий', eventType: 'корпоратив', eventDate: '2026-10-06', budgetKzt: 1000000 };
const selected = selectMatches(catalog, input).selected;
const choices = selected.map(profile => explanationChoices(profile, input));
const valid = { items: choices.map(item => ({ id: item.id, evidenceIndex: 0, factIndex: 0 })) };

test('one batch covers all selected profiles; returned order follows deterministic selection', async () => {
  let calls = 0;
  const explain = createExplainer({ cachePath: false, providers: [async batch => {
    calls += 1;
    assert.equal(batch.length, 3);
    return { items: [...valid.items].reverse() };
  }] });
  const result = await explain(selected, input, catalog.version);
  assert.equal(calls, 1);
  assert.deepEqual(result, validateSelections(valid, choices));
  assert.ok(result?.every((text, i) => text.includes(choices[i]!.evidence[0]!.replace(/[.!?]+$/u, ''))));
});

test('invalid IDs, duplicate IDs, invented text and out-of-range evidence are never accepted', () => {
  assert.equal(validateSelections({ items: valid.items.slice(1) }, choices), null);
  assert.equal(validateSelections({ items: valid.items.map(() => valid.items[0]) }, choices), null);
  assert.equal(validateSelections({ items: valid.items.map(item => ({ ...item, id: 'invented' })) }, choices), null);
  assert.equal(validateSelections({ items: valid.items.map(item => ({ ...item, evidenceIndex: 999 })) }, choices), null);
  assert.equal(validateSelections({ items: valid.items.map(item => ({ ...item, explanation: 'Invented claim' })) }, choices), null);
});

test('primary failure falls back once to secondary; both failures preserve templates', async () => {
  const order: string[] = [];
  const explain = createExplainer({ cachePath: false, providers: [async () => { order.push('openai'); throw new Error('upstream error'); }, async () => { order.push('nvidia'); return valid; }] });
  assert.ok(await explain(selected, input, catalog.version));
  assert.deepEqual(order, ['openai', 'nvidia']);
  const failed = createExplainer({ cachePath: false, providers: [async () => { throw new Error('failed'); }, async () => 'invalid'] });
  assert.equal(await failed(selected, input, catalog.version), null);
  assert.equal(await createExplainer({ cachePath: false, providers: [] })(selected, input, catalog.version), null);
});

test('hung providers are aborted and bounded even when they ignore cancellation', async () => {
  const signals: AbortSignal[] = [];
  const stuck = async (_choices: unknown, signal: AbortSignal): Promise<unknown> => { signals.push(signal); return new Promise(() => {}); };
  const explain = createExplainer({ cachePath: false, providers: [stuck, stuck], providerTimeoutMs: 30 });
  const started = performance.now();
  assert.equal(await explain(selected, input, catalog.version), null);
  assert.ok(performance.now() - started < 1000);
  assert.ok(signals.every(signal => signal.aborted));
});

test('OpenAI and NVIDIA SDK adapters submit one batch through stub transport with bounded output', async () => {
  for (const [factory, model] of [[createOpenAIProvider, OPENAI_MODEL], [createNvidiaProvider, NVIDIA_MODEL]] as const) {
    let calls = 0;
    const client = new OpenAI({ apiKey: 'unit-test-only', maxRetries: 0, fetch: async (_url, options) => {
      calls += 1;
      const body = JSON.parse(String(options?.body)) as { model: string; max_tokens: number; messages: { content: string }[] };
      assert.equal(body.model, model);
      assert.equal(body.max_tokens, 350);
      const payload = JSON.parse(body.messages[1]!.content) as { contractors: unknown[] };
      assert.equal(payload.contractors.length, 3);
      return new Response(JSON.stringify({ id: 'test', object: 'chat.completion', created: 0, model,
        choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(valid) }, finish_reason: 'stop' }] }), { headers: { 'Content-Type': 'application/json' } });
    } });
    const provider = factory(undefined, client)!;
    assert.deepEqual(await provider(choices, new AbortController().signal), valid);
    assert.equal(calls, 1);
  }
});

test('validated AI selections survive restart; changed dataset or input does not reuse stale output', async () => {
  mkdirSync('.status', { recursive: true });
  const directory = mkdtempSync(join('.status', 'cache-test-'));
  const cachePath = join(directory, 'cache.json');
  let calls = 0;
  const explain = createExplainer({ cachePath, providers: [async () => { calls += 1; return valid; }] });
  const first = await explain(selected, input, catalog.version);
  assert.deepEqual(await explain(selected, input, catalog.version), first);
  assert.equal(calls, 1);
  assert.ok(readFileSync(cachePath, 'utf8').includes('evidenceIndex'));
  const offline = createExplainer({ cachePath, providers: [] });
  assert.deepEqual(await offline(selected, input, catalog.version), first);
  assert.equal(await offline(selected, input, `${catalog.version}-changed`), null);
  assert.equal(await offline(selected, { ...input, budgetKzt: 999999 }, catalog.version), null);
  writeFileSync(cachePath, '{invalid-json');
  assert.equal(await createExplainer({ cachePath, providers: [] })(selected, input, catalog.version), null);
});
