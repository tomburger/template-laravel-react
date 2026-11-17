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

## Management access

Roles combine: users may be administrators, content managers, community
managers, pricing managers, and owners of individual locations or seasons at
the same time. Users without these roles have no management access. Deactivated
users cannot use management endpoints.

- Administrators manage user flags and verification and can view locations and seasons.
- Content managers create, edit and delete locations and seasons, assign their
  owners, and view users.
- Community managers manage members.
- Pricing managers manage pricing rules.
- Location owners can edit their locations, units and layouts, but cannot change
  owners or delete locations.
- Season owners can edit their seasons, manage enrollments and allocations,
  but cannot change owners or delete seasons.
- Owners can also view users, members, locations and seasons they do not own.

Administrators and pricing managers can manage pricing rules. Location layout
images remain public as before. User accounts are created through self-registration.

Authenticated users can edit their own display name and create or update their
own member details from the dashboard. Member categories remain
community-manager-controlled because they affect pricing.

Season owners can adjust an enrolled member's or unit's category for that season
without changing its general category. The adjusted category is used for new
allocations; existing allocation amounts are not recalculated.

Season owners manage allocations from the Members and Units enrollment tabs.
New allocations start pending with a price from the matching pricing rule;
their price, status and variable symbol can then be edited in the allocation drawer.
The drawer can preview the current matching rule price for an allocation and copy
it into the amount field; the stored amount changes only when the edit is saved.
Cancelled allocations remain visible, and pending or cancelled allocations can be deleted.
Additional allocations can be started from an existing allocation's drawer.
The season dashboard counts distinct enrolled members and units with non-cancelled
allocations, summarizes active amounts by season category, and shows amounts by
status separately. Cancelled allocations do not contribute to active totals.
Season owners can bulk-remove pending and cancelled allocations or recalculate
pending amounts; allocations without a matching rule are skipped and reported.
They can copy active allocations from another season when both
member and unit are enrolled and the unit is free. Copies start pending with a
new variable symbol and destination pricing; missing prices and ineligible or
occupied units are skipped and reported.
