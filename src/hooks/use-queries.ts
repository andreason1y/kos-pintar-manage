import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

// ---- Raw data fetchers (non-demo) ----

async function fetchRoomTypesAndRooms(propertyId: string) {
  const { data: types, error: typesError } = await supabase
    .from("room_types")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at") as any;
  if (typesError) Sentry.captureException(typesError, { tags: { source: "fetchRoomTypes", propertyId } });
  const rtIds = (types || []).map((t: any) => t.id);
  let rooms: any[] = [];
  if (rtIds.length > 0) {
    const { data, error: roomsError } = await supabase.from("rooms").select("*").in("room_type_id", rtIds).order("nomor") as any;
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
    .order("created_at", { ascending: false }) as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchTenants", propertyId } });
  return (data || []) as any[];
}

async function fetchTransactions(propertyId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false }) as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchTransactions", propertyId } });
  return (data || []) as any[];
}

async function fetchExpenses(propertyId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("property_id", propertyId)
    .gte("tanggal", startDate)
    .lt("tanggal", endDate)
    .order("tanggal", { ascending: false }) as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchExpenses", propertyId } });
  return (data || []) as any[];
}

async function fetchDeposits(propertyId: string) {
  const { data, error } = await supabase
    .from("deposits")
    .select("*")
    .eq("property_id", propertyId) as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchDeposits", propertyId } });
  return (data || []) as any[];
}

async function fetchReminders(propertyId: string, bulan: number, tahun: number) {
  const { data, error } = await supabase
    .from("reminders")
    .select("id, type, message, wa_link, is_read, tenant_id")
    .eq("property_id", propertyId)
    .eq("periode_bulan", bulan)
    .eq("periode_tahun", tahun)
    .eq("is_read", false) as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchReminders", propertyId } });
  return (data || []) as any[];
}

async function fetchBroadcasts() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data, error } = await supabase
    .from("broadcasts")
    .select("id, message, created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false }) as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchBroadcasts" } });
  return (data || []) as any[];
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("nama, no_hp").eq("id", userId).single() as any;
  if (error) Sentry.captureException(error, { tags: { source: "fetchProfile", userId } });
  return data;
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

// ---- Invalidation helpers ----
export function useInvalidate() {
  const qc = useQueryClient();
  return {
    rooms: () => qc.invalidateQueries({ queryKey: ["roomTypesAndRooms"] }),
    tenants: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
    transactions: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
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
