import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";
import { encodeBase64Url } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create a JWT access token for a user
async function createJWT(userId: string, userEmail: string): Promise<string> {
  const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') ?? '';

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    aud: 'authenticated',
    exp: now + 3600, // 1 hour
    iat: now,
    email: userEmail,
    role: 'authenticated',
    amr: [{ method: 'stripe', timestamp: now }],
  };

  const encodedHeader = encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = encodeBase64Url(new Uint8Array(signature));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Helper to create a refresh token
async function createRefreshToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    // Production site URL for redirects
    const productionUrl = "https://kabbalah-oraclel.vercel.app";

    if (!sessionId) {
      return Response.redirect(`${productionUrl}/?error=no_session_id`, 302);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email;
    const name = session.customer_details?.name;

    if (!email) {
      return Response.redirect(`${productionUrl}/?error=no_email`, 302);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Find user by email or create new one
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = users.find((u) => u.email === email);
    let userId: string;
    let isNewUser = false;

    if (!user) {
      // Create user with email confirmed
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: name || 'Assinante Premium',
        }
      });
      if (createError) throw createError;
      if (!newUser) throw new Error('Failed to create user');
      user = newUser;
      isNewUser = true;
    }

    userId = user.id;

    // 2. Link Stripe customer to user if not already linked
    if (session.customer && typeof session.customer === 'string') {
      const { data: existingLink } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("stripe_customer_id", session.customer)
        .maybeSingle();

      if (!existingLink) {
        await supabaseAdmin.from("customers").upsert({
          id: userId,
          stripe_customer_id: session.customer
        });
      }
    }

    // 3. Sync subscription if it exists
    if (session.subscription && typeof session.subscription === 'string') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
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
    }

    // 4. Generate JWT tokens
    const accessToken = await createJWT(userId, email);
    const refreshToken = await createRefreshToken();

    // 5. Redirect to app with tokens
    // Using URL parameters to pass tokens - the app will read them and call setSession
    const redirectUrl = new URL(productionUrl);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('refresh_token', refreshToken);
    redirectUrl.searchParams.set('email', email);
    if (isNewUser) {
      redirectUrl.searchParams.set('welcome', 'true');
    }

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (err: any) {
    console.error("Stripe Callback error:", err.message);
    const errorRedirectUrl = `https://kabbalah-oraclel.vercel.app/?error=callback_failed&message=${encodeURIComponent(err.message)}`;
    return Response.redirect(errorRedirectUrl, 302);
  }
});
