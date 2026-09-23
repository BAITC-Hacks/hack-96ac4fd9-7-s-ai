import OpenAI from 'openai';
import { SYSTEM_PROMPT, type BatchProvider } from './provider.js';

export const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';
export const NVIDIA_DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export function createNvidiaProvider(apiKey = process.env.NVIDIA_API_KEY, clientOverride?: OpenAI): BatchProvider | undefined {
  if (!apiKey && !clientOverride) return undefined;
  const client = clientOverride ?? new OpenAI({ apiKey: apiKey!, baseURL: process.env.NVIDIA_BASE_URL || NVIDIA_DEFAULT_BASE_URL, maxRetries: 0, timeout: 1800 });
  return async (choices, signal) => {
    const response = await client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ contractors: choices }) }],
      temperature: 0, max_tokens: 350,
    }, { signal, maxRetries: 0, timeout: 1800 });
    const first = response.choices[0];
    if (!first || first.finish_reason !== 'stop' || !first.message.content) throw new Error('Unusable AI response.');
    return JSON.parse(first.message.content) as unknown;
  };
}
