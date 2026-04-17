import * as Sentry from "@sentry/react";

export interface EmailNotificationPayload {
  to: string;
  tenant_name: string;
  amount_due: number;
  due_date: string;
  property_name: string;
}

export async function queueEmailNotification(payload: EmailNotificationPayload): Promise<void> {
  try {
    const { to, tenant_name, amount_due, due_date, property_name } = payload;

    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount_due);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 10px; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Notifikasi Tagihan Jatuh Tempo</h1>
    </div>
    <div class="content">
      <p>Halo <strong>${tenant_name}</strong>,</p>
      <p>Kami ingin mengingatkan bahwa tagihan Anda akan segera jatuh tempo.</p>

      <div class="highlight">
        <strong>Detail Tagihan:</strong><br />
        Properti: ${property_name}<br />
        Jumlah: ${formattedAmount}<br />
        Jatuh Tempo: ${due_date}
      </div>

      <p>Mohon lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari denda keterlambatan.</p>
      <p>Terima kasih.</p>
    </div>
    <div class="footer">
      <p>Kos Pintar Management System</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: `Notifikasi Tagihan Jatuh Tempo - ${property_name}`,
          html,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Email service error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    Sentry.captureException(error, { tags: { service: "email-notification" } });
    throw error;
  }
}

export async function isEmailNotificationsEnabled(): Promise<boolean> {
  return true;
}
