# DNP Monitor — Blue-Green & Zero-Downtime Deployment Guide (VPS: RiksaUjiServer)

> **Spesifikasi Server VPS:**\
> **Host / User:** `delta@RiksaUjiServer`\
> **Base Directory:** `/var/www/demo-dnp/demo-dnp`\
> **Production Target:** `/var/www/demo-dnp/demo-dnp/dnp-monitor-production` (Symlink Aktif)\
> **Repository:** `/var/www/demo-dnp/demo-dnp/` (Repo clone)

---

## 1. Mengapa Perlu Beralih ke Blue-Green / Atomic Symlink?

### Masalah pada Alur Manual Lama:
```bash
# ❌ ALUR LAMA (Beresiko Screen Blank / Downtime):
delta@RiksaUjiServer:/var/www/demo-dnp/demo-dnp$ sudo git pull
delta@RiksaUjiServer:/var/www/demo-dnp/demo-dnp$ cp -r dnp-rework/* dnp-monitor-production/
delta@RiksaUjiServer:/var/www/demo-dnp/demo-dnp$ cd dnp-monitor-production/
delta@RiksaUjiServer:/var/www/demo-dnp/demo-dnp/dnp-monitor-production$ npm run build     # <-- Saat proses ini (15-30 detik), folder build hilang/terhapus (White Blank Screen bagi user)
delta@RiksaUjiServer:/var/www/demo-dnp/demo-dnp/dnp-monitor-production$ php artisan migrate
delta@RiksaUjiServer:/var/www/demo-dnp/demo-dnp/dnp-monitor-production$ php artisan optimize:clear
```
- **Downtime saat Vite Build**: `npm run build` di dalam folder produksi live menghapus file bundle lama sebelum bundle baru selesai. User yang sedang mengklik kartu Kanban akan langsung melihat **White Blank Screen / 404 Assets**.
- **Tidak Ada Instant Rollback**: Jika terjadi error sintaks atau kegagalan migrasi di live, aplikasi langsung rusak dan butuh waktu lama untuk dibetulkan.

---

## 2. Arsitektur Folder Blue-Green di Server VPS

Nginx **tetap mengarah** ke `/var/www/demo-dnp/demo-dnp/dnp-monitor-production/public` (tidak perlu ubah konfigurasi Nginx jika sudah mengarah ke path ini). Folder `dnp-monitor-production` kita jadikan **Symlink Aktif**.

```text
/var/www/demo-dnp/demo-dnp/
├── .env.shared                        # File .env master bersama
├── shared-storage/                    # Folder upload dokumen/BAP bersama (persistent)
│   ├── app/public/
│   ├── framework/
│   └── logs/
├── releases/
│   ├── blue/                          # Slot Release A
│   └── green/                         # Slot Release B
└── dnp-monitor-production -> /var/www/demo-dnp/demo-dnp/releases/blue  # <-- Symlink yang dibaca Nginx
```

---

## 3. Setup Awal di VPS (Cukup Dijalankan 1 Kali Saja)

Jalankan perintah ini melalui terminal SSH `delta@RiksaUjiServer`:

```bash
cd /var/www/demo-dnp/demo-dnp

# 1. Buat folder release dan shared storage
mkdir -p releases/blue
mkdir -p releases/green
mkdir -p shared-storage/app/public
mkdir -p shared-storage/framework/cache
mkdir -p shared-storage/framework/sessions
mkdir -p shared-storage/framework/views
mkdir -p shared-storage/logs

# 2. Backup dan amankan .env serta storage existing
if [ -f "dnp-monitor-production/.env" ]; then
    cp dnp-monitor-production/.env .env.shared
fi

if [ -d "dnp-monitor-production/storage/app" ]; then
    cp -rn dnp-monitor-production/storage/app/* shared-storage/app/ 2>/dev/null || true
fi

# 3. Pindahkan / Inisialisasi slot 'blue' pertama kali
if [ -d "dnp-monitor-production" ] && [ ! -L "dnp-monitor-production" ]; then
    # Jika dnp-monitor-production masih berupa folder biasa, backup & pindahkan ke blue
    cp -r dnp-monitor-production/* releases/blue/
    rm -rf dnp-monitor-production
else
    cp -r dnp-rework/* releases/blue/
fi

# 4. Hubungkan shared .env & storage ke blue
cd /var/www/demo-dnp/demo-dnp/releases/blue
ln -sfn /var/www/demo-dnp/demo-dnp/.env.shared .env
rm -rf storage && ln -sfn /var/www/demo-dnp/demo-dnp/shared-storage storage

# 5. Buat symlink dnp-monitor-production mengarah ke blue
cd /var/www/demo-dnp/demo-dnp
ln -sfn /var/www/demo-dnp/demo-dnp/releases/blue dnp-monitor-production

# 6. Set permission kepemilikan www-data / delta
sudo chown -R www-data:delta /var/www/demo-dnp/demo-dnp
sudo chmod -R 775 /var/www/demo-dnp/demo-dnp/shared-storage
```

