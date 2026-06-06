# React + TypeScript Frontend

Modern React frontend with TypeScript and Vite, consuming the Laravel API.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## API Integration

The API client is auto-generated from the Laravel API's OpenAPI spec using Orval.

### Generate API Client

First, ensure the Laravel backend is running and has generated its OpenAPI documentation.

Then generate the API client:
```bash
npm run generate-api
```

This will create type-safe API calls based on the backend's OpenAPI spec.

## Build

```bash
npm run build
```

## Linting

```bash
npm run lint
```

## Project Structure

- `src/components/` - Reusable React components
- `src/pages/` - Page components for routing
- `src/hooks/` - Custom React hooks
- `src/services/` - Generated API client and API-related utilities
- `src/styles/` - Global styles and utilities

## Environment Variables

Create a `.env.local` file:
```
VITE_API_URL=http://localhost:8000
```

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool with fast HMR
- **Axios** - HTTP client
- **Bootstrap 5** - UI framework
- **Orval** - OpenAPI client generator
- **React Router** - Routing
