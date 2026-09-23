# Contractor dataset

`contractors.csv` — адам берген [Google Drive CSV](https://drive.google.com/file/d/1uUCu-szctwaTaV0-Yfg3FKHY8M3lQ3vw/view) файлының өзгеріссіз көшірмесі.

- 66 бірегей профиль: Алматы 50, Астана 15, Зарубежье 1.
- SHA-256: `6a724b6b7dfb5973343e68ba18dadb60fc807d87e3d78f03ee86fb26cb089f7d`.
- CSV delimiter: comma; quoted comma, escaped quote және multiline description рұқсат етіледі.
- `categories`, `event_formats`, `languages`, `busy_dates`: `|` арқылы бөлінген тізімдер.
- `busy_dates`: `YYYY-MM-DD`; диапазон 2026-09-23–2026-12-31.
- Бос `max_hours` → `null`. Loader literal `null` мәнін де қолдайды.
- `True`/`False` → boolean; баға → number.
- `русский` → `ru`, `казахский` → `kz`, `английский` → `en`.
- 13 synthetic, 8 cityImputed, 18 priceImputed; 9 maxHours=null.

Бастапқы атаулар мен ID сақталды. `cache.json` тек сәтті тексерілген AI жауаптан
кейін автоматты жасалады және Git-ке кірмейді. Жасанды/тест кэш өндірістік кэшке салынбайды.
