# SubTrack

A subscription management application to track all your recurring payments in one place.

## Features

- Track subscriptions across multiple categories (Entertainment, Productivity, Cloud, Gaming, Fitness, etc.)
- Smart reminders before billing dates
- Spending insights with monthly and yearly cost analytics
- Calendar view to visualize upcoming payments
- Support for popular services (Netflix, Spotify, ChatGPT Plus, etc.) and custom subscriptions
- Multi-language support (English, Indonesian)
- Multi-currency support (USD, IDR, EUR, GBP)
- Secure authentication with Supabase

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Authentication & Database)
- Lucide React (Icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd subtrack
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run database migrations in your Supabase project (SQL files are in `supabase/migrations/`)

6. Start the development server:

```bash
npm run dev
```

## Project Structure

```
src/
  components/       # React components
  contexts/         # React context providers (Auth, Preferences)
  lib/              # Utility functions and configurations
supabase/
  migrations/       # Database migration files
```

## Database Schema

### Tables

- `subscriptions` - Stores user subscription data
- `user_preferences` - Stores user settings (language, currency, timezone)

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## License

MIT
