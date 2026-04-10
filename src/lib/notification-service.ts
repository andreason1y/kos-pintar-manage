/**
 * Notification Service
 *
 * Handles sending notifications to tenants for payment reminders.
 * Supports multiple channels: Email (via email-service.ts)
 */

import { supabase } from "@/integrations/supabase/client";
import { queueEmailNotification } from "./email-service";

export interface TenantPaymentDue {
  tenant_id: string;
  tenant_name: string;
  tenant_email: string | null;
  send_email_notifications: boolean;
  property_name: string;
  amount_due: number;
  due_date: string;
}

/**
 * Send payment due reminders to tenants
 *
 * Checks each tenant's notification preferences and sends appropriate reminders.
 * Currently supports email notifications.
 *
 * @param paymentsDue - Array of payments that are due
 */
export async function sendPaymentReminders(paymentsDue: TenantPaymentDue[]): Promise<void> {
  console.log(`[Notification Service] Processing ${paymentsDue.length} payment reminders`);

  for (const payment of paymentsDue) {
    try {
      // Check if email notifications are enabled for this tenant
      if (payment.send_email_notifications && payment.tenant_email) {
        await queueEmailNotification({
          to: payment.tenant_email,
          tenant_name: payment.tenant_name,
          amount_due: payment.amount_due,
          due_date: payment.due_date,
          property_name: payment.property_name,
        });

        console.log(`[Notification Service] Email queued for ${payment.tenant_name}`);
      } else if (!payment.tenant_email && payment.send_email_notifications) {
        console.warn(
          `[Notification Service] Email enabled for ${payment.tenant_name} but no email on file`
        );
      }
    } catch (error) {
      console.error(
        `[Notification Service] Failed to send reminder to ${payment.tenant_name}:`,
        error
      );
      // Continue processing other tenants on error
    }
  }
}

/**
 * Fetch tenants with overdue or upcoming due payments
 *
 * @param propertyId - The property ID to check (optional)
 * @param daysUntilDue - Number of days ahead to consider as "due soon" (default: 7)
 * @returns Array of tenants with due payments
 */
export async function getPaymentsDue(
  propertyId?: string,
  daysUntilDue: number = 7
): Promise<TenantPaymentDue[]> {
  const today = new Date();
  const upcomingDate = new Date();
  upcomingDate.setDate(upcomingDate.getDate() + daysUntilDue);

  const query = supabase
    .from("pembayaran")
    .select(
      `
      id,
      amount,
      due_date,
      penyewa:penyewa_id (
        id,
        nama,
        email,
        send_email_notifications,
        kamar:room_id (
          properti:property_id (
            nama
          )
        )
      )
    `
    )
    .eq("status", "belum_lunas")
    .lte("due_date", upcomingDate.toISOString().split("T")[0])
    .gte("due_date", today.toISOString().split("T")[0]);

  if (propertyId) {
    query.eq("kamar.properti.id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Notification Service] Error fetching payments due:", error);
    return [];
  }

  // Transform to TenantPaymentDue format
  return (data || [])
    .filter((p: any) => p.penyewa)
    .map((p: any) => ({
      tenant_id: p.penyewa.id,
      tenant_name: p.penyewa.nama,
      tenant_email: p.penyewa.email || null,
      send_email_notifications: p.penyewa.send_email_notifications || false,
      property_name: p.penyewa.kamar?.properti?.nama || "Unknown Property",
      amount_due: p.amount,
      due_date: p.due_date,
    }));
}
