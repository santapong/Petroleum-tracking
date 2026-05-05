# Petroleum Tracking - Thailand

Full supply chain petroleum tracking system for Thailand with bilingual support (Thai/English).

## Features

- **Fuel Price Tracking** - Daily prices for Diesel, Gasohol 91/95, E20, E85, LPG, NGV
- **Station Management** - Manage gas stations across Thailand with province-based organization
- **Inventory Management** - Monitor fuel stock levels with low-stock alerts
- **Delivery Tracking** - Track fuel deliveries from depots to stations with status updates
- **Analytics Dashboard** - Price trends, inventory overview, delivery statistics with interactive charts
- **Bilingual UI** - Thai and English language support

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js)
- **UI**: Tailwind CSS + shadcn/ui
- **i18n**: next-intl
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Push database schema
npx prisma db push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/petroleum_tracking"
AUTH_SECRET="your-secret-key"
EPPO_API_BASE="https://api.eppo.go.th"
EPPO_CATALOG_BASE="https://catalog.eppo.go.th"
```

### Default Admin Account

After seeding:
- Email: `admin@petroleum.th`
- Password: `admin123`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Real Data: Admin Data Sync

The seeded data is for demos only. Admins can replace it with real data from the **Data Sync** page (`/[locale]/admin/sync`), which is visible in the sidebar to users with the `ADMIN` role.

### Refresh prices from EPPO

Click **Refresh Prices from EPPO**. The server calls Thailand's Energy Policy and Planning Office open API (`api.eppo.go.th`) and falls back to the EPPO CKAN data catalog (`catalog.eppo.go.th`), maps Thai/English fuel labels to the `FuelType` enum, and upserts rows in `FuelPrice` keyed by `(fuelType, effectiveDate)` so re-runs are idempotent.

### CSV imports (stations / inventory / deliveries)

EPPO does not publish per-station operational data. Upload CSVs with the columns below to populate those tables:

- `stations.csv` — `name, address, provinceCode, latitude, longitude, owner, phone, status` (provinceCode matches `Province.nameEn`)
- `inventory.csv` — `stationName, fuelType, quantity, capacity`
- `deliveries.csv` — `depotName, stationName, fuelType, quantity, status, scheduledDate, deliveredDate, driverName, truckPlate, notes`

Each upload returns `{ inserted, updated, skipped, errors[] }`. Stations and inventory upsert by natural key; deliveries always insert.
