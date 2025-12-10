# Instalasi & Setup

## Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis)
- Akun Netlify untuk deployment (opsional)
- Telegram Bot Token (opsional, untuk integrasi Telegram)

## Langkah Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd Subscription-Tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` dan isi dengan credentials Anda:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Telegram Bot (opsional)
VITE_TELEGRAM_BOT_TOKEN=your-bot-token
VITE_TELEGRAM_BOT_USERNAME=YourBotUsername
```

> ⚠️ **PENTING**: Jangan pernah commit file `.env` ke repository!

### 4. Setup Supabase

Lihat [Konfigurasi Supabase](./supabase-setup.md) untuk panduan lengkap.

### 5. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## Scripts yang Tersedia

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview production build |
| `npm run lint` | Jalankan ESLint |
| `npm run typecheck` | Check TypeScript types |

## Troubleshooting

### Error: Missing Supabase credentials
Pastikan file `.env` sudah ada dan berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` yang valid.

### Error: Database tables not found
Jalankan migrations ke Supabase. Lihat [Konfigurasi Supabase](./supabase-setup.md).

### Error: CORS issues
Pastikan URL aplikasi sudah ditambahkan di Supabase Dashboard → Authentication → URL Configuration.
