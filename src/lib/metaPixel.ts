/**
 * Meta Pixel (Facebook Pixel) Service
 * 
 * Provides functions to track custom events for the Meta Pixel.
 * Pixel ID: 2523532344715444
 */

// Declare fbq function globally
declare global {
    interface Window {
        fbq: any;
    }
}

/**
 * Track a custom event with the Meta Pixel
 * @param eventName - The name of the event (e.g., 'Lead', 'Purchase', 'InitiateCheckout')
 * @param params - Optional parameters for the event
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, params);
        console.log(`[Meta Pixel] Event tracked: ${eventName}`, params);
    } else {
        console.warn('[Meta Pixel] fbq not available');
    }
}

/**
 * Track a Lead event - when user signs up or logs in
 * @param params - Optional parameters (email, etc.)
 */
export function trackLead(params?: Record<string, any>): void {
    trackEvent('Lead', params);
}

/**
 * Track an InitiateCheckout event - when user starts a subscription
 * @param params - Contains value, currency, plan name, etc.
 */
export function trackInitiateCheckout(params: {
    value?: number;
    currency?: string;
    plan_name?: string;
    price_id?: string;
}): void {
    trackEvent('InitiateCheckout', {
        currency: 'BRL',
        value: params.value || 0,
        ...params,
    });
}

/**
 * Track a Purchase event - when subscription is completed
 * @param params - Contains value, currency, subscription details
 */
export function trackPurchase(params: {
    value: number;
    currency?: string;
    plan_name?: string;
    subscription_id?: string;
    customer_email?: string;
}): void {
    trackEvent('Purchase', {
        currency: 'BRL',
        value: params.value,
        ...params,
    });
}

/**
 * Track a ViewContent event - when user views subscription plans
 */
export function trackViewContent(params?: Record<string, any>): void {
    trackEvent('ViewContent', params);
}

/**
 * Track a CompleteRegistration event - when user completes registration
 */
export function trackCompleteRegistration(params?: Record<string, any>): void {
    trackEvent('CompleteRegistration', params);
}
