/**
 * Tripay payment gateway client.
 *
 * Sensitive operations (signature generation, direct Tripay API calls) run inside
 * the `tripay-create` and `tripay-callback` Supabase Edge Functions so that
 * TRIPAY_PRIVATE_KEY never leaves the server.
 *
 * This module provides:
 *   - TypeScript types for Tripay payloads
 *   - `createOrder()` — calls the `tripay-create` edge function
 *   - `getLocalOrder()` — reads order status from local `tripay_orders` table
 *   - `PAYMENT_METHODS` — supported payment channel list
 */

import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = [
  { code: "BRIVA",     label: "BRI Virtual Account",     group: "bank" },
  { code: "BNIVA",     label: "BNI Virtual Account",     group: "bank" },
  { code: "MANDIRIVA", label: "Mandiri Virtual Account", group: "bank" },
  { code: "BCAVA",     label: "BCA Virtual Account",     group: "bank" },
  { code: "PERMATAVA", label: "Permata Virtual Account", group: "bank" },
  { code: "QRIS",      label: "QRIS",                    group: "qris" },
] as const;

export type PaymentMethodCode = typeof PAYMENT_METHODS[number]["code"];

export interface CreateOrderParams {
  plan: string;
  duration_months: number;
  amount: number;
  payment_method: PaymentMethodCode;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface CreateOrderResult {
  success: true;
  merchant_ref: string;
  reference: string;
  checkout_url: string;
  pay_code: string | null;
  pay_name: string | null;
  amount: number;
  expired_time: number;
}

export interface TripayOrderRow {
  merchant_ref: string;
  reference: string | null;
  plan: string;
  duration_months: number;
  amount: number;
  status: string;
  payment_method: string | null;
  checkout_url: string | null;
  pay_code: string | null;
  pay_name: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/** Create a new Tripay transaction via edge function. Returns checkout_url. */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { data, error } = await supabase.functions.invoke("tripay-create", {
    body: params,
  });

  if (error) throw new Error(error.message ?? "Gagal menghubungi server pembayaran");

  const result = data as { success?: boolean; error?: string } & Partial<CreateOrderResult>;
  if (!result.success) throw new Error(result.error ?? "Gagal membuat transaksi");

  return result as CreateOrderResult;
}

/** Fetch order status from local tripay_orders table. */
export async function getLocalOrder(merchantRef: string): Promise<TripayOrderRow | null> {
  const { data, error } = await (supabase as any)
    .from("tripay_orders")
    .select("merchant_ref, reference, plan, duration_months, amount, status, payment_method, checkout_url, pay_code, pay_name, created_at")
    .eq("merchant_ref", merchantRef)
    .single();

  if (error || !data) return null;
  return data as TripayOrderRow;
}

/** Poll latest order status for authenticated user (most recent). */
export async function getLatestOrder(): Promise<TripayOrderRow | null> {
  const { data, error } = await (supabase as any)
    .from("tripay_orders")
    .select("merchant_ref, reference, plan, duration_months, amount, status, payment_method, checkout_url, pay_code, pay_name, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as TripayOrderRow;
}
