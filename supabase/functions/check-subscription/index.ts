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
        const { email } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? "", {
            apiVersion: "2023-10-16",
        });

        // Check Stripe for existing customer with active subscription
        const customers = await stripe.customers.list({
            email: email.toLowerCase(),
            limit: 1,
        });

        if (customers.data.length === 0) {
            return new Response(JSON.stringify({
                hasActiveSubscription: false,
                error: 'Nenhuma assinatura encontrada para este email.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const customer = customers.data[0];

        // Check for active or trialing subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1,
        });

        let subscriptionStatus = null;
        if (subscriptions.data.length > 0) {
            subscriptionStatus = subscriptions.data[0].status;
        } else {
            // Check trialing
            const trialingSubscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'trialing',
                limit: 1,
            });
            if (trialingSubscriptions.data.length > 0) {
                subscriptionStatus = trialingSubscriptions.data[0].status;
            }
        }

        const hasActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

        return new Response(JSON.stringify({
            hasActiveSubscription,
            customerId: customer.id,
            subscriptionStatus,
            error: hasActiveSubscription ? null : 'Assinatura não está ativa.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error('check-subscription error:', err);
        return new Response(JSON.stringify({
            error: err.message || 'Erro ao verificar assinatura.',
            hasActiveSubscription: false
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
