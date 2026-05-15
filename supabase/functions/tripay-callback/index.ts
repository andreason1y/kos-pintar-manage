import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Webhook dari Tripay — tidak butuh CORS (server-to-server, bukan browser request)

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const jsonResp = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const PRIVATE_KEY = Deno.env.get("TRIPAY_PRIVATE_KEY")!;

    // Baca raw body sebelum parse — wajib untuk validasi signature
    const rawBody = await req.text();
    const callbackSig = req.headers.get("X-Callback-Signature") ?? "";

    // Validasi signature: HMAC-SHA256(rawBody, private_key)
    const expected = await hmacSha256Hex(rawBody, PRIVATE_KEY);
    if (callbackSig !== expected) {
      console.error("[tripay-callback] Signature mismatch. received:", callbackSig, "expected:", expected);
      return jsonResp({ success: false, message: "Invalid signature" }, 400);
    }

    const payload = JSON.parse(rawBody) as {
      merchant_ref: string;
      reference: string;
      status: string;
      paid_at?: number;
    };

    const { merchant_ref, status, paid_at } = payload;
    if (!merchant_ref) {
      return jsonResp({ success: false, message: "Missing merchant_ref" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Update status order + simpan respons lengkap
    const orderUpdate: Record<string, unknown> = { status, tripay_response: payload };
    if (status === "PAID" && paid_at) {
      orderUpdate.paid_at = new Date(paid_at * 1000).toISOString();
    }

    const { data: order, error: updateErr } = await supabase
      .from("tripay_orders")
      .update(orderUpdate)
      .eq("merchant_ref", merchant_ref)
      .select("user_id, plan, duration_months")
      .single();

    if (updateErr || !order) {
      console.error("[tripay-callback] Order not found:", merchant_ref, updateErr);
      return jsonResp({ success: false, message: "Order not found" }, 404);
    }

    // Aktivasi subscription hanya jika PAID
    if (status === "PAID") {
      const { user_id, plan, duration_months } = order as {
        user_id: string;
        plan: string;
        duration_months: number;
      };

      // Hitung tanggal mulai: extend dari expiry yang masih aktif (jika ada)
      let startDate = new Date();
      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("id, expires_at")
        .eq("user_id", user_id)
        .eq("status", "aktif")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSub?.expires_at) {
        const currentExpiry = new Date(activeSub.expires_at);
        if (currentExpiry > startDate) startDate = currentExpiry;
      }

      const expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + duration_months);
      const expiresAtStr = expiresAt.toISOString().split("T")[0];
      const startedAtStr = new Date().toISOString().split("T")[0];

      if (activeSub?.id) {
        // Update subscription yang ada (by id, bukan by user_id — menghindari update banyak rows)
        await supabase.from("subscriptions")
          .update({ plan, status: "aktif", expires_at: expiresAtStr, duration_months, started_at: startedAtStr })
          .eq("id", activeSub.id);
      } else {
        await supabase.from("subscriptions")
          .insert({ user_id, plan, status: "aktif", started_at: startedAtStr, expires_at: expiresAtStr, duration_months });
      }

      console.log(`[tripay-callback] PAID: user=${user_id} plan=${plan} expires=${expiresAtStr}`);
    }

    return jsonResp({ success: true });

  } catch (err) {
    console.error("[tripay-callback] Error:", err);
    return jsonResp({ success: false, message: "Internal error" }, 500);
  }
});
