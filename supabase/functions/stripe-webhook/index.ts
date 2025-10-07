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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-10-28.acacia",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No signature");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planType = session.metadata?.plan_type;

        if (!userId || !planType) {
          console.error("Missing metadata in checkout session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await supabaseClient
          .from("users")
          .update({
            subscription_tier: "player",
            subscription_status: "active",
            subscription_plan_type: planType,
            stripe_subscription_id: subscription.id,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          const { data: customer } = await supabaseClient
            .from("users")
            .select("id")
            .eq("stripe_customer_id", subscription.customer)
            .maybeSingle();

          if (!customer) {
            console.error("User not found for subscription update");
            break;
          }
        }

        const updateData: any = {
          subscription_status: subscription.status,
          subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        if (subscription.status === "active") {
          updateData.subscription_tier = "player";
        } else if (["canceled", "unpaid", "past_due"].includes(subscription.status)) {
          updateData.subscription_tier = "boyfriend";
        }

        await supabaseClient
          .from("users")
          .update(updateData)
          .eq("stripe_subscription_id", subscription.id);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabaseClient
          .from("users")
          .update({
            subscription_tier: "boyfriend",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            subscription_plan_type: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await supabaseClient
            .from("users")
            .update({
              subscription_status: "past_due",
            })
            .eq("stripe_subscription_id", invoice.subscription);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
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