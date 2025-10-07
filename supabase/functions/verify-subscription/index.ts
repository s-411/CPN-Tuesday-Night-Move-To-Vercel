import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-10-28.acacia",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      throw new Error("Missing session_id parameter");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error("Invalid session_id");
    }

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({
          success: false,
          status: "pending",
          message: "Payment not completed",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = session.metadata?.supabase_user_id;
    const planType = session.metadata?.plan_type;

    if (!userId || !planType) {
      throw new Error("Missing metadata in session");
    }

    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const { data: currentUser } = await supabaseClient
        .from("users")
        .select("subscription_tier, stripe_subscription_id")
        .eq("id", userId)
        .maybeSingle();

      const needsUpdate =
        !currentUser ||
        currentUser.subscription_tier !== "player" ||
        currentUser.stripe_subscription_id !== subscription.id;

      if (needsUpdate) {
        const { error: updateError } = await supabaseClient
          .from("users")
          .update({
            subscription_tier: "player",
            subscription_status: subscription.status,
            subscription_plan_type: planType,
            stripe_subscription_id: subscription.id,
            subscription_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            subscription_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            has_seen_paywall: true,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating user:", updateError);
          throw updateError;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "active",
          subscription: {
            tier: "player",
            planType: planType,
            status: subscription.status,
            periodStart: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            periodEnd: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          },
          synced: needsUpdate,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        status: "no_subscription",
        message: "No subscription found in session",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
