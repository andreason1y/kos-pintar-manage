/**
 * Centralized API service layer
 * All Supabase operations should go through this service
 * Provides consistent error handling, logging, and type safety
 */

import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

// ─── Auth Service ───

export const authService = {
  async signOut() {
    return supabase.auth.signOut();
  },

  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Sentry.captureException(error, { tags: { source: "signUp" } });
      throw error;
    }

    return data;
  },

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Sentry.captureException(error, { tags: { source: "signIn" } });
      throw error;
    }

    return data;
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-sandi`,
    });

    if (error) {
      Sentry.captureException(error, { tags: { source: "resetPassword" } });
      throw error;
    }

    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Sentry.captureException(error, { tags: { source: "updatePassword" } });
      throw error;
    }

    return data;
  },
};

// ─── Property Service ───

export const propertyService = {
  async getProperties() {
    const { data, error } = await supabase
      .from("properties")
      .select("id, nama_kos, alamat")
      .order("created_at", { ascending: true });

    if (error) {
      Sentry.captureException(error, { tags: { source: "getProperties" } });
      throw error;
    }

    return data || [];
  },

  async createProperty(nama_kos: string, alamat?: string) {
    const { data, error } = await supabase
      .from("properties")
      .insert([{ nama_kos, alamat }])
      .select()
      .single();

    if (error) {
      Sentry.captureException(error, { tags: { source: "createProperty" } });
      throw error;
    }

    return data;
  },

  async updateProperty(
    propertyId: string,
    updates: { nama_kos?: string; alamat?: string }
  ) {
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", propertyId)
      .select()
      .single();

    if (error) {
      Sentry.captureException(error, { tags: { source: "updateProperty" } });
      throw error;
    }

    return data;
  },
};

// ─── Profile Service ───

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (acceptable)
      Sentry.captureException(error, { tags: { source: "getProfile" } });
    }

    return data || null;
  },

  async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      Sentry.captureException(error, { tags: { source: "updateProfile" } });
      throw error;
    }

    return data;
  },
};

// ─── Room Service ───

export const roomService = {
  async getRoomTypes(propertyId: string) {
    const { data, error } = await supabase
      .from("room_types")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at");

    if (error) {
      Sentry.captureException(error, { tags: { source: "getRoomTypes" } });
      throw error;
    }

    return data || [];
  },

  async getRooms(propertyId: string) {
    const { data: roomTypes, error: typesError } = await supabase
      .from("room_types")
      .select("id")
      .eq("property_id", propertyId);

    if (typesError) {
      Sentry.captureException(typesError, { tags: { source: "getRooms" } });
      throw typesError;
    }

    const typeIds = (roomTypes || []).map((t: any) => t.id);

    if (typeIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .in("room_type_id", typeIds)
      .order("nomor");

    if (error) {
      Sentry.captureException(error, { tags: { source: "getRooms" } });
      throw error;
    }

    return data || [];
  },
};

// ─── Tenant Service ───

export const tenantService = {
  async getTenants(propertyId: string) {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      Sentry.captureException(error, { tags: { source: "getTenants" } });
      throw error;
    }

    return data || [];
  },
};

// ─── Transaction Service ───

export const transactionService = {
  async getTransactions(propertyId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      Sentry.captureException(error, { tags: { source: "getTransactions" } });
      throw error;
    }

    return data || [];
  },
};

// ─── Broadcast Service ───

export const broadcastService = {
  async getBroadcasts() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("broadcasts")
      .select("id, message, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      Sentry.captureException(error, { tags: { source: "getBroadcasts" } });
      throw error;
    }

    return data || [];
  },
};

/**
 * Generic error handler for API operations
 * Centralizes error logging and user-facing error messages
 */
export function handleApiError(error: any, context: string): string {
  console.error(`API Error [${context}]:`, error);

  Sentry.captureException(error, {
    tags: { source: "api", context },
  });

  // Return user-friendly error message
  if (error?.message) {
    return error.message;
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}
