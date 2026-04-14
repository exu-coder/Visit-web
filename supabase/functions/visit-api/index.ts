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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Check free trial usage
    const { data: trialUsed } = await supabase
      .from("free_trial_uses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (trialUsed) {
      return new Response(
        JSON.stringify({ error: "Free trial already used. Purchase a visit package for continued access." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API endpoint from settings
    const { data: apiSetting } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "visit_api_normal")
      .maybeSingle();

    const baseUrl = apiSetting?.setting_value || "https://visit-53-48kz.onrender.com";
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

    // Record trial usage
    await supabase.from("free_trial_uses").insert({ user_id: user.id });

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
