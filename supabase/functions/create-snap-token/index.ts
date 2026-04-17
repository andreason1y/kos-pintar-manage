import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICING: Record<string, number> = {
  starter: 399000,
  pro: 699000,
  bisnis: 1299000,
};

interface CreateSnapTokenRequest {
  plan: "starter" | "pro" | "bisnis";
}

interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");

    if (!midtransServerKey) {
      throw new Error("MIDTRANS_SERVER_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    const body: CreateSnapTokenRequest = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICING[plan]) {
      throw new Error("Invalid plan: must be starter, pro, or bisnis");
    }

    const amount = PLAN_PRICING[plan];
    const orderId = `KP_${user.id}_${Date.now()}`;

    // Get user profile for customer details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nama, email: id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const customerEmail = user.email || profile?.email || "customer@example.com";
    const customerName = profile?.nama || user.email?.split("@")[0] || "Customer";

    // Call Midtrans Snap API
    const midtransAuth = btoa(`${midtransServerKey}:`);
    const snapResponse = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${midtransAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          first_name: customerName,
          email: customerEmail,
          phone: "", // Could fetch from profiles if stored
        },
        item_details: [
          {
            id: plan,
            price: amount,
            quantity: 1,
            name: `KosPintar ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - 1 Bulan`,
          },
        ],
      }),
    });

    const snapData: MidtransSnapResponse = await snapResponse.json();

    if (!snapResponse.ok || !snapData.token) {
      throw new Error(
        `Midtrans API error: ${snapResponse.status} - ${JSON.stringify(snapData)}`
      );
    }

    // Store payment transaction
    const { data: transaction, error: insertError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        order_id: orderId,
        plan,
        amount,
        snap_token: snapData.token,
        status: "pending",
        midtrans_response: null,
      })
      .select("id")
      .maybeSingle();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        snap_token: snapData.token,
        order_id: orderId,
        amount,
        plan,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage = (err as Error).message;
    console.error("create-snap-token error:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
