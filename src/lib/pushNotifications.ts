// Push Notification Service for PWA
// Supports both Android (FCM) and iOS (APNs via Web Push)

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Check current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe with VAPID key
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    return {
      endpoint: json.endpoint!,
      keys: {
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      },
    };
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

// Show local notification (for testing and immediate notifications)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      ...options,
    });
  } catch (error) {
    // Fallback to regular notification
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      ...options,
    });
  }
}

// Schedule a reminder notification
export function scheduleReminderNotification(
  subscriptionName: string,
  daysUntilBilling: number,
  amount: string
): void {
  const title = `💰 ${subscriptionName} Reminder`;
  const body = daysUntilBilling === 0
    ? `Payment of ${amount} is due today!`
    : daysUntilBilling === 1
    ? `Payment of ${amount} is due tomorrow!`
    : `Payment of ${amount} is due in ${daysUntilBilling} days`;

  showLocalNotification(title, {
    body,
    tag: `reminder-${subscriptionName}`,
    renotify: true,
    requireInteraction: daysUntilBilling <= 1,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: {
      type: 'reminder',
      subscriptionName,
      daysUntilBilling,
    },
  });
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check and show due reminders
export async function checkAndShowReminders(
  subscriptions: Array<{
    service_name: string;
    next_billing_date: string;
    price: number;
    currency: string;
    reminder_days?: number[];
  }>,
  formatCurrency: (amount: number, currency: string) => string
): Promise<void> {
  if (getNotificationPermission() !== 'granted') return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const sub of subscriptions) {
    if (!sub.next_billing_date || !sub.reminder_days?.length) continue;

    const billingDate = new Date(sub.next_billing_date);
    billingDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil(
      (billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if today matches any reminder day
    if (sub.reminder_days.includes(daysUntil)) {
      const amount = formatCurrency(sub.price, sub.currency);
      scheduleReminderNotification(sub.service_name, daysUntil, amount);
    }
  }
}
