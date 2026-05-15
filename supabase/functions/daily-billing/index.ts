import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = [
  "https://kos-pintar-manage111.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function getMonthName(m: number): string {
  return ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][m - 1] || "";
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const dayOfMonth = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  try {
    const { data: tenants, error: tErr } = await supabase
      .from("tenants")
      .select("id, nama, no_hp, property_id, room_id, tanggal_masuk, status")
      .eq("status", "aktif");

    if (tErr) throw tErr;
    if (!tenants || tenants.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roomIds = tenants.map(t => t.room_id).filter((id): id is string => id != null);

    // Batch fetch semua rooms dan room_types sekaligus
    const [roomsRes, existingTxRes] = await Promise.all([
      roomIds.length > 0
        ? supabase.from("rooms").select("id, room_type_id").in("id", roomIds)
        : Promise.resolve({ data: [] as { id: string; room_type_id: string }[], error: null }),
      supabase
        .from("transactions")
        .select("id, tenant_id, total_tagihan, jumlah_dibayar, status")
        .in("tenant_id", tenants.map(t => t.id))
        .eq("periode_bulan", currentMonth)
        .eq("periode_tahun", currentYear),
    ]);

    if (roomsRes.error) throw roomsRes.error;
    if (existingTxRes.error) throw existingTxRes.error;

    const rooms = roomsRes.data || [];
    const roomTypeIds = [...new Set(rooms.map(r => r.room_type_id))];

    const roomTypesRes = roomTypeIds.length > 0
      ? await supabase.from("room_types").select("id, harga_per_bulan").in("id", roomTypeIds)
      : { data: [] as { id: string; harga_per_bulan: number }[], error: null };

    if (roomTypesRes.error) throw roomTypesRes.error;

    // Build lookup maps
    const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
    const roomTypeMap = Object.fromEntries((roomTypesRes.data || []).map(rt => [rt.id, rt]));
    const txByTenant = Object.fromEntries((existingTxRes.data || []).map(tx => [tx.tenant_id, tx]));

    // 1. Auto-generate monthly invoices via upsert (idempotent)
    for (const tenant of tenants) {
      const startDay = new Date(tenant.tanggal_masuk).getDate();
      if (startDay !== dayOfMonth || !tenant.room_id) continue;

      const room = roomMap[tenant.room_id];
      if (!room) continue;
      const roomType = roomTypeMap[room.room_type_id];
      if (!roomType) continue;

      // Upsert with conflict do nothing — idempotent insert
      await supabase.from("transactions").upsert(
        {
          tenant_id: tenant.id,
          property_id: tenant.property_id,
          periode_bulan: currentMonth,
          periode_tahun: currentYear,
          total_tagihan: roomType.harga_per_bulan,
          jumlah_dibayar: 0,
          status: "belum_bayar",
        },
        { onConflict: "tenant_id,periode_bulan,periode_tahun", ignoreDuplicates: true }
      );
    }

    // 2. Generate reminders (H-3, H0, H+3) — fetch updated tx map after inserts
    const { data: updatedTxData } = await supabase
      .from("transactions")
      .select("id, tenant_id, total_tagihan, jumlah_dibayar, status")
      .in("tenant_id", tenants.map(t => t.id))
      .eq("periode_bulan", currentMonth)
      .eq("periode_tahun", currentYear)
      .neq("status", "lunas");

    const unpaidTxByTenant = Object.fromEntries(
      (updatedTxData || []).map(tx => [tx.tenant_id, tx])
    );

    for (const tenant of tenants) {
      if (!tenant.room_id) continue;
      const startDay = new Date(tenant.tanggal_masuk).getDate();

      const dueDate = new Date(currentYear, currentMonth - 1, startDay);
      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const tx = unpaidTxByTenant[tenant.id];
      if (!tx) continue;

      const sisa = tx.total_tagihan - tx.jumlah_dibayar;
      const phone = tenant.no_hp ? tenant.no_hp.replace(/^0/, "62") : "";

      let reminderType: string | null = null;
      let message = "";

      if (diffDays === 3) {
        reminderType = "h-3";
        message = `Halo ${tenant.nama}, tagihan sewa bulan ${getMonthName(currentMonth)} sebesar ${formatRupiah(sisa)} jatuh tempo 3 hari lagi.`;
      } else if (diffDays === 0) {
        reminderType = "h0";
        message = `Halo ${tenant.nama}, hari ini adalah jatuh tempo pembayaran sewa ${formatRupiah(sisa)}. Mohon segera dibayar.`;
      } else if (diffDays === -3) {
        reminderType = "h+3";
        message = `Halo ${tenant.nama}, tagihan sewa bulan ${getMonthName(currentMonth)} sebesar ${formatRupiah(sisa)} sudah lewat jatuh tempo. Mohon segera melunasi.`;
      }

      if (!reminderType) continue;

      const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

      await supabase.from("reminders").upsert(
        {
          property_id: tenant.property_id,
          tenant_id: tenant.id,
          type: reminderType,
          message,
          wa_link: waLink,
          periode_bulan: currentMonth,
          periode_tahun: currentYear,
        },
        { onConflict: "tenant_id,periode_bulan,periode_tahun,type" }
      );
    }

    // Re-fetch existing tx map to check which ones were pre-existing (used for logging only)
    const preExistingCount = Object.keys(txByTenant).length;

    return new Response(JSON.stringify({ success: true, tenants: tenants.length, pre_existing_tx: preExistingCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
