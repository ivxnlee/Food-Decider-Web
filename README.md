# 🍜 Food Decider

A food discovery and decision-making app that helps you decide on your next meal. Browse food options, filter by dietary preferences, and lock in on your meal.[Click here for published site](https://food.ivanl.dev/)

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (Postgres, Auth, RLS, Storage)

---

## Features

- 🔍 **Food Discovery** — Browse and explore food options tailored to your country
- 🔒 **Food Lock-in** — Claim a food item with a countdown timer; multiple users can lock independently
- 🥗 **Dietary Filters** — Filter by halal, vegan, and vegetarian preferences
- ❤️ **Favourites** — Save your favourite foods for quick access
- 👤 **User Profiles** — Personalised preferences including country and dietary settings
- 🔐 **Auth** — Supabase-powered authentication with row-level security

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/ivxnlee/Food-Decider-Web.git
cd food-decider
npm install
```

### Environment Variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
food-decider/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable React components
│   ├── ui/               # shadcn/ui primitives
│   └── ...               # Feature components
├── lib/
│   ├── supabase/         # Supabase client setup
│   └── utils.ts          # Shared utilities
└── public/               # Static assets
```

---

## Database

The app uses Supabase (Postgres) with the following key tables:

| Table              | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `account_settings` | User preferences (country, dietary, favourites)           |
| `foods`            | Food items available for discovery                        |
| `food_locks`       | Active lock-in records with server-side expiry timestamps |

Lock expiry timestamps are computed server-side via a Postgres function to avoid client timezone inconsistencies.

### Running Migrations

Apply migrations via the Supabase CLI:

```bash
supabase db push
```

---

## Architecture Notes

- **Auth**: Uses `getSession()` for client-side UI guards; RLS policies enforce actual data security on the server.
- **Food Locks**: Non-exclusive — multiple users can independently lock the same food item. Locks store an absolute `expires_at` timestamp rather than a client-managed countdown.
- **Data Fetching**: Combines available and locked foods in a single RPC round trip, split client-side, to minimise latency.

---

## Contributing

Pull requests are welcome. For larger changes, open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)
