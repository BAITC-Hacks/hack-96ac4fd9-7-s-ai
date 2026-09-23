import OpenAI from 'openai';
import { SYSTEM_PROMPT, SELECTION_JSON_SCHEMA, type BatchProvider } from './provider.js';

export const OPENAI_MODEL = 'gpt-4.1-mini-2025-04-14';

export function createOpenAIProvider(apiKey = process.env.OPENAI_API_KEY, clientOverride?: OpenAI): BatchProvider | undefined {
  if (!apiKey && !clientOverride) return undefined;
  const client = clientOverride ?? new OpenAI({ apiKey: apiKey!, maxRetries: 0, timeout: 1800 });
  return async (choices, signal) => {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ contractors: choices }) }],
      response_format: { type: 'json_schema', json_schema: SELECTION_JSON_SCHEMA },
      temperature: 0, max_tokens: 350,
    }, { signal, maxRetries: 0, timeout: 1800 });
    const first = response.choices[0];
    if (!first || first.finish_reason !== 'stop' || first.message.refusal || !first.message.content) throw new Error('Unusable AI response.');
    return JSON.parse(first.message.content) as unknown;
  };
}
