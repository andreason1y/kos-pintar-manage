import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { action } = body;

    if (action === "create_user") {
      const { email, password, nama, no_hp, plan, nama_kos, started_at, expires_at } = body;
      
      // Create auth user
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nama, no_hp },
      });
      if (createErr) throw createErr;
      const userId = newUser.user.id;

      // Upsert profile
      await supabase.from("profiles").upsert({ id: userId, nama, no_hp });

      // Create property if nama_kos provided
      if (nama_kos) {
        await supabase.from("properties").insert({ user_id: userId, nama_kos });
      }

      // Create subscription
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
      const { user_id, new_password } = body;
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_reset_email") {
      const { email } = body;
      const anonUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const anonSupa = createClient(anonUrl, anonKey);
      const { error } = await anonSupa.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_user") {
      const { user_id, nama, no_hp, plan, status, expires_at, nama_kos } = body;

      // Update profile
      if (nama !== undefined || no_hp !== undefined) {
        const updates: Record<string, string> = {};
        if (nama !== undefined) updates.nama = nama;
        if (no_hp !== undefined) updates.no_hp = no_hp;
        await supabase.from("profiles").update(updates).eq("id", user_id);
      }

      // Update subscription
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

      // Update property name
      if (nama_kos !== undefined) {
        await supabase.from("properties").update({ nama_kos }).eq("user_id", user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
