import { supabase, Subscription } from './supabase';
import { sendSubscriptionReminder } from './telegram';

export type UserWithPreferences = {
  user_id: string;
  telegram_chat_id: string | null;
  telegram_notifications: boolean;
  language: 'en' | 'id';
  display_name: string;
};

// Get subscriptions that need reminders today
export async function getSubscriptionsNeedingReminders(userId: string): Promise<Subscription[]> {
  const today = new Date();
  
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .not('next_billing_date', 'is', null);

  if (error || !subscriptions) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }

  // Filter subscriptions that match reminder_days
  return subscriptions.filter(sub => {
    if (!sub.next_billing_date || !sub.reminder_days?.length) return false;
    
    const billingDate = new Date(sub.next_billing_date);
    const daysUntilBilling = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return sub.reminder_days.includes(daysUntilBilling);
  });
}

// Send Telegram reminders for a user's subscriptions
export async function sendTelegramReminders(
  chatId: string,
  subscriptions: Subscription[],
  language: 'en' | 'id' = 'id'
): Promise<number> {
  let sentCount = 0;
  const today = new Date();

  for (const sub of subscriptions) {
    if (!sub.next_billing_date) continue;

    const billingDate = new Date(sub.next_billing_date);
    const daysUntilBilling = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const success = await sendSubscriptionReminder(chatId, {
      serviceName: sub.service_name,
      price: sub.price,
      currency: sub.currency,
      nextBillingDate: sub.next_billing_date,
      daysUntilBilling: Math.max(0, daysUntilBilling),
    }, language);

    if (success) sentCount++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return sentCount;
}

// Check and send reminders for current user
export async function checkAndSendReminders(userId: string): Promise<{ sent: number; error?: string }> {
  try {
    // Get user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('telegram_chat_id, telegram_notifications, language')
      .eq('user_id', userId)
      .single();

    if (prefsError || !prefs) {
      return { sent: 0, error: 'User preferences not found' };
    }

    if (!prefs.telegram_chat_id || !prefs.telegram_notifications) {
      return { sent: 0, error: 'Telegram not connected or notifications disabled' };
    }

    // Get subscriptions needing reminders
    const subscriptions = await getSubscriptionsNeedingReminders(userId);
    
    if (subscriptions.length === 0) {
      return { sent: 0 };
    }

    // Send reminders
    const sentCount = await sendTelegramReminders(
      prefs.telegram_chat_id,
      subscriptions,
      prefs.language || 'id'
    );

    return { sent: sentCount };
  } catch (error) {
    console.error('Error checking and sending reminders:', error);
    return { sent: 0, error: 'Failed to send reminders' };
  }
}
