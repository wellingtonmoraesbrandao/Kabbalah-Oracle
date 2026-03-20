import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );

    let user = null;
    if (authHeader) {
      const { data: { user: authedUser } } = await supabaseClient.auth.getUser();
      user = authedUser;
    }

    const { priceId, customerEmail, customerName } = await req.json();
    if (!priceId) {
      throw new Error("priceId is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    let stripeCustomerId = null;

    if (user) {
      const { data: customerData } = await supabaseClient
        .from("customers")
        .select("stripe_customer_id")
        .single();

      stripeCustomerId = customerData?.stripe_customer_id;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.full_name,
          metadata: { supabaseUUID: user.id },
        });
        stripeCustomerId = customer.id;
        await supabaseClient.from("customers").insert({ id: user.id, stripe_customer_id: stripeCustomerId });
      }
    }

    // Production site URL for redirects
    const productionUrl = "https://kabbalah-oraclel.vercel.app";

    const sessionOptions: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${productionUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${productionUrl}/?checkout=cancelled`,
      allow_promotion_codes: true,
    };

    if (stripeCustomerId) {
      sessionOptions.customer = stripeCustomerId;
    } else {
      if (customerEmail) sessionOptions.customer_email = customerEmail;
      // Note: customerName isn't directly supported in session options as a top-level but we can pass it via customer_details if needed 
      // but customer_email is usually enough for guest.
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
