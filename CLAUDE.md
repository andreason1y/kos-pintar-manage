# Claude.md - Kos Pintar Manage Codebase Guide

This document provides comprehensive guidance for AI assistants working on the **Kos Pintar** project, a rental property management system (Indonesian: "Kos Cerdas" - Smart Dormitory/Rental Management).

## Project Overview

**Kos Pintar** is a comprehensive property management platform designed to help property owners manage:
- **Rental rooms/units** (Kamar - rooms/apartments)
- **Tenants** (Penyewa - renters)
- **Payments & billing** (Pembayaran)
- **Financial analytics** (Keuangan)
- **Tenant profiles** (Profil)

The application supports multi-property management with role-based access (user roles and admin roles).

### Key Features
- User authentication with email/password
- Property onboarding flow for new users
- Room management with detailed information
- Tenant management and tracking
- Payment processing (Midtrans integration)
- Financial reporting and analytics
- Admin dashboard with broadcast, user management, and activity logging
- Demo mode for testing without authentication
- Error tracking via Sentry
- Responsive design with Tailwind CSS

## Technology Stack

### Frontend Framework
- **React 18.3.1** - UI library with hooks
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server (fast HMR)
- **React Router DOM 6.30.1** - Client-side routing

### UI & Styling
- **shadcn/ui** - Radix UI component library with extensive components
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Framer Motion 12.38.0** - Animations and transitions
- **Lucide React 0.462.0** - Icon library

### State Management & Data
- **Supabase 2.101.1** - Backend-as-a-service (PostgreSQL database)
- **React Query (TanStack) 5.83.0** - Server state management and caching
- **React Hook Form 7.61.1** - Form state management
- **Zod 3.25.76** - Schema validation and parsing

### Backend Integration
- **Supabase JS Client** - Database and auth operations
- **Midtrans Integration** - Payment gateway for Indonesian market
- **Sentry 10.47.0** - Error tracking and monitoring (10% transaction sample rate in production)

### UI Features
- **Recharts 2.15.4** - Charts and analytics visualization
- **Embla Carousel React 8.6.0** - Carousel component
- **React Resizable Panels 2.1.9** - Resizable panel layouts
- **Sonner 1.7.4** - Toast notifications
- **HTML2PDF.js** - Invoice/nota generation and PDF export
- **Input OTP** - One-time password input

### Development Tools
- **Vitest 3.2.4** - Unit testing framework
- **Playwright 1.57.0** - E2E testing
- **ESLint 9.32.0** - Code linting
- **Tailwind CSS TypeScript Plugin** - IDE support
- **Lovable Tagger 1.1.13** - Component tagging in development mode
- **JSDOM** - DOM testing environment

## Directory Structure

