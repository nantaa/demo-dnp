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
echo "📥 1/7 Git pull branch: $BRANCH..."
cd "$BASE_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard origin/"$BRANCH"

# 2. Restore critical files if wiped (public/index.php, vendor)
echo "🛡️  2/7 Checking & restoring critical files if missing..."
BACKUP_DIR=""
for slot in blue green; do
    if [ -d "$BASE_DIR/releases/$slot" ] && [ -f "$BASE_DIR/releases/$slot/public/index.php" ]; then
        BACKUP_DIR="$BASE_DIR/releases/$slot"
        echo "   -> Found backup at: $BACKUP_DIR"
        break
    fi
done

# Restore public/index.php if missing
if [ ! -f "$PROD_DIR/public/index.php" ]; then
    echo "   ⚠️  public/index.php MISSING — restoring..."
    if [ -n "$BACKUP_DIR" ]; then
        mkdir -p "$PROD_DIR/public"
        cp "$BACKUP_DIR/public/index.php" "$PROD_DIR/public/"
        cp "$BACKUP_DIR/public/.htaccess" "$PROD_DIR/public/" 2>/dev/null || true
        cp "$BACKUP_DIR/public/favicon.ico" "$PROD_DIR/public/" 2>/dev/null || true
        cp "$BACKUP_DIR/public/robots.txt" "$PROD_DIR/public/" 2>/dev/null || true
        echo "   -> Restored public/ from $BACKUP_DIR"
    else
        echo "   ❌ No backup slot found! public/index.php cannot be restored automatically."
        exit 1
    fi
else
    echo "   -> public/index.php OK"
fi

# Restore vendor if missing
if [ ! -d "$PROD_DIR/vendor" ]; then
    echo "   ⚠️  vendor/ MISSING — restoring..."
    if [ -n "$BACKUP_DIR" ]; then
        cp -r "$BACKUP_DIR/vendor" "$PROD_DIR/"
        echo "   -> Restored vendor/ from $BACKUP_DIR"
    else
        echo "   -> No backup, running composer install..."
        cd "$PROD_DIR"
        composer install --no-dev --optimize-autoloader --no-interaction || true
    fi
else
    echo "   -> vendor/ OK"
fi

# 3. Copy ONLY source code — NEVER touch public/index.php or vendor
echo "📦 3/7 Copying updated source files (safe — no overwrite of public/index.php)..."
cp -r "$BASE_DIR/dnp-rework/app"       "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/database"  "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/resources" "$PROD_DIR/"
cp -r "$BASE_DIR/dnp-rework/routes"    "$PROD_DIR/"
[ -d "$BASE_DIR/dnp-rework/config" ]   && cp -r "$BASE_DIR/dnp-rework/config" "$PROD_DIR/"

# 4. Build frontend (npm) in production dir
echo "🔨 4/7 Building frontend assets..."
cd "$PROD_DIR"
if [ -f "package.json" ]; then
    npm ci --prefer-offline 2>/dev/null || npm install --no-audit --no-fund
    npm run build
    echo "   -> Build OK: $(ls public/build/assets/ 2>/dev/null | wc -l) assets"
else
    echo "   -> No package.json — copying pre-built v16 bundles from repo..."
    rm -rf "$PROD_DIR/public/build"
    mkdir -p "$PROD_DIR/public/build/assets"
    cp -r "$BASE_DIR/dnp-rework/public/build/"* "$PROD_DIR/public/build/"
    echo "   -> Assets: $(ls $PROD_DIR/public/build/assets/ | wc -l) files"
fi

# 5. Link .env and storage
echo "🔗 5/7 Linking .env and storage..."
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

# 6. Fix permissions
echo "⚙️  6/7 Fixing permissions..."
sudo chmod -R 777 "$PROD_DIR/bootstrap/cache" 2>/dev/null || true
sudo chmod -R 777 "$SHARED_STORAGE" 2>/dev/null || true

# 7. Artisan
echo "🗄️  7/7 Artisan migrate & cache clear..."
cd "$PROD_DIR"
if [ -f "artisan" ]; then
    php artisan migrate --force || true
    php artisan storage:link 2>/dev/null || true
    php artisan optimize:clear || true
fi

sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true

echo "=================================================="
echo "✅ DONE! Site should be live."
echo "Assets: $(ls $PROD_DIR/public/build/assets/ 2>/dev/null | wc -l) files"
echo "public/index.php: $([ -f $PROD_DIR/public/index.php ] && echo OK || echo MISSING)"
echo "vendor: $([ -d $PROD_DIR/vendor ] && echo OK || echo MISSING)"
echo "=================================================="
