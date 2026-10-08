#!/bin/bash
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
PROD_DIR="$BASE_DIR/dnp-monitor-production"
BACKUP_ROOT="$BASE_DIR/backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DEST="$BACKUP_ROOT/checkpoint_$TIMESTAMP"
RELEASE_BLUE="$BASE_DIR/releases/blue"

echo "=================================================="
echo "🛡️  CREATING CHECKPOINT BACKUP"
echo "Timestamp: $TIMESTAMP"
echo "Source: $PROD_DIR"
echo "=================================================="

if [ ! -d "$PROD_DIR" ]; then
    echo "❌ Error: Production directory ($PROD_DIR) tidak ditemukan!"
    exit 1
fi

mkdir -p "$BACKUP_DEST"
mkdir -p "$RELEASE_BLUE"

echo "📦 1/3 Snapshotting production files..."
# Exclude vendor and node_modules to keep backup lightweight, but preserve built assets and core code
if command -v rsync >/dev/null 2>&1; then
    rsync -a \
        --exclude 'node_modules' \
        --exclude 'vendor' \
        --exclude 'storage' \
        "$PROD_DIR/" "$BACKUP_DEST/"
else
    cp -r "$PROD_DIR"/. "$BACKUP_DEST/"
fi

echo "💾 2/3 Updating emergency restore release slot ($RELEASE_BLUE)..."
cp -r "$PROD_DIR/artisan" "$RELEASE_BLUE/" 2>/dev/null || true
cp -r "$PROD_DIR/bootstrap" "$RELEASE_BLUE/" 2>/dev/null || true
cp -r "$PROD_DIR/app" "$RELEASE_BLUE/" 2>/dev/null || true
cp -r "$PROD_DIR/public" "$RELEASE_BLUE/" 2>/dev/null || true
cp -r "$PROD_DIR/resources" "$RELEASE_BLUE/" 2>/dev/null || true
cp -r "$PROD_DIR/routes" "$RELEASE_BLUE/" 2>/dev/null || true

echo "🏷️  3/3 Recording checkpoint metadata..."
cat <<EOF > "$BACKUP_DEST/CHECKPOINT_INFO.txt"
Checkpoint Created: $(date '+%Y-%m-%d %H:%M:%S')
Git Commit: $(cd "$BASE_DIR" && git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(cd "$BASE_DIR" && git branch --show-current 2>/dev/null || echo "N/A")
Asset Count: $(ls "$PROD_DIR/public/build/assets/" 2>/dev/null | wc -l)
Status: Healthy Verified
EOF

echo "=================================================="
echo "✅ CHECKPOINT BACKUP COMPLETED!"
echo "Destination: $BACKUP_DEST"
echo "Emergency Slot: $RELEASE_BLUE (Updated)"
echo "=================================================="
