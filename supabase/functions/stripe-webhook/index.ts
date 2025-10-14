import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { addSubscriberWithTags, tagSubscriberByEmail } from "../_shared/kit-api.ts";

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

        // Get user email for Kit tagging
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("email, kit_subscriber_id")
          .eq("id", userId)
          .maybeSingle();

        if (userError || !userData) {
          console.error("Failed to fetch user data:", userError);
        }

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

        // Tag user as "player-mode" in Kit
        if (userData?.email) {
          try {
            console.log(`[Stripe Webhook] Tagging user in Kit as player-mode: ${userData.email}`);

            // If user doesn't have Kit subscriber ID yet, add them first
            if (!userData.kit_subscriber_id) {
              console.log("[Stripe Webhook] User not in Kit yet, adding with player-mode tag");
              const kitResult = await addSubscriberWithTags(
                userData.email,
                ["signed-up", "player-mode"]
              );

              // Update user with Kit subscriber ID
              await supabaseClient
                .from("users")
                .update({ kit_subscriber_id: kitResult.subscriberId })
                .eq("id", userId);
            } else {
              // User already in Kit, just tag them
              await tagSubscriberByEmail(userData.email, "player-mode");
            }

            console.log("[Stripe Webhook] Successfully tagged user as player-mode in Kit");
          } catch (kitError) {
            console.error("[Stripe Webhook] Failed to tag user in Kit:", kitError);
            // Don't fail the webhook - subscription was processed successfully
          }
        }

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

        // Get user email for Kit tagging
        const { data: cancelledUser, error: cancelledUserError } = await supabaseClient
          .from("users")
          .select("email, kit_subscriber_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (cancelledUserError) {
          console.error("Failed to fetch user for cancellation:", cancelledUserError);
        }

        await supabaseClient
          .from("users")
          .update({
            subscription_tier: "boyfriend",
            subscription_status: "canceled",
            stripe_subscription_id: null,
            subscription_plan_type: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        // Tag user as "cancelled" in Kit
        if (cancelledUser?.email) {
          try {
            console.log(`[Stripe Webhook] Tagging cancelled user in Kit: ${cancelledUser.email}`);

            // If user doesn't have Kit subscriber ID yet (edge case), add them first
            if (!cancelledUser.kit_subscriber_id) {
              console.log("[Stripe Webhook] User not in Kit yet, adding with cancelled tag");
              await addSubscriberWithTags(
                cancelledUser.email,
                ["signed-up", "cancelled"]
              );
            } else {
              // User already in Kit, just tag them
              await tagSubscriberByEmail(cancelledUser.email, "cancelled");
            }

            console.log("[Stripe Webhook] Successfully tagged user as cancelled in Kit");
          } catch (kitError) {
            console.error("[Stripe Webhook] Failed to tag cancelled user in Kit:", kitError);
            // Don't fail the webhook - cancellation was processed successfully
          }
        }

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