# Fitur Lengkap

## Manajemen Langganan

### Tambah Langganan
- Nama service dengan auto-suggest icon
- Pilih kategori: Entertainment, Productivity, Cloud, Gaming, Reading, Fitness, Domain, Other
- Harga dengan format number separator
- Currency: IDR, USD, EUR, GBP, SGD, MYR, JPY, KRW, AUD, CNY
- Billing cycle: Monthly, Yearly, One-time
- Tanggal mulai dan next billing (dengan auto-calculate)
- Status: Active, Trial, Cancelled

### Edit Langganan
- Edit semua field
- Quick renew untuk perpanjang tanggal billing
- Cancel subscription dengan panduan

### Duplikasi Langganan
- Klik tombol copy untuk duplikasi
- Otomatis menambahkan "(Copy)" di nama
- Start date di-set ke hari ini

### Hapus Langganan
- Konfirmasi sebelum hapus
- Soft delete dengan status cancelled (opsional)

## Custom Icon

### Emoji
- 200+ emoji tersedia dalam kategori
- Search emoji
- Preview sebelum pilih

### Image URL
- Support PNG, JPG, SVG
- Preview gambar
- Fallback ke emoji jika gagal load

## Reminder & Notifikasi

### Reminder Schedule
- H-1 (1 hari sebelum)
- H-3 (3 hari sebelum)
- H-7 (1 minggu sebelum)
- H-14 (2 minggu sebelum)
- H-30 (1 bulan sebelum)

### Notification Time
- Pilih jam notifikasi
- Default: 09:00

### In-App Notification
- Badge count untuk upcoming renewals
- Modal dengan daftar langganan yang akan jatuh tempo

## Tampilan

### Grid View
- Card layout responsive
- 1 kolom (mobile), 2 kolom (tablet), 3 kolom (desktop)
- Animasi hover dan loading

### Timeline View
- Serpentine layout
- Warna berdasarkan urgency
- Inline editing

### Calendar View
- Kalender bulanan
- Marker untuk tanggal billing
- Klik tanggal untuk lihat detail

### Analytics View
- Total pengeluaran per bulan/tahun
- Breakdown per kategori
- Grafik trend

## Export & Import

### Export
- **JSON**: Full data, cocok untuk backup
- **CSV**: Excel compatible, untuk spreadsheet

### Import
- Drag & drop file
- Support JSON dan CSV
- Deteksi duplikat otomatis
- Validasi data

## Integrasi Telegram

### Commands
| Command | Fungsi |
|---------|--------|
| `/start` | Mulai dan dapatkan Chat ID |
| `/list` | Daftar semua langganan |
| `/upcoming` | Langganan 7 hari ke depan |
| `/summary` | Ringkasan per kategori |
| `/status` | Status koneksi |
| `/help` | Bantuan |
| `/chatid` | Lihat Chat ID |
| `/disconnect` | Putus koneksi |

### Notifikasi
- Reminder otomatis via Telegram
- Format pesan yang informatif
- Emoji untuk visual

## Fitur Tambahan

### Shared Subscription
- Tandai langganan yang di-share
- Input jumlah orang
- Hitung biaya per orang

### Company Paid
- Tandai langganan yang dibayar perusahaan
- Tidak dihitung di total pengeluaran pribadi

### Tags
- Tambah tags untuk organisasi
- Filter berdasarkan tags

### Cancellation Info
- Simpan URL cancellation
- Simpan langkah-langkah cancel
- Quick access saat mau cancel

### Multi-Language
- English
- Bahasa Indonesia
- Mudah ditambah bahasa lain

## Keamanan

### Authentication
- Email/Password login
- Session management
- Secure logout

### Row Level Security
- Data terisolasi per user
- Tidak bisa akses data user lain

### Environment Variables
- Credentials tidak di-hardcode
- Secrets management
