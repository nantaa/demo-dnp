#!/bin/bash
set -e

# Base deployment directory
BASE_DIR="/var/www/demo-dnp/demo-dnp"
CURRENT_LINK="$BASE_DIR/dnp-monitor-production"
SHARED_ENV="$BASE_DIR/.env.shared"
SHARED_STORAGE="$BASE_DIR/shared-storage"
BRANCH="${1:-refactorized}"

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

if [ -f "$SHARED_ENV" ]; then
    ln -sfn "$SHARED_ENV" .env
else
    echo "⚠️ Warning: $SHARED_ENV tidak ditemukan, mencari fallback .env..."
    if [ -f "$BASE_DIR/dnp-monitor-production/.env" ]; then
        cp "$BASE_DIR/dnp-monitor-production/.env" "$SHARED_ENV"
        ln -sfn "$SHARED_ENV" .env
    fi
fi

if [ -d "$SHARED_STORAGE" ]; then
    rm -rf storage
    ln -sfn "$SHARED_STORAGE" storage
fi

# 5. Build aset di slot idle
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
sudo chown -R www-data:delta "$TARGET_DIR" 2>/dev/null || true

# 7. ATOMIC SYMLINK SWITCH (0.001 Detik)
echo "⚡ 6/7 Switching dnp-monitor-production to $TARGET_SLOT (Atomic Switch)..."
ln -sfn "$TARGET_DIR" "$CURRENT_LINK"

# 8. Reload PHP-FPM / Optimize Clear
echo "🔄 7/7 Reloading PHP-FPM..."
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || sudo service php8.2-fpm reload 2>/dev/null || true
cd "$CURRENT_LINK"
php artisan optimize:clear

echo "=================================================="
echo "✅ DEPLOYMENT BERHASIL TANPA DOWNTIME / TANPA BLANK!"
echo "Aktif saat ini     : $TARGET_SLOT"
echo "Cadangan rollback : $PREVIOUS_SLOT"
echo "=================================================="
