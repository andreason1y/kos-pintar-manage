/**
 * Email Notification Service
 *
 * Handles sending email notifications to tenants for payment reminders.
 * Currently a stub - awaiting email service API setup (Sendgrid, AWS SES, etc.)
 */

export interface EmailNotificationPayload {
  to: string;
  tenant_name: string;
  amount_due: number;
  due_date: string;
  property_name: string;
}

/**
 * Queue an email notification for a tenant
 *
 * This function checks if notifications are enabled and queues an email to be sent.
 * In production, this would integrate with an actual email service API.
 *
 * @param payload - Email notification data
 * @returns Promise that resolves when email is queued
 *
 * @example
 * await queueEmailNotification({
 *   to: "tenant@email.com",
 *   tenant_name: "John Doe",
 *   amount_due: 500000,
 *   due_date: "2026-04-15",
 *   property_name: "Kos Sejahtera"
 * });
 */
export async function queueEmailNotification(payload: EmailNotificationPayload): Promise<void> {
  try {
    // TODO: Implement actual email service integration
    // For now, just log the notification
    console.log("[Email Notification Queued]", {
      to: payload.to,
      tenant: payload.tenant_name,
      amount: payload.amount_due,
      dueDate: payload.due_date,
      property: payload.property_name,
      timestamp: new Date().toISOString(),
    });

    // Once email service is configured, replace above with:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: payload.to,
    //     templateId: 'billing-reminder',
    //     variables: {
    //       tenant_name: payload.tenant_name,
    //       amount_due: formatRupiah(payload.amount_due),
    //       due_date: formatDate(payload.due_date),
    //       property_name: payload.property_name,
    //     }
    //   })
    // });
    // if (!response.ok) throw new Error('Failed to queue email');
  } catch (error) {
    console.error("[Email Service Error]", error);
    // In production, log to error tracking service (Sentry)
    // Sentry.captureException(error, { tags: { service: 'email' } });
    throw error;
  }
}

/**
 * Check if email notifications are enabled globally
 *
 * @returns Promise<boolean> - true if email notifications are enabled in settings
 */
export async function isEmailNotificationsEnabled(): Promise<boolean> {
  // TODO: Fetch from settings_text table
  // For now, return true as placeholder
  return true;
}

/**
 * Get email configuration from settings
 *
 * @returns Promise with sender address, subject template, body template
 */
export async function getEmailConfig(): Promise<{
  senderAddress: string;
  subjectTemplate: string;
  bodyTemplate: string;
}> {
  // TODO: Fetch from settings_text table
  // Return defaults for now
  return {
    senderAddress: "noreply@kospintar.id",
    subjectTemplate: "Notifikasi Tagihan Jatuh Tempo - {property_name}",
    bodyTemplate: `
Halo {tenant_name},

Kami ingin mengingatkan bahwa tagihan Anda akan jatuh tempo pada {due_date}.

Detail Tagihan:
- Nama Properti: {property_name}
- Jumlah: {amount_due}
- Jatuh Tempo: {due_date}

Mohon lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari denda keterlambatan.

Terima kasih.

---
Kos Pintar Management System
    `.trim(),
  };
}
