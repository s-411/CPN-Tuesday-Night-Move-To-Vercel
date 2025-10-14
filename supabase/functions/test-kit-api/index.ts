import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { addSubscriberWithTags, tagSubscriberByEmail } from "../_shared/kit-api.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("[Test Kit API] Starting test...");

    // Test 1: Add a test subscriber with tags
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`[Test Kit API] Adding test subscriber: ${testEmail}`);

    const result = await addSubscriberWithTags(
      testEmail,
      ["signed-up", "test-subscriber"],
      "Test User"
    );

    console.log(`[Test Kit API] Subscriber added:`, result);

    // Test 2: Add another tag to the same subscriber
    console.log(`[Test Kit API] Adding another tag...`);
    await tagSubscriberByEmail(testEmail, "additional-tag");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Kit API test completed successfully",
        subscriberId: result.subscriberId,
        email: result.email,
        testsRun: [
          "✓ Add subscriber with initial tags",
          "✓ Tag existing subscriber",
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Test Kit API] Error:", error);

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