```
kos-pintar-manage/
├── src/
│   ├── App.tsx                 # Root component with routing & context setup
│   ├── main.tsx                # Entry point with Sentry initialization
│   ├── index.css               # Global styles
│   ├── App.css                 # App-specific styles
│   ├── vite-env.d.ts           # Vite type declarations
│   │
│   ├── pages/                  # Page components (route handlers)
│   │   ├── LandingPage.tsx      # Public landing page
│   │   ├── AuthPage.tsx         # Login page
│   │   ├── OnboardingPage.tsx   # New user property setup
│   │   ├── DashboardPage.tsx    # Main dashboard
│   │   ├── KamarPage.tsx        # Room/unit management
│   │   ├── PenyewaPage.tsx      # Tenant management
│   │   ├── PembayaranPage.tsx   # Payment management
│   │   ├── KeuanganPage.tsx     # Financial analytics
│   │   ├── ProfilPage.tsx       # User profile
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── NotFound.tsx         # 404 page
│   │   └── admin/               # Admin panel routes
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminUsers.tsx
│   │       ├── AdminBroadcast.tsx
│   │       ├── AdminSettings.tsx
│   │       ├── AdminSubscriptions.tsx
│   │       └── AdminActivityLog.tsx
│   │
│   ├── components/              # React components
│   │   └── ui/                  # shadcn/ui component library (auto-generated)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       ├── select.tsx
│   │       ├── form.tsx
│   │       └── ... (30+ ui components)
│   │
│   ├── lib/                     # Utilities and context
│   │   ├── auth-context.tsx     # Auth provider (Supabase)
│   │   ├── property-context.tsx # Current property context
│   │   ├── demo-context.tsx     # Demo mode management
│   │   ├── plan-context.tsx     # Subscription plan context
│   │   ├── helpers.ts           # General utilities
│   │   ├── utils.ts             # Class name utilities
│   │   ├── avatar-colors.ts     # Avatar color mapping
│   │   ├── meta-pixel.ts        # Meta Pixel tracking
│   │   └── nota-generator.ts    # Invoice/nota PDF generation
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-queries.ts       # Supabase queries (tenants, payments, etc.)
│   │   ├── use-mobile.tsx       # Mobile detection hook
│   │   └── use-toast.ts         # Toast notifications hook
│   │
│   ├── integrations/            # External service integrations
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client instance
│   │       └── types.ts         # Generated TypeScript types from DB schema
│   │
│   ├── types/                   # TypeScript type definitions
│   │   └── html2pdf.d.ts        # html2pdf.js type declarations
│   │
│   ├── test/                    # Test configuration & utilities
│   │   ├── setup.ts             # Vitest setup
│   │   └── example.test.ts      # Example test file
│   │
│   └── assets/                  # Static assets
│       └── (images, fonts, etc.)
│
├── supabase/                    # Supabase configuration
│   ├── migrations/              # Database migrations
│   └── schema.sql               # Database schema
│
├── public/                      # Static files served as-is
│
├── vite.config.ts               # Vite configuration
├── vitest.config.ts             # Vitest configuration
├── playwright.config.ts         # Playwright E2E testing config
├── tsconfig.json                # Root TypeScript config
├── tsconfig.app.json            # App TypeScript config (@ alias)
├── tsconfig.node.json           # Node.js TypeScript config
├── tailwind.config.ts           # Tailwind CSS configuration
├── eslint.config.js             # ESLint configuration
├── postcss.config.js            # PostCSS configuration
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (local)
├── .gitignore                   # Git ignore rules
└── README.md                    # Basic project documentation
```

## Core Architecture

### Authentication & Context Providers

The app uses React Context for global state management stacked in `App.tsx`:

```typescript
<QueryClientProvider>           // React Query for server state
  <TooltipProvider>             // Radix UI tooltips
    <BrowserRouter>
      <DemoProvider>            // Demo mode detection
        <AuthProvider>          // Supabase auth & user
          <PropertyProvider>    // Current property selection
            <PlanProvider>      // Subscription plan info
              <AppRoutes />
            </PlanProvider>
          </PropertyProvider>
        </AuthProvider>
      </DemoProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

**Key Contexts:**
- **AuthProvider** (`lib/auth-context.tsx`): Handles Supabase authentication
- **PropertyProvider** (`lib/property-context.tsx`): Manages current property selection
- **DemoProvider** (`lib/demo-context.tsx`): Enables demo mode (bypasses auth)
- **PlanProvider** (`lib/plan-context.tsx`): Manages subscription/plan state

### Routing Strategy

The app uses conditional routing based on auth state:

```
Landing/Auth Pages (unauthenticated)
    ↓
Onboarding (no properties yet)
    ↓
Main Routes (authenticated + property selected)
    ├── Dashboard
    ├── Rooms (Kamar)
    ├── Tenants (Penyewa)
    ├── Payments (Pembayaran)
    ├── Finance (Keuangan)
    ├── Profile (Profil)
    └── Admin Routes (admin role)
```

### Database Integration

**Supabase** is the backend providing:
- PostgreSQL database for all data
- Row-level security (RLS) for data access control
- Authentication via email
- Real-time capabilities
- File storage (if needed)

**Generated Types:** `src/integrations/supabase/types.ts` is auto-generated from Supabase schema.

**Main Tables:**
- `users` - User accounts with metadata
- `properties` - Rental properties (user can own multiple)
- `kamar` (rooms) - Individual rental units
- `penyewa` (tenants) - Tenant information
- `pembayaran` (payments) - Payment history and invoices

**Data Fetching Pattern:**
- Use React Query hooks from `src/hooks/use-queries.ts`
- Hooks provide `data`, `isLoading`, `error` pattern
- Automatic caching and refetching

## Development Workflows

### Local Setup

```bash
# Install dependencies
npm install
# or
bun install

