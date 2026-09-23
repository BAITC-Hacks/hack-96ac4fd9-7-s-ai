# Smart contractor matching backend

Express + TypeScript API, 66 профиль және ортақ `CreateMatchInput` / `MatchResult`
келісімі. Барлық жаңа іске асыру тек `backend/` ішінде.

## Іске қосу

Репозиторий түбірінен `backend` папкасына өтіп:

```powershell
npm ci
npm run dev
```

Node 20+ қажет; тексерілген орта — Node 24.19.0. Сервер: `http://127.0.0.1:8787`.
`npm start` те іске қосады; tsx dev dependency болғандықтан runtime орнатқанда
dev dependencies-ті өткізіп жібермеңіз. Порт `PORT` арқылы беріледі, әдепкі 8787.

Кілтсіз де нақты matching және фактілік template түсіндірмелері жұмыс істейді.
Адам берген `OPENAI_API_KEY`, `NVIDIA_API_KEY`, қажет болса `NVIDIA_BASE_URL`
сервердің environment мәндерінен оқылады. Backend `.env`, одан кейін root `.env`
оқылады, бірақ бар process environment басым. `.env` файлдары бұл жұмыста
жасалмады және өзгертілмеді. Кілтті кодқа, чатқа немесе GitHub-қа қоймаңыз.

## FRONT интеграциясы

- Клиент функциялары: `getHealth()`, `getCatalogOptions()`, `createMatch(input)`.
- Vite `/api` proxy → `http://localhost:8787`; CORS localhost/127.0.0.1:5173 үшін ашық.
- Екі адам бөлек компьютерде болса, әрқайсысының localhost-ы басқа. Бірге тексеру
  үшін FRONT және BACK бір интеграция көшірмесінде іске қосылады.
- Көрінетін атауды аударуға болады, бірақ metadata мәнін API-ға өзгеріссіз жіберіңіз.
- Қазақ тілінің келісімдегі мәні **`kz`**, `kk` емес.
- Жауап кілттері: **`status`, `cards`, `message`, `candidatesBeforeCut`**.
- `cityId`, `categoryId`, `outcome`, `matches` сияқты ескі draft өрістері қолданылмайды.
- Күн диапазоны 2026-09-23–2026-12-31, екі шеті кіреді. Уақыт белдеуіне айналдырмаңыз.
- Баға — бастапқы баға. `dataFlags` белгілерін сақтап көрсетіңіз.
- Карточкаларды frontend қайта сұрыптамайды; key ретінде `card.id` пайдаланады.

### Endpoint-тер

`GET /api/health` → `{ok:true,data:{status:'up'}}`.

`GET /api/catalog-options` → `ApiResponse<CatalogOptions>`; нақты деректен 3 қала,
17 санат, 6 формат және `en/kz/ru` тілдері.

`POST /api/match` сұранысы:

```json
{
  "city": "Алматы",
  "eventDate": "2026-10-06",
  "eventType": "корпоратив",
  "category": "Ведущий",
  "budgetKzt": 1000000,
  "durationHours": 5,
  "language": "ru"
}
```

Сәтті жауап — `{ok:true,data:MatchResult}`. Бос нәтиже де HTTP 200.
`no_category`: қала+санатта профиль жоқ. `no_match`: бар, бірақ шарттан өтпеді.
`found`: 1–3 карточка; `candidatesBeforeCut` — барлық сүзгіден өткендердің саны.
Өтпеу себептері message ішінде санымен беріледі; бір профильде бірнеше себеп
қабаттасады. Олардың сандарын қосып, жеке профиль саны деп көрсетпеңіз.

Сұраныс валидациясы: міндетті өрістер, белгілі metadata мәндері, нақты ISO күн,
оң бүтін budgetKzt, берілсе оң durationHours және ru/kz/en language. Белгісіз өріс,
санның мәтін түрі және optional null қабылданбайды. HTTP 400 → VALIDATION.
Белгісіз API жолы HTTP 404 → NOT_FOUND. Сервер қатесі HTTP 500 → INTERNAL.

## Іріктеу

1. Қала және категория.
2. Формат, күн бос болуы, priceFromKzt ≤ budgetKzt, берілген тіл және ұзақтық.
3. maxHours=null болса, ұзақтық шектеуі қолданылмайды.
4. Сипаттаманың форматқа қатысты тұрақты сөз топтары бойынша ұпай.
5. Ұпай тең болса ID өсу ретімен. Баға рейтингке мүлде кірмейді.
6. Алғашқы үштік пен ерекше профиль дерегінен template түсіндірмесі.
7. `src/ai/index.ts` арқылы бір batch AI таңдауы; қатеде template сақталады.

