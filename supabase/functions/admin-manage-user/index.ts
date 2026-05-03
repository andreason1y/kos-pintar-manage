import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = Record<string, unknown>;

function requireString(body: Payload, field: string): string | null {
  const v = body[field];
  if (typeof v !== "string" || !v.trim()) return `Field '${field}' wajib diisi`;
  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(action: string, body: Payload): string | null {
  if (action === "create_user") {
    const err = requireString(body, "email") ?? requireString(body, "password") ?? requireString(body, "nama");
    if (err) return err;
    if (!isValidEmail(body.email as string)) return "Format email tidak valid";
    if ((body.password as string).length < 6) return "Password minimal 6 karakter";
    return null;
  }
  if (action === "reset_password") {
    const err = requireString(body, "user_id") ?? requireString(body, "new_password");
    if (err) return err;
    if ((body.new_password as string).length < 8) return "Password baru minimal 8 karakter";
    return null;
  }
  if (action === "send_reset_email") {
    const err = requireString(body, "email");
    if (err) return err;
    if (!isValidEmail(body.email as string)) return "Format email tidak valid";
    return null;
  }
  if (action === "update_user") {
    const err = requireString(body, "user_id");
    if (err) return err;
    const hasUpdate = ["nama", "no_hp", "plan", "status", "expires_at", "nama_kos"].some(f => body[f] !== undefined);
    if (!hasUpdate) return "Minimal satu field harus diisi untuk update";
    return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) throw new Error("Unauthorized");
    const { data: isAdmin } = await supabase.from("admins").select("id").eq("email", caller.email!).maybeSingle();
    if (!isAdmin) throw new Error("Not admin");

    const body: Payload = await req.json();
    const { action } = body as { action: string };

    // Validate payload before executing
    const validationError = validatePayload(action, body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_user") {
      const { email, password, nama, no_hp, plan, nama_kos, started_at, expires_at } = body as {
        email: string; password: string; nama: string; no_hp?: string;
        plan?: string; nama_kos?: string; started_at?: string; expires_at?: string;
      };

      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nama, no_hp },
      });
      if (createErr) throw createErr;
      const userId = newUser.user.id;

      await supabase.from("profiles").upsert({ id: userId, nama, no_hp });

      if (nama_kos) {
        await supabase.from("properties").insert({ user_id: userId, nama_kos });
      }

      if (plan && expires_at) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan,
          status: "aktif",
          started_at: started_at || new Date().toISOString().split("T")[0],
          expires_at,
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { user_id, new_password } = body as { user_id: string; new_password: string };
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_reset_email") {
      const { email } = body as { email: string };
      const anonSupa = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { error } = await anonSupa.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_user") {
      const { user_id, nama, no_hp, plan, status, expires_at, nama_kos } = body as {
        user_id: string; nama?: string; no_hp?: string; plan?: string;
        status?: string; expires_at?: string; nama_kos?: string;
      };

      if (nama !== undefined || no_hp !== undefined) {
        const updates: Record<string, string> = {};
        if (nama !== undefined) updates.nama = nama;
        if (no_hp !== undefined) updates.no_hp = no_hp;
        await supabase.from("profiles").update(updates).eq("id", user_id);
      }

      if (plan !== undefined || status !== undefined || expires_at !== undefined) {
        const subUpdates: Record<string, string> = {};
        if (plan !== undefined) subUpdates.plan = plan;
        if (status !== undefined) subUpdates.status = status;
        if (expires_at !== undefined) subUpdates.expires_at = expires_at;

        const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();
        if (existingSub) {
          await supabase.from("subscriptions").update(subUpdates).eq("user_id", user_id);
        } else if (plan && expires_at) {
          await supabase.from("subscriptions").insert({
            user_id,
            plan,
            status: status || "aktif",
            expires_at,
          });
        }
      }

      if (nama_kos !== undefined) {
        await supabase.from("properties").update({ nama_kos }).eq("user_id", user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
