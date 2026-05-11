import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "KosPintar <noreply@kospintar.id>";
const OTP_EXPIRY_MINUTES = 10;

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

  // Generate kode OTP 6 digit
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Simpan ke DB via service role (bypass RLS)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Hapus kode lama yang belum dipakai untuk user ini
  await supabaseAdmin
    .from("otp_codes")
    .delete()
    .eq("user_id", user.id)
    .is("used_at", null);

  const { error: insertError } = await supabaseAdmin
    .from("otp_codes")
    .insert({
      user_id: user.id,
      email: user.email!,
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("Insert OTP error:", insertError);
    return new Response(JSON.stringify({ error: "Gagal membuat kode OTP" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Kirim email via Resend
  const html = buildOtpEmail(user.email!, code, OTP_EXPIRY_MINUTES);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [user.email!],
      subject: `${code} — Kode Verifikasi Login KosPintar`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const resendError = await resendRes.text();
    console.error("Resend error:", resendError);
    return new Response(JSON.stringify({ error: "Gagal mengirim email OTP" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function buildOtpEmail(email: string, code: string, expiryMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kode Verifikasi KosPintar</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-block;background:#0d9488;border-radius:12px;padding:12px 20px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">KosPintar</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Kode Verifikasi Login</h1>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Gunakan kode berikut untuk masuk ke akun KosPintar Anda (<strong>${email}</strong>):
              </p>
              <div style="background:#f0fdf9;border:2px dashed #0d9488;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0d9488;font-family:monospace;">
                  ${code}
                </span>
              </div>
              <p style="margin:0;color:#6b7280;font-size:14px;text-align:center;">
                Kode berlaku selama <strong>${expiryMinutes} menit</strong>.
                Jangan bagikan kode ini kepada siapa pun.
              </p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="margin:0;color:#9ca3af;font-size:13px;">
                Jika Anda tidak mencoba masuk ke KosPintar, abaikan email ini. Akun Anda tetap aman.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Email ini dikirim oleh KosPintar &bull; Sistem Manajemen Kos Indonesia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