Рейтинг нұсқасы: `description-groups-id-v1`, ереже `src/lib/matching.ts` ішінде.
Бұл сөздік эвристика сапа рейтингі немесе пайыздық сәйкестік емес; терістеуді
толық түсінбейді. Сипаттама — профиль иесінің дерегі, тәуелсіз расталған факт емес.

## AI және кэш

OpenAI → NVIDIA → template. Әр провайдерге 1800 мс, жалпы AI deadline 3600 мс,
SDK retries=0. Бір шақыруда барлық карточка беріледі, жеке-жеке шақыру жоқ.

Бұл нұсқа **деректен үзінді таңдайтын түсіндірме** қолданады: модель профильдегі
нақты сөйлемді және алдын ала тексерілген сұраныс фактілерін таңдайды. Сервер
оларды біріктіреді. Модельге жаңа баға, тәжірибе немесе бос күн ойлап табуға жол
берілмейді. Индекстер, ID жиыны және ерекше үзінділер тексеріледі; жарамсыз болса
келесі провайдер немесе template. Түпнұсқа үзінді орысша, байланыстыратын мәтін
қазақша. Толық еркін парафраз не өздігінен жоспарлайтын агент деп көрсетілмейді.

Модельдер тұрақтылары: `gpt-4.1-mini-2025-04-14` және
`meta/llama-3.3-70b-instruct`. Нақты аккаунттағы қолжетімділік live smoke-пен
тексерілуі керек. [OpenAI моделі](https://developers.openai.com/api/docs/models/gpt-4.1-mini),
[NVIDIA endpoint](https://docs.api.nvidia.com/nim/reference/meta-llama-3_3-70b-instruct-infer).

`data/cache.json` тек сәтті валидациядан өткен AI таңдауын сақтайды. Кілт сұраныс,
датасет, рейтинг, prompt/model нұсқалары және нақты дәлел нұсқаларын қамтиды.
200 жазба / 1 MiB шегі; жоқ, бүлінген немесе жазылмайтын кэш matching-ті тоқтатпайды.
Құпия кілттер мен upstream қате мәтіндері логқа жазылмайды.

## Тексеру

```powershell
npm run typecheck
npm test
# Сервер бөлек terminal-де іске қосулы болуы керек:
powershell -ExecutionPolicy Bypass -File scripts/smoke.ps1
```

Соңғы команда curl.exe арқылы нақты сервердің health, metadata, тығыз/сирек
санат, екі бос күй, күн ауыстыру және қайталанған реттілігін тексереді.
Lint конфигурациясы берілмеген; lint өтті деп есептелмейді.

Тексерілген демо:

| Сұраныс | Күтілетін нәтиже |
|---|---|
| Жоғарыдағы жүргізуші сұранысы | 6 өтті; HK-44733, HK-88430, HK-35215 |
| Тек күнін 2026-10-01 ету | 2 өтті; HK-88430, HK-44923; бұрынғы екі профиль бос емес |
| Алматы, Флорист, корпоратив, 2026-10-04, 300000, durationHours=24 | 1 өтті; HK-39372; null maxHours шектемейді |
| Астана, Декоратор, сол корпоратив сұранысы | no_category |
| Алғашқы сұраныс, budgetKzt=1000 | no_match; бюджеттен жоғары 10 профиль |

Қазір typecheck, 17 автоматты тест және curl smoke тексерілген. Модель
адаптерлері stub transport-пен тексерілді. Нақты API кілттері жоқ болғандықтан
live OpenAI/NVIDIA, production кэшін жылыту және FRONT-пен браузер интеграциясы
әлі тексерілген жоқ. Кодты commit жасауға болады, бірақ осы шектеулер сақталады.

## Өзгерген файлдар

- `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `TASKS.md`.
- `src/index.ts`, `src/app.ts`.
- `src/lib/catalog.ts`, `validation.ts`, `matching.ts`, `explanations.ts`.
- `src/ai/index.ts`, `provider.ts`, `openai.ts`, `nvidia.ts`, `cache.ts`.
- `data/contractors.csv`, `data/README.md`.
- `tests/catalog.test.ts`, `matching.test.ts`, `ai.test.ts`, `api.test.ts`.
- `scripts/smoke.ps1`, `README.md`, `CONTRACT_REQUEST.md`.

Барлық тізім backend/ аймағына қатысты. Shared және frontend файлдарын
өзгерту қажет болған жоқ. T7 кейінге қалдырылды. Git әрекеттері адамның нақты рұқсатымен ғана орындалады.

Түбірлік .gitignore backend/data/ папкасын жасырады. Тек backend/.gitignore
ішінде екі ашық файлға (contractors.csv және data/README.md) exception қосылды;
кэш пен қалған runtime деректер Git-ке кірмейді.
