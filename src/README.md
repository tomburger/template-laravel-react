# Application README (src)

This folder is the real application root. It contains both:
- Laravel backend code
- React frontend source integrated through Vite

## Folder Overview

```
src/
├── app/                        # Laravel application code
├── routes/                     # API and web routes
├── database/                   # Migrations and seeders
├── resources/views/            # Blade entry points
├── frontend/                   # React pages/components/styles/services
├── public/build/               # Built frontend assets (production)
├── artisan
├── composer.json
├── package.json
└── vite.config.ts
```

## Prerequisites

- PHP 8.1+
- Composer
- Node.js 20+
- npm
- SQLite or another Laravel-supported database

## Setup

1. Install dependencies

```bash
composer install
npm install
```

2. Configure environment

```bash
copy .env.example .env
php artisan key:generate
php artisan migrate
```

On macOS/Linux, use `cp .env.example .env`.

3. Run development servers

```bash
php artisan serve
npm run dev
```

Default local URLs:
- Laravel: `http://localhost:8000`
- Vite: `http://localhost:5173`

## Frontend Workflow

- React source is under `frontend/`.
- Use `npm run dev` for live watch and HMR.
- Avoid `npm run build` during routine local development unless you explicitly need production output.

## API Documentation

Generate Scribe docs:

```bash
php artisan scribe:generate --no-interaction --force
```

## Testing

Backend tests:

```bash
php artisan test
```

## Authentication

Token-based auth is used for API requests.

Authorization header format:

```
Authorization: Bearer {token}
```
