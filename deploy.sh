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
echo "📥 1/6 Git pull branch: $BRANCH..."
cd "$BASE_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard origin/"$BRANCH"

# 2. Copy source files (safe — no delete, preserves vendor/storage/.env)
echo "📦 2/6 Copying updated source files to production..."
cp -r "$BASE_DIR/dnp-rework/app"           "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/config"        "$PROD_DIR/" 2>/dev/null || true
cp -r "$BASE_DIR/dnp-rework/database"      "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/resources"     "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/routes"        "$PROD_DIR/"
cp    "$BASE_DIR/dnp-rework/artisan"       "$PROD_DIR/" 2>/dev/null || true

# 3. NPM install + build INSIDE production dir (generates fresh bundles from source)
echo "🔨 3/6 Running npm install & build in production..."
cd "$PROD_DIR"

if [ -f "package.json" ]; then
    npm ci --prefer-offline 2>/dev/null || npm install --no-audit --no-fund
    npm run build
    echo "   -> Build done. Assets: $(ls public/build/assets/ 2>/dev/null | wc -l) files"
else
    echo "   ⚠️ No package.json found in $PROD_DIR — skipping npm build"
    echo "   -> Copying pre-built v16 bundles from repo instead..."
    if [ -d "$BASE_DIR/dnp-rework/public/build" ]; then
        rm -rf "$PROD_DIR/public/build"
        mkdir -p "$PROD_DIR/public/build/assets"
        cp -r "$BASE_DIR/dnp-rework/public/build/"* "$PROD_DIR/public/build/"
    fi
fi

# 4. Link .env and storage
echo "🔗 4/6 Linking .env and storage..."
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

# 5. Fix permissions
echo "⚙️  5/6 Fixing permissions..."
sudo chmod -R 777 "$PROD_DIR/bootstrap/cache" 2>/dev/null || true
sudo chmod -R 777 "$SHARED_STORAGE" 2>/dev/null || true

# 6. Artisan commands
echo "🗄️  6/6 Artisan cache clear..."
cd "$PROD_DIR"
if [ -f "artisan" ]; then
    php artisan migrate --force || true
    php artisan storage:link 2>/dev/null || true
    php artisan optimize:clear || true
fi

# Reload PHP-FPM
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true

echo "=================================================="
echo "✅ DONE!"
echo "Assets in production:"
ls "$PROD_DIR/public/build/assets/" 2>/dev/null || echo "(no build assets found)"
echo "=================================================="
