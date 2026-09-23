import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import type { ApiResponse, CatalogOptions, MatchResult } from '../../shared/types.js';
import { loadCatalog, type Catalog } from './lib/catalog.js';
import { createMatchSchema } from './lib/validation.js';
import { selectMatches } from './lib/matching.js';
import { createExplainer, type Explainer } from './ai/index.js';

export function createApp(catalog: Catalog = loadCatalog(), explain: Explainer = createExplainer()) {
  const matchSchema = createMatchSchema(catalog.options);
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, data: { status: 'up' } } satisfies ApiResponse<{ status: 'up' }>);
  });
  app.get('/api/catalog-options', (_req, res) => {
    res.json({ ok: true, data: catalog.options } satisfies ApiResponse<CatalogOptions>);
  });
  app.post('/api/match', async (req, res) => {
    const input = matchSchema.safeParse(req.body as unknown);
    if (!input.success) {
      res.status(400).json({ ok: false, error: { code: 'VALIDATION', message: input.error.issues.map(issue => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ') } } satisfies ApiResponse<never>);
      return;
    }
    const { result, selected } = selectMatches(catalog, input.data);
    if (selected.length > 0) {
      const explanations = await explain(selected, input.data, catalog.version).catch(() => null);
      if (explanations && explanations.length === result.cards.length) {
        result.cards = result.cards.map((card, index) => ({ ...card, explanation: explanations[index] ?? card.explanation }));
      }
    }
    res.json({ ok: true, data: result } satisfies ApiResponse<MatchResult>);
  });
  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'API жолы табылмады.' } } satisfies ApiResponse<never>);
  });
  const onError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const invalidJson = error instanceof SyntaxError;
    const tooLarge = typeof error === 'object' && error !== null && 'status' in error && error.status === 413;
    res.status(invalidJson || tooLarge ? 400 : 500).json({ ok: false, error: { code: invalidJson || tooLarge ? 'VALIDATION' : 'INTERNAL', message: tooLarge ? 'Сұраныс көлемі тым үлкен.' : invalidJson ? 'JSON пішімі дұрыс емес.' : 'Ішкі сервер қатесі.' } } satisfies ApiResponse<never>);
  };
  app.use(onError);
  return app;
}
