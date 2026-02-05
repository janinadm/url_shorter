# BrevioLink - URL Shortener SaaS

A modern, production-ready URL shortener for content creators and influencers. Built with Vue 3, TypeScript, and Supabase.

## Features

- 🔗 **Create Short Links** - Turn long URLs into memorable short links with custom aliases
- 📊 **Detailed Analytics** - Track clicks, browsers, countries, and referrers with auto-refresh
- 👤 **User Authentication** - Secure signup, login, password recovery, and single-session enforcement
- 💳 **Tiered Plans** - Free (10 links, 3-day expiry) and Pro (500 links, permanent)
- 🎨 **Modern UI** - iOS-inspired design with smooth animations
- 📱 **Responsive** - Works on desktop and mobile
- 👁️ **Password Visibility Toggle** - Show/hide password in auth forms
- ⏱️ **Request Timeouts** - 15-second timeout prevents hanging requests
- 🔄 **Auto-refresh** - Dashboard and analytics update every new click

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + TypeScript |
| State | Pinia |
| Styling | SCSS (BEM) |
| Backend | Supabase (PostgreSQL + Auth) |
| Payments | Stripe |
| Charts | Chart.js |
| Icons | Lucide Icons |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/janinadm/url_shorter.git
cd url_shorter

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_BASE_URL=https://your-domain.com
```

> **Note**: The app works in demo mode without Supabase configured, using mock data.

## Project Structure

```
src/
├── assets/scss/     # SCSS styles with BEM
│   ├── _auth.scss   # Shared auth form styles
│   ├── _mixins.scss # Reusable SCSS mixins
│   └── _variables.scss # Design tokens
├── components/      # Reusable Vue components
│   ├── common/      # Layout components (AuthLayout)
│   ├── ConfirmDialog.vue
│   └── Logo.vue
├── constants/       # App-wide constants (timeouts, limits)
├── lib/             # External service clients
│   ├── supabase.ts  # Supabase client config
│   └── stripe.ts    # Stripe integration
├── router/          # Vue Router config with guards
├── stores/          # Pinia stores
│   ├── auth.ts      # Authentication state
│   ├── urls.ts      # URL management
│   ├── analytics.ts # Analytics data
│   └── plans.ts     # Subscription plans
├── types/           # TypeScript interfaces
└── views/           # Page components
    ├── auth/        # Login, Signup, Recovery
    ├── dashboard/   # Dashboard, Analytics, Settings
    └── LandingView.vue
```

## Database Setup

### Initial Schema

Run `supabase/schema.sql` in your Supabase SQL Editor to create:
- `profiles` table (extends auth.users)
- `urls` table (shortened URLs with expiration)
- `clicks` table (analytics with browser, country, referrer)
- Row Level Security policies
- URL limit enforcement triggers

### Migrations

Run these migrations in order:

1. **Single Session Enforcement** (`supabase/migrations/enforce_single_session.sql`)
   - Creates `enforce_single_session()` function
   - Closes all other sessions when user logs in on a new device

## Features Detail

### Single Session Enforcement
When a user logs in, all previous sessions are automatically terminated. This prevents multiple devices being logged in simultaneously.

### Link Expiration
- **Free plan**: Links expire after 3 days
- **Pro plan**: Links are permanent (no expiration)

### Analytics (Pro features)
- Clicks by hour
- Top referrers
- Unique visitors (requires `ip_hash` to be populated)

### Auto-refresh
Both Dashboard and Analytics pages automatically refresh every 30 seconds to show new clicks without manual refresh.

## Plans & Limits

| Plan | Links | Expiration | Analytics | Price |
|------|-------|------------|-----------|-------|
| Free | 10 | 3 days | 7 days | $0/mo |
| Pro | 500 | Permanent | 30 days | $9/mo |
| Enterprise | Unlimited | Permanent | 1 year | Custom |

## Development

```bash
# Run dev server
npm run dev

# Type check and build
npm run build

# Preview production build
npm run preview
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |


**BrevioLink** - Built with ❤️ for content creators everywhere.
