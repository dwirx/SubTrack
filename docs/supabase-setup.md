# Konfigurasi Supabase

## Membuat Project Baru

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik "New Project"
3. Isi nama project dan password database
4. Pilih region terdekat (Singapore untuk Indonesia)
5. Tunggu project selesai dibuat

## Mendapatkan Credentials

1. Buka project di Supabase Dashboard
2. Pergi ke Settings → API
3. Copy nilai berikut ke file `.env`:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## Database Schema

Project ini menggunakan 2 tabel utama:

### Tabel `subscriptions`
Menyimpan data langganan user dengan kolom:
- `id`, `user_id`, `service_name`, `category`, `plan_name`
- `price`, `currency`, `billing_cycle`
- `start_date`, `next_billing_date`
- `payment_method`, `status`, `auto_renew`
- `notes`, `is_shared`, `shared_with_count`, `paid_by_company`
- `icon_emoji`, `tags`, `description`
- `subscription_email`, `phone_number`
- `cancellation_url`, `cancellation_steps`
- `reminder_days`, `notification_time`
- `created_at`, `updated_at`

### Tabel `user_preferences`
Menyimpan preferensi user:
- `id`, `user_id`
- `language`, `currency`, `theme`
- `display_name`, `avatar_url`
- `telegram_chat_id`, `telegram_notifications`, `telegram_connected_at`
- `created_at`, `updated_at`

## Menjalankan Migrations

### Opsi 1: Via Supabase CLI

```bash
# Login ke Supabase
npx supabase login

# Link project
npx supabase link --project-ref <project-id>

# Push migrations
npx supabase db push
```

### Opsi 2: Via SQL Editor

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan file migration secara berurutan:

```
1. 20251210031414_create_subscriptions_schema.sql
2. 20251210032217_add_subscription_extra_fields.sql
3. 20251210034320_create_user_preferences.sql
4. 20251210040241_optimize_rls_policies.sql
5. 20251210044149_add_domain_category.sql
6. 20251210050000_add_telegram_integration.sql
```

## Row Level Security (RLS)

Semua tabel menggunakan RLS untuk keamanan:
- User hanya bisa melihat dan mengedit data miliknya sendiri
- Policies menggunakan `auth.uid()` untuk verifikasi

## Authentication Setup

1. Buka Supabase Dashboard → Authentication → Providers
2. Enable provider yang diinginkan (Email, Google, dll)
3. Untuk Email:
   - Enable "Email" provider
   - Opsional: Disable "Confirm email" untuk development

4. Buka Authentication → URL Configuration
5. Tambahkan URL aplikasi:
   - Site URL: `https://your-app.netlify.app`
   - Redirect URLs: `https://your-app.netlify.app/*`

## Generate TypeScript Types

Setelah schema berubah, generate types:

```bash
npx supabase gen types --linked > src/lib/database.types.ts
```

## Sync Migrations dari Remote

Jika ada perubahan di hosted database:

```bash
npx supabase migration fetch --yes
```

## Tips Keamanan

1. Jangan pernah expose `service_role` key di frontend
2. Selalu gunakan `anon` key untuk client-side
3. Pastikan RLS policies sudah benar sebelum production
4. Review security advisors di Supabase Dashboard
