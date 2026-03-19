import { supabase } from './supabase';

const PREMIUM_EMAIL_KEY = 'mystic_premium_email';

export function savePremiumEmail(email: string) {
  localStorage.setItem(PREMIUM_EMAIL_KEY, email.toLowerCase());
}

export function getSavedPremiumEmail(): string | null {
  return localStorage.getItem(PREMIUM_EMAIL_KEY);
}

export async function createCheckoutSession(priceId: string, customerEmail?: string, customerName?: string) {
  if (customerEmail) {
    savePremiumEmail(customerEmail);
  }
  
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
  
  let subscription = null;
  
  if (user) {
    subscription = await checkSubscriptionByUserId(user.id);
  }
  
  if (!subscription) {
    const savedEmail = getSavedPremiumEmail();
    if (savedEmail) {
      subscription = await checkSubscriptionByEmail(savedEmail);
    }
  }
  
  return subscription;
}

async function checkSubscriptionByUserId(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription by userId:', error);
  }

  return data;
}

async function checkSubscriptionByEmail(email: string) {
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error fetching users:', listError);
      return null;
    }
    
    const user = users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    
    if (user) {
      return await checkSubscriptionByUserId(user.id);
    }
  } catch (err) {
    console.error('Error in checkSubscriptionByEmail:', err);
  }
  
  return null;
}
