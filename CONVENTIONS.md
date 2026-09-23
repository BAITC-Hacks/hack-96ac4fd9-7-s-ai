# CONVENTIONS.md — единые правила стека и имён

Цель: код FRONT и BACK стыкуется с первого раза.
Главный приём: **TypeScript на обеих сторонах и один файл типов `shared/types.ts`**.
Если имя поля не совпадает, компилятор сразу покажет ошибку.

> Если на месте решите сменить стек, поменяйте этот файл вдвоём **в первые 20 минут**, до кодинга.

## Стек по умолчанию
| | FRONT | BACK |
|---|---|---|
| Язык | TypeScript (strict) | TypeScript (strict) |
| Основа | Vite + React | Node 20+ · Express |
| Стили | Tailwind CSS | — |
| Прочее | fetch (без axios) | `openai` SDK (и для OpenAI, и для NVIDIA), `zod` для валидации |
| Порт | 5173 | 8787 |
| Запуск | `npm run dev` | `npm run dev` (tsx watch) |

Фронт ходит на `/api/...`, Vite проксирует запросы на `http://localhost:8787`.

### Скаффолд (делают люди, 0:20)
```bash
# FRONT
npm create vite@latest frontend -- --template react-ts
# папка не пустая (там AGENTS.md) → выбрать "Ignore files and continue"
# затем: tailwind по доке Vite, proxy в vite.config.ts:  server: { proxy: { '/api': 'http://localhost:8787' } }
# в package.json добавить: "typecheck": "tsc -b --noEmit"

# BACK
mkdir backend && cd backend && npm init -y
npm i express cors openai zod dotenv
npm i -D typescript tsx @types/express @types/cors @types/node
# scripts: "dev": "tsx watch src/index.ts", "typecheck": "tsc --noEmit", "start": "tsx src/index.ts"
```

## Имена (обязательно)
| Что | Стиль | Пример |
|---|---|---|
| Поля JSON, переменные, функции | camelCase | `imageUrl`, `createdAt`, `generateImage()` |
| Типы, интерфейсы, React-компоненты | PascalCase | `Generation`, `GalleryCard` |
| Файлы компонентов | PascalCase.tsx | `GalleryCard.tsx` |
| Остальные файлы | camelCase.ts | `apiClient.ts`, `generate.ts` |
| Константы и env | UPPER_SNAKE | `MAX_PROMPT_LENGTH`, `OPENAI_API_KEY` |
| URL | kebab-case, мн. число | `/api/generations`, `/api/style-presets` |
| Даты | ISO-строка | `"2026-09-23T12:00:00Z"` |
| ID | string | `"gen_abc123"` |

**Запрещено** snake_case в JSON, `any`, дублировать типы из `shared/` вручную.
Импортируй их: `import type { Generation } from '../../shared/types'`.

## Формат ответа API (всегда)
```ts
{ ok: true,  data: T }
{ ok: false, error: { code: 'VALIDATION' | 'AI_FAILED' | 'NOT_FOUND' | 'INTERNAL', message: string } }
```
Тип называется `ApiResponse<T>` и лежит в `shared/types.ts`. HTTP-статус тоже ставить (200/400/404/500).

## Структура
```
frontend/src/
  api/client.ts        ← ЕДИНСТВЕННОЕ место с fetch. Функции 1:1 с эндпоинтами из api.md
  api/mocks.ts         ← моки по типам из shared, флаг VITE_USE_MOCKS=true
  pages/  components/  hooks/  lib/
backend/src/
  index.ts             ← express, cors, подключение роутов
  routes/<resource>.ts ← один файл = один ресурс из api.md
  ai/openai.ts         ← клиент OpenAI
  ai/nvidia.ts         ← клиент NVIDIA (OpenAI-совместимый, baseURL из env)
  ai/index.ts          ← generateText(), generateImage() с фолбэком OpenAI → NVIDIA
  lib/
```

## Именование функций клиента = эндпоинт
`GET /api/generations` → `listGenerations()` · `POST /api/generations` → `createGeneration()` ·
`GET /api/generations/:id` → `getGeneration(id)` · `DELETE ...` → `deleteGeneration(id)`.
Глаголы: `list` / `get` / `create` / `update` / `delete`. Бэк называет обработчики так же.

## ENV (одинаковые имена у обоих)
```
OPENAI_API_KEY=
NVIDIA_API_KEY=
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
PORT=8787
VITE_USE_MOCKS=true
```

## ИИ в продукте
- Все вызовы моделей идут **только** через `backend/src/ai/index.ts`. Фронт моделей не вызывает.
- Таймаут 60 с, при ошибке один повтор, потом фолбэк на другого провайдера.
- Названия моделей хранятся в константах в `ai/*.ts`, не разбросаны по коду.
- Для демо: кешировать удачные ответы (`backend/data/cache.json`), чтобы демо не зависело от сети.
