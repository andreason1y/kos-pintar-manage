import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
type DepositRow = Database["public"]["Tables"]["deposits"]["Row"];

// ---- Raw data fetchers (non-demo) ----

async function fetchRoomTypesAndRooms(propertyId: string) {
  const { data: types, error: typesError } = await supabase
    .from("room_types")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at");
  if (typesError) Sentry.captureException(typesError, { tags: { source: "fetchRoomTypes", propertyId } });
  const rtIds = (types || []).map(t => t.id);
  let rooms: RoomRow[] = [];
  if (rtIds.length > 0) {
    const { data, error: roomsError } = await supabase.from("rooms").select("*").in("room_type_id", rtIds).order("nomor");
    if (roomsError) Sentry.captureException(roomsError, { tags: { source: "fetchRooms", propertyId } });
    rooms = data || [];
  }
  return { roomTypes: types || [], rooms };
}

async function fetchTenants(propertyId: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) Sentry.captureException(error, { tags: { source: "fetchTenants", propertyId } });
  return data || [];
}

async function fetchTransactions(propertyId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) Sentry.captureException(error, { tags: { source: "fetchTransactions", propertyId } });
  return data || [];
}

async function fetchExpenses(propertyId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("property_id", propertyId)
    .gte("tanggal", startDate)
    .lt("tanggal", endDate)
    .order("tanggal", { ascending: false });
  if (error) Sentry.captureException(error, { tags: { source: "fetchExpenses", propertyId } });
  return data || [];
}

async function fetchDeposits(propertyId: string) {
  const { data, error } = await supabase
    .from("deposits")
    .select("*")
    .eq("property_id", propertyId);
  if (error) Sentry.captureException(error, { tags: { source: "fetchDeposits", propertyId } });
  // Deduplicate by id — guards against duplicate rows that can arise from
  // RLS policies or other DB-level multiplications.
  const rows = data || [];
  const seen = new Map<string, DepositRow>();
  for (const row of rows) seen.set(row.id, row);
  return Array.from(seen.values());
}

async function fetchReminders(propertyId: string, bulan: number, tahun: number) {
  const { data, error } = await supabase
    .from("reminders")
    .select("id, type, message, wa_link, is_read, tenant_id")
    .eq("property_id", propertyId)
    .eq("periode_bulan", bulan)
    .eq("periode_tahun", tahun)
    .eq("is_read", false);
  if (error) Sentry.captureException(error, { tags: { source: "fetchReminders", propertyId } });
  return data || [];
}

async function fetchBroadcasts() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data, error } = await supabase
    .from("broadcasts")
    .select("id, message, created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });
  if (error) Sentry.captureException(error, { tags: { source: "fetchBroadcasts" } });
  return data || [];
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("nama, no_hp").eq("id", userId).single();
  if (error) Sentry.captureException(error, { tags: { source: "fetchProfile", userId } });
  return data;
}

async function fetchOverduePaymentStats(propertyId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, is_overdue, overdue_days")
    .eq("property_id", propertyId)
    .eq("is_overdue", true);
  if (error) Sentry.captureException(error, { tags: { source: "fetchOverduePaymentStats", propertyId } });

  const overduePayments = data || [];
  return {
    count: overduePayments.length,
    totalDays: overduePayments.reduce((sum, tx) => sum + (tx.overdue_days || 0), 0),
  };
}

// ---- Hooks ----

export function useRoomTypesAndRooms() {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["roomTypesAndRooms", pid],
    queryFn: () => fetchRoomTypesAndRooms(pid!),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

export function useTenants() {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["tenants", pid],
    queryFn: () => fetchTenants(pid!),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

export function useTransactions() {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["transactions", pid],
    queryFn: () => fetchTransactions(pid!),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

export function useExpenses(bulan: number, tahun: number) {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endMonth = bulan === 12 ? 1 : bulan + 1;
  const endYear = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
  return useQuery({
    queryKey: ["expenses", pid, bulan, tahun],
    queryFn: () => fetchExpenses(pid!, startDate, endDate),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

export function useDeposits() {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["deposits", pid],
    queryFn: () => fetchDeposits(pid!),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

export function useReminders(bulan: number, tahun: number) {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["reminders", pid, bulan, tahun],
    queryFn: () => fetchReminders(pid!, bulan, tahun),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

export function useBroadcasts() {
  const { isDemo } = useDemo();
  return useQuery({
    queryKey: ["broadcasts"],
    queryFn: fetchBroadcasts,
    enabled: !isDemo,
    staleTime: STALE_TIME,
  });
}

export function useProfile(userId: string | undefined) {
  const { isDemo } = useDemo();
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !isDemo && !!userId,
    staleTime: STALE_TIME,
  });
}

export function useOverduePaymentStats() {
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;
  return useQuery({
    queryKey: ["overdueStats", pid],
    queryFn: () => fetchOverduePaymentStats(pid!),
    enabled: !isDemo && !!pid,
    staleTime: STALE_TIME,
  });
}

// ---- Invalidation helpers ----
export function useInvalidate() {
  const qc = useQueryClient();
  return {
    rooms: () => qc.invalidateQueries({ queryKey: ["roomTypesAndRooms"] }),
    tenants: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
    transactions: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    overdueStats: () => qc.invalidateQueries({ queryKey: ["overdueStats"] }),
    expenses: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
    deposits: () => qc.invalidateQueries({ queryKey: ["deposits"] }),
    profile: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    all: () => qc.invalidateQueries(),
  };
}

// ---- Prefetching ----
export function usePrefetchRoutes() {
  const qc = useQueryClient();
  const { activeProperty } = useProperty();
  const { isDemo } = useDemo();
  const pid = activeProperty?.id;

  const prefetch = () => {
    if (isDemo || !pid) return;
    qc.prefetchQuery({
      queryKey: ["tenants", pid],
      queryFn: () => fetchTenants(pid),
      staleTime: STALE_TIME,
    });
    qc.prefetchQuery({
      queryKey: ["roomTypesAndRooms", pid],
      queryFn: () => fetchRoomTypesAndRooms(pid),
      staleTime: STALE_TIME,
    });
    qc.prefetchQuery({
      queryKey: ["transactions", pid],
      queryFn: () => fetchTransactions(pid),
      staleTime: STALE_TIME,
    });
  };

  return prefetch;
}