# Set up environment variables (copy .env.example or ask team)
cp .env.example .env

# Start dev server (http://localhost:8080)
npm run dev

# Run tests
npm run test
npm run test:watch

# Lint code
npm run lint

# Build for production
npm run build
npm run build:dev  # Development build with source maps
```

### Environment Variables

Required `.env` variables:
```
VITE_SUPABASE_URL=            # Supabase project URL
VITE_SUPABASE_ANON_KEY=       # Supabase anonymous key
VITE_MIDTRANS_CLIENT_KEY=     # Midtrans payment gateway key
VITE_SENTRY_DSN=              # Sentry error tracking DSN
SENTRY_ORG=                   # Sentry org (build only)
SENTRY_PROJECT=               # Sentry project (build only)
SENTRY_AUTH_TOKEN=            # Sentry auth token (build only)
```

### Code Style & Conventions

**Naming:**
- **Files:** PascalCase for React components, kebab-case for utilities
- **Variables:** camelCase for variables and functions
- **Constants:** UPPER_SNAKE_CASE
- **Types:** PascalCase (interfaces and types)

**Component Pattern:**
```typescript
import { FC } from 'react';

interface Props {
  title: string;
  onClick?: () => void;
}

export const MyComponent: FC<Props> = ({ title, onClick }) => {
  return <div onClick={onClick}>{title}</div>;
};

export default MyComponent;
```

**Form Handling:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export const MyForm = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

**Data Fetching:**
```typescript
import { useQueries } from '@/hooks/use-queries';

export const MyComponent = () => {
  const { data: tenants, isLoading } = useQueries().getTenantList();
  
  if (isLoading) return <LoadingSkeleton />;
  return <TenantTable data={tenants} />;
};
```

### Styling

- **Tailwind CSS** for utility-based styling
- Use predefined design tokens from `tailwind.config.ts`
- Dark mode supported via `next-themes`
- Shadcn components handle most styling

**Theme Colors:** Primary, secondary, accent, destructive, muted, foreground, background

### Testing

**Unit Tests (Vitest):**
```typescript
// src/test/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should render', () => {
    expect(true).toBe(true);
  });
});
```

Run with:
```bash
npm run test          # Run once
npm run test:watch   # Watch mode
```

**E2E Tests (Playwright):**
```typescript
// playwright.config.ts configured
// Write tests in any .test.ts files
```

### Linting & Code Quality

```bash
npm run lint       # Check ESLint violations

# Auto-fix eslint issues (when possible)
npx eslint . --fix
```

ESLint config (`eslint.config.js`):
- TypeScript support
- React hooks rules
- React refresh rules

**Note:** TypeScript strict mode is disabled (`"strict": false`) for flexibility.

## Key Integration Points

### Sentry Error Tracking

**File:** `src/main.tsx`

- Initialized in production only
- 10% transaction sample rate (cost optimization)
- 5% normal session replays, 100% on errors
- Automatically captures unhandled errors
- Sentry.ErrorBoundary wraps the app

**Using Sentry:**
```typescript
import * as Sentry from '@sentry/react';

// Capture custom messages
Sentry.captureMessage('Important event', 'info');

// Capture exceptions
Sentry.captureException(error);

// Set user context
Sentry.setUser({ id: user.id, email: user.email });
```

### Midtrans Payment Gateway

- Indonesian payment processor (credit cards, bank transfers, e-wallets)
- Integrated in payment pages
- Client key stored in `.env`

### Supabase RLS & Auth

Database security via Row-Level Security (RLS):
- Users can only access their own properties and related data
- Tenant/payment/room data scoped by property owner
- Admin users have elevated access via roles

## Git Workflow

### Branches

- **main** - Production-ready code
- **claude/add-claude-documentation-pggkp** - Current development branch for documentation

### Commit Strategy

Use descriptive commits:
```bash
# Features
git commit -m "feat: add new payment method"

# Bug fixes
git commit -m "fix: resolve tenant data loading issue"

