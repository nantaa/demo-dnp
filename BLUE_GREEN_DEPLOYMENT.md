# DNP Monitor — Blue-Green & Zero-Downtime Deployment Guide

> **Panduan Deploy VPS Zero-Downtime (Blue-Green Deployment)**\
> Menggantikan proses manual `cp -r` dan `npm run build` di direktori live yang rentan menyebabkan *white blank screen* / downtime bagi pengguna aktif.

---

## 1. Mengapa Perlu Beralih ke Blue-Green / Atomic Symlink?

### Masalah pada Metode Manual Lama:
```bash
# ❌ ALUR LAMA (Beresiko):
sudo git pull
cp -r dnp-rework/* dnp-monitor-production/
cd dnp-monitor-production/
npm run build              # <-- SAAT PROSES INI (10-30 detik), folder build hilang/terhapus (Error 404 / Blank Screen bagi user)
php artisan migrate
php artisan optimize:clear
```
- **Downtime saat Vite Build**: `npm run build` menghapus aset lama sebelum aset baru selesai dibuat. Pengguna yang sedang membuka Kanban akan langsung mengalami *white screen* / 404 assets.
- **Tidak Ada Instant Rollback**: Jika ada bug atau salah upload, produksi langsung rusak dan butuh waktu untuk perbaikan manual.

---

## 2. Arsitektur Blue-Green Symlink (Zero-Downtime)

Nginx selalu mengarah ke symlink `/var/www/dnp-monitor/current/public`. Proses build dan migrasi dilakukan di folder yang sedang *idle* (tidak aktif), lalu symlink diganti dalam hitungan **0.001 detik**.

```text
/var/www/dnp-monitor/
├── shared/
│   ├── .env                           # File konfigurasi utama
│   └── storage/                       # Folder upload dokumen, BAP, log
│       ├── app/
│       ├── framework/
│       └── logs/
├── releases/
│   ├── blue/                          # Slot Release A
│   └── green/                         # Slot Release B
└── current -> /var/www/dnp-monitor/releases/blue  # <-- Symlink aktif yang dibaca Nginx
```

```text
[ Deploy Baru Dimulai ]
1. Git pull code baru ke slot 'green' (slot idle)
2. Link .env & storage dari shared/
3. Run npm run build & php artisan migrate di slot 'green'
4. Verifikasi build sukses
5. Ganti symlink: current -> releases/green (Seketika / 0ms downtime)
6. Reload PHP-FPM / Optimize cache
```

---

## 3. Setup Awal di VPS (Cukup Dijalankan 1 Kali)

Hubungkan SSH ke VPS Anda, lalu buat struktur folder berikut:

```bash
# 1. Buat direktori utama
sudo mkdir -p /var/www/dnp-monitor/releases/blue
sudo mkdir -p /var/www/dnp-monitor/releases/green
sudo mkdir -p /var/www/dnp-monitor/shared/storage/app/public
sudo mkdir -p /var/www/dnp-monitor/shared/storage/framework/cache
sudo mkdir -p /var/www/dnp-monitor/shared/storage/framework/sessions
sudo mkdir -p /var/www/dnp-monitor/shared/storage/framework/views
sudo mkdir -p /var/www/dnp-monitor/shared/storage/logs

# 2. Salin .env production ke shared
sudo cp /var/www/dnp-monitor-production/.env /var/www/dnp-monitor/shared/.env

# 3. Clone repository ke workspace deployment
cd /var/www/dnp-monitor
sudo git clone -b v3 https://github.com/USERNAME/REPO_NAME.git repo
# atau git clone via SSH

# 4. Inisialisasi slot 'blue' pertama kali
sudo cp -r repo/dnp-rework/* /var/www/dnp-monitor/releases/blue/
cd /var/www/dnp-monitor/releases/blue
sudo ln -sfn /var/www/dnp-monitor/shared/.env .env
sudo rm -rf storage && sudo ln -sfn /var/www/dnp-monitor/shared/storage storage

composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan storage:link

# 5. Arahkan symlink 'current' ke blue
sudo ln -sfn /var/www/dnp-monitor/releases/blue /var/www/dnp-monitor/current

# 6. Set permission kepemilikan www-data
sudo chown -R www-data:www-data /var/www/dnp-monitor
sudo chmod -R 775 /var/www/dnp-monitor/shared/storage
```

---

## 4. Konfigurasi Nginx VPS

Pastikan konfigurasi Nginx root mengarah ke `/var/www/dnp-monitor/current/public`:

```nginx
# /etc/nginx/sites-available/dnp-monitor
server {
    listen 80;
    server_name monitor.deltaindo.co.id; # Ganti domain/IP Anda
    root /var/www/dnp-monitor/current/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php index.html;
    charset utf-8;

    # Client upload max size untuk BAP & Suket PDF
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock; # Sesuaikan versi PHP VPS (8.2 / 8.3)
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Uji dan reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Script Otomatis `deploy.sh` (Zero-Downtime)

Simpan script ini di `/var/www/dnp-monitor/deploy.sh`:

```bash
#!/bin/bash
set -e

BASE_DIR="/var/www/dnp-monitor"
REPO_DIR="$BASE_DIR/repo"
SHARED_DIR="$BASE_DIR/shared"
CURRENT_LINK="$BASE_DIR/current"
BRANCH="${1:-v3}" # Default branch v3 jika tidak disebutkan

echo "=================================================="
echo "🚀 MEMULAI BLUE-GREEN ZERO-DOWNTIME DEPLOYMENT"
echo "Target Branch: $BRANCH"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# 1. Tentukan target slot rilis (Blue atau Green)
if [ -L "$CURRENT_LINK" ]; then
    CURRENT_TARGET=$(readlink "$CURRENT_LINK")
    if [[ "$CURRENT_TARGET" == *"blue"* ]]; then
        TARGET_SLOT="green"
        PREVIOUS_SLOT="blue"
    else
        TARGET_SLOT="blue"
        PREVIOUS_SLOT="green"
    fi
