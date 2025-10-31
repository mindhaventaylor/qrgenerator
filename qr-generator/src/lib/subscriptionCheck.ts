import { supabase } from './supabase';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: any | null;
  canCreateQR: boolean;
  message?: string;
}

/**
 * Checks if user has an active paid subscription
 * Returns true only if status is 'active' - no trial periods
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('Error checking subscription:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        canCreateQR: false,
        message: 'Unable to verify subscription status'
      };
    }

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        subscription: null,
        canCreateQR: false,
        message: 'No subscription found. Please subscribe to create QR codes.'
      };
    }

    // Check if subscription is active (paid) - no trials allowed
    const isActive = subscription.status === 'active';
    const isExpired = subscription.status === 'expired' || subscription.status === 'cancelled';
    
    // No trial periods - only active subscriptions can create QR codes
    const canCreate = isActive;

    let message = '';
    if (!canCreate) {
      if (isExpired) {
        message = 'Your subscription has expired. Please renew to continue creating QR codes.';
      } else {
        message = 'Please subscribe to create QR codes. Only $5/month - no hidden fees, no scams, no trials.';
      }
    }

    return {
      hasActiveSubscription: isActive,
      subscription,
      canCreateQR: canCreate,
      message
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      hasActiveSubscription: false,
      subscription: null,
      canCreateQR: false,
      message: 'Error checking subscription status'
    };
  }
}