# Improvements
git commit -m "refactor: simplify room filtering logic"

# Documentation
git commit -m "docs: update deployment instructions"

# Chores
git commit -m "chore: update dependencies"
```

### Push & PR Workflow

1. Make changes on feature branch
2. Create atomic, well-described commits
3. Push to remote: `git push origin <branch>`
4. Create pull request with clear description
5. Link related issues
6. Request review

## Performance Optimization

### Built-in Optimizations

- **Code Splitting:** Components lazy-loaded with React.lazy() for routes
- **React Query:** Automatic caching, deduplication, background refetching
- **Vite:** Fast HMR, optimized bundles, source maps in dev
- **Tailwind:** Purges unused CSS, optimized for production
- **Lovable Tagger:** Tags components in dev for tracking (disabled in prod)

### Best Practices

- Use React Query for server state (not useState)
- Lazy-load pages to reduce initial bundle size
- Memoize expensive computations with useMemo
- Use useCallback for stable function references
- Avoid inline object/array creation in renders

## Common Tasks

### Add a New Page

1. Create `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx` MainRoutes
3. Add route guard if needed (auth check, etc.)
4. Use lazy() for route definition: `const NewPage = lazy(() => import('./pages/NewPage'))`

### Add a New Component

1. Create `src/components/NewComponent.tsx`
2. Import and use in pages
3. Keep components focused and reusable
4. Prop drill sparingly; use context for cross-cutting state

### Fetch Data

1. Create/use hook in `src/hooks/use-queries.ts`
2. Use React Query: `useQuery()`, `useMutation()`
3. Handle loading/error states in component
4. Use Zod for validation if needed

### Add Form

1. Create component with `useForm()` from react-hook-form
2. Define schema with zod
3. Use shadcn form components for UI
4. Handle submission with mutation

### Styling

1. Use Tailwind utility classes
2. Import shadcn components with pre-built styling
3. Extend colors in `tailwind.config.ts` if needed
4. Use CSS modules or Tailwind @apply for complex styles

## Debugging

### Browser DevTools
- React DevTools extension for component inspection
- Network tab to check API calls to Supabase
- Console for logging

### Sentry Dashboard
- View real errors from production
- Track user sessions and replays
- Monitor performance metrics

### VSCode Tips
- Install Tailwind CSS IntelliSense
- Install TypeScript Vue Plugin
- Use Go to Definition (F12) for navigation
- Use Find References (Shift+F12) for impact analysis

## Common Gotchas

1. **Auth Loading:** Always check `useAuth()` loading state before rendering protected content
2. **Property Context:** Must select a property before accessing main routes
3. **React Query Cache:** Mutations don't auto-invalidate; manually refetch or use invalidateQueries
4. **TypeScript Strict Mode:** Disabled for flexibility; use explicit types where needed
5. **Demo Mode:** Bypasses all auth; test actual auth flows separately
6. **Supabase Types:** Regenerate if schema changes with `supabase gen types`

## Resources & References

- **Supabase Docs:** https://supabase.com/docs
- **React Query Docs:** https://tanstack.com/query/latest
- **Shadcn/ui Docs:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vite Docs:** https://vitejs.dev/guide
- **TypeScript:** https://www.typescriptlang.org/docs

## Important Notes for AI Assistants

### When Making Changes:
- Always run `npm run lint` before committing
- Test changes in dev mode first (`npm run dev`)
- Check TypeScript for type errors
- Verify React Query cache invalidation
- Test with demo mode and real auth

### Code Quality:
- Don't add unnecessary abstractions
- Prefer explicit code over clever tricks
- Keep components under 300 lines (split if larger)
- Use descriptive variable names
- Add comments for non-obvious logic

### Before Pushing:
- Ensure no console errors or warnings
- Test authentication flows if changed
- Check mobile responsiveness for UI changes
- Verify Supabase permissions (RLS) for data access changes
- Run full test suite if available

### Database Changes:
- Use Supabase migrations for schema changes
- Update generated types after schema changes
- Test RLS policies thoroughly
- Document new tables/columns in comments

---

**Last Updated:** April 10, 2026  
**Branch:** claude/add-claude-documentation-pggkp  
**Maintainers:** Development team
