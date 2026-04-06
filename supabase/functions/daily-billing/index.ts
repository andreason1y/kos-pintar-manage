import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function getMonthName(m: number): string {
  return ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][m - 1] || "";
}

Deno.serve(async (req) => {
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
    // 1. Auto-generate monthly invoices
    // Find active tenants whose tanggal_masuk day matches today
    const { data: tenants, error: tErr } = await supabase
      .from("tenants")
      .select("id, nama, no_hp, property_id, room_id, tanggal_masuk, status")
      .eq("status", "aktif");

    if (tErr) throw tErr;

    for (const tenant of tenants || []) {
      const startDay = new Date(tenant.tanggal_masuk).getDate();
      if (startDay !== dayOfMonth) continue;
      if (!tenant.room_id) continue;

      // Check if transaction already exists for this month
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("periode_bulan", currentMonth)
        .eq("periode_tahun", currentYear)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Get room price
      const { data: room } = await supabase
        .from("rooms")
        .select("room_type_id")
        .eq("id", tenant.room_id)
        .single();

      if (!room) continue;

      const { data: roomType } = await supabase
        .from("room_types")
        .select("harga_per_bulan")
        .eq("id", room.room_type_id)
        .single();

      if (!roomType) continue;

      await supabase.from("transactions").insert({
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        periode_bulan: currentMonth,
        periode_tahun: currentYear,
        total_tagihan: roomType.harga_per_bulan,
        jumlah_dibayar: 0,
        status: "belum_bayar",
      });
    }

    // 2. Generate reminders (H-3, H0, H+3)
    for (const tenant of tenants || []) {
      if (!tenant.room_id) continue;
      const startDay = new Date(tenant.tanggal_masuk).getDate();

      // Due date is the billing day of current month
      const dueDate = new Date(currentYear, currentMonth - 1, startDay);
      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if there's an unpaid transaction for this month
      const { data: unpaidTx } = await supabase
        .from("transactions")
        .select("id, total_tagihan, jumlah_dibayar, status")
        .eq("tenant_id", tenant.id)
        .eq("periode_bulan", currentMonth)
        .eq("periode_tahun", currentYear)
        .neq("status", "lunas")
        .limit(1);

      if (!unpaidTx || unpaidTx.length === 0) continue;

      const tx = unpaidTx[0];
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

      // Insert reminder (unique constraint prevents duplicates)
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
