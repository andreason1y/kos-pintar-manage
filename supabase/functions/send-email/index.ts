const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET")!;
const FROM_EMAIL = "KosPintar <noreply@kospintar.id>";
const APP_URL = Deno.env.get("APP_URL") || "https://kospintar.id";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase HTTPS hooks kirim JWT HS256 di Authorization header
async function verifyHookJWT(authHeader: string | null, secret: string): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const data = encoder.encode(parts[0] + "." + parts[1]);
    const sig = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const padded = sig + "=".repeat((4 - sig.length % 4) % 4);
    const signature = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, signature, data);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  const valid = await verifyHookJWT(authHeader, HOOK_SECRET);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json() as {
    user: { email: string; id: string };
    email_data: {
      token: string;
      token_hash: string;
      redirect_to: string;
      email_action_type: string;
      site_url: string;
    };
  };

  const { user, email_data } = body;
  const { token_hash, redirect_to, email_action_type } = email_data;

  // Bangun link verifikasi menggunakan Supabase verify endpoint
  const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || APP_URL)}`;

  let subject = "";
  let htmlContent = "";

  if (email_action_type === "signup") {
    subject = "Verifikasi Email KosPintar Anda";
    htmlContent = buildVerificationEmail(user.email, verifyUrl);
  } else if (email_action_type === "recovery") {
    subject = "Reset Kata Sandi KosPintar";
    htmlContent = buildResetPasswordEmail(user.email, verifyUrl);
  } else if (email_action_type === "email_change") {
    subject = "Konfirmasi Perubahan Email KosPintar";
    htmlContent = buildVerificationEmail(user.email, verifyUrl);
  } else {
    // Jenis email lain — kirim link generik
    subject = "Tindakan Diperlukan — KosPintar";
    htmlContent = buildVerificationEmail(user.email, verifyUrl);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [user.email],
      subject,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Resend error:", error);
    return new Response(JSON.stringify({ error: "Gagal mengirim email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function buildBaseEmail(content: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KosPintar</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-block;background:#0d9488;border-radius:12px;padding:12px 20px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">KosPintar</span>
              </div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Email ini dikirim oleh KosPintar &bull; Sistem Manajemen Kos Indonesia
              </p>
              <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">
                Jika Anda tidak merasa mendaftar, abaikan email ini.
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

function buildVerificationEmail(email: string, verifyUrl: string): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Verifikasi Email Anda</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Halo! Terima kasih telah mendaftar di KosPintar. Klik tombol di bawah untuk memverifikasi alamat email Anda.
    </p>
    <div style="margin-bottom:24px;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:#0d9488;color:#ffffff;font-weight:600;font-size:15px;
                padding:12px 32px;border-radius:8px;text-decoration:none;">
        Verifikasi Email
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
      Atau salin link ini ke browser Anda:
    </p>
    <p style="margin:0;word-break:break-all;">
      <a href="${verifyUrl}" style="color:#0d9488;font-size:13px;">${verifyUrl}</a>
    </p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="margin:0;color:#9ca3af;font-size:13px;">
      Link ini hanya berlaku selama <strong>24 jam</strong>. Jika Anda tidak mendaftar, abaikan email ini.
    </p>
  `;
  return buildBaseEmail(content);
}

function buildResetPasswordEmail(email: string, resetUrl: string): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset Kata Sandi</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Kami menerima permintaan untuk mereset kata sandi akun KosPintar Anda (<strong>${email}</strong>).
      Klik tombol di bawah untuk membuat kata sandi baru.
    </p>
    <div style="margin-bottom:24px;">
      <a href="${resetUrl}"
         style="display:inline-block;background:#0d9488;color:#ffffff;font-weight:600;font-size:15px;
                padding:12px 32px;border-radius:8px;text-decoration:none;">
        Reset Kata Sandi
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
      Atau salin link ini ke browser Anda:
    </p>
    <p style="margin:0;word-break:break-all;">
      <a href="${resetUrl}" style="color:#0d9488;font-size:13px;">${resetUrl}</a>
    </p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="margin:0;color:#9ca3af;font-size:13px;">
      Link ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset kata sandi, abaikan email ini &mdash; akun Anda aman.
    </p>
  `;
  return buildBaseEmail(content);
}
