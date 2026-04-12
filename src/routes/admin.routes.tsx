import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { AdminGuard } from "@/guards/AdminGuard";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminBroadcast = lazy(() => import("@/pages/admin/AdminBroadcast"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminActivityLog = lazy(() => import("@/pages/admin/AdminActivityLog"));

/**
 * Admin routes - requires authentication and admin role
 * Protected by AdminGuard; RLS policies handle server-side security
 */
export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AdminGuard>
        <AdminUsers />
      </AdminGuard>
    ),
  },
  {
    path: "/admin/broadcast",
    element: (
      <AdminGuard>
        <AdminBroadcast />
      </AdminGuard>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <AdminGuard>
        <AdminSettings />
      </AdminGuard>
    ),
  },
  {
    path: "/admin/subscriptions",
    element: (
      <AdminGuard>
        <AdminSubscriptions />
      </AdminGuard>
    ),
  },
  {
    path: "/admin/activity-log",
    element: (
      <AdminGuard>
        <AdminActivityLog />
      </AdminGuard>
    ),
  },
];
