import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";
import { encodeBase64Url } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log('direct-login called with email:', email);

    if (!email) {
      console.error('No email provided');
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

    // 1. Check Stripe for existing customer with active subscription
    let customerData: { id: string; email: string; name: string | null } | null = null;
    let subscriptionStatus: string | null = null;

    try {
      const customers = await stripe.customers.list({
        email: email.toLowerCase(),
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        customerData = {
          id: customer.id,
          email: customer.email ?? email,
          name: customer.name,
        };

        // Check for active or trialing subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          const trialingSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'trialing',
            limit: 1,
          });
          if (trialingSubscriptions.data.length > 0) {
            subscriptionStatus = trialingSubscriptions.data[0].status;
          }
        } else {
          subscriptionStatus = subscriptions.data[0].status;
        }
      }
    } catch (stripeError) {
      console.error('Error checking Stripe:', stripeError);
      return new Response(JSON.stringify({ error: 'Erro ao verificar assinatura. Tente novamente.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // If no active subscription found in Stripe, return error
    if (!subscriptionStatus || !['active', 'trialing'].includes(subscriptionStatus)) {
      console.error('No active subscription. Customer:', customerData, 'Status:', subscriptionStatus);
      return new Response(JSON.stringify({ error: 'Nenhuma assinatura ativa encontrada para este email.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // 2. Find or create user in Supabase
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;
    let isNewUser = false;

    if (user) {
      userId = user.id;
    } else {
      // Create user
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: {
          full_name: customerData?.name || 'Assinante Premium',
        },
      });
      if (createError) throw createError;
      if (!newUser) throw new Error('Failed to create user');
      user = newUser;
      userId = newUser.id;
      isNewUser = true;
    }

    // 3. Link Stripe customer to user
    if (customerData) {
      const { data: existingLink } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("stripe_customer_id", customerData.id)
        .maybeSingle();

      if (!existingLink) {
        await supabaseAdmin.from("customers").upsert({
          id: userId,
          stripe_customer_id: customerData.id
        });
      }
    }

    // 4. Sync subscription to local database
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerData?.id ?? '',
        status: 'active',
        limit: 1,
      });

      let subscription = subscriptions.data[0];

      if (!subscription) {
        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: customerData?.id ?? '',
          status: 'trialing',
          limit: 1,
        });
        subscription = trialingSubscriptions.data[0];
      }

      if (subscription) {
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
    } catch (syncError) {
      console.error('Error syncing subscription:', syncError);
      // Don't fail login if subscription sync fails
    }

    // 5. Update user metadata with Stripe info if available
    if (customerData?.name && user) {
      const currentMetadata = user.user_metadata || {};
      if (!currentMetadata.full_name || isNewUser) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          data: {
            ...currentMetadata,
            full_name: customerData.name,
          }
        });
      }
    }

    // 6. Generate a magic link and verify it immediately to get a session
    // This DOES NOT send an email to the user.
    const userEmail = user?.email ?? email.toLowerCase();
    console.log('Generating internal magic link for user:', userId, userEmail);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: { 
        // fallback to standard URL if PUBLIC_SITE_URL is missing
        redirectTo: Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co') || '' 
      }
    });

    if (linkError) {
      console.error('Error generating link:', linkError);
      throw linkError;
    }

    // Immediately verify the OTP token hash to create a session
    console.log('Verifying OTP token hash for instant login...');
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: linkData.properties.token_hash,
      type: 'magiclink',
    });

    if (sessionError) {
      console.error('Error verifying OTP:', sessionError);
      throw sessionError;
    }

    if (!sessionData.session) {
      throw new Error('Could not create session for user');
    }

    console.log('Login successful for user:', userEmail, 'isNewUser:', isNewUser);

    // Return the session tokens so frontend can log in immediately
    return new Response(JSON.stringify({
      success: true,
      isNewUser,
      user: sessionData.user,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error('direct-login error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Erro ao fazer login. Tente novamente.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
