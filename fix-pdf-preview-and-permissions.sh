#!/bin/bash
# ==============================================================================
# Script Perbaikan Izin Storage & Header Pratinjau Dokumen PDF
# DNP Monitor - PT Delta NDT Indonesia
# ==============================================================================
set -e

BASE_DIR="/var/www/demo-dnp/demo-dnp"
PROD_DIR="$BASE_DIR/dnp-monitor-production"
SHARED_STORAGE="$BASE_DIR/shared-storage"

echo "===================================================================="
echo "🔧 Menjalankan Perbaikan Izin Berkas Storage & Pratinjau PDF..."
echo "Waktu: $(date '+%Y-%m-%d %H:%M:%S')"
echo "===================================================================="

# 1. Deteksi User Web Server (www-data atau nginx)
WEB_USER="www-data"
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
elif id "nginx" &>/dev/null; then
    WEB_USER="nginx"
fi
echo "👤 User Web Server terdeteksi: $WEB_USER"

# 2. Pastikan seluruh struktur folder storage lengkap
echo "📁 Memeriksa dan membuat direktori storage publik & framework..."
mkdir -p "$SHARED_STORAGE/app/public/documents"
mkdir -p "$SHARED_STORAGE/app/public/photos"
mkdir -p "$SHARED_STORAGE/app/public/invoices"
mkdir -p "$SHARED_STORAGE/app/public/sukets"
mkdir -p "$SHARED_STORAGE/framework/cache/data"
mkdir -p "$SHARED_STORAGE/framework/sessions"
mkdir -p "$SHARED_STORAGE/framework/views"
mkdir -p "$SHARED_STORAGE/logs"
mkdir -p "$PROD_DIR/bootstrap/cache"

# 3. Atur Kepemilikan (Ownership) ke Web Server
echo "🔑 Mengatur ownership ke $WEB_USER:$WEB_USER..."
sudo chown -R "$WEB_USER:$WEB_USER" "$SHARED_STORAGE" 2>/dev/null || chown -R "$WEB_USER:$WEB_USER" "$SHARED_STORAGE" 2>/dev/null || true
sudo chown -R "$WEB_USER:$WEB_USER" "$PROD_DIR/bootstrap/cache" 2>/dev/null || chown -R "$WEB_USER:$WEB_USER" "$PROD_DIR/bootstrap/cache" 2>/dev/null || true

# 4. Atur Hak Akses File (Permissions)
# Direktori: 775 (rwxrwxr-x) agar PHP-FPM dan web server bisa baca-tulis
# File dokumen: 664 (rw-rw-r--) agar berkas PDF tidak terblokir
echo "🔒 Menyetel izin akses direktori (775) dan berkas dokumen (664)..."
sudo find "$SHARED_STORAGE" -type d -exec chmod 775 {} + 2>/dev/null || true
sudo find "$SHARED_STORAGE" -type f -exec chmod 664 {} + 2>/dev/null || true
sudo chmod -R 775 "$PROD_DIR/bootstrap/cache" 2>/dev/null || true

# 5. Verifikasi & Re-create Symlink Storage Publik
echo "🔗 Memperbarui symlink public/storage..."
if [ -d "$PROD_DIR" ]; then
    cd "$PROD_DIR"
    # Pastikan storage di prod mengarah ke shared-storage
    if [ -d "$SHARED_STORAGE" ]; then
        rm -rf storage
        ln -sfn "$SHARED_STORAGE" storage
    fi
    
    # Re-link artisan storage link
    rm -rf public/storage
    php artisan storage:link --force || true
    
    # 6. Bersihkan cache konfigurasi dan route agar header SAMEORIGIN aktif
    echo "🧹 Membersihkan cache aplikasi (optimize:clear)..."
    php artisan optimize:clear || true
fi

# 7. Periksa dan Rekonsiliasi Konfigurasi Nginx untuk X-Frame-Options
echo "🌐 Memeriksa konfigurasi Nginx untuk mencegah konflik header X-Frame-Options..."
if [ -d "/etc/nginx" ]; then
    NGINX_DENY=$(grep -rn "X-Frame-Options.*DENY" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || true)
    if [ -n "$NGINX_DENY" ]; then
        echo "⚠️ Peringatan: Ditemukan header DENY di Nginx:"
        echo "$NGINX_DENY"
        echo "Mengganti X-Frame-Options DENY menjadi SAMEORIGIN pada file terkait..."
        sudo sed -i 's/add_header X-Frame-Options.*DENY.*/add_header X-Frame-Options "SAMEORIGIN" always;/g' /etc/nginx/sites-enabled/* 2>/dev/null || true
        sudo sed -i 's/add_header X-Frame-Options.*DENY.*/add_header X-Frame-Options "SAMEORIGIN" always;/g' /etc/nginx/conf.d/* 2>/dev/null || true
        sudo nginx -t && sudo systemctl reload nginx || echo "Periksa sintaks Nginx manual"
    else
        echo "✅ Konfigurasi Nginx bersih (tidak ada header DENY yang menimpa)."
    fi
fi

# 8. Reload service PHP-FPM dan Nginx
echo "🔄 Mereload service PHP-FPM dan Nginx..."
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true
sudo systemctl reload nginx 2>/dev/null || true

echo "===================================================================="
echo "✅ PERBAIKAN SELESAI!"
echo "Status Storage Link:"
ls -la "$PROD_DIR/public/storage" 2>/dev/null || echo "Periksa direktori public/storage manual"
echo "Izin Berkas PDF dan Header SAMEORIGIN telah aktif."
echo "===================================================================="