else
    TARGET_SLOT="blue"
    PREVIOUS_SLOT="green"
fi

TARGET_DIR="$BASE_DIR/releases/$TARGET_SLOT"
echo "📍 Current Active Slot : $PREVIOUS_SLOT"
echo "🎯 Deploying to Idle   : $TARGET_SLOT ($TARGET_DIR)"

# 2. Update code di repo staging
echo "📥 1/7 Pulling latest code from Git..."
cd "$REPO_DIR"
git fetch --all
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 3. Salin code baru ke target slot yang sedang idle
echo "📦 2/7 Copying code to release slot $TARGET_SLOT..."
mkdir -p "$TARGET_DIR"
rm -rf "$TARGET_DIR"/*
cp -r "$REPO_DIR/dnp-rework"/* "$TARGET_DIR/"

# 4. Hubungkan file shared (.env & storage)
echo "🔗 3/7 Linking shared storage & environment..."
cd "$TARGET_DIR"
ln -sfn "$SHARED_DIR/.env" .env
rm -rf storage
ln -sfn "$SHARED_DIR/storage" storage

# 5. Install dependensi & build aset (Pengguna live TIDAK terganggu)
echo "⚙️ 4/7 Building application assets..."
composer install --no-dev --optimize-autoloader --no-interaction --quiet
npm install --silent
npm run build

# 6. Database Migration & Cache Warmup di target slot
echo "🗄️ 5/7 Running database migrations..."
php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
sudo chown -R www-data:www-data "$TARGET_DIR"

# 7. ATOMIC SYMLINK SWITCH (0.001 Detik)
echo "⚡ 6/7 Switching symlink to $TARGET_SLOT (Atomic Switch)..."
ln -sfn "$TARGET_DIR" "$CURRENT_LINK"

# 8. Reload PHP-FPM / Cache reset
echo "🔄 7/7 Reloading PHP-FPM..."
sudo systemctl reload php8.2-fpm || sudo systemctl reload php8.3-fpm || true
php artisan optimize:clear

echo "=================================================="
echo "✅ DEPLOYMENT BERHASIL TANPA DOWNTIME!"
echo "Aktif saat ini : $TARGET_SLOT ($TARGET_DIR)"
echo "Cadangan rollback : $PREVIOUS_SLOT"
echo "=================================================="
```

Beri izin eksekusi script:
```bash
sudo chmod +x /var/www/dnp-monitor/deploy.sh
```

---

## 6. Script Instant Rollback `rollback.sh`

Jika ada error tak terduga setelah deploy, Anda bisa rollback dalam waktu **< 1 detik**:

Simpan di `/var/www/dnp-monitor/rollback.sh`:

```bash
#!/bin/bash
set -e

BASE_DIR="/var/www/dnp-monitor"
CURRENT_LINK="$BASE_DIR/current"

if [ ! -L "$CURRENT_LINK" ]; then
    echo "❌ Error: current symlink tidak ditemukan!"
    exit 1
fi

CURRENT_TARGET=$(readlink "$CURRENT_LINK")

if [[ "$CURRENT_TARGET" == *"blue"* ]]; then
    ROLLBACK_SLOT="green"
else
    ROLLBACK_SLOT="blue"
fi

ROLLBACK_DIR="$BASE_DIR/releases/$ROLLBACK_SLOT"

if [ ! -d "$ROLLBACK_DIR" ]; then
    echo "❌ Error: Direktori rollback ($ROLLBACK_DIR) tidak ditemukan!"
    exit 1
fi

echo "⏪ Melakukan Instant Rollback ke slot: $ROLLBACK_SLOT..."
ln -sfn "$ROLLBACK_DIR" "$CURRENT_LINK"
sudo systemctl reload php8.2-fpm || sudo systemctl reload php8.3-fpm || true

echo "✅ ROLLBACK SUKSES! Aplikasi kembali aktif di: $ROLLBACK_SLOT"
```

Beri izin eksekusi:
```bash
sudo chmod +x /var/www/dnp-monitor/rollback.sh
```

---

## 7. Cara Menjalankan Deploy Selanjutnya

Setiap kali Anda ingin melakukan deploy update dari lokal / GitHub ke VPS:

### Cukup jalankan 1 baris perintah ini di VPS:
```bash
# Deploy branch v3 (default)
sudo /var/www/dnp-monitor/deploy.sh

# Atau deploy branch tertentu (contoh: refactorized)
sudo /var/www/dnp-monitor/deploy.sh refactorized
```

### Jika ada kendala dan ingin kembali ke versi sebelumnya:
```bash
sudo /var/www/dnp-monitor/rollback.sh
```

---

## 8. Ringkasan Perbandingan

| Fitur | Cara Manual Lama (`cp -r`) | Blue-Green / Atomic Symlink (`deploy.sh`) |
| :--- | :--- | :--- |
| **Downtime saat Build** | ❌ Ada (10-30 detik layar putih/404) | ✅ **0 Detik (Zero Downtime)** |
| **Keamanan User Aktif** | ❌ Form submission bisa gagal di tengah jalan | ✅ **100% Aman (Aset lama tetap ada sampai link beralih)** |
| **Rollback** | ❌ Manual (re-copy & re-build lama) | ✅ **Instant (< 1 detik via `rollback.sh`)** |
| **Langkah Eksekusi** | ❌ 6 langkah manual satu per satu | ✅ **1 Perintah Otomatis** |
