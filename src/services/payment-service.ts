import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";

export interface SnapTokenResponse {
  snap_token: string;
  order_id: string;
  amount: number;
  plan: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  order_id: string;
  plan: string;
  amount: number;
  status: "pending" | "success" | "failed";
  snap_token: string;
  midtrans_response: any;
  created_at: string;
  updated_at: string;
}

export const paymentService = {
  async createSnapToken(
    plan: "starter" | "pro" | "bisnis"
  ): Promise<SnapTokenResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-snap-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create Snap token");
      }

      return await response.json();
    } catch (err) {
      Sentry.captureException(err, { tags: { source: "create-snap-token" } });
      throw err;
    }
  },

  async getPaymentTransaction(orderId: string): Promise<PaymentTransaction | null> {
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      if (error) throw error;
      return data as PaymentTransaction | null;
    } catch (err) {
      Sentry.captureException(err, { tags: { source: "get-payment-transaction" } });
      throw err;
    }
  },

  async getPaymentHistory(): Promise<PaymentTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PaymentTransaction[];
    } catch (err) {
      Sentry.captureException(err, { tags: { source: "get-payment-history" } });
      throw err;
    }
  },

  async verifyPaymentStatus(orderId: string): Promise<"success" | "pending" | "failed"> {
    try {
      const transaction = await this.getPaymentTransaction(orderId);
      if (!transaction) return "failed";
      return transaction.status as "success" | "pending" | "failed";
    } catch (err) {
      Sentry.captureException(err, { tags: { source: "verify-payment-status" } });
      throw err;
    }
  },
};
