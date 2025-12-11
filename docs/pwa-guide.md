# PWA (Progressive Web App) Guide

## Overview

Subscription Manager sekarang mendukung PWA, yang memungkinkan aplikasi diinstall di perangkat mobile dan desktop seperti aplikasi native.

## Fitur PWA

### 1. Installable
- Aplikasi bisa diinstall langsung dari browser
- Muncul di home screen seperti app native
- Tidak perlu download dari App Store/Play Store

### 2. Offline Support
- Data subscription di-cache di IndexedDB
- Bisa melihat subscription saat offline
- Sync otomatis saat kembali online

### 3. Fast Loading
- Assets di-cache oleh Service Worker
- Load instan setelah install
- Background sync untuk update

## Cara Install

### Di Android (Chrome)
1. Buka aplikasi di Chrome
2. Tunggu beberapa detik, akan muncul prompt "Install SubsManager"
3. Klik "Install App"
4. Atau: tap menu (⋮) → "Add to Home screen"

### Di iOS (Safari)
1. Buka aplikasi di Safari
2. Tap tombol Share (kotak dengan panah ke atas)
3. Scroll dan tap "Add to Home Screen"
4. Tap "Add"

### Di Desktop (Chrome/Edge)
1. Buka aplikasi di browser
2. Klik icon install di address bar (atau prompt yang muncul)
3. Klik "Install"

## Verifikasi PWA

### Menggunakan Chrome DevTools
1. Buka aplikasi di Chrome
2. Tekan F12 untuk buka DevTools
3. Pergi ke tab "Application"
4. Cek bagian:
   - **Manifest**: Pastikan semua field terisi
   - **Service Workers**: Status harus "activated and running"
   - **Cache Storage**: Lihat assets yang di-cache

### Menggunakan Lighthouse
1. Buka DevTools → tab "Lighthouse"
2. Centang "Progressive Web App"
3. Klik "Analyze page load"
4. Lihat skor PWA (target: 100)

### Checklist PWA
- [ ] Manifest valid dengan semua icons
- [ ] Service Worker registered dan active
- [ ] HTTPS enabled (required untuk PWA)
- [ ] Responsive design
- [ ] Offline page tersedia
- [ ] Install prompt muncul

## Technical Details

### Files PWA
```
public/
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   └── icon-512x512-maskable.png
├── apple-touch-icon.png
└── favicon.ico

dist/ (after build)
├── manifest.webmanifest
├── sw.js
└── workbox-*.js
```

### Caching Strategy
- **App Shell**: Cache First (instant load)
- **Static Assets**: Cache First dengan expiration 30 hari
- **API Requests**: Network First dengan fallback ke cache
- **Images**: Stale While Revalidate

### IndexedDB Schema
```
Database: subscription-tracker-offline
├── subscriptions (cached subscription data)
├── pendingChanges (offline changes queue)
└── metadata (sync timestamps, etc.)
```

## Troubleshooting

### Install prompt tidak muncul
- Pastikan menggunakan HTTPS
- Clear cache dan refresh
- Cek apakah sudah pernah dismiss prompt (tunggu 7 hari)

### Offline tidak bekerja
- Pastikan Service Worker active
- Cek Cache Storage di DevTools
- Refresh halaman setelah pertama kali load

### Update tidak terdeteksi
- Service Worker update setiap 1 jam
- Force update: DevTools → Application → Service Workers → Update

## Development

### Generate Icons
```bash
node scripts/generate-icons.js
```

### Build dengan PWA
```bash
npm run build
```

### Preview PWA
```bash
npm run preview
# Buka http://localhost:4173
```

### Test Offline
1. Buka DevTools → Network
2. Centang "Offline"
3. Refresh halaman
4. Aplikasi harus tetap bisa diakses
