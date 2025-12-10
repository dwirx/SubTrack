// Supabase Edge Function: Telegram Webhook Handler
// This function receives updates from Telegram Bot and processes them

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

interface Subscription {
  id: string;
  service_name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  next_billing_date: string | null;
  status: string;
  category: string;
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  if (currency === 'IDR') {
    return `Rp${amount.toLocaleString('id-ID')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Calculate days until date
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Format date to Indonesian format
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Get category emoji
function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    'Entertainment': '🎬',
    'Productivity': '📝',
    'Cloud': '☁️',
    'Gaming': '🎮',
    'Reading': '📚',
    'Fitness': '🏃',
    'Domain': '🌐',
    'Other': '📦',
  };
  return emojis[category] || '📦';
}



// Send message to Telegram
async function sendTelegramMessage(chatId: number | string, text: string, parseMode = 'Markdown') {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return response.json();
}

// Get user_id from chat_id
async function getUserIdFromChatId(chatId: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('user_id')
    .eq('telegram_chat_id', chatId.toString())
    .single();

  if (error || !data) return null;
  return data.user_id;
}

// Handle /start command
async function handleStartCommand(chatId: number, userId: string | null, firstName: string) {
  if (userId) {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        telegram_chat_id: chatId.toString(),
        telegram_notifications: true,
        telegram_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error connecting Telegram:', error);
      await sendTelegramMessage(chatId, 
        `❌ *Gagal Menghubungkan*\n\nTerjadi kesalahan. Silakan coba lagi.`
      );
      return;
    }

    await sendTelegramMessage(chatId,
      `✅ *Berhasil Terhubung!*\n\nHalo ${firstName}! 👋\n\nAkun Telegram Anda sekarang terhubung.\n\n*Perintah tersedia:*\n/list - Lihat semua langganan\n/upcoming - Langganan yang akan jatuh tempo\n/summary - Ringkasan pengeluaran\n/help - Bantuan\n\n_Ketik /list untuk melihat langganan Anda._`
    );
  } else {
    await sendTelegramMessage(chatId,
      `👋 *Selamat Datang!*\n\nBot Subscription Tracker.\n\n*Cara Menghubungkan:*\n1️⃣ Buka aplikasi Subscription Tracker\n2️⃣ Pergi ke *Profil Saya*\n3️⃣ Klik *Hubungkan Telegram*\n4️⃣ Masukkan Chat ID: \`${chatId}\`\n\n_Atau klik tombol "Hubungkan Telegram" di aplikasi._`
    );
  }
}

