import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = [
  "https://kospintar.id",
  "https://www.kospintar.id",
  "https://kos-pintar-manage111.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

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
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonResp = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const MERCHANT_CODE = Deno.env.get("TRIPAY_MERCHANT_CODE")!;
    const API_KEY       = Deno.env.get("TRIPAY_API_KEY")!;
    const PRIVATE_KEY   = Deno.env.get("TRIPAY_PRIVATE_KEY")!;
    const BASE_URL      = Deno.env.get("TRIPAY_BASE_URL") ?? "https://tripay.co.id/api-sandbox/";
    const CALLBACK_URL  = Deno.env.get("TRIPAY_CALLBACK_URL")!;
    const RETURN_URL    = Deno.env.get("TRIPAY_RETURN_URL") ?? "https://kos-pintar-manage111.vercel.app/payment/status";

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) return jsonResp({ error: "Unauthorized" }, 401);

    const body = await req.json() as {
      plan: string;
      duration_months: number;
      payment_method: string;
      customer_name?: string;
      customer_phone?: string;
    };

    const { plan, duration_months, payment_method, customer_name, customer_phone } = body;

    if (!plan || !duration_months || !payment_method) {
      return jsonResp({ error: "plan, duration_months, dan payment_method wajib diisi" }, 400);
    }

    // Ambil harga dari DB — jangan terima amount dari frontend
    const { data: priceRow, error: priceErr } = await supabase
      .from("subscription_prices")
      .select("price")
      .eq("tier", plan)
      .eq("duration_months", duration_months)
      .single();

    if (priceErr || !priceRow) {
      return jsonResp({ error: "Paket tidak ditemukan" }, 400);
    }

    const amount = priceRow.price;

    // Merchant ref unik pakai crypto
    const merchantRef = `KP-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

    // Tripay signature: HMAC-SHA256(merchant_code + merchant_ref + amount, private_key)
    const signature = await hmacSha256Hex(MERCHANT_CODE + merchantRef + amount, PRIVATE_KEY);

    const expiredTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const tripayPayload = {
      method: payment_method,
      merchant_ref: merchantRef,
      amount,
      customer_name: customer_name || "Pelanggan KosPintar",
      customer_email: user.email,
      customer_phone: customer_phone || "08000000000",
      order_items: [
        {
          sku: `KP-${plan.toUpperCase()}-${duration_months}M`,
          name: `KosPintar ${plan.charAt(0).toUpperCase() + plan.slice(1)} — ${duration_months} Bulan`,
          price: amount,
          quantity: 1,
        },
      ],
      callback_url: CALLBACK_URL,
      return_url: RETURN_URL,
      expired_time: expiredTime,
      signature,
    };

    const tripayRes = await fetch(`${BASE_URL}transaction/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tripayPayload),
    });

    const tripayData = await tripayRes.json() as {
      success: boolean;
      message?: string;
      data?: {
        reference: string;
        checkout_url: string;
        pay_code?: string;
        pay_name?: string;
        amount: number;
        expired_time: number;
      };
    };

    if (!tripayData.success || !tripayData.data) {
      console.error("[tripay-create] Tripay error:", JSON.stringify(tripayData));
      return jsonResp({ error: tripayData.message ?? "Gagal membuat transaksi Tripay" }, 400);
    }

    const tx = tripayData.data;

    const { error: insertErr } = await supabase.from("tripay_orders").insert({
      user_id: user.id,
      merchant_ref: merchantRef,
      reference: tx.reference,
      plan,
      duration_months,
      amount,
      payment_method,
      status: "UNPAID",
      checkout_url: tx.checkout_url,
      pay_code: tx.pay_code ?? null,
      pay_name: tx.pay_name ?? null,
      tripay_response: tx,
    });

    if (insertErr) {
      console.error("[tripay-create] DB insert error:", insertErr);
      return jsonResp({ error: "Gagal menyimpan order" }, 500);
    }

    return jsonResp({
      success: true,
      merchant_ref: merchantRef,
      reference: tx.reference,
      checkout_url: tx.checkout_url,
      pay_code: tx.pay_code ?? null,
      pay_name: tx.pay_name ?? null,
      amount: tx.amount,
      expired_time: tx.expired_time,
    });

  } catch (err) {
    console.error("[tripay-create] Unexpected error:", err);
    return jsonResp({ error: "Internal server error" }, 500);
  }
});
