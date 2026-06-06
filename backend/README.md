# Laravel Backend API

Headless REST API built with Laravel for the React frontend.

## Setup

### Prerequisites
- PHP 8.1+
- Composer
- SQLite (or other database)

### Installation

1. Install dependencies:
```bash
composer install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Generate application key:
```bash
php artisan key:generate
```

4. Run database migrations:
```bash
php artisan migrate
```

5. Start the development server:
```bash
php artisan serve
```

The API will be available at `http://localhost:8000/api`

## API Documentation

API documentation is generated using Scribe. To generate:
```bash
php artisan scribe:generate
```

Documentation will be available at `/api/documentation`

## Testing

Run tests:
```bash
php artisan test
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/user` - Get authenticated user (requires Sanctum token)

## Architecture

- **Controllers**: `app/Http/Controllers/`
- **Models**: `app/Models/`
- **Routes**: `routes/api.php`
- **Migrations**: `database/migrations/`

## CORS

CORS is configured to allow requests from the frontend. Configure the `FRONTEND_URL` in `.env`.

## Authentication

Uses Laravel Sanctum for token-based authentication. Tokens are issued on login and must be included in request headers:
```
Authorization: Bearer {token}
```
