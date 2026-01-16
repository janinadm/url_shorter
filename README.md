# LinkSnip - URL Shortener SaaS

A modern, production-ready URL shortener for content creators and influencers. Built with Vue 3, TypeScript, and Supabase.

![LinkSnip](https://via.placeholder.com/800x400?text=LinkSnip+URL+Shortener)

## Features

- 🔗 **Create Short Links** - Turn long URLs into memorable short links
- 📊 **Detailed Analytics** - Track clicks, browsers, and locations
- 👤 **User Authentication** - Secure signup, login, and password recovery
- 💳 **Tiered Plans** - Free, Pro, and Enterprise with different limits
- 🎨 **Modern UI** - iOS-inspired design with smooth animations
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + TypeScript |
| State | Pinia |
| Styling | SCSS (BEM) |
| Backend | Supabase |
| Auth | Supabase Auth |
| Payments | Stripe |
| Charts | Chart.js |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (optional for dev)
- Stripe account (optional for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/url_shorter.git
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
```

> **Note**: The app works in demo mode without Supabase configured.

## Project Structure

```
src/
├── assets/scss/     # SCSS styles with BEM
├── components/      # Reusable Vue components
├── composables/     # Vue composables
├── lib/             # Supabase & Stripe clients
├── router/          # Vue Router config
├── stores/          # Pinia stores
├── types/           # TypeScript interfaces
└── views/           # Page components
```

## Database Setup

Run the schema in your Supabase SQL Editor:

```sql
-- See supabase/schema.sql for full schema
```

This creates:
- `profiles` table (extends auth.users)
- `urls` table (shortened URLs)
- `clicks` table (analytics)
- Row Level Security policies
- URL limit enforcement triggers

## Plans & Limits

| Plan | Links | Price |
|------|-------|-------|
| Free | 10 | $0/mo |
| Pro | 500 | $9/mo |
| Enterprise | Unlimited | Custom |

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run build

# Build for production
npm run build
```

## License

MIT

---

Built with ❤️ for content creators everywhere.
