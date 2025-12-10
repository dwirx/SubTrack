# GitHub Actions

## Keep Supabase Alive

Supabase Free Plan akan mem-pause project yang tidak aktif selama 7 hari. Workflow ini akan ping database setiap 5 hari untuk menjaga project tetap aktif.

### Setup

1. Push repository ke GitHub

2. Buka repository di GitHub

3. Pergi ke **Settings** → **Secrets and variables** → **Actions**

4. Klik **New repository secret** dan tambahkan:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | URL project Supabase Anda (contoh: `https://xxxxx.supabase.co`) |
   | `SUPABASE_ANON_KEY` | Anon/Public key dari Supabase |

5. Workflow akan berjalan otomatis setiap 5 hari

### Manual Trigger

Jika ingin menjalankan secara manual:

1. Buka tab **Actions** di repository
2. Pilih workflow **"Keep Supabase Alive"**
3. Klik **"Run workflow"**
4. Pilih branch dan klik **"Run workflow"**

### Workflow File

File: `.github/workflows/keep-supabase-alive.yml`

```yaml
name: Keep Supabase Alive

on:
  schedule:
    - cron: '0 0 */5 * *'  # Setiap 5 hari
  workflow_dispatch:        # Manual trigger

jobs:
  ping-supabase:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase Database
        run: |
          curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/..." \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Verifikasi

Setelah workflow berjalan:

1. Buka tab **Actions**
2. Lihat run terbaru
3. Pastikan status **✓ Success**
4. Klik untuk melihat logs

### Troubleshooting

#### Workflow gagal dengan error 401/403
- Pastikan `SUPABASE_ANON_KEY` sudah benar
- Cek apakah key masih valid di Supabase Dashboard

#### Workflow gagal dengan error 404
- Pastikan `SUPABASE_URL` sudah benar (tanpa trailing slash)
- Pastikan project Supabase masih aktif

#### Workflow tidak berjalan otomatis
- GitHub Actions scheduled workflows hanya berjalan di branch default
- Pastikan file workflow ada di branch `main` atau `master`
- Scheduled workflows mungkin delay hingga 1 jam

## Workflow Lainnya (Opsional)

### CI/CD untuk Build & Deploy

Anda bisa menambahkan workflow untuk:
- Build dan test otomatis saat push
- Deploy otomatis ke Netlify
- Lint dan type checking

Contoh file: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```
