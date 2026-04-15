import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate token
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { server, uid } = await req.json();

    if (!server || !uid) {
      return new Response(JSON.stringify({ error: "server and uid are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serverLower = server.toLowerCase();
    if (!["bd", "ind"].includes(serverLower)) {
      return new Response(JSON.stringify({ error: "Server must be bd or ind" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get free trial settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "free_trial_user_daily_limit",
        "free_trial_total_daily_limit",
        "visit_api_normal",
      ]);

    const settingsMap: Record<string, string> = {};
    (settingsData || []).forEach((s: any) => {
      settingsMap[s.setting_key] = s.setting_value || "";
    });

    const userDailyLimit = parseInt(settingsMap.free_trial_user_daily_limit || "3") || 0;
    const totalDailyLimit = parseInt(settingsMap.free_trial_total_daily_limit || "100") || 0;

    // Get start of today (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Check per-user daily usage
    if (userDailyLimit > 0) {
      const { count } = await supabase
        .from("free_trial_uses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("used_at", todayISO);

      if ((count || 0) >= userDailyLimit) {
        return new Response(
          JSON.stringify({ error: `Daily limit reached. You can use ${userDailyLimit} free visit(s) per day.` }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check total daily usage
    if (totalDailyLimit > 0) {
      const { count } = await supabase
        .from("free_trial_uses")
        .select("id", { count: "exact", head: true })
        .gte("used_at", todayISO);

      if ((count || 0) >= totalDailyLimit) {
        return new Response(
          JSON.stringify({ error: "Daily free visit limit reached for all users. Please try again tomorrow." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get API endpoint
    const baseUrl = settingsMap.visit_api_normal || "https://visit-53-48kz.onrender.com";
    const apiUrl = `${baseUrl}/${serverLower}/${uid}`;

    console.log("Calling visit API:", apiUrl);

    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Visit API error:", apiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Visit API request failed. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await apiResponse.json();

    // Record usage
    await supabase.from("free_trial_uses").insert({ user_id: userId });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
