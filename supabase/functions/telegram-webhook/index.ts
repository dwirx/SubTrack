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

// Handle /start command
async function handleStartCommand(chatId: number, userId: string | null, firstName: string) {
  if (userId) {
    // User came from app with user_id parameter - auto connect
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
        `❌ *Gagal Menghubungkan*\n\nTerjadi kesalahan saat menghubungkan akun. Silakan coba lagi.\n\nError: ${error.message}`
      );
      return;
    }

    await sendTelegramMessage(chatId,
      `✅ *Berhasil Terhubung!*\n\nHalo ${firstName}! 👋\n\nAkun Telegram Anda sekarang terhubung dengan Subscription Tracker.\n\n*Anda akan menerima:*\n• 🔔 Pengingat perpanjangan langganan\n• 📅 Notifikasi tanggal tagihan\n• 📢 Update penting\n\n_Kelola pengaturan notifikasi di aplikasi._`
    );
  } else {
    // User started bot directly without app link
    await sendTelegramMessage(chatId,
      `👋 *Selamat Datang di Subscription Tracker Bot!*\n\nBot ini akan mengirimkan notifikasi pengingat langganan Anda.\n\n*Cara Menghubungkan:*\n1️⃣ Buka aplikasi Subscription Tracker\n2️⃣ Pergi ke *Profil Saya*\n3️⃣ Klik *Hubungkan Telegram*\n4️⃣ Masukkan Chat ID Anda: \`${chatId}\`\n\n_Atau klik tombol "Hubungkan Telegram" di aplikasi untuk koneksi otomatis._`
    );
  }
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
      `❌ *Akun Tidak Terhubung*\n\nTelegram Anda belum terhubung dengan Subscription Tracker.\n\nChat ID Anda: \`${chatId}\`\n\nMasukkan Chat ID ini di aplikasi untuk menghubungkan.`
    );
    return;
  }

  const connectedDate = data.telegram_connected_at 
    ? new Date(data.telegram_connected_at).toLocaleDateString('id-ID')
    : '-';

  await sendTelegramMessage(chatId,
    `✅ *Status Akun*\n\n👤 Nama: ${data.display_name || 'User'}\n🔔 Notifikasi: ${data.telegram_notifications ? 'Aktif ✅' : 'Nonaktif ❌'}\n📅 Terhubung sejak: ${connectedDate}\n\n_Kelola pengaturan di aplikasi Subscription Tracker._`
  );
}

// Handle /help command
async function handleHelpCommand(chatId: number) {
  await sendTelegramMessage(chatId,
    `📚 *Bantuan Subscription Tracker Bot*\n\n*Perintah yang tersedia:*\n/start - Mulai dan lihat info koneksi\n/status - Cek status koneksi akun\n/help - Tampilkan bantuan ini\n/chatid - Lihat Chat ID Anda\n\n*Tentang Bot:*\nBot ini mengirimkan pengingat langganan dari aplikasi Subscription Tracker.\n\n*Butuh bantuan?*\nHubungi support di aplikasi.`
  );
}

// Handle /chatid command
async function handleChatIdCommand(chatId: number) {
  await sendTelegramMessage(chatId,
    `🆔 *Chat ID Anda*\n\n\`${chatId}\`\n\nSalin dan tempel Chat ID ini di aplikasi Subscription Tracker untuk menghubungkan akun Telegram Anda.`
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
    await sendTelegramMessage(chatId, `❌ Gagal memutuskan koneksi. Silakan coba lagi.`);
    return;
  }

  await sendTelegramMessage(chatId,
    `✅ *Koneksi Diputus*\n\nAkun Telegram Anda telah diputus dari Subscription Tracker.\n\nAnda tidak akan menerima notifikasi lagi.\n\nUntuk menghubungkan kembali, gunakan /start atau hubungkan dari aplikasi.`
  );
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Parse command and parameters
    const [command, ...params] = text.split(' ');
    const param = params.join(' ');

    switch (command.toLowerCase()) {
      case '/start':
        // Check if there's a user_id parameter (deep link from app)
        await handleStartCommand(chatId, param || null, firstName);
        break;
      case '/status':
        await handleStatusCommand(chatId);
        break;
      case '/help':
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
        // Unknown command - show help
        if (text.startsWith('/')) {
          await sendTelegramMessage(chatId,
            `❓ Perintah tidak dikenal.\n\nKetik /help untuk melihat daftar perintah yang tersedia.`
          );
        } else {
          await sendTelegramMessage(chatId,
            `👋 Halo! Saya bot Subscription Tracker.\n\nKetik /help untuk melihat perintah yang tersedia.`
          );
        }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
