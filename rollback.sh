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

echo "=================================================="
echo "⏪ Melakukan Instant Rollback ke slot: $ROLLBACK_SLOT..."
echo "Target path: $ROLLBACK_DIR"
echo "=================================================="

ln -sfn "$ROLLBACK_DIR" "$CURRENT_LINK"
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || sudo service php8.2-fpm reload 2>/dev/null || true
cd "$CURRENT_LINK"
php artisan optimize:clear 2>/dev/null || true

echo "✅ ROLLBACK SUKSES! Aplikasi kembali aktif di slot: $ROLLBACK_SLOT"
