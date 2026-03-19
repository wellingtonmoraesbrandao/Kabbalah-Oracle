import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2023-10-16",
  });

  const body = await req.text();
  console.log(`Webhook received. Body length: ${body.length}, Secret present: ${!!webhookSecret}`);
  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (event.type) {
      case "product.created":
      case "product.updated": {
        const product = event.data.object;
        await supabaseAdmin.from("products").upsert({
          id: product.id,
          active: product.active,
          name: product.name,
          description: product.description ?? null,
          image: product.images?.[0] ?? null,
          metadata: product.metadata,
        });
        break;
      }
      case "price.created":
      case "price.updated": {
        const price = event.data.object;
        await supabaseAdmin.from("prices").upsert({
          id: price.id,
          product_id: price.product,
          active: price.active,
          currency: price.currency,
          type: price.type,
          unit_amount: price.unit_amount ?? null,
          interval: price.recurring?.interval ?? null,
          interval_count: price.recurring?.interval_count ?? null,
          metadata: price.metadata,
        });
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription") {
          const subscriptionId = session.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerEmail = session.customer_details?.email;
          const customerName = session.customer_details?.name;

          let supabaseUserId = null;

          // 1. Check if we already have this Stripe customer linked
          const { data: customerData } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("stripe_customer_id", session.customer)
            .maybeSingle();

          if (customerData) {
            supabaseUserId = customerData.id;
          } else if (customerEmail) {
            // 2. If not linked, check if user exists by email
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (listError) throw listError;
            
            const existingUser = users.find(u => u.email === customerEmail);
            
            if (existingUser) {
              supabaseUserId = existingUser.id;
            } else {
              // 3. Create a new user and invite them (sends magic link)
              const { data: { user: newUser }, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(customerEmail, {
                data: { full_name: customerName }
              });
              if (inviteError) throw inviteError;
              supabaseUserId = newUser.id;
            }

            // 4. Link the user to the Stripe customer
            await supabaseAdmin.from("customers").upsert({
              id: supabaseUserId,
              stripe_customer_id: session.customer
            });
          }

          if (supabaseUserId) {
            await supabaseAdmin.from("subscriptions").upsert({
              id: subscription.id,
              user_id: supabaseUserId,
              metadata: subscription.metadata,
              status: subscription.status,
              price_id: subscription.items.data[0].price.id,
              quantity: subscription.items.data[0].quantity,
              cancel_at_period_end: subscription.cancel_at_period_end,
              cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              created: new Date(subscription.created * 1000).toISOString(),
              ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
              trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            });
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { data: customerData } = await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (customerData) {
          await supabaseAdmin.from("subscriptions").upsert({
            id: subscription.id,
            user_id: customerData.id,
            metadata: subscription.metadata,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
