import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { addSubscriberWithTags } from "../_shared/kit-api.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    email: string;
    display_name?: string | null;
    kit_subscriber_id?: string | null;
  };
  old_record: null | Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();

    console.log("[Kit User Signup] Received webhook:", {
      type: payload.type,
      userId: payload.record.id,
      email: payload.record.email,
    });

    // Only process INSERT events (new signups)
    if (payload.type !== "INSERT") {
      console.log("[Kit User Signup] Ignoring non-INSERT event");
      return new Response(
        JSON.stringify({ message: "Not a signup event" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Skip if already has Kit subscriber ID (already processed)
    if (payload.record.kit_subscriber_id) {
      console.log("[Kit User Signup] User already has Kit subscriber ID, skipping");
      return new Response(
        JSON.stringify({ message: "Already processed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, display_name } = payload.record;

    // Add subscriber to Kit with "signed-up" tag
    console.log(`[Kit User Signup] Adding subscriber to Kit: ${email}`);

    const result = await addSubscriberWithTags(
      email,
      ["signed-up"],
      display_name || undefined
    );

    console.log(`[Kit User Signup] Successfully added to Kit:`, result);

    // Update user record with Kit subscriber ID
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ kit_subscriber_id: result.subscriberId })
      .eq("id", payload.record.id);

    if (updateError) {
      console.error("[Kit User Signup] Error updating user with Kit ID:", updateError);
      // Don't fail - subscriber was added to Kit successfully
    } else {
      console.log(`[Kit User Signup] Updated user ${payload.record.id} with Kit subscriber ID`);
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
    console.error("[Kit User Signup] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
