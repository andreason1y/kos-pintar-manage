-- Phase 2: Composite Indexes for Complex Queries
-- Date: April 12, 2026
-- Purpose: Optimize JOINs, date ranges, and multi-column filters
-- Expected improvement: 50-500x faster on complex queries

-- Transaction queries (most common)
CREATE INDEX idx_transactions_property_tenant ON transactions(
  property_id,
  tenant_id
) WHERE property_id IS NOT NULL AND tenant_id IS NOT NULL;

-- Period-based queries (monthly reports)
CREATE INDEX idx_transactions_periode ON transactions(
  property_id,
  periode_tahun DESC,
  periode_bulan DESC
) WHERE property_id IS NOT NULL;

-- Payment status per period
CREATE INDEX idx_transactions_status_periode ON transactions(
  property_id,
  status,
  periode_tahun DESC,
  periode_bulan DESC
) WHERE status IS NOT NULL;

-- Date range queries (for expense reports)
CREATE INDEX idx_expenses_property_date ON expenses(
  property_id,
  tanggal DESC
) WHERE property_id IS NOT NULL;

-- Transactions by payment date
CREATE INDEX idx_transactions_property_payment_date ON transactions(
  property_id,
  tanggal_bayar DESC
) WHERE property_id IS NOT NULL AND tanggal_bayar IS NOT NULL;

-- Tenants active in property (common filter)
CREATE INDEX idx_tenants_property_status ON tenants(
  property_id,
  status
) WHERE property_id IS NOT NULL AND status IS NOT NULL;

-- Rooms by property and status (room availability)
CREATE INDEX idx_rooms_property_status ON rooms(
  room_type_id,
  status
) WHERE status IS NOT NULL;

-- Room types and rooms together
CREATE INDEX idx_room_types_property_with_rooms ON room_types(
  property_id,
  created_at DESC
) WHERE property_id IS NOT NULL;

-- Reminders by property and period (payment reminders)
CREATE INDEX idx_reminders_property_period ON reminders(
  property_id,
  periode_tahun DESC,
  periode_bulan DESC,
  is_read
) WHERE property_id IS NOT NULL;

-- Deposits by tenant and status
CREATE INDEX idx_deposits_tenant_status ON deposits(
  tenant_id,
  status
) WHERE tenant_id IS NOT NULL AND status IS NOT NULL;

-- Subscriptions by user and status
CREATE INDEX idx_subscriptions_user_status ON subscriptions(
  user_id,
  status
) WHERE user_id IS NOT NULL AND status IS NOT NULL;

-- Analyze tables for updated statistics
ANALYZE transactions;
ANALYZE tenants;
ANALYZE expenses;
ANALYZE deposits;
ANALYZE room_types;
ANALYZE rooms;
ANALYZE reminders;