---

## 4. Script Otomatis `deploy.sh` (Zero-Downtime)

Buat file script deployment di `/var/www/demo-dnp/demo-dnp/deploy.sh`:

```bash
cat << 'EOF' > /var/www/demo-dnp/demo-dnp/deploy.sh
#!/bin/bash
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
CURRENT_LINK="$BASE_DIR/dnp-monitor-production"
SHARED_ENV="$BASE_DIR/.env.shared"
SHARED_STORAGE="$BASE_DIR/shared-storage"
BRANCH="${1:-refactorized}" # Default branch: refactorized

echo "=================================================="
echo "🚀 MEMULAI BLUE-GREEN ZERO-DOWNTIME DEPLOYMENT"
echo "Host: delta@RiksaUjiServer"
echo "Target Branch: $BRANCH"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# 1. Tentukan target slot rilis (Blue vs Green)
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

# 2. Pull git repository terbaru
echo "📥 1/7 Pulling latest code from Git..."
cd "$BASE_DIR"
git fetch --all
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 3. Salin code ke slot release yang sedang idle
echo "📦 2/7 Copying code to release slot $TARGET_SLOT..."
mkdir -p "$TARGET_DIR"
rm -rf "$TARGET_DIR"/*
cp -r "$BASE_DIR/dnp-rework"/* "$TARGET_DIR/"

# 4. Hubungkan file shared (.env & storage)
echo "🔗 3/7 Linking shared storage & environment..."
cd "$TARGET_DIR"
ln -sfn "$SHARED_ENV" .env
rm -rf storage
ln -sfn "$SHARED_STORAGE" storage

# 5. Build aset di slot idle (Pengguna live TIDAK terganggu sama sekali)
echo "⚙️ 4/7 Installing dependencies & building assets..."
composer install --no-dev --optimize-autoloader --no-interaction --quiet
npm install --silent
npm run build

# 6. Database Migration & Cache Warmup di slot baru
echo "🗄️ 5/7 Running database migrations..."
php artisan migrate --force
php artisan storage:link 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
sudo chown -R www-data:delta "$TARGET_DIR"

# 7. ATOMIC SYMLINK SWITCH (0.001 Detik)
echo "⚡ 6/7 Switching dnp-monitor-production to $TARGET_SLOT (Atomic Switch)..."
ln -sfn "$TARGET_DIR" "$CURRENT_LINK"

# 8. Reload PHP-FPM / Optimize Clear
echo "🔄 7/7 Reloading PHP-FPM..."
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true
cd "$CURRENT_LINK"
php artisan optimize:clear

echo "=================================================="
echo "✅ DEPLOYMENT BERHASIL TANPA DOWNTIME / TANPA BLANK!"
echo "Aktif saat ini     : $TARGET_SLOT"
echo "Cadangan rollback : $PREVIOUS_SLOT"
echo "=================================================="
EOF

chmod +x /var/www/demo-dnp/demo-dnp/deploy.sh
```

---

## 5. Script Instant Rollback `rollback.sh`

Jika ada kendala darurat, Anda bisa mengembalikan versi live ke slot sebelumnya dalam **< 1 detik**:

```bash
cat << 'EOF' > /var/www/demo-dnp/demo-dnp/rollback.sh
#!/bin/bash
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
CURRENT_LINK="$BASE_DIR/dnp-monitor-production"

if [ ! -L "$CURRENT_LINK" ]; then
    echo "❌ Error: $CURRENT_LINK bukan merupakan symlink!"
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
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true

echo "✅ ROLLBACK SUKSES! Aplikasi kembali aktif di slot: $ROLLBACK_SLOT"
EOF

chmod +x /var/www/demo-dnp/demo-dnp/rollback.sh
```

---

## 6. Cara Deploy Selanjutnya di VPS (Sangat Praktis)

Mulai sekarang, Anda **tidak perlu lagi** mengetik `git pull`, `cp -r`, `npm run build` secara manual.

### Cukup jalankan 1 perintah ini:
```bash
# Deploy branch 'refactorized' (default)
/var/www/demo-dnp/demo-dnp/deploy.sh

# Atau jika ingin deploy branch 'v3'
/var/www/demo-dnp/demo-dnp/deploy.sh v3
```

### Jika perlu rollback instan:
```bash
/var/www/demo-dnp/demo-dnp/rollback.sh
```
