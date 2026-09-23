import { readFileSync, writeFileSync, renameSync, statSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const MAX_CACHE_ENTRIES = 200;
const MAX_CACHE_BYTES = 1024 * 1024;
const cacheSchema = z.object({ version: z.literal(1), entries: z.record(z.string().regex(/^[a-f0-9]{64}$/), z.unknown()) }).strict();

export function createSelectionCache(path: string | URL) {
  const file = typeof path === 'string' ? path : fileURLToPath(path);
  const entries = new Map<string, unknown>();
  try {
    if (statSync(file).size <= MAX_CACHE_BYTES) {
      const parsed = cacheSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')) as unknown);
      if (parsed.success) for (const [key, value] of Object.entries(parsed.data.entries).slice(-MAX_CACHE_ENTRIES)) entries.set(key, value);
    }
  } catch { /* A missing or corrupt cache never prevents matching. */ }
  return {
    get(key: string): unknown { return entries.get(key); },
    set(key: string, value: unknown): void {
      entries.delete(key);
      entries.set(key, value);
      while (entries.size > MAX_CACHE_ENTRIES) entries.delete(entries.keys().next().value!);
      try {
        mkdirSync(dirname(file), { recursive: true });
        const text = JSON.stringify({ version: 1, entries: Object.fromEntries(entries) });
        if (Buffer.byteLength(text) > MAX_CACHE_BYTES) return;
        const temporary = `${file}.${process.pid}.tmp`;
        writeFileSync(temporary, text, { encoding: 'utf8', mode: 0o600 });
        renameSync(temporary, file);
      } catch { /* Read-only storage must not turn a valid match into an error. */ }
    },
  };
}
