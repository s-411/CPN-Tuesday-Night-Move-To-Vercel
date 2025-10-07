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
      console.error('STRIPE_SECRET_KEY environment variable is not set');
      throw new Error("Stripe is not configured on the server");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-10-28.acacia",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { priceId, planType } = await req.json();

    if (!priceId) {
      console.error('Missing priceId in request body');
      throw new Error("Missing priceId - Stripe product configuration is incomplete");
    }

    if (!planType) {
      console.error('Missing planType in request body');
      throw new Error("Missing planType - Plan type (weekly/annual) must be specified");
    }

    const { data: userData } = await supabaseClient
      .from("users")
      .select("email, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabaseClient
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}?page=subscription-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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