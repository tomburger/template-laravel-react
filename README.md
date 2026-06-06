# Laravel + React Headless Template

A modern headless architecture template combining Laravel REST API with React TypeScript frontend.

## Project Structure

```
template-laravel-react/
├── backend/              # Laravel API
├── frontend/             # React TypeScript UI
└── .copilot-instructions.md
```

## Quick Start

### Backend Setup

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

API runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

UI runs on `http://localhost:5173`

## Architecture

- **Backend**: Laravel REST API with Sanctum authentication
- **Frontend**: React 18 with TypeScript, Vite, and Bootstrap
- **API Integration**: Type-safe client auto-generated from OpenAPI spec using Orval
- **Database**: SQLite (configurable in backend `.env`)
- **Authentication**: Token-based with Laravel Sanctum

## Key Features

- ✅ Headless API (no server-side rendering)
- ✅ Type-safe React with TypeScript
- ✅ Auto-generated API client from OpenAPI spec
- ✅ Bootstrap UI components
- ✅ Hot reloading in development
- ✅ CORS configured for frontend/backend communication
- ✅ RESTful API design

## Technologies

### Backend
- Laravel 11
- PHP 8.1+
- Laravel Sanctum (authentication)
- Scribe (API documentation)

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- Bootstrap 5
- Axios
- Orval (API client generator)
- React Router

## Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Copilot Instructions](.copilot-instructions.md)

## Development Workflow

1. Start Laravel backend: `cd backend && php artisan serve`
2. Start React frontend: `cd frontend && npm run dev`
3. Generate API client when backend API changes: `cd frontend && npm run generate-api`
4. Build for production: 
   - Backend: follow Laravel deployment guidelines
   - Frontend: `npm run build`

## License

See [LICENSE](LICENSE) file.
