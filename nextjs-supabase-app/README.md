# Next.js + Supabase Production App

A production-ready full-stack application built with Next.js 14 (App Router) and Supabase.

## Features

- 🔐 **Authentication**: Email/Password + Google OAuth
- 🗄️ **Database**: PostgreSQL with RLS policies
- 📁 **Storage**: Private file uploads with user isolation
- ⚡ **Realtime**: Live project updates
- 🎨 **UI**: Modern Tailwind CSS design
- 🔒 **Security**: Server-side auth, strict RLS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL script in `supabase-setup.sql` in the SQL Editor
3. Enable Google OAuth in Authentication → Providers
4. Copy your API keys from Settings → API

### 3. Set Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── (auth)/          # Login/Signup pages
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── api/             # API routes
│   └── auth/callback/   # OAuth callback
├── components/          # React components
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
├── middleware.ts        # Route protection
└── supabase-setup.sql   # Database setup script
```

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/profile` | GET, PUT | User profile CRUD |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Single project CRUD |
| `/api/upload` | POST | File upload |

## Security

- Service role key only used server-side
- RLS policies enforce user data isolation
- Middleware protects dashboard routes
- Storage policies restrict file access

## License

MIT
