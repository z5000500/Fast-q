# QuizCraft (fast_q)

A full-stack quiz platform for creating, sharing, and taking interactive quizzes with real-time features.

## Architecture

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | React 18 + TypeScript + Vite + shadcn/ui | 8080 |
| REST API | Plain PHP 8.5 + PDO + JWT | 8000 |
| Realtime | Node.js + Express + Socket.io | 3001 |
| Database | MySQL 8+ | 3306 |

## Prerequisites

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `openssl` extensions
- Composer
- Node.js 18+
- MySQL 8+

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql   # optional demo data
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and a strong JWT_SECRET
```

### 3. PHP API

```bash
cd api
composer install
php -S 127.0.0.1:8000 -t public
```

### 4. Realtime Service

```bash
cd realtime
npm install
npm run dev
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:8080 in your browser.

## API Endpoints

### Auth
- `POST /api/auth/register` -- create account
- `POST /api/auth/login` -- sign in (returns JWT + refresh token)
- `POST /api/auth/refresh` -- rotate refresh token
- `POST /api/auth/logout` -- invalidate refresh token
- `GET  /api/auth/me` -- current user profile

### Quizzes
- `GET    /api/quizzes` -- list my quizzes
- `POST   /api/quizzes` -- create quiz
- `GET    /api/quizzes/:id` -- get quiz with questions
- `PUT    /api/quizzes/:id` -- update quiz
- `DELETE /api/quizzes/:id` -- delete quiz
- `GET    /api/quizzes/join/:code` -- get quiz by share code
- `POST   /api/quizzes/:id/duplicate` -- duplicate quiz

### Attempts
- `POST /api/quizzes/:id/attempts` -- submit attempt
- `GET  /api/quizzes/:id/attempts` -- list attempts (owner only)
- `GET  /api/quizzes/:id/stats` -- quiz statistics
- `GET  /api/quizzes/:id/leaderboard` -- public leaderboard
- `GET  /api/attempts/me` -- my attempts

### Stats & Notifications
- `GET /api/stats/global` -- global stats
- `GET /api/notifications` -- user notifications
- `PUT /api/notifications/:id/read` -- mark read

## Socket.io Namespaces

- `/quiz-session` -- live quiz hosting and participation
- `/leaderboard` -- real-time leaderboard updates
- `/notifications` -- push notifications for authenticated users

## Project Structure

```
fast_q/
├── .env                  # shared environment config
├── database/
│   ├── schema.sql        # MySQL schema (8 tables)
│   └── seed.sql          # demo seed data
├── api/                  # PHP REST API
│   ├── composer.json
│   ├── public/index.php  # router entry point
│   └── src/
│       ├── Config/
│       ├── Controllers/
│       ├── Helpers/
│       ├── Middleware/
│       └── Models/
├── realtime/             # Node.js Socket.io service
│   ├── package.json
│   ├── server.js
│   ├── config/
│   ├── middleware/
│   └── socket/
└── frontend/             # React SPA
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/          # API client layer
        ├── socket/       # Socket.io hooks
        ├── contexts/     # Auth context (JWT)
        ├── hooks/        # TanStack Query hooks
        ├── pages/
        ├── components/
        └── types/
```

## Demo Accounts (after running seed.sql)

| Email | Password |
|-------|----------|
| demo@quizcraft.com | password123 |
| alice@quizcraft.com | password123 |
