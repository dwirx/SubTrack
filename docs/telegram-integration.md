# Integrasi Telegram

## Membuat Telegram Bot

1. Buka Telegram dan cari [@BotFather](https://t.me/BotFather)
2. Kirim `/newbot`
3. Ikuti instruksi untuk membuat bot baru
4. Simpan **Bot Token** yang diberikan
5. Simpan **Username** bot (tanpa @)

## Konfigurasi Environment

Tambahkan ke file `.env`:

```env
VITE_TELEGRAM_BOT_TOKEN=your-bot-token-here
VITE_TELEGRAM_BOT_USERNAME=YourBotUsername
```

## Deploy Webhook (Supabase Edge Function)

### 1. Set Secret di Supabase

```bash
npx supabase secrets set TELEGRAM_BOT_TOKEN=your-bot-token-here
```

Atau via Dashboard:
1. Buka Supabase Dashboard → Edge Functions
2. Klik "Manage Secrets"
3. Tambahkan `TELEGRAM_BOT_TOKEN`

### 2. Deploy Edge Function

```bash
npx supabase functions deploy telegram-webhook --no-verify-jwt
```

### 3. Setup Webhook URL

Jalankan script setup atau gunakan curl:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<PROJECT_ID>.supabase.co/functions/v1/telegram-webhook"}'
```

Ganti:
- `<YOUR_BOT_TOKEN>` dengan token bot Anda
- `<PROJECT_ID>` dengan project ID Supabase

### 4. Set Bot Commands

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Mulai dan hubungkan akun"},
      {"command": "list", "description": "Lihat semua langganan aktif"},
      {"command": "upcoming", "description": "Langganan yang akan jatuh tempo"},
      {"command": "summary", "description": "Ringkasan pengeluaran"},
      {"command": "status", "description": "Status koneksi akun"},
      {"command": "help", "description": "Bantuan penggunaan bot"},
      {"command": "chatid", "description": "Lihat Chat ID Anda"},
      {"command": "disconnect", "description": "Putuskan koneksi akun"}
    ]
  }'
```

## Menghubungkan Akun

1. Buka aplikasi Subscription Tracker
2. Klik avatar/profile → My Profile
3. Scroll ke bagian "Telegram Integration"
4. Klik "Connect Telegram"
5. Buka link bot yang muncul
6. Kirim `/start` di Telegram
7. Copy Chat ID yang diberikan
8. Paste di aplikasi dan klik "Verify"

## Bot Commands

| Command | Deskripsi |
|---------|-----------|
| `/start` | Mulai bot dan dapatkan Chat ID |
| `/list` | Lihat semua langganan aktif dengan harga dan tanggal |
| `/upcoming` | Langganan yang jatuh tempo dalam 7 hari |
| `/summary` | Ringkasan pengeluaran per kategori |
| `/status` | Cek status koneksi akun |
| `/help` | Panduan penggunaan bot |
| `/chatid` | Lihat Chat ID Anda |
| `/disconnect` | Putuskan koneksi akun |

## Fitur Notifikasi

Setelah terhubung, bot akan mengirim:
- Reminder sebelum tanggal billing (sesuai setting)
- Notifikasi langganan yang akan expired

## Troubleshooting

### Bot tidak merespon
1. Pastikan webhook sudah di-setup dengan benar
2. Cek logs di Supabase Dashboard → Edge Functions → Logs
3. Pastikan `TELEGRAM_BOT_TOKEN` secret sudah di-set

### Chat ID tidak valid
1. Pastikan mengirim `/start` ke bot yang benar
2. Chat ID harus berupa angka (bisa negatif untuk group)

### Webhook error
1. Pastikan Edge Function sudah di-deploy dengan `--no-verify-jwt`
2. Cek URL webhook sudah benar
3. Verifikasi token bot valid
