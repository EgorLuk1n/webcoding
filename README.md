# Ber Car

Full-stack проект для автосервиса Ber Car:

- `client/` - React + Vite лендинг и админка.
- `server/` - Node.js + Express API.
- `database/` - SQL-схема и стартовые данные PostgreSQL.

## Что есть

- Публичный лендинг берет контент из API.
- Форма заявки сохраняет `name`, `phone`, `car`, `message` в PostgreSQL.
- Админка: `/admin/login` и `/admin/dashboard`.
- Авторизация администратора через JWT в `httpOnly` cookie.
- Protected API routes для админки.
- CRUD для `content_blocks`, `services`, `problems`, `contacts`.
- Просмотр заявок и смена статуса заявки.

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

4. Создать env-файл для сервера:

```bash
cp .env.example server/.env
```

В Windows PowerShell:

```powershell
Copy-Item .env.example server/.env
```

Проверьте `DATABASE_URL` и замените `JWT_SECRET` на длинную случайную строку.

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
- Админка: http://127.0.0.1:5173/admin/login
- API healthcheck: http://127.0.0.1:4000/api/health

## Доступ в админку после seed

- Email: `admin@bercar.local`
- Пароль: `admin123`

После первого запуска лучше сменить пароль через SQL или добавить отдельный экран управления администраторами.

## API

Публичные:

- `GET /api/public/site`
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
- `PATCH /api/admin/leads/:id`

## Примечания

В dev-режиме клиент ходит в API через Vite proxy (`/api` -> `http://127.0.0.1:4000`). Для отдельного API-домена можно создать `client/.env` и указать `VITE_API_URL`.
