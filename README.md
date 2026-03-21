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
