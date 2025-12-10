// Telegram Bot Integration
// Bot: @HadesnoteBot

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'HadesnoteBot';

export const TELEGRAM_BOT_LINK = `https://t.me/${TELEGRAM_BOT_USERNAME}`;

// Generate deep link for auto-connect (user_id passed to bot via start parameter)
export function getTelegramDeepLink(userId: string): string {
  // Telegram deep link format: https://t.me/BotUsername?start=PARAMETER
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${userId}`;
}

export type TelegramMessage = {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
};

export type SubscriptionReminder = {
  serviceName: string;
  price: number;
  currency: string;
  nextBillingDate: string;
  daysUntilBilling: number;
};

// Send message via Telegram Bot API
export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

// Generate verification code
export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Send verification code to user
export async function sendVerificationCode(chatId: string, code: string): Promise<boolean> {
  const message = `🔐 *Kode Verifikasi Subscription Tracker*\n\nKode verifikasi Anda: \`${code}\`\n\nMasukkan kode ini di aplikasi untuk menghubungkan akun Telegram Anda.\n\n_Kode ini berlaku selama 10 menit._`;
  
  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  });
}

// Send subscription reminder
export async function sendSubscriptionReminder(
  chatId: string,
  reminder: SubscriptionReminder,
  language: 'en' | 'id' = 'id'
): Promise<boolean> {
  const messages = {
    en: {
      title: '🔔 Subscription Reminder',
      service: 'Service',
      amount: 'Amount',
      dueDate: 'Due Date',
      daysLeft: 'Days Left',
      footer: 'Open app to manage your subscriptions',
    },
    id: {
      title: '🔔 Pengingat Langganan',
      service: 'Layanan',
      amount: 'Jumlah',
      dueDate: 'Tanggal Jatuh Tempo',
      daysLeft: 'Hari Tersisa',
      footer: 'Buka aplikasi untuk mengelola langganan Anda',
    },
  };

  const t = messages[language];
  const daysText = reminder.daysUntilBilling === 0 
    ? (language === 'id' ? 'Hari ini!' : 'Today!') 
    : `${reminder.daysUntilBilling} ${language === 'id' ? 'hari' : 'days'}`;

  const message = `${t.title}\n\n📌 *${t.service}:* ${reminder.serviceName}\n💰 *${t.amount}:* ${reminder.currency} ${reminder.price.toLocaleString()}\n📅 *${t.dueDate}:* ${reminder.nextBillingDate}\n⏰ *${t.daysLeft}:* ${daysText}\n\n_${t.footer}_`;

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  });
}

// Send welcome message after successful connection
export async function sendWelcomeMessage(chatId: string, displayName: string, language: 'en' | 'id' = 'id'): Promise<boolean> {
  const messages = {
    en: {
      title: '✅ Successfully Connected!',
      greeting: `Hello ${displayName}!`,
      body: 'Your Telegram account is now connected to Subscription Tracker.',
      features: 'You will receive:\n• Subscription renewal reminders\n• Billing date notifications\n• Important updates',
      footer: 'Manage notification settings in the app.',
    },
    id: {
      title: '✅ Berhasil Terhubung!',
      greeting: `Halo ${displayName}!`,
      body: 'Akun Telegram Anda sekarang terhubung dengan Subscription Tracker.',
      features: 'Anda akan menerima:\n• Pengingat perpanjangan langganan\n• Notifikasi tanggal tagihan\n• Update penting',
      footer: 'Kelola pengaturan notifikasi di aplikasi.',
    },
  };

  const t = messages[language];
  const message = `${t.title}\n\n${t.greeting}\n\n${t.body}\n\n${t.features}\n\n_${t.footer}_`;

  return sendTelegramMessage({
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  });
}

// Test connection by sending a test message
export async function sendTestMessage(chatId: string, language: 'en' | 'id' = 'id'): Promise<boolean> {
  const messages = {
    en: '🧪 *Test Message*\n\nThis is a test notification from Subscription Tracker.\n\nIf you received this message, your Telegram notifications are working correctly! ✅',
    id: '🧪 *Pesan Tes*\n\nIni adalah notifikasi tes dari Subscription Tracker.\n\nJika Anda menerima pesan ini, notifikasi Telegram Anda berfungsi dengan baik! ✅',
  };

  return sendTelegramMessage({
    chat_id: chatId,
    text: messages[language],
    parse_mode: 'Markdown',
  });
}