// Handle /list command - Show all subscriptions
async function handleListCommand(chatId: number) {
  const userId = await getUserIdFromChatId(chatId);
  
  if (!userId) {
    await sendTelegramMessage(chatId,
      `❌ *Akun Tidak Terhubung*\n\nHubungkan akun Anda terlebih dahulu.\nChat ID: \`${chatId}\``
    );
    return;
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('next_billing_date', { ascending: true });

  if (error) {
    await sendTelegramMessage(chatId, `❌ Gagal mengambil data langganan.`);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    await sendTelegramMessage(chatId,
      `📭 *Tidak Ada Langganan*\n\nAnda belum memiliki langganan aktif.\n\nTambahkan langganan di aplikasi Subscription Tracker.`
    );
    return;
  }

  let message = `📋 *Daftar Langganan Aktif*\n\n`;
  
  subscriptions.forEach((sub: Subscription, index: number) => {
    const emoji = getCategoryEmoji(sub.category);
    const days = sub.next_billing_date ? daysUntil(sub.next_billing_date) : null;
    const dateStr = sub.next_billing_date ? formatDate(sub.next_billing_date) : '-';
    
    let daysText = '';
    if (days !== null) {
      if (days < 0) {
        daysText = `⚠️ _${Math.abs(days)} hari lalu_`;
      } else if (days === 0) {
        daysText = `🔴 _Hari ini!_`;
      } else if (days <= 7) {
        daysText = `🟡 _${days} hari lagi_`;
      } else {
        daysText = `🟢 _${days} hari lagi_`;
      }
    }

    message += `${index + 1}. ${emoji} *${sub.service_name}*\n`;
    message += `   💰 ${formatCurrency(sub.price, sub.currency)}/${sub.billing_cycle === 'monthly' ? 'bln' : sub.billing_cycle === 'yearly' ? 'thn' : 'x'}\n`;
    message += `   📅 ${dateStr} ${daysText}\n\n`;
  });

  message += `_Total: ${subscriptions.length} langganan aktif_`;

  await sendTelegramMessage(chatId, message);
}

// Handle /upcoming command - Show subscriptions due soon
async function handleUpcomingCommand(chatId: number) {
  const userId = await getUserIdFromChatId(chatId);
  
  if (!userId) {
    await sendTelegramMessage(chatId,
      `❌ *Akun Tidak Terhubung*\n\nHubungkan akun Anda terlebih dahulu.\nChat ID: \`${chatId}\``
    );
    return;
  }

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .not('next_billing_date', 'is', null)
    .lte('next_billing_date', nextWeek.toISOString().split('T')[0])
    .order('next_billing_date', { ascending: true });

  if (error) {
    await sendTelegramMessage(chatId, `❌ Gagal mengambil data.`);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    await sendTelegramMessage(chatId,
      `✨ *Tidak Ada Tagihan Minggu Ini*\n\nTidak ada langganan yang jatuh tempo dalam 7 hari ke depan.\n\nKetik /list untuk melihat semua langganan.`
    );
    return;
  }

  let message = `⏰ *Tagihan Mendatang (7 Hari)*\n\n`;
  let totalAmount = 0;

  subscriptions.forEach((sub: Subscription, index: number) => {
    const emoji = getCategoryEmoji(sub.category);
    const days = sub.next_billing_date ? daysUntil(sub.next_billing_date) : 0;
    const dateStr = sub.next_billing_date ? formatDate(sub.next_billing_date) : '-';
    
    let urgency = '';
    if (days < 0) {
      urgency = '⚠️ TERLAMBAT';
    } else if (days === 0) {
      urgency = '🔴 HARI INI';
    } else if (days === 1) {
      urgency = '🟠 BESOK';
    } else {
      urgency = `🟡 ${days} hari`;
    }

    message += `${index + 1}. ${emoji} *${sub.service_name}*\n`;
    message += `   💰 ${formatCurrency(sub.price, sub.currency)}\n`;
    message += `   📅 ${dateStr} - ${urgency}\n\n`;
    
    totalAmount += sub.price;
  });

  message += `━━━━━━━━━━━━━━━\n`;
  message += `💵 *Total: ${formatCurrency(totalAmount, subscriptions[0]?.currency || 'IDR')}*\n`;
  message += `\n_${subscriptions.length} tagihan dalam 7 hari_`;

  await sendTelegramMessage(chatId, message);
}

// Handle /summary command - Show spending summary
async function handleSummaryCommand(chatId: number) {
  const userId = await getUserIdFromChatId(chatId);
  
  if (!userId) {
    await sendTelegramMessage(chatId,
      `❌ *Akun Tidak Terhubung*\n\nHubungkan akun Anda terlebih dahulu.\nChat ID: \`${chatId}\``
    );
    return;
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    await sendTelegramMessage(chatId, `❌ Gagal mengambil data.`);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    await sendTelegramMessage(chatId,
      `📭 *Tidak Ada Langganan*\n\nAnda belum memiliki langganan aktif.`
    );
    return;
  }

  // Calculate totals
  let monthlyTotal = 0;
  let yearlyTotal = 0;
  const byCategory: Record<string, number> = {};

  subscriptions.forEach((sub: Subscription) => {
    let monthlyAmount = sub.price;
    if (sub.billing_cycle === 'yearly') {
      monthlyAmount = sub.price / 12;
    }
    
    monthlyTotal += monthlyAmount;
    yearlyTotal += monthlyAmount * 12;

    if (!byCategory[sub.category]) {
      byCategory[sub.category] = 0;
    }
    byCategory[sub.category] += monthlyAmount;
  });

  // Sort categories by amount
  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1]);

  let message = `📊 *Ringkasan Pengeluaran*\n\n`;
  message += `💰 *Total Bulanan:* ${formatCurrency(Math.round(monthlyTotal), 'IDR')}\n`;
  message += `💰 *Total Tahunan:* ${formatCurrency(Math.round(yearlyTotal), 'IDR')}\n`;
  message += `📦 *Jumlah Langganan:* ${subscriptions.length}\n\n`;
  
  message += `*Per Kategori:*\n`;
  sortedCategories.forEach(([category, amount]) => {
    const emoji = getCategoryEmoji(category);
    const percentage = Math.round((amount / monthlyTotal) * 100);
    message += `${emoji} ${category}: ${formatCurrency(Math.round(amount), 'IDR')}/bln (${percentage}%)\n`;
  });

  message += `\n_Ketik /list untuk detail langganan_`;

  await sendTelegramMessage(chatId, message);
}

