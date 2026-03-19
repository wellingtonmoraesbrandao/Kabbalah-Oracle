import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    // Fetch all active products
    const products = await stripe.products.list({ active: true });
    
    // Fetch all active prices
    const prices = await stripe.prices.list({ active: true });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert products
    for (const product of products.data) {
      await supabaseAdmin.from("products").upsert({
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description ?? null,
        image: product.images?.[0] ?? null,
        metadata: product.metadata,
      });
    }

    // Insert prices
    for (const price of prices.data) {
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
    }

    return new Response(JSON.stringify({ 
      success: true, 
      productsCount: products.data.length,
      pricesCount: prices.data.length 
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
