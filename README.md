# Ber Car

Full-stack проект для автосервиса Ber Car:

- `client/` - React + Vite лендинг и админка.
- `server/` - Node.js + Express API.
- `database/` - SQL-схема и стартовые данные PostgreSQL.

## Что есть

- Публичный лендинг берет контент из API.
- Форма записи сохраняет данные клиента, автомобиль, тип услуги, желаемые дату/время и комментарии в PostgreSQL.
- Скрытая админка: `/bercar-control/login` и `/bercar-control/dashboard`.
- Авторизация администратора через JWT в `httpOnly` cookie.
- Protected API routes для админки.
- CRUD для `content_blocks`, `services`, `problems`, `contacts`.
- Просмотр заявок, подтверждение/перенос/отмена записи, проверка слотов, скачивание `.ics`.
- Telegram-уведомления администратору о новых и измененных заявках.

## Требования

- Node.js 20+
- PostgreSQL 14+
- npm

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать базу данных:

```bash
createdb ber_car
```

3. Применить схему и seed:

```bash
psql -d ber_car -f database/schema.sql
psql -d ber_car -f database/seed.sql
```

Для существующей базы примените миграции:

```bash
psql -d ber_car -f database/migrations/001_extend_leads.sql
psql -d ber_car -f database/migrations/002_booking_slots.sql
```

4. Создать env-файл для сервера:

```bash
cp .env.example server/.env
```

В Windows PowerShell:

```powershell
Copy-Item .env.example server/.env
```

Проверьте `DATABASE_URL` и замените `JWT_SECRET` на длинную случайную строку.

### Telegram-уведомления

1. Создайте бота через `@BotFather`.
2. Получите токен бота.
3. Узнайте `chat_id` администратора или группы.
4. Добавьте в `server/.env`:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...
TELEGRAM_PROXY_URL=socks5://user:password@host:1080
TELEGRAM_PROXY_URL_2=https://user:password@host:8443
TELEGRAM_PROXY_URL_3=http://user:password@host:8080
TELEGRAM_PROXY_ROTATION=true
```

Proxy-поля необязательные. Если Telegram недоступен напрямую, backend попробует proxy по очереди. Для proxy-режима на production установите пакет `undici` в server dependencies, чтобы работал `ProxyAgent`.

5. Перезапустите backend:

```bash
pm2 restart ber-car-api
```

6. Проверьте статус и уведомление через protected endpoints после входа:

```bash
curl http://127.0.0.1:4000/api/admin/system/telegram-status
curl -X POST http://127.0.0.1:4000/api/admin/test-telegram-notification
```

5. Запустить API:

```bash
npm run server:dev
```

6. Во втором терминале запустить клиент:

```bash
npm run client:dev
```

## Адреса

- Сайт: http://127.0.0.1:5173/
- Админка: http://127.0.0.1:5173/bercar-control/login
- API healthcheck: http://127.0.0.1:4000/api/health

## Доступ в админку после seed

- Email: `admin@bercar.local`
- Пароль: `admin123`

После первого запуска лучше сменить пароль через SQL или добавить отдельный экран управления администраторами.

## API

Публичные:

- `GET /api/public/site`
- `GET /api/public/booking-slots?date=YYYY-MM-DD`
- `POST /api/public/leads`

Авторизация:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Админские protected routes:

- `GET /api/admin/content-blocks`
- `POST /api/admin/content-blocks`
- `PUT /api/admin/content-blocks/:id`
- `DELETE /api/admin/content-blocks/:id`
- Те же CRUD-маршруты для `services`, `problems`, `contacts`.
- `GET /api/admin/leads`
- `GET /api/admin/leads/:id`
- `PATCH /api/admin/leads/:id`
- `DELETE /api/admin/leads/:id`
- `GET /api/admin/leads/:id/calendar.ics`
- `GET /api/admin/system/telegram-status`
- `POST /api/admin/test-telegram-notification`

## Логика записи

- Клиент выбирает желаемую дату и время, администратор подтверждает запись.
- Слот блокируют только заявки со статусом `confirmed` или `in_progress`.
- Проверка пересечения: `new_start < existing_end AND new_end > existing_start`.
- При переносе сохраняется предыдущий слот.
- При отмене сохраняются `cancelled_at` и `cancel_reason`.

## Примечания

В dev-режиме клиент ходит в API через Vite proxy (`/api` -> `http://127.0.0.1:4000`). Для отдельного API-домена можно создать `client/.env` и указать `VITE_API_URL`.

## Production hardening

- Пример Nginx-конфига: `deploy/nginx.ber-car.conf`.
- Backend включает `trust proxy`, secure headers, CORS whitelist, JSON body limit, structured request/error logs.
- Cookies администратора: `httpOnly`, `sameSite=strict`, `secure` в production.
- Login защищен in-memory rate limit/cooldown; для нескольких backend-инстансов лучше вынести rate limit в Redis/Nginx.
- Публичный UI не содержит ссылок на админку. Скрытый вход открывается 5 кликами по логотипу.
