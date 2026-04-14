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
  property_name: string;
  amount_due: number;
  due_date: string;
}

/**
 * Send payment due reminders to tenants
 */
export async function sendPaymentReminders(paymentsDue: TenantPaymentDue[]): Promise<void> {
  console.log(`[Notification Service] Processing ${paymentsDue.length} payment reminders`);

  for (const payment of paymentsDue) {
    try {
      // Only send email if tenant has an email address on file
      if (payment.tenant_email) {
        await queueEmailNotification({
          to: payment.tenant_email,
          tenant_name: payment.tenant_name,
          amount_due: payment.amount_due,
          due_date: payment.due_date,
          property_name: payment.property_name,
        });
        console.log(`[Notification Service] Email queued for ${payment.tenant_name}`);
      }
    } catch (error) {
      console.error(`[Notification Service] Failed to send reminder to ${payment.tenant_name}:`, error);
    }
  }
}

/**
 * Fetch tenants with overdue or upcoming due payments
 */
export async function getPaymentsDue(
  propertyId?: string,
  daysUntilDue: number = 7
): Promise<TenantPaymentDue[]> {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let query = supabase
    .from("transactions")
    .select(`
      id,
      total_tagihan,
      jumlah_dibayar,
      periode_bulan,
      periode_tahun,
      property_id,
      tenant_id
    `)
    .neq("status", "lunas")
    .eq("periode_bulan", currentMonth)
    .eq("periode_tahun", currentYear);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data: txns, error } = await query;

  if (error) {
    console.error("[Notification Service] Error fetching transactions:", error);
    return [];
  }

  if (!txns || txns.length === 0) return [];

  // Get tenant details including email for each transaction
  const tenantIds = [...new Set(txns.map((t) => t.tenant_id))];
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nama, no_hp, email, property_id")
    .in("id", tenantIds);

  // Get property names
  const propIds = [...new Set(txns.map((t) => t.property_id))];
  const { data: properties } = await supabase
    .from("properties")
    .select("id, nama_kos")
    .in("id", propIds);

  return txns
    .map((tx) => {
      const tenant = tenants?.find((t) => t.id === tx.tenant_id);
      const prop = properties?.find((p) => p.id === tx.property_id);
      if (!tenant) return null;
      return {
        tenant_id: tenant.id,
        tenant_name: tenant.nama,
        tenant_email: tenant.email ?? null,
        property_name: prop?.nama_kos || "Unknown Property",
        amount_due: tx.total_tagihan - tx.jumlah_dibayar,
        due_date: `${tx.periode_tahun}-${String(tx.periode_bulan).padStart(2, "0")}-01`,
      };
    })
    .filter(Boolean) as TenantPaymentDue[];
}
