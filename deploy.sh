#!/bin/bash
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
PROD_DIR="$BASE_DIR/dnp-monitor-production"
SHARED_ENV="$BASE_DIR/.env.shared"
SHARED_STORAGE="$BASE_DIR/shared-storage"
BRANCH="${1:-main}"

echo "=================================================="
echo "🚀 MEMULAI DIRECT DEPLOYMENT KE PRODUCTION FOLDER"
echo "Host: delta@RiksaUjiServer"
echo "Target Branch: $BRANCH"
echo "Target Dir: $PROD_DIR"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# 1. Pull git repository terbaru
echo "📥 1/5 Syncing code from branch: $BRANCH..."
cd "$BASE_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard origin/"$BRANCH"

# 2. Pastikan folder production ada
echo "📦 2/5 Preparing production directory..."
mkdir -p "$PROD_DIR"

# 3. WIPE old build assets to prevent stale JS bundles
echo "   -> Wiping OLD public/build to remove stale bundles..."
rm -rf "$PROD_DIR/public/build"

# Sync source code from dnp-rework into production
echo "   -> Syncing source code from dnp-rework into production..."
rsync -a --delete \
    --exclude='vendor/' \
    --exclude='storage/' \
    --exclude='.env' \
    "$BASE_DIR/dnp-rework/" "$PROD_DIR/"

# Force-sync compiled build assets (16 stage bundles)
echo "   -> Force-syncing compiled 16-stage build assets..."
mkdir -p "$PROD_DIR/public/build/assets"
cp -f "$BASE_DIR/dnp-rework/public/build/manifest.json" "$PROD_DIR/public/build/manifest.json"
cp -f "$BASE_DIR/dnp-rework/public/build/assets/"* "$PROD_DIR/public/build/assets/"
echo "   -> Build assets on server: $(ls $PROD_DIR/public/build/assets/ | wc -l) files"

# 4. Hubungkan shared .env & storage
echo "🔗 3/5 Linking shared storage & environment..."
cd "$PROD_DIR"

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

# 5. Dependency & Permissions
echo "⚙️ 4/5 Setting up dependencies & permissions..."
cd "$PROD_DIR"

if [ -f "composer.json" ] && [ ! -d "vendor" ]; then
    composer install --no-dev --optimize-autoloader --no-interaction || true
fi

sudo chmod -R 777 "$PROD_DIR/storage" "$PROD_DIR/bootstrap/cache" 2>/dev/null || true
sudo chmod -R 777 "$SHARED_STORAGE" 2>/dev/null || true

# 6. Artisan & Cache
echo "🗄️ 5/5 Running migrations & clearing cache..."
if [ -f "artisan" ]; then
    php artisan migrate --force || true
    php artisan storage:link 2>/dev/null || true
    php artisan optimize:clear || true
fi

# Reload PHP-FPM
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || sudo service php8.2-fpm reload 2>/dev/null || sudo service php8.3-fpm reload 2>/dev/null || true

echo "=================================================="
echo "✅ DEPLOYMENT SELESAI!"
echo "Production Dir: $PROD_DIR"
echo "Build assets updated: $(ls $PROD_DIR/public/build/assets/ | wc -l) files"
echo "=================================================="
