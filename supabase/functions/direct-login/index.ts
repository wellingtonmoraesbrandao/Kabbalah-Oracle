import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? "", {
      apiVersion: "2023-10-16",
    });

    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    let userExists = users.some(u => u.email === email);

    let supabaseUserId: string | null = null;

    if (userExists) {
      supabaseUserId = users.find(u => u.email === email)?.id ?? null;
    } else {
      // Create user automatically to guarantee direct login
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) throw createError;
      supabaseUserId = newUser?.id ?? null;
    }

    // Check for existing Stripe subscription and sync if found
    if (supabaseUserId && email) {
      try {
        // Search for customer by email in Stripe
        const customers = await stripe.customers.list({
          email: email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];

          // Link customer to user if not already linked
          const { data: existingLink } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("stripe_customer_id", customer.id)
            .maybeSingle();

          if (!existingLink) {
            await supabaseAdmin.from("customers").upsert({
              id: supabaseUserId,
              stripe_customer_id: customer.id
            });
          }

          // Check for active subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1,
          });

          // If no active subscription, check for trialing
          if (subscriptions.data.length === 0) {
            const trialingSubscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'trialing',
              limit: 1,
            });

            if (trialingSubscriptions.data.length > 0) {
              await syncSubscriptionToDb(supabaseAdmin, supabaseUserId, trialingSubscriptions.data[0]);
            }
          } else {
            await syncSubscriptionToDb(supabaseAdmin, supabaseUserId, subscriptions.data[0]);
          }
        }
      } catch (stripeError) {
        // Log but don't fail the login if Stripe sync fails
        console.error('Error syncing Stripe subscription:', stripeError);
      }
    }

    // Generate the magic link (action link logs the user in when visited)
    // Use production URL to ensure redirects go to the correct site, not localhost
    const productionUrl = 'https://kabbalah-oraclel.vercel.app';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: { redirectTo: redirectTo || productionUrl }
    });

    if (linkError) throw linkError;

    return new Response(JSON.stringify({ url: linkData.properties.action_link }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function syncSubscriptionToDb(supabaseAdmin: any, userId: string, subscription: any) {
  try {
    await supabaseAdmin.from("subscriptions").upsert({
      id: subscription.id,
      user_id: userId,
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
  } catch (err) {
    console.error('Error syncing subscription to DB:', err);
  }
}
