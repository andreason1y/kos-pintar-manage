import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as crypto from "https://deno.land/std@0.208.0/crypto/mod.ts";

interface MidtransNotification {
  order_id: string;
  status_code: string;
  transaction_id: string;
  transaction_status: string;
  gross_amount: string | number;
  signature_key: string;
  [key: string]: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_DURATION_DAYS = 30; // 1 month subscription

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");

    if (!midtransServerKey) {
      throw new Error("MIDTRANS_SERVER_KEY not configured");
    }

    const notification: MidtransNotification = await req.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = notification;

    // Verify signature
    const signaturePayload = `${order_id}${status_code}${gross_amount}${midtransServerKey}`;
    const hash = await crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(signaturePayload)
    );
    const hashArray = Array.from(new Uint8Array(hash));
    const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (computedSignature !== signature_key) {
      console.warn(`Invalid signature for order ${order_id}`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Map Midtrans status to app status
    const appStatus = (() => {
      if (transaction_status === "capture" || transaction_status === "settlement") return "success";
      if (transaction_status === "pending") return "pending";
      return "failed";
    })();

    // Update payment transaction
    const { data: paymentTx, error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: appStatus,
        midtrans_response: notification,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order_id)
      .select("user_id, plan, amount")
      .maybeSingle();

    if (updateError) {
      console.error(`Update payment_transactions error: ${updateError.message}`);
      return new Response(JSON.stringify({ error: "Payment update failed" }), { status: 500 });
    }

    if (!paymentTx) {
      console.warn(`No payment transaction found for order ${order_id}`);
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Only process if payment successful
    if (appStatus === "success") {
      const { user_id, plan } = paymentTx;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + PLAN_DURATION_DAYS);
      const expiresAtString = expiresAt.toISOString().split("T")[0];

      // Check if user has active subscription
      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("id, expires_at")
        .eq("user_id", user_id)
        .eq("status", "aktif")
        .maybeSingle();

      if (activeSub) {
        // Extend existing subscription
        const currentExpiry = new Date(activeSub.expires_at);
        currentExpiry.setDate(currentExpiry.getDate() + PLAN_DURATION_DAYS);
        const newExpiry = currentExpiry.toISOString().split("T")[0];

        await supabase
          .from("subscriptions")
          .update({
            plan,
            expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeSub.id);
      } else {
        // Create new subscription
        const startedAt = new Date().toISOString().split("T")[0];
        await supabase.from("subscriptions").insert({
          user_id,
          plan,
          status: "aktif",
          started_at: startedAt,
          expires_at: expiresAtString,
        });
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({
          plan,
          subscription_active: true,
        })
        .eq("id", user_id);

      // Get user email for confirmation
      const { data: { user: authUser } } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!)
        .auth.admin.getUserById(user_id);

      // Send confirmation email
      if (authUser?.email) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: authUser.email,
              subject: "Pembayaran Berhasil - Langganan KosPintar Aktif",
              html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pembayaran Berhasil ✓</h1>
    </div>
    <div class="content">
      <p>Halo,</p>
      <p>Terima kasih telah melakukan pembayaran untuk langganan KosPintar paket ${plan.toUpperCase()}.</p>
      <p><strong>Langganan Anda telah diaktifkan dan berlaku hingga ${expiresAtString}.</strong></p>
      <p>Anda sekarang dapat mengakses semua fitur premium.</p>
      <p>Terima kasih telah memilih KosPintar!</p>
    </div>
  </div>
</body>
</html>
              `,
            }),
          });
        } catch (emailError) {
          console.error(`Send email error: ${emailError}`);
          // Don't fail webhook if email fails
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = (err as Error).message;
    console.error("midtrans-webhook error:", errorMessage);

    // Still return 200 to prevent Midtrans retry storms
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
