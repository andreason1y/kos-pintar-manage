import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

    const userId = user.id;
    const body = await req.json().catch(() => ({}));
    const namaKos = body.nama_kos || "Kos Harmoni Residence";
    const alamat = body.alamat || "Jl. Harmoni No. 45, Jakarta Pusat";
    const isReset = body.reset === true;

    // If reset, delete all user data first
    if (isReset) {
      const { data: props } = await supabase.from("properties").select("id").eq("user_id", userId);
      const propIds = (props || []).map((p: any) => p.id);
      if (propIds.length > 0) {
        await supabase.from("reminders").delete().in("property_id", propIds);
        await supabase.from("deposits").delete().in("property_id", propIds);
        await supabase.from("transactions").delete().in("property_id", propIds);
        await supabase.from("expenses").delete().in("property_id", propIds);
        // Delete tenants
        await supabase.from("tenants").delete().in("property_id", propIds);
        // Delete rooms via room_types
        const { data: rts } = await supabase.from("room_types").select("id").in("property_id", propIds);
        const rtIds = (rts || []).map((r: any) => r.id);
        if (rtIds.length > 0) await supabase.from("rooms").delete().in("room_type_id", rtIds);
        await supabase.from("room_types").delete().in("property_id", propIds);
        await supabase.from("properties").delete().eq("user_id", userId);
      }
    }

    // Check if user already has properties (skip if not reset)
    if (!isReset) {
      const { data: existing } = await supabase.from("properties").select("id").eq("user_id", userId).limit(1);
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ message: "User already has data", skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 1. Create property
    const { data: prop, error: propErr } = await supabase.from("properties").insert({
      user_id: userId, nama_kos: namaKos, alamat
    }).select("id").single();
    if (propErr) throw propErr;
    const propertyId = prop.id;

    // 2. Create room types
    const roomTypesData = [
      { property_id: propertyId, nama: "Standar", harga_per_bulan: 1200000, fasilitas: ["WiFi", "Lemari", "Parkir Motor"] },
      { property_id: propertyId, nama: "Deluxe", harga_per_bulan: 1800000, fasilitas: ["AC", "WiFi", "Kamar Mandi Dalam", "Lemari", "TV"] },
      { property_id: propertyId, nama: "Suite", harga_per_bulan: 2500000, fasilitas: ["AC", "WiFi", "Kamar Mandi Dalam", "Lemari", "TV", "Air Panas", "Parkir Motor"] },
    ];
    const { data: rTypes, error: rtErr } = await supabase.from("room_types").insert(roomTypesData).select("id, nama");
    if (rtErr) throw rtErr;

    const rtMap: Record<string, string> = {};
    rTypes.forEach((rt: any) => { rtMap[rt.nama] = rt.id; });

    // 3. Create rooms
    const roomsData = [
      { room_type_id: rtMap["Standar"], nomor: "A1", lantai: 1, status: "terisi" },
      { room_type_id: rtMap["Standar"], nomor: "A2", lantai: 1, status: "terisi" },
      { room_type_id: rtMap["Standar"], nomor: "A3", lantai: 1, status: "kosong" },
      { room_type_id: rtMap["Standar"], nomor: "A4", lantai: 1, status: "terisi" },
      { room_type_id: rtMap["Standar"], nomor: "A5", lantai: 1, status: "kosong" },
      { room_type_id: rtMap["Deluxe"], nomor: "B1", lantai: 2, status: "terisi" },
      { room_type_id: rtMap["Deluxe"], nomor: "B2", lantai: 2, status: "terisi" },
      { room_type_id: rtMap["Deluxe"], nomor: "B3", lantai: 2, status: "kosong" },
      { room_type_id: rtMap["Suite"], nomor: "C1", lantai: 3, status: "terisi" },
      { room_type_id: rtMap["Suite"], nomor: "C2", lantai: 3, status: "kosong" },
    ];
    const { data: rooms, error: rmErr } = await supabase.from("rooms").insert(roomsData as any).select("id, nomor");
    if (rmErr) throw rmErr;

    const roomMap: Record<string, string> = {};
    rooms.forEach((r: any) => { roomMap[r.nomor] = r.id; });

    // 4. Create tenants
    const tenantsData = [
      { property_id: propertyId, room_id: roomMap["A1"], nama: "Budi Santoso", no_hp: "081234567890", gender: "L", tanggal_masuk: "2025-10-01", status: "aktif" },
      { property_id: propertyId, room_id: roomMap["A2"], nama: "Siti Rahayu", no_hp: "082198765432", gender: "P", tanggal_masuk: "2025-11-15", status: "aktif" },
      { property_id: propertyId, room_id: roomMap["A4"], nama: "Ahmad Fauzi", no_hp: "085312345678", gender: "L", tanggal_masuk: "2026-01-01", status: "aktif" },
      { property_id: propertyId, room_id: roomMap["B1"], nama: "Dewi Lestari", no_hp: "087812345678", gender: "P", tanggal_masuk: "2025-09-01", status: "aktif" },
      { property_id: propertyId, room_id: roomMap["B2"], nama: "Rizky Pratama", no_hp: "081387654321", gender: "L", tanggal_masuk: "2026-02-01", status: "aktif" },
    ];
    const { data: tenants, error: tnErr } = await supabase.from("tenants").insert(tenantsData as any).select("id, nama, room_id");
    if (tnErr) throw tnErr;

    const tenantMap: Record<string, { id: string; room_id: string }> = {};
    tenants.forEach((t: any) => { tenantMap[t.nama] = { id: t.id, room_id: t.room_id }; });

    // 5. Create transactions (last 3 months)
    const now = new Date();
    const transactions: any[] = [];
    const tenantNames = ["Budi Santoso", "Siti Rahayu", "Ahmad Fauzi", "Dewi Lestari", "Rizky Pratama"];
    const prices: Record<string, number> = {
      "Budi Santoso": 1200000, "Siti Rahayu": 1200000, "Ahmad Fauzi": 1200000,
      "Dewi Lestari": 1800000, "Rizky Pratama": 1800000,
    };

    for (let offset = 0; offset < 3; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const bulan = d.getMonth() + 1;
      const tahun = d.getFullYear();
      const mm = String(bulan).padStart(2, "0");

      for (const name of tenantNames) {
        const t = tenantMap[name];
        const total = prices[name];
        let status: string, dibayar: number, metode: string | null, tglBayar: string | null, nota: string | null;

        if (offset === 0) {
          // Current month: mix
          if (name === "Rizky Pratama") {
            status = "belum_bayar"; dibayar = 0; metode = null; tglBayar = null; nota = null;
          } else if (name === "Siti Rahayu") {
            status = "belum_lunas"; dibayar = Math.floor(total / 2); metode = "tunai"; tglBayar = `${tahun}-${mm}-10`; nota = null;
          } else {
            status = "lunas"; dibayar = total; metode = ["transfer", "qris", "tunai"][Math.floor(Math.random() * 3)];
            tglBayar = `${tahun}-${mm}-0${3 + Math.floor(Math.random() * 5)}`; nota = `NOTA-${tahun}${mm}-${String(Math.floor(1000 + Math.random() * 9000))}`;
          }
        } else if (offset === 1) {
          // Last month: mostly lunas
          if (name === "Ahmad Fauzi") {
            status = "belum_bayar"; dibayar = 0; metode = null; tglBayar = null; nota = null;
          } else {
            status = "lunas"; dibayar = total; metode = "transfer"; tglBayar = `${tahun}-${mm}-05`; nota = `NOTA-${tahun}${mm}-${String(Math.floor(1000 + Math.random() * 9000))}`;
          }
        } else {
          // 2 months ago: all lunas
          status = "lunas"; dibayar = total; metode = "transfer"; tglBayar = `${tahun}-${mm}-03`; nota = `NOTA-${tahun}${mm}-${String(Math.floor(1000 + Math.random() * 9000))}`;
        }

        transactions.push({
          tenant_id: t.id, property_id: propertyId,
          periode_bulan: bulan, periode_tahun: tahun,
          total_tagihan: total, jumlah_dibayar: dibayar,
          status, metode_bayar: metode, tanggal_bayar: tglBayar,
          nota_number: nota, catatan: null,
        });
      }
    }
    const { error: txErr } = await supabase.from("transactions").insert(transactions);
    if (txErr) throw txErr;

    // 6. Create expenses
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const expensesData = [
      { property_id: propertyId, judul: "Bayar Listrik", kategori: "Listrik", jumlah: 850000, tanggal: `${yyyy}-${mm}-08`, is_recurring: true },
      { property_id: propertyId, judul: "Bayar Air PDAM", kategori: "Air", jumlah: 350000, tanggal: `${yyyy}-${mm}-10`, is_recurring: true },
      { property_id: propertyId, judul: "Internet Bulanan", kategori: "Internet", jumlah: 500000, tanggal: `${yyyy}-${mm}-05`, is_recurring: true },
      { property_id: propertyId, judul: "Gaji Kebersihan", kategori: "Kebersihan", jumlah: 600000, tanggal: `${yyyy}-${mm}-01`, is_recurring: true },
      { property_id: propertyId, judul: "Perbaikan Pipa Kamar B3", kategori: "Perbaikan", jumlah: 250000, tanggal: `${yyyy}-${mm}-12`, is_recurring: false },
    ];
    const { error: expErr } = await supabase.from("expenses").insert(expensesData);
    if (expErr) throw expErr;

    return new Response(JSON.stringify({ success: true, property_id: propertyId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
