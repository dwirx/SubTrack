# Deployment

## Deploy ke Netlify

### Opsi 1: Deploy via Netlify Dashboard

1. Buka [Netlify](https://app.netlify.com)
2. Klik "Add new site" → "Import an existing project"
3. Pilih GitHub dan authorize
4. Pilih repository
5. Konfigurasi build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Tambahkan environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TELEGRAM_BOT_TOKEN` (opsional)
   - `VITE_TELEGRAM_BOT_USERNAME` (opsional)
7. Klik "Deploy site"

### Opsi 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Init project
netlify init

# Deploy
netlify deploy --prod
```

### Konfigurasi Netlify

File `netlify.toml` sudah dikonfigurasi:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Environment Variables di Netlify

1. Buka Netlify Dashboard → Site settings
2. Pergi ke "Environment variables"
3. Tambahkan variables:

| Key | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase |
| `VITE_TELEGRAM_BOT_TOKEN` | Token Telegram bot (opsional) |
| `VITE_TELEGRAM_BOT_USERNAME` | Username bot tanpa @ (opsional) |

## Update Supabase Auth URLs

Setelah deploy, update URL di Supabase:

1. Buka Supabase Dashboard → Authentication → URL Configuration
2. Update **Site URL**: `https://your-site.netlify.app`
3. Tambahkan **Redirect URLs**: `https://your-site.netlify.app/*`

## Custom Domain (Opsional)

1. Buka Netlify Dashboard → Domain settings
2. Klik "Add custom domain"
3. Ikuti instruksi untuk setup DNS

## Deploy Supabase Edge Functions

Untuk Telegram webhook:

```bash
# Login ke Supabase
npx supabase login

# Link project
npx supabase link --project-ref <project-id>

# Set secrets
npx supabase secrets set TELEGRAM_BOT_TOKEN=your-token

# Deploy function
npx supabase functions deploy telegram-webhook --no-verify-jwt
```

## Checklist Sebelum Production

- [ ] Environment variables sudah di-set di Netlify
- [ ] Supabase Auth URLs sudah di-update
- [ ] RLS policies sudah aktif dan benar
- [ ] Telegram webhook sudah di-deploy (jika digunakan)
- [ ] GitHub Actions secrets sudah di-set (untuk keep-alive)
- [ ] Test semua fitur di production

## Monitoring

### Netlify
- Lihat deploy logs di Netlify Dashboard
- Setup notifications untuk deploy failures

### Supabase
- Monitor database usage di Dashboard
- Cek Edge Function logs untuk debugging
- Review security advisors secara berkala

### GitHub Actions
- Cek workflow runs di tab Actions
- Setup notifications untuk workflow failures
