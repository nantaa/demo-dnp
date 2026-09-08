# PANDUAN LENGKAP RE-DEPLOY DNP MONITOR V3
## VPS Ubuntu 24.04 LTS + Cloudflare DNS & SSL

Dokumen ini adalah panduan teknis langkah demi langkah (*step-by-step*) untuk melakukan deployment / migrasi aplikasi **DNP Monitor v3** (Laravel + Inertia React + Vite) ke VPS baru dengan konfigurasi domain dan IP berikut:

- **Target Domain / Hostname**: `monitorv3.deltaindo.co.id`
- **Target IP VPS**: `157.10.160.135`
- **Sistem Operasi**: Ubuntu 24.04 LTS (Noble Numbat)
- **Web Server & Runtime**: Nginx, PHP 8.3-FPM, MySQL 8.0 / MariaDB, Node.js 20 LTS, Composer
- **Git Repository**: `https://github.com/nantaa/demo-dnp.git` (Branch: `v3`)
- **DNS & SSL Provider**: Cloudflare (Mode: Full / Full Strict)

---

## DAFTAR ISI
1. [Langkah 1: Konfigurasi DNS & SSL di Cloudflare](#langkah-1-konfigurasi-dns--ssl-di-cloudflare)
2. [Langkah 2: Inisialisasi & Pengamanan VPS (Ubuntu 24.04 LTS)](#langkah-2-inisialisasi--pengamanan-vps-ubuntu-2404-lts)
3. [Langkah 3: Instalasi Nginx, PHP 8.3, MySQL, Composer & Node.js](#langkah-3-instalasi-nginx-php-83-mysql-composer--nodejs)
4. [Langkah 4: Konfigurasi Database MySQL](#langkah-4-konfigurasi-database-mysql)
5. [Langkah 5: Deployment Source Code Aplikasi (Branch v3)](#langkah-5-deployment-source-code-aplikasi-branch-v3)
6. [Langkah 6: Konfigurasi Environment & Build Assets](#langkah-6-konfigurasi-environment--build-assets)
7. [Langkah 7: Konfigurasi SSL Cloudflare Origin & Virtual Host Nginx](#langkah-7-konfigurasi-ssl-cloudflare-origin--virtual-host-nginx)
8. [Langkah 8: Setup Background Worker & Cron Scheduler](#langkah-8-setup-background-worker--cron-scheduler)
9. [Langkah 9: Verifikasi & Testing Aplikasi](#langkah-9-verifikasi--testing-aplikasi)
10. [Lampiran: Script Update Otomatis (CI/CD Deploy Script)](#lampiran-script-update-otomatis-cicd-deploy-script)

---

## LANGKAH 1: KONFIGURASI DNS & SSL DI CLOUDFLARE

### 1.1. Tambahkan DNS Record
1. Login ke dashboard [Cloudflare](https://dash.cloudflare.com/).
2. Pilih domain **`deltaindo.co.id`**.
3. Buka menu **DNS** > **Records**.
4. Klik **Add record**:
   - **Type**: `A`
   - **Name**: `monitorv3`
   - **IPv4 address**: `157.10.160.135`
   - **Proxy status**: `Proxied` (Awan Oranye menyala)
   - **TTL**: `Auto`
5. Klik **Save**.

### 1.2. Pengaturan Enkripsi SSL/TLS
1. Masuk ke menu **SSL/TLS** > **Overview**.
2. Ubah mode enkripsi menjadi **Full (strict)** (atau **Full** jika sertifikat sementara).
3. Buka menu **SSL/TLS** > **Edge Certificates**:
   - Aktifkan **Always Use HTTPS**: `ON`
   - Aktifkan **Automatic HTTPS Rewrites**: `ON`
   - **Minimum TLS Version**: `TLS 1.2`

### 1.3. Buat Cloudflare Origin Certificate (Direkomendasikan)
1. Buka menu **SSL/TLS** > **Origin Server**.
2. Klik **Create Certificate**.
3. Biarkan opsi default:
   - *Key type*: `RSA (2048)`
   - *Hostnames*: `monitorv3.deltaindo.co.id`, `*.deltaindo.co.id`
   - *Validity*: `15 years`
4. Klik **Create**.
5. Simpan 2 teks yang muncul ke file lokal/notepad:
   - **Origin Certificate** (simpan sebagai `certificate.pem`)
   - **Private Key** (simpan sebagai `private.key`)
   *(Teks ini akan di-paste ke VPS pada Langkah 7).*

---

## LANGKAH 2: INISIALISASI & PENGAMANAN VPS (UBUNTU 24.04 LTS)

Login ke VPS via SSH menggunakan terminal / PowerShell:
```bash
ssh delta@157.10.160.135
# atau jika menggunakan root: ssh root@157.10.160.135
```

*(Catatan: Jika muncul warning `REMOTE HOST IDENTIFICATION HAS CHANGED`, jalankan `ssh-keygen -R 157.10.160.135` di komputer lokal Anda terlebih dahulu)*.

### 2.1. Update & Upgrade Sistem
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip zip software-properties-common ufw htop nano
```

### 2.2. Set Timezone ke WIB (Asia/Jakarta)
```bash
sudo timedatectl set-timezone Asia/Jakarta
timedatectl
```

### 2.3. Konfigurasi Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## LANGKAH 3: INSTALASI NGINX, PHP 8.3, MYSQL, COMPOSER & NODE.JS

### 3.1. Instal Nginx Web Server
```bash
sudo apt install -y nginx

# Catatan penting: Jika VPS adalah IPv4-Only, nonaktifkan listen IPv6 pada default config agar tidak error:
sudo sed -i 's/listen \[::\]:80/#listen [::]:80/g' /etc/nginx/sites-available/default 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default

sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3.2. Instal PHP 8.3 & Ekstensi yang Dibutuhkan Laravel
Ubuntu 24.04 LTS sudah menyertakan PHP 8.3 sebagai default repository.
```bash
sudo apt install -y php8.3-fpm php8.3-cli php8.3-common php8.3-mysql php8.3-sqlite3 \
php8.3-zip php8.3-gd php8.3-mbstring php8.3-curl php8.3-xml php8.3-bcmath php8.3-intl
```

Sesuaikan konfigurasi PHP untuk upload file dokumen & laporan teknis:
```bash
sudo nano /etc/php/8.3/fpm/php.ini
```
Ubah baris berikut:
```ini
upload_max_filesize = 64M
post_max_size = 64M
memory_limit = 512M
max_execution_time = 300
```
Restart service PHP-FPM:
```bash
sudo systemctl restart php8.3-fpm
sudo systemctl enable php8.3-fpm
```

### 3.3. Instal Composer
```bash
cd ~
curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
sudo php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
composer --version
```

### 3.4. Instal Node.js 20 LTS & NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

## LANGKAH 4: KONFIGURASI DATABASE MYSQL

### 4.1. Instal MySQL Server
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 4.2. Buat Database & User untuk DNP Monitor
Masuk ke console MySQL:
```bash
sudo mysql
```

Jalankan query SQL berikut (menggunakan user `dnp_user` dan password `DNP123!`):
```sql
CREATE DATABASE dnp_monitor_v3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dnp_user'@'localhost' IDENTIFIED BY 'DNP123!';
GRANT ALL PRIVILEGES ON dnp_monitor_v3.* TO 'dnp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## LANGKAH 5: DEPLOYMENT SOURCE CODE APLIKASI (BRANCH V3)

### 5.1. Siapkan Direktori Web
```bash
sudo mkdir -p /var/www/dnp-monitor
sudo chown -R $USER:www-data /var/www/dnp-monitor
```

### 5.2. Clone Repository Branch v3
Clone repository langsung ke direktori `/var/www/dnp-monitor`:
```bash
cd /var/www/dnp-monitor
git clone -b v3 https://github.com/nantaa/demo-dnp.git .
```

Struktur folder di server:
- Root Project: `/var/www/dnp-monitor`
- Laravel App: `/var/www/dnp-monitor/dnp-rework`
- Web Root (Public): `/var/www/dnp-monitor/dnp-rework/public`

---

## LANGKAH 6: KONFIGURASI ENVIRONMENT & BUILD ASSETS

### 6.1. Konfigurasi File `.env`
Masuk ke folder aplikasi Laravel:
```bash
cd /var/www/dnp-monitor/dnp-rework
cp .env.example .env
nano .env
```

Sesuaikan parameter produksi berikut di dalam `.env`:
```env
APP_NAME="DNP Monitor v3"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://monitorv3.deltaindo.co.id

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dnp_monitor_v3
DB_USERNAME=dnp_user
DB_PASSWORD=DNP123!

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=public
QUEUE_CONNECTION=database
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

### 6.2. Install Composer & Generate App Key
```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
```

### 6.3. Jalankan Database Migration & Seeders
```bash
php artisan migrate --force
# (Opsional) Jika perlu data awal:
# php artisan db:seed --force
```

### 6.4. Buat Symlink Storage
```bash
php artisan storage:link
```

### 6.5. Install Node Dependencies & Build Production Assets (Vite)
```bash
npm ci
npm run build
```

### 6.6. Atur Hak Akses File & Direktori (Permissions)
```bash
sudo chown -R www-data:www-data /var/www/dnp-monitor
sudo find /var/www/dnp-monitor -type f -exec chmod 644 {} \;
sudo find /var/www/dnp-monitor -type d -exec chmod 755 {} \;
sudo chmod -R 775 /var/www/dnp-monitor/dnp-rework/storage
sudo chmod -R 775 /var/www/dnp-monitor/dnp-rework/bootstrap/cache
```

---

## LANGKAH 7: KONFIGURASI SSL CLOUDFLARE ORIGIN & VIRTUAL HOST NGINX

### 7.1. Simpan Sertifikat SSL Cloudflare
Buat folder sertifikat:
```bash
sudo mkdir -p /etc/ssl/cloudflare
```

1. Buat file sertifikat publik:
```bash
sudo nano /etc/ssl/cloudflare/monitorv3_deltaindo.pem
```
*Paste seluruh isi teks **Origin Certificate** dari Langkah 1.3, simpan (`Ctrl+O`, `Enter`, `Ctrl+X`).*

2. Buat file private key:
```bash
sudo nano /etc/ssl/cloudflare/monitorv3_deltaindo.key
```
*Paste seluruh isi teks **Private Key** dari Langkah 1.3, simpan (`Ctrl+O`, `Enter`, `Ctrl+X`).*

3. Kunci hak akses private key:
```bash
sudo chmod 600 /etc/ssl/cloudflare/monitorv3_deltaindo.key
sudo chmod 644 /etc/ssl/cloudflare/monitorv3_deltaindo.pem
```

### 7.2. Buat Nginx Server Block Configuration (IPv4-Only)
Buat file konfigurasi Nginx:
```bash
sudo nano /etc/nginx/sites-available/monitorv3.deltaindo.co.id
```

Masukkan konfigurasi lengkap berikut:
```nginx
# HTTP - Redirect seluruh request ke HTTPS
server {
    listen 80;
    server_name monitorv3.deltaindo.co.id;

    return 301 https://$host$request_uri;
}

# HTTPS - Konfigurasi Utama Laravel + Cloudflare SSL
server {
    listen 443 ssl http2;
    server_name monitorv3.deltaindo.co.id;

    root /var/www/dnp-monitor/dnp-rework/public;
    index index.php index.html index.htm;

    # SSL Cloudflare Origin Certificates
    ssl_certificate /etc/ssl/cloudflare/monitorv3_deltaindo.pem;
    ssl_certificate_key /etc/ssl/cloudflare/monitorv3_deltaindo.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Upload Size Limit (sesuai kebutuhan upload laporan teknis / dokumen)
    client_max_body_size 64M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    # FastCGI PHP-FPM 8.3
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    # Block akses ke hidden files (.env, .git, dll)
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets Vite
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    access_log /var/log/nginx/monitorv3_access.log;
    error_log /var/log/nginx/monitorv3_error.log error;
}
```

### 7.3. Aktifkan Site & Uji Konfigurasi Nginx
```bash
# Aktifkan symlink
sudo ln -sf /etc/nginx/sites-available/monitorv3.deltaindo.co.id /etc/nginx/sites-enabled/

# Hapus default nginx site (jika ada)
sudo rm -f /etc/nginx/sites-enabled/default

# Test sintaks Nginx
sudo nginx -t
```
*Jika output menampilkan `syntax is ok` dan `test is successful`:*
```bash
sudo systemctl reload nginx
```

---

## LANGKAH 8: SETUP BACKGROUND WORKER & CRON SCHEDULER

### 8.1. Setup Systemd Service untuk Laravel Queue Worker
Agar proses pengolahan PDF, notifikasi, dan split job di background berjalan otomatis tanpa henti:

Buat file unit service:
```bash
sudo nano /etc/systemd/system/dnp-worker.service
```

Isi dengan:
```ini
[Unit]
Description=DNP Monitor Laravel Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/dnp-monitor/dnp-rework/artisan queue:work --sleep=3 --tries=3 --max-time=3600
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Aktifkan service worker:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dnp-worker
sudo systemctl start dnp-worker
sudo systemctl status dnp-worker
```

### 8.2. Setup Cron Scheduler Laravel
Jalankan scheduler Laravel setiap menit:
```bash
sudo crontab -u www-data -e
```
Tambahkan baris berikut di bagian paling bawah:
```cron
* * * * * cd /var/www/dnp-monitor/dnp-rework && php artisan schedule:run >> /dev/null 2>&1
```

### 8.3. Cache Optimasi Produksi Laravel
Jalankan caching konfigurasi & routing agar aplikasi berjalan sangat cepat:
```bash
cd /var/www/dnp-monitor/dnp-rework
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## LANGKAH 9: VERIFIKASI & TESTING APLIKASI

Lakukan pengujian menyeluruh:

1. **Buka Browser**: Akses `https://monitorv3.deltaindo.co.id`
   - Pastikan gembok SSL valid (dikeluarkan oleh Cloudflare).
   - Pastikan halaman login / dashboard tampil rapi tanpa error asset 404.
2. **Cek Storage & Upload**:
   - Coba upload dokumen / attachment surat tugas atau form inspection.
   - Pastikan file tersimpan di `storage/app/public` dan dapat diunduh via URL.
3. **Cek Log Error jika ada kendala**:
   ```bash
   # Log Laravel
   tail -n 100 -f /var/www/dnp-monitor/dnp-rework/storage/logs/laravel.log

   # Log Nginx Error
   tail -n 100 -f /var/log/nginx/monitorv3_error.log
   ```

---

## LAMPIRAN: SCRIPT UPDATE OTOMATIS (CI/CD DEPLOY SCRIPT)

Untuk mempermudah update kode di masa mendatang tanpa perlu mengetik ulang semua perintah, buat script deploy di server:

```bash
nano /var/www/dnp-monitor/deploy.sh
```

Isi dengan:
```bash
#!/bin/bash
set -e

echo "🚀 [1/6] Mengaktifkan mode maintenance..."
cd /var/www/dnp-monitor/dnp-rework
php artisan down || true

echo "📥 [2/6] Mengambil update code dari Git (Branch v3)..."
git pull origin v3

echo "📦 [3/6] Mengupdate dependency Composer..."
composer install --no-dev --optimize-autoloader

echo "🗄️ [4/6] Menjalankan Database Migration..."
php artisan migrate --force

echo "⚡ [5/6] Building Frontend Assets (Vite)..."
npm ci
npm run build

echo "🧹 [6/6] Clearing & Rebuilding Caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "🔄 Restarting Queue Worker & PHP-FPM..."
sudo systemctl restart dnp-worker
sudo systemctl reload php8.3-fpm
sudo systemctl reload nginx

php artisan up
echo "✅ DEPLOYMENT BERHASIL! https://monitorv3.deltaindo.co.id sudah live."
```

Beri izin eksekusi:
```bash
chmod +x /var/www/dnp-monitor/deploy.sh
```

Setiap kali ada update code di masa depan, cukup jalankan:
```bash
/var/www/dnp-monitor/deploy.sh
```
