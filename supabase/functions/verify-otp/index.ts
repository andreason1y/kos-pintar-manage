import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Ambil user dari bearer token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let code: string;
  try {
    const body = await req.json();
    code = String(body.code || "").trim();
  } catch {
    return new Response(JSON.stringify({ error: "Request tidak valid" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!code || code.length !== 6) {
    return new Response(JSON.stringify({ error: "Kode OTP harus 6 digit" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Cari kode OTP yang valid
  const { data: otpRecord, error: fetchError } = await supabaseAdmin
    .from("otp_codes")
    .select("id, code, expires_at, used_at")
    .eq("user_id", user.id)
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Fetch OTP error:", fetchError);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan, coba lagi" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!otpRecord) {
    return new Response(
      JSON.stringify({ error: "Kode OTP salah atau sudah kadaluarsa" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Tandai kode sebagai sudah dipakai
  await supabaseAdmin
    .from("otp_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", otpRecord.id);

  return new Response(JSON.stringify({ success: true, verified: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
