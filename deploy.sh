#!/bin/bash
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
PROD_DIR="$BASE_DIR/dnp-monitor-production"
SHARED_ENV="$BASE_DIR/.env.shared"
SHARED_STORAGE="$BASE_DIR/shared-storage"
BRANCH="${1:-main}"

echo "=================================================="
echo "🚀 DEPLOYING ke: $PROD_DIR"
echo "Branch: $BRANCH | $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# 1. Pull latest code
echo "📥 1/5 Git pull branch: $BRANCH..."
cd "$BASE_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard origin/"$BRANCH"

# 2. Copy source files (NO --delete, keep vendor/storage/.env intact)
echo "📦 2/5 Copying source files to production (safe, no delete)..."
cp -r "$BASE_DIR/dnp-rework/app"              "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/bootstrap"        "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/config"           "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/database"         "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/resources"        "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/routes"           "$PROD_DIR/"
cp    "$BASE_DIR/dnp-rework/artisan"          "$PROD_DIR/"
cp    "$BASE_DIR/dnp-rework/composer.json"    "$PROD_DIR/" 2>/dev/null || true
cp -r "$BASE_DIR/dnp-rework/public"           "$PROD_DIR/"

# 3. WIPE old build assets then copy v16 bundles fresh
echo "🗑️  3/5 Wiping old public/build and copying v16 bundles..."
rm -rf "$PROD_DIR/public/build"
mkdir -p "$PROD_DIR/public/build/assets"
cp -r "$BASE_DIR/dnp-rework/public/build/"* "$PROD_DIR/public/build/"
echo "   -> Assets copied: $(ls $PROD_DIR/public/build/assets/ | wc -l) files"
echo "   -> Manifest: $(cat $PROD_DIR/public/build/manifest.json | grep 'Index-v16' | head -1)"

# 4. Link .env and storage
echo "🔗 4/5 Linking .env and storage..."
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

# 5. Fix permissions + artisan commands
echo "⚙️  5/5 Permissions and artisan cache clear..."
sudo chmod -R 777 "$PROD_DIR/bootstrap/cache" 2>/dev/null || true
sudo chmod -R 777 "$SHARED_STORAGE" 2>/dev/null || true

if [ -f "artisan" ]; then
    php artisan storage:link 2>/dev/null || true
    php artisan optimize:clear || true
fi

# Reload PHP-FPM
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true

echo "=================================================="
echo "✅ DONE! Production: $PROD_DIR"
echo "Build assets:"
ls "$PROD_DIR/public/build/assets/"
echo "=================================================="
