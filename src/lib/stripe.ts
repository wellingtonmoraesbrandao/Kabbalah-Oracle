import { supabase } from './supabase';

export async function createCheckoutSession(priceId: string, customerEmail?: string, customerName?: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { priceId, customerEmail, customerName },
  });

  if (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }

  if (data?.url) {
    window.location.href = data.url;
  }
}

export async function createPortalSession() {
  const { data, error } = await supabase.functions.invoke('create-portal');

  if (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }

  if (data?.url) {
    window.location.href = data.url;
  }
}

export async function getSubscription() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error);
  }

  return data;
}
