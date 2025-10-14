import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { addSubscriberWithTags } from "../_shared/kit-api.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignupRequest {
  userId: string;
  email: string;
  firstName?: string;
}

/**
 * Manual Kit Signup Integration
 *
 * This function is called directly from the client after successful signup.
 * It's more reliable than database webhooks for local development.
 *
 * Usage:
 *   POST /functions/v1/kit-user-signup-manual
 *   Headers: Authorization: Bearer [anon_key]
 *   Body: { userId: "...", email: "...", firstName: "..." }
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, email, firstName }: SignupRequest = await req.json();

    if (!userId || !email) {
      throw new Error("userId and email are required");
    }

    console.log(`[Kit User Signup Manual] Processing signup for: ${email}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user already has Kit subscriber ID
    const { data: user, error: fetchError } = await supabaseClient
      .from("users")
      .select("kit_subscriber_id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch user: ${fetchError.message}`);
    }

    if (user?.kit_subscriber_id) {
      console.log("[Kit User Signup Manual] User already has Kit subscriber ID, skipping");
      return new Response(
        JSON.stringify({
          success: true,
          message: "User already synced to Kit",
          subscriberId: user.kit_subscriber_id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add subscriber to Kit with "signed-up" tag
    console.log(`[Kit User Signup Manual] Adding subscriber to Kit: ${email}`);

    const result = await addSubscriberWithTags(
      email,
      ["signed-up"],
      firstName
    );

    console.log(`[Kit User Signup Manual] Successfully added to Kit:`, result);

    // Update user record with Kit subscriber ID
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ kit_subscriber_id: result.subscriberId })
      .eq("id", userId);

    if (updateError) {
      console.error("[Kit User Signup Manual] Error updating user with Kit ID:", updateError);
      // Don't fail - subscriber was added to Kit successfully
    } else {
      console.log(`[Kit User Signup Manual] Updated user ${userId} with Kit subscriber ID`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User added to Kit successfully",
        subscriberId: result.subscriberId,
        email: result.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Kit User Signup Manual] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
