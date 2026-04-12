# Kos Pintar - Architecture Documentation

**Version:** 2.0 (Production-Ready)  
**Last Updated:** April 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Core Concepts](#core-concepts)
4. [Module Descriptions](#module-descriptions)
5. [Routing System](#routing-system)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Architecture Overview

The application has been refactored from an MVP structure to a **modular, production-ready architecture** that emphasizes:

- **Separation of Concerns** - Routing, state, and UI are clearly separated
- **Scalability** - Easy to add new features without touching existing code
- **Maintainability** - Clear directory structure and consistent patterns
- **Type Safety** - Full TypeScript support with no loose types
- **Error Resilience** - Global error boundaries and error handling

### Architecture Layers

```
┌─────────────────────────────────────┐
│        React Components (UI)        │  Pages, Guards, Common Components
├─────────────────────────────────────┤
│     State Management (Context)      │  Auth, Property, Plan, Demo
├─────────────────────────────────────┤
│    Server State (React Query)       │  Data fetching, caching, sync
├─────────────────────────────────────┤
│      Service Layer (API Client)     │  Supabase operations
├─────────────────────────────────────┤
│    External Services (Supabase)     │  Database, Auth, Storage
└─────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── app/                              # Application root & setup
│   ├── App.tsx                       # Root component
│   ├── router.tsx                    # useRoutes hook & routing logic
│   ├── providers.tsx                 # Providers stack (Context, Query)
│   └── error-boundary.tsx            # Global error handling
│
├── routes/                           # Route definitions (modular)
│   ├── public.routes.tsx             # Landing, Auth, Password reset
│   ├── private.routes.tsx            # Dashboard, Rooms, Tenants, etc.
│   └── admin.routes.tsx              # Admin panel routes
│
├── guards/                           # Route protection guards
│   ├── AuthGuard.tsx                 # Requires authentication
│   ├── OnboardingGuard.tsx           # Requires property
│   └── AdminGuard.tsx                # Requires admin role
│
├── features/                         # Feature modules (organized by domain)
│   ├── auth/
│   ├── property/
│   ├── tenant/
│   ├── payment/
│   ├── room/
│   ├── admin/
│   └── common/
│       └── components/               # Shared UI components
│
├── pages/                            # Page components (route handlers)
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── KamarPage.tsx
│   ├── PenyewaPage.tsx
│   ├── PembayaranPage.tsx
│   ├── KeuanganPage.tsx
│   ├── ProfilPage.tsx
│   ├── OnboardingPage.tsx
│   ├── NotFound.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminUsers.tsx
│       ├── AdminBroadcast.tsx
│       ├── AdminSettings.tsx
│       ├── AdminSubscriptions.tsx
│       └── AdminActivityLog.tsx
│
├── components/                       # Shared components
│   ├── ui/                           # shadcn/ui components (auto-generated)
│   ├── AppShell.tsx
│   ├── AppSidebar.tsx
│   ├── BottomNav.tsx
│   ├── PageHeader.tsx
│   └── ... (other reusable components)
│
├── hooks/                            # Custom React hooks
│   ├── use-queries.ts                # React Query hooks for data
│   ├── use-toast.ts                  # Toast notifications
│   └── use-mobile.tsx                # Mobile detection
│
├── lib/                              # Context & utilities
│   ├── auth-context.tsx              # Supabase auth session
│   ├── property-context.tsx          # Current property selection
│   ├── demo-context.tsx              # Demo mode state
│   ├── plan-context.tsx              # Subscription plan info
│   ├── helpers.ts                    # Utility functions
│   ├── utils.ts                      # Class name utilities
│   └── ... (other lib functions)
│
├── services/                         # Centralized API services
│   ├── api.ts                        # Supabase operations (auth, property, tenant, etc.)
│   └── query-client.ts               # React Query configuration
│
├── types/                            # TypeScript type definitions
│   └── html2pdf.d.ts
│
├── integrations/                     # External service integrations
│   └── supabase/
│       ├── client.ts                 # Supabase client instance
│       └── types.ts                  # Auto-generated Supabase types
│
├── assets/                           # Static assets
│
├── test/                             # Test configuration
│   ├── setup.ts
│   └── example.test.ts
│
├── main.tsx                          # Entry point with Sentry
├── index.css                         # Global styles
├── vite-env.d.ts                     # Vite types
└── App.tsx                           # DEPRECATED - moved to src/app/App.tsx
```

---

## Core Concepts

### 1. Routing System

The app uses **`useRoutes()`** hook with **modular route definitions**:

```typescript
// Routes are separated by access level
publicRoutes       // Landing, Auth (no auth required)
privateRoutes      // Dashboard, Rooms, Tenants (auth + property required)
adminRoutes        // Admin panel (auth + admin role required)
```

Routes are **dynamically loaded** based on:
- Authentication state
- Property selection
- Demo mode flag
- Admin role

**Router Logic** (`src/app/router.tsx`):
- Not authenticated → Show public routes only
- Authenticated, no property → Show onboarding + public routes
- Authenticated, has property → Show all routes (guarded by OnboardingGuard)

### 2. Route Guards

Three guard components protect routes:

#### `AuthGuard`
```typescript
<AuthGuard>
  <ProtectedComponent />
</AuthGuard>
```
- Requires: Authenticated user
- Redirect: `/` (landing page)
- Bypassed in: Demo mode

#### `OnboardingGuard`
```typescript
<OnboardingGuard>
  <ProtectedComponent />
</OnboardingGuard>
```
- Requires: Authenticated user + at least one property
- Redirect: `/onboarding`
- Bypassed in: Demo mode

#### `AdminGuard`
```typescript
<AdminGuard>
  <AdminComponent />
</AdminGuard>
```
- Requires: Authenticated user (role check via RLS)
- Redirect: `/beranda`
- Bypassed in: Demo mode
- **Important**: Server-side security via Supabase RLS policies

### 3. State Management

**Context Providers** (core session state):

| Provider | Purpose | Scope |
|----------|---------|-------|
| `AuthProvider` | Supabase auth session | Global |
| `PropertyProvider` | Current property selection | User-level |
| `DemoProvider` | Demo mode state | Global |
| `PlanProvider` | Subscription plan info | User-level |

**React Query** (server state):
- Handles data fetching, caching, and synchronization
- Configured in `src/services/query-client.ts`
- Hooks in `src/hooks/use-queries.ts`

**Local State**:
- Component-level state with `useState()`
- Form state with `react-hook-form`

### 4. Service Layer

Centralized API operations in `src/services/api.ts`:

```typescript
// Services are organized by domain
authService       // signIn, signOut, resetPassword
propertyService   // getProperties, createProperty
profileService    // getProfile, updateProfile
roomService       // getRoomTypes, getRooms
tenantService     // getTenants
transactionService // getTransactions
broadcastService  // getBroadcasts
```

Each service function:
- Uses Supabase client
- Has error handling with Sentry integration
- Returns typed results
- Throws errors (let calling code handle)

### 5. Error Handling

**Multi-layer error handling**:

1. **Global ErrorBoundary** (`src/app/error-boundary.tsx`)
   - Catches React component errors
   - Shows fallback UI
   - Reports to Sentry

2. **Sentry Integration** (`src/main.tsx`)
   - Wrapped at root level
   - Captures unhandled exceptions
   - Tracks performance metrics
   - Session replays on errors

3. **Service-level handling** (`src/services/api.ts`)
   - API functions throw errors
   - Errors logged to Sentry with context
   - User-friendly error messages

4. **Route guards**
   - Prevent unauthorized access
   - Show loading states during auth checks
   - Redirect to appropriate pages

---

## Module Descriptions

### App (`src/app/`)

**App.tsx** - Root component
- Composes error boundary, providers, and router
- No business logic

**router.tsx** - Routing orchestrator
- Uses `useRoutes()` hook
- Builds route list based on auth state
- Provides fallback UI during loading

**providers.tsx** - Provider stack
- Stacks all context providers
- Order matters: QueryClient → Tooltip → Router → DemoProvider → AuthProvider → PropertyProvider → PlanProvider
- Contains toast components

**error-boundary.tsx** - React error catching
- Catches unhandled React errors
- Shows user-friendly fallback UI
- Integrates with Sentry

### Routes (`src/routes/`)

Modular route definitions by access level:

**public.routes.tsx**
- Landing page, Auth, Password reset
- Accessible to all users

**private.routes.tsx**
- Dashboard, Rooms, Tenants, Payments, Finance, Profile
- Wrapped in `OnboardingGuard`
- Only show if user has a property

**admin.routes.tsx**
- Admin dashboard, users, broadcast, settings
- Wrapped in `AdminGuard`
- RLS policies enforce server-side security

### Guards (`src/guards/`)

Route protection components

### Services (`src/services/`)

**api.ts** - Supabase operations
- Centralized API layer
- All DB calls go through here
- Consistent error handling

**query-client.ts** - React Query setup
- Global query configuration
- Retry logic, cache times, stale times
- Utility functions for cache management

### Hooks (`src/hooks/`)

**use-queries.ts**
- React Query hooks for fetching data
- Automatic caching and refetching
- Handles demo mode data

**use-toast.ts**
- Toast notification hook

**use-mobile.tsx**
- Mobile device detection

### Context (`src/lib/`)

**auth-context.tsx** - Session management
- Supabase auth state
- User and session data
- Sign out function

**property-context.tsx** - Property selection
- User's properties list
- Current active property
- Used to scope queries

**demo-context.tsx** - Demo mode
- Mock data for demo experience
- Bypasses authentication
- Used for testing/presentations

**plan-context.tsx** - Subscription info
- User's current plan (starter, pro, bisnis)
- Plan limits and labels
- Upgrade modal trigger

---

## Routing System

### Route Structure

```
/                           → Landing page
/login                      → Auth (login/signup)
/lupa-sandi                 → Forgot password
/reset-sandi                → Reset password

/onboarding                 → Setup first property
/beranda                     → Dashboard (needs property)
/kamar                      → Room management (needs property)
/penyewa                    → Tenant management (needs property)
/pembayaran                 → Payment management (needs property)
/keuangan                   → Finance analytics (needs property)
/profil                     → User profile (needs property)

/admin                      → Admin dashboard (admin only)
/admin/users                → User management (admin only)
/admin/broadcast            → Send broadcasts (admin only)
/admin/settings             → System settings (admin only)
/admin/subscriptions        → Subscription management (admin only)
/admin/activity-log         → Activity logging (admin only)
```

### Dynamic Route Loading

Routes are built dynamically in `src/app/router.tsx`:

```typescript
if (isDemo) {
  // All routes available
} else if (!user) {
  // Only public routes
} else {
  // Public + private + admin routes
  // Private routes guarded with OnboardingGuard
}
```

### Redirect Logic

| Scenario | Redirect To |
|----------|-------------|
| Not authenticated, accessing protected route | `/` (landing) |
| Authenticated, no property, accessing guarded route | `/onboarding` |
| Not admin, accessing admin route | `/beranda` (data fetch will fail at RLS) |
| Demo mode | All routes available |

---

## State Management

### Data Flow

```
User Action
    ↓
Component (useState, useForm)
    ↓
Mutation/Query (React Query)
    ↓
Service Layer (src/services/api.ts)
    ↓
Supabase (Database, Auth, RLS)
    ↓
Cache/Context Updates
    ↓
Component Re-render
```

### Context vs React Query

| State Type | Tool | When to Use |
|-----------|------|------------|
| Session/Auth | Context | User info, auth token |
| Server Data | React Query | Tenants, payments, rooms |
| UI State | useState | Form inputs, modals, UI toggles |
| Form Data | react-hook-form | Form handling, validation |
| Current Property | Context | Scoping queries |

### React Query Configuration

```typescript
// src/services/query-client.ts
{
  queries: {
    retry: 2,                      // Retry failed queries 2x
    gcTime: 5 * 60 * 1000,        // Keep cache 5 minutes
    staleTime: 1 * 60 * 1000,     // Fresh for 1 minute
    refetchOnWindowFocus: false,   // No unnecessary refetches
    refetchOnMount: false,
    refetchOnReconnect: false,
  }
}
```

---

## Best Practices

### Adding a New Route

1. Create page component in `src/pages/`
2. Add to appropriate route file (`public.routes.tsx`, `private.routes.tsx`, or `admin.routes.tsx`)
3. Wrap in guard if needed
4. Test redirect behavior

```typescript
// src/routes/private.routes.tsx
{
  path: "/new-feature",
  element: (
    <OnboardingGuard>
      <NewFeaturePage />
    </OnboardingGuard>
  ),
}
```

### Adding a New Data Query

1. Create fetch function in `src/services/api.ts` or add to existing service
2. Create React Query hook in `src/hooks/use-queries.ts`
3. Use hook in component

```typescript
// src/services/api.ts
export const featureService = {
  async getItems(propertyId: string) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("property_id", propertyId);
    if (error) throw error;
    return data;
  }
};

// src/hooks/use-queries.ts
export function useItems() {
  const { activeProperty } = useProperty();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["items", pid],
    queryFn: () => featureService.getItems(pid!),
    enabled: !!pid,
  });
}
```

### Adding a New Context

Only add context for **session/global state** that doesn't belong in React Query.

```typescript
// src/lib/new-context.tsx
import { createContext, useContext, ReactNode } from "react";

interface NewContextType {
  // Define shape
}

const NewContext = createContext<NewContextType>({
  // Default values
});

export const useNewContext = () => useContext(NewContext);

export function NewProvider({ children }: { children: ReactNode }) {
  // Implementation
  return (
    <NewContext.Provider value={{...}}>
      {children}
    </NewContext.Provider>
  );
}
```

Then add to `src/app/providers.tsx`:

```typescript
<NewProvider>
  {children}
</NewProvider>
```

### Error Handling

Always handle errors at service layer and in components:

```typescript
// In component
const mutation = useMutation({
  mutationFn: (data) => api.createItem(data),
  onError: (error) => {
    toast.error(handleApiError(error, "createItem"));
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
    toast.success("Item created!");
  }
});
```

### Performance

- Use `React.lazy()` for code splitting (already done in routes)
- Wrap expensive components with `useMemo()`
- Use `useCallback()` for stable function references
- Let React Query handle server state caching
- Avoid prop drilling; use context/stores judiciously

---

## Migration from Old Architecture

### What Changed

| Old | New |
|-----|-----|
| Routes defined in App.tsx | Modular route files in src/routes/ |
| Nested Switch/Route components | useRoutes() hook |
| Logic routing in App.tsx | Separated in router.tsx |
| No guards | AuthGuard, OnboardingGuard, AdminGuard |
| Ad-hoc API calls | Centralized service layer |
| No QueryClient config | Dedicated query-client.ts |

### Files Moved/Deleted

```
DELETED: src/App.tsx → MOVED TO: src/app/App.tsx
DELETED: src/App.css
UPDATED: src/main.tsx → Now imports from src/app/App.tsx
CREATED: src/app/router.tsx, providers.tsx, error-boundary.tsx
CREATED: src/routes/, src/guards/, src/services/
```

---

## Troubleshooting

### Issue: Component not updating after mutation

**Solution**: Invalidate React Query cache

```typescript
const { invalidate } = useInvalidate();
// After mutation succeeds
invalidate.tenants(); // Or invalidate.all()
```

### Issue: User can access routes they shouldn't

**Solution**: Check guard wrapper + RLS policies

1. Verify route is wrapped in appropriate guard
2. Check Supabase RLS policies allow/deny access
3. Use `queryKey` to scope data by property

### Issue: Demo mode not working

**Solution**: Check DemoProvider is enabled in url

```typescript
// Check URL: http://localhost:5173/?demo=true
const { isDemo } = useDemo();
```

---

## References

- **Routing**: [React Router useRoutes](https://reactrouter.com/en/main/hooks/use-routes)
- **Queries**: [React Query (TanStack Query)](https://tanstack.com/query/latest)
- **Form**: [react-hook-form](https://react-hook-form.com/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/)
- **Error Tracking**: [Sentry](https://docs.sentry.io/platforms/javascript/guides/react/)
- **Backend**: [Supabase](https://supabase.com/docs)

---

**Last Updated**: April 12, 2026
