# Subscription Tracker Documentation

Aplikasi untuk melacak dan mengelola langganan digital Anda dengan fitur reminder, analytics, dan integrasi Telegram.

## 📚 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Instalasi & Setup](./setup.md)
- [Konfigurasi Supabase](./supabase-setup.md)
- [Integrasi Telegram](./telegram-integration.md)
- [GitHub Actions](./github-actions.md)
- [Deployment](./deployment.md)
- [Fitur Lengkap](./features.md)

## ✨ Fitur Utama

### Manajemen Langganan
- Tambah, edit, hapus, dan duplikasi langganan
- Kategori: Entertainment, Productivity, Cloud, Gaming, Reading, Fitness, Domain, Other
- Support multiple currency (IDR, USD, EUR, dll)
- Billing cycle: Monthly, Yearly, One-time
- Custom icon dengan emoji atau image URL
- Tags dan notes untuk organisasi

### Tampilan & Navigasi
- Grid view dan Timeline view
- Calendar view untuk melihat jadwal billing
- Analytics dengan grafik pengeluaran
- Filter berdasarkan status dan kategori
- Sorting berdasarkan nama, harga, atau tanggal billing

### Reminder & Notifikasi
- Reminder H-1, H-3, H-7, H-14, H-30 sebelum billing
- Custom notification time
- Badge notifikasi untuk upcoming renewals

### Export & Import
- Export ke JSON (full data) atau CSV (Excel compatible)
- Import dari JSON/CSV dengan drag & drop
- Deteksi duplikat otomatis saat import

### Integrasi Telegram
- Hubungkan akun dengan Telegram bot
- Lihat daftar langganan via Telegram
- Notifikasi reminder via Telegram
- Commands: /start, /list, /upcoming, /summary, /status, /help

### Lainnya
- Multi-language (English, Indonesia)
- Responsive design (mobile-friendly)
- Dark mode ready
- Shared subscription tracking
- Company-paid subscription marking

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Hosting | Netlify |
| Bot | Telegram Bot API |

## 📁 Struktur Project

```
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, Preferences)
│   ├── lib/            # Utilities, Supabase client, i18n
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions (telegram-webhook)
├── docs/               # Documentation
├── public/             # Static assets
└── .github/workflows/  # GitHub Actions
```

## 🚀 Quick Start

1. Clone repository
2. Copy `.env.example` ke `.env` dan isi credentials
3. Install dependencies: `npm install`
4. Jalankan development server: `npm run dev`

Untuk setup lengkap, lihat [Instalasi & Setup](./setup.md).
