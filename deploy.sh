#!/bin/bash
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
CURRENT_LINK="$BASE_DIR/dnp-monitor-production"
SHARED_ENV="$BASE_DIR/.env.shared"
SHARED_STORAGE="$BASE_DIR/shared-storage"
BRANCH="${1:-main}"

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
PREV_DIR="$BASE_DIR/releases/$PREVIOUS_SLOT"

echo "📍 Current Active Slot : $PREVIOUS_SLOT"
echo "🎯 Deploying to Idle   : $TARGET_SLOT ($TARGET_DIR)"

# 2. Pull git repository terbaru di base directory
echo "📥 1/6 Syncing code from branch: $BRANCH..."
cd "$BASE_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard origin/"$BRANCH"

# 3. Siapkan direktori target slot release
echo "📦 2/6 Preparing release slot $TARGET_SLOT..."
mkdir -p "$TARGET_DIR"

# Jika target slot belum punya vendor/artisan, sync dari slot sebelumnya atau folder production lama
if [ ! -f "$TARGET_DIR/artisan" ]; then
    if [ -f "$PREV_DIR/artisan" ]; then
        echo "   -> Menyalin base files dari $PREV_DIR..."
        cp -rn "$PREV_DIR"/* "$TARGET_DIR/" 2>/dev/null || true
    elif [ -d "$BASE_DIR/dnp-monitor-production" ] && [ ! -L "$BASE_DIR/dnp-monitor-production" ]; then
        echo "   -> Menyalin base files dari dnp-monitor-production..."
        cp -rn "$BASE_DIR/dnp-monitor-production"/* "$TARGET_DIR/" 2>/dev/null || true
    fi
fi

# Timpa dengan file update terbaru dari dnp-rework
echo "   -> Mengupdate source code dari dnp-rework..."
cp -r "$BASE_DIR/dnp-rework"/* "$TARGET_DIR/"

# Salin aset frontend yang sudah dibuild dari dist/
if [ -d "$BASE_DIR/dist" ]; then
    echo "   -> Menyalin frontend build artifacts (dist)..."
    mkdir -p "$TARGET_DIR/public"
    cp -r "$BASE_DIR/dist"/* "$TARGET_DIR/public/"
fi

# 4. Hubungkan shared .env & storage
echo "🔗 3/6 Linking shared storage & environment..."
cd "$TARGET_DIR"

if [ -f "$SHARED_ENV" ]; then
    ln -sfn "$SHARED_ENV" .env
elif [ -f "$BASE_DIR/.env" ]; then
    cp "$BASE_DIR/.env" "$SHARED_ENV"
    ln -sfn "$SHARED_ENV" .env
fi

if [ -d "$SHARED_STORAGE" ]; then
    rm -rf storage
    ln -sfn "$SHARED_STORAGE" storage
fi

# 5. Dependency Check & Permission Fix
echo "⚙️ 4/6 Setting up dependencies & storage permissions in $TARGET_SLOT..."
cd "$TARGET_DIR"

if [ -f "composer.json" ] && [ ! -d "vendor" ]; then
    composer install --no-dev --optimize-autoloader --no-interaction || true
fi

# Pastikan permission storage & bootstrap selalu writable untuk webserver
sudo chmod -R 777 "$TARGET_DIR/storage" "$TARGET_DIR/bootstrap/cache" 2>/dev/null || true
sudo chmod -R 777 "$SHARED_STORAGE" 2>/dev/null || true

# 6. Database Migration & Cache Warmup di slot baru
echo "🗄️ 5/6 Running database migrations & cache clearing..."
if [ -f "artisan" ]; then
    php artisan migrate --force || true
    php artisan storage:link 2>/dev/null || true
    php artisan optimize:clear || true
fi

# 7. ATOMIC SYMLINK SWITCH (0.001 Detik)
echo "⚡ 6/6 Switching dnp-monitor-production to $TARGET_SLOT (Atomic Switch)..."
ln -sfn "$TARGET_DIR" "$CURRENT_LINK"

# Reload PHP-FPM
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || sudo service php8.2-fpm reload 2>/dev/null || sudo service php8.3-fpm reload 2>/dev/null || true

echo "=================================================="
echo "✅ DEPLOYMENT BERHASIL TANPA DOWNTIME / TANPA BLANK!"
echo "Aktif saat ini     : $TARGET_SLOT ($TARGET_DIR)"
echo "Cadangan rollback : $PREVIOUS_SLOT"
echo "=================================================="
