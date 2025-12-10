/**
 * Script to setup Telegram Bot Webhook
 * 
 * Usage:
 * 1. Set environment variables or edit values below
 * 2. Run: npx ts-node scripts/setup-telegram-webhook.ts
 * 
 * Or run directly with Deno:
 * deno run --allow-net scripts/setup-telegram-webhook.ts
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN environment variable.');
}

if (!SUPABASE_PROJECT_REF) {
  throw new Error('Missing SUPABASE_PROJECT_REF environment variable.');
}

// Webhook URL - Supabase Edge Function
const WEBHOOK_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/telegram-webhook`;

async function setWebhook() {
  console.log('🔧 Setting up Telegram webhook...');
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }),
    }
  );

  const result = await response.json();
  
  if (result.ok) {
    console.log('✅ Webhook set successfully!');
    console.log('Result:', result);
  } else {
    console.error('❌ Failed to set webhook:', result);
  }

  return result;
}

async function getWebhookInfo() {
  console.log('\n📋 Getting webhook info...');

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );

  const result = await response.json();
  console.log('Webhook Info:', JSON.stringify(result, null, 2));

  return result;
}

// Delete webhook (uncomment if needed)
// async function deleteWebhook() {
//   console.log('🗑️ Deleting webhook...');
//   const response = await fetch(
//     `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ drop_pending_updates: true }),
//     }
//   );
//   const result = await response.json();
//   console.log('Delete result:', result);
//   return result;
// }

async function getBotInfo() {
  console.log('\n🤖 Getting bot info...');

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
  );

  const result = await response.json();
  
  if (result.ok) {
    console.log('Bot Info:');
    console.log(`  Username: @${result.result.username}`);
    console.log(`  Name: ${result.result.first_name}`);
    console.log(`  ID: ${result.result.id}`);
  } else {
    console.error('Failed to get bot info:', result);
  }

  return result;
}

async function setCommands() {
  console.log('\n📝 Setting bot commands...');

  const commands = [
    { command: 'start', description: 'Mulai dan hubungkan akun' },
    { command: 'status', description: 'Cek status koneksi' },
    { command: 'chatid', description: 'Lihat Chat ID Anda' },
    { command: 'help', description: 'Tampilkan bantuan' },
    { command: 'disconnect', description: 'Putuskan koneksi' },
  ];

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    }
  );

  const result = await response.json();
  
  if (result.ok) {
    console.log('✅ Commands set successfully!');
  } else {
    console.error('❌ Failed to set commands:', result);
  }

  return result;
}

// Main execution
async function main() {
  console.log('🚀 Telegram Bot Setup Script\n');
  console.log('='.repeat(50));

  await getBotInfo();
  await setCommands();
  await setWebhook();
  await getWebhookInfo();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Deploy the Edge Function: supabase functions deploy telegram-webhook');
  console.log('2. Set secrets: supabase secrets set TELEGRAM_BOT_TOKEN=your_token');
  console.log('3. Test by sending /start to @HadesnoteBot');
}

main().catch(console.error);
