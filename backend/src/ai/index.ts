import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { CreateMatchInput } from '../../../shared/types.js';
import type { Contractor } from '../lib/catalog.js';
import { explanationChoices, assembleExplanation, type ExplanationChoices } from '../lib/explanations.js';
import { createOpenAIProvider, OPENAI_MODEL } from './openai.js';
import { createNvidiaProvider, NVIDIA_MODEL } from './nvidia.js';
import { EXPLANATION_VERSION, type BatchProvider } from './provider.js';
import { RANKING_VERSION } from '../lib/matching.js';
import { createSelectionCache } from './cache.js';

const selectionSchema = z.object({ items: z.array(z.object({
  id: z.string(), evidenceIndex: z.number().int().nonnegative(), factIndex: z.number().int().nonnegative(),
}).strict()).min(1).max(3) }).strict();

export type Explainer = (profiles: Contractor[], input: CreateMatchInput, datasetVersion: string) => Promise<string[] | null>;
export interface ExplainerOptions { providers?: BatchProvider[]; providerTimeoutMs?: number; cachePath?: string | URL | false }

export function validateSelections(raw: unknown, choices: ExplanationChoices[]): string[] | null {
  const parsed = selectionSchema.safeParse(raw);
  if (!parsed.success || parsed.data.items.length !== choices.length) return null;
  const byId = new Map(parsed.data.items.map(item => [item.id, item]));
  if (byId.size !== choices.length) return null;
  const explanations: string[] = [];
  const evidenceSeen = new Set<string>();
  for (const item of choices) {
    const selection = byId.get(item.id);
    if (!selection || !item.evidence[selection.evidenceIndex] || !item.facts[selection.factIndex]) return null;
    const evidence = item.evidence[selection.evidenceIndex]!.toLowerCase();
    if (evidenceSeen.has(evidence)) return null;
    evidenceSeen.add(evidence);
    explanations.push(assembleExplanation(item, selection.evidenceIndex, selection.factIndex));
  }
  return explanations;
}

async function callWithinDeadline(provider: BatchProvider, choices: ExplanationChoices[], timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => provider(choices, controller.signal)),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('AI deadline reached.')); }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    controller.abort();
  }
}

export function createExplainer(options: ExplainerOptions = {}): Explainer {
  const providers = options.providers ?? [createOpenAIProvider(), createNvidiaProvider()].filter((provider): provider is BatchProvider => provider !== undefined);
  const timeoutMs = options.providerTimeoutMs ?? 1800;
  const cache = options.cachePath === false ? null : createSelectionCache(options.cachePath ?? new URL('../../data/cache.json', import.meta.url));
  return async (profiles, input, datasetVersion) => {
    if (profiles.length === 0) return null;
    const choices = profiles.map(profile => explanationChoices(profile, input));
    const cacheKey = createHash('sha256').update(JSON.stringify({
      datasetVersion, ranking: RANKING_VERSION, prompt: EXPLANATION_VERSION, models: [OPENAI_MODEL, NVIDIA_MODEL],
      input: { city: input.city, eventDate: input.eventDate, eventType: input.eventType, category: input.category,
        budgetKzt: input.budgetKzt, language: input.language ?? null, durationHours: input.durationHours ?? null,
        locale: input.locale ?? 'kz' },
      choices,
    })).digest('hex');
    const cached = cache?.get(cacheKey);
    if (cached !== undefined) {
      const explanations = validateSelections(cached, choices);
      if (explanations) return explanations;
    }
    const deadline = performance.now() + timeoutMs * 2;
    for (const provider of providers.slice(0, 2)) {
      const remaining = Math.min(timeoutMs, deadline - performance.now());
      if (remaining <= 0) break;
      try {
        const response = await callWithinDeadline(provider, choices, remaining);
        const explanations = validateSelections(response, choices);
        if (explanations) {
          cache?.set(cacheKey, response);
          return explanations;
        }
      } catch {
        // Never log credentials, upstream payloads, request headers or provider errors.
      }
    }
    return null;
  };
}