// Handle /status command
async function handleStatusCommand(chatId: number) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('display_name, telegram_notifications, telegram_connected_at')
    .eq('telegram_chat_id', chatId.toString())
    .single();

  if (error || !data) {
    await sendTelegramMessage(chatId,
      `❌ *Akun Tidak Terhubung*\n\nChat ID: \`${chatId}\`\n\nMasukkan Chat ID ini di aplikasi.`
    );
    return;
  }

  const connectedDate = data.telegram_connected_at 
    ? new Date(data.telegram_connected_at).toLocaleDateString('id-ID')
    : '-';

  await sendTelegramMessage(chatId,
    `✅ *Status Akun*\n\n👤 Nama: ${data.display_name || 'User'}\n🔔 Notifikasi: ${data.telegram_notifications ? 'Aktif ✅' : 'Nonaktif ❌'}\n📅 Terhubung: ${connectedDate}`
  );
}

// Handle /help command
async function handleHelpCommand(chatId: number) {
  await sendTelegramMessage(chatId,
    `📚 *Bantuan Bot*\n\n*Perintah Utama:*\n/list - 📋 Lihat semua langganan\n/upcoming - ⏰ Tagihan 7 hari ke depan\n/summary - 📊 Ringkasan pengeluaran\n\n*Perintah Lainnya:*\n/status - Cek status koneksi\n/chatid - Lihat Chat ID\n/disconnect - Putuskan koneksi\n/help - Tampilkan bantuan\n\n*Tips:*\n• Gunakan /upcoming untuk cek tagihan terdekat\n• Gunakan /summary untuk lihat total pengeluaran`
  );
}

// Handle /chatid command
async function handleChatIdCommand(chatId: number) {
  await sendTelegramMessage(chatId,
    `🆔 *Chat ID Anda*\n\n\`${chatId}\`\n\nSalin Chat ID ini untuk menghubungkan akun.`
  );
}

// Handle /disconnect command
async function handleDisconnectCommand(chatId: number) {
  const { error } = await supabase
    .from('user_preferences')
    .update({
      telegram_chat_id: null,
      telegram_notifications: false,
      telegram_connected_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('telegram_chat_id', chatId.toString());

  if (error) {
    await sendTelegramMessage(chatId, `❌ Gagal memutuskan koneksi.`);
    return;
  }

  await sendTelegramMessage(chatId,
    `✅ *Koneksi Diputus*\n\nAnda tidak akan menerima notifikasi lagi.\n\nGunakan /start untuk menghubungkan kembali.`
  );
}

// Main handler
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (!update.message?.text) {
      return new Response('OK', { status: 200 });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;
    const firstName = update.message.from.first_name;

    const [command, ...params] = text.split(' ');
    const param = params.join(' ');

    switch (command.toLowerCase()) {
      case '/start':
        await handleStartCommand(chatId, param || null, firstName);
        break;
      case '/list':
      case '/langganan':
      case '/subs':
        await handleListCommand(chatId);
        break;
      case '/upcoming':
      case '/tagihan':
      case '/due':
        await handleUpcomingCommand(chatId);
        break;
      case '/summary':
      case '/ringkasan':
      case '/total':
        await handleSummaryCommand(chatId);
        break;
      case '/status':
        await handleStatusCommand(chatId);
        break;
      case '/help':
      case '/bantuan':
        await handleHelpCommand(chatId);
        break;
      case '/chatid':
      case '/id':
        await handleChatIdCommand(chatId);
        break;
      case '/disconnect':
      case '/putus':
        await handleDisconnectCommand(chatId);
        break;
      default:
        if (text.startsWith('/')) {
          await sendTelegramMessage(chatId,
            `❓ Perintah tidak dikenal.\n\nKetik /help untuk bantuan.`
          );
        } else {
          await sendTelegramMessage(chatId,
            `👋 Halo! Ketik /help untuk melihat perintah.`
          );
        }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
