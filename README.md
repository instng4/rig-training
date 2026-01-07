# RTMS - Rig Training Management System

A centralized Training Management Platform for Rig Employees built with Next.js 14, Supabase, and Clerk.

## Features

- 🔐 **Authentication** - CPF-based login with Clerk (includes password reset)
- 👥 **Employee Profiles** - Manage employee details, photos, and duty patterns
- 📚 **Training Records** - Track MVT, IWCF, Fire, First Aid, PME, and custom training types
- 🚦 **Status Tracking** - Automatic color-coded status (Safe/Upcoming/Overdue)
- ⚙️ **Grace Period Engine** - Configurable warning windows for each training type
- 📊 **Role-based Dashboards** - Employee, Rig Admin, and Super Admin views
- 📧 **Email Reminders** - Automated training expiry notifications
- 🏢 **Rig Management** - Super Admin can add/edit/delete rigs

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- `CLERK_SECRET_KEY` - From Clerk Dashboard
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Project Settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase API Settings
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase API Settings
- `RESEND_API_KEY` - (Optional) For email notifications

### 3. Set Up Database
Run the SQL migration in Supabase SQL Editor:
```bash
# Copy contents from:
supabase/migrations/001_initial_schema.sql
```

### 4. Configure Clerk
In Clerk Dashboard:
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Enable "Username" as sign-in identifier (this will be the CPF)
3. Configure password requirements

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign-in/Sign-up pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── training/
│   │   ├── settings/
│   │   └── admin/rigs/
│   ├── api/cron/         # Email reminder cron endpoint
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── employees/
│   └── training/
└── lib/
    ├── supabase/         # Database clients
    ├── email/            # Email provider abstraction
    ├── utils/            # Training status engine
    └── types/            # TypeScript definitions
```

## User Roles

| Role | Permissions |
|------|-------------|
| Employee | View/edit own profile, view own training |
| Rig Admin | Manage employees of assigned rig |
| Super Admin | Full system control across all rigs |

## Training Status Logic

| Status | Condition | Color |
|--------|-----------|-------|
| SAFE | Expiry > grace window | 🟢 Green |
| UPCOMING | Within grace period | 🟠 Orange |
| OVERDUE | Past expiry | 🔴 Red |

## Email Reminders

Set up a daily cron job to call:
```
GET /api/cron
Authorization: Bearer your-cron-secret
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Email**: Resend (with provider abstraction)

## License

MIT
