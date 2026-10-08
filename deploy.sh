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

# 2. EMERGENCY RESTORE — if artisan or bootstrap are missing, restore from backup
echo "🛡️  2/6 Checking production integrity..."
if [ ! -f "$PROD_DIR/artisan" ] || [ ! -d "$PROD_DIR/bootstrap" ]; then
    echo "   ⚠️  CRITICAL files missing! Restoring full app from backup slot..."
    BACKUP=""
    [ -f "$BASE_DIR/releases/blue/artisan" ]  && BACKUP="$BASE_DIR/releases/blue"
    [ -z "$BACKUP" ] && [ -f "$BASE_DIR/releases/green/artisan" ] && BACKUP="$BASE_DIR/releases/green"

    if [ -n "$BACKUP" ]; then
        echo "   -> Restoring from: $BACKUP"
        mkdir -p "$PROD_DIR"
        cp -rn "$BACKUP"/. "$PROD_DIR/"
        echo "   -> Full restore done."
    else
        echo "   ❌ No backup found in releases/blue or releases/green!"
        echo "   ❌ Cannot continue safely. Please restore manually."
        exit 1
    fi
else
    echo "   -> artisan OK, bootstrap OK — production intact."
fi

# 3. Copy ONLY source folders from dnp-rework (safe — never overwrites artisan/bootstrap/vendor)
echo "📦 3/6 Copying updated source files from dnp-rework..."
cp -r "$BASE_DIR/dnp-rework/app"       "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/database"  "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/resources" "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/routes"    "$PROD_DIR/"
[ -d "$BASE_DIR/dnp-rework/config" ] && cp -r "$BASE_DIR/dnp-rework/config" "$PROD_DIR/"
echo "   -> Source files updated."

# 4. npm install + build
echo "🔨 4/6 npm install & build..."
cd "$PROD_DIR"
npm install --no-audit --no-fund
npm run build
echo "   -> Build done: $(ls public/build/assets/ 2>/dev/null | wc -l) assets"

# 5. Link .env and storage
echo "🔗 5/6 Linking .env and storage..."
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

# Fix permissions
sudo chmod -R 777 "$PROD_DIR/bootstrap/cache" 2>/dev/null || true
sudo chmod -R 777 "$SHARED_STORAGE" 2>/dev/null || true

# 6. Artisan
echo "🗄️  6/6 Artisan..."
cd "$PROD_DIR"
php artisan migrate --force || true
php artisan storage:link 2>/dev/null || true
php artisan optimize:clear || true

sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true

echo "=================================================="
echo "✅ DONE!"
echo "artisan:      $([ -f $PROD_DIR/artisan ] && echo OK || echo MISSING)"
echo "bootstrap:    $([ -d $PROD_DIR/bootstrap ] && echo OK || echo MISSING)"
echo "vendor:       $([ -d $PROD_DIR/vendor ] && echo OK || echo MISSING)"
echo "public/index: $([ -f $PROD_DIR/public/index.php ] && echo OK || echo MISSING)"
echo "build assets: $(ls $PROD_DIR/public/build/assets/ 2>/dev/null | wc -l) files"
echo "=================================================="
