# PANDUAN LENGKAP DEPLOYMENT DNP MONITOR V3
## VPS Ubuntu 24.04 LTS + Node.js (PM2) + SQLite + Nginx + Cloudflare SSL

Dokumen ini adalah panduan deployment teknis yang akurat untuk arsitektur aplikasi **DNP Monitor v3** (**React Vite Frontend + Express Node.js Backend + SQLite + PM2 + Nginx**):

- **Target Domain**: `monitorv3.deltaindo.co.id`
- **Target IP VPS**: `157.10.160.135`
- **Sistem Operasi**: Ubuntu 24.04 LTS (IPv4 Only)
- **Tech Stack**:
  - **Frontend**: React 19 + Vite (Folder build: `/var/www/dnp-monitor/dist`)
  - **Backend**: Node.js Express (Entry: `/var/www/dnp-monitor/server/index.js` Port `3001`)
  - **Database**: SQLite (`server/dnp.db`)
  - **Process Manager**: PM2
  - **Web Server / Reverse Proxy**: Nginx (IPv4)
  - **DNS & SSL Provider**: Cloudflare (`monitorv3.deltaindo.co.id`)

---

## DAFTAR ISI
1. [Langkah 1: Setup DNS & SSL di Cloudflare](#langkah-1-setup-dns--ssl-di-cloudflare)
2. [Langkah 2: Inisialisasi & Firewall VPS (Ubuntu 24.04 LTS)](#langkah-2-inisialisasi--firewall-vps-ubuntu-2404-lts)
3. [Langkah 3: Instalasi Node.js 20, PM2, Build Tools & Nginx](#langkah-3-instalasi-nodejs-20-pm2-build-tools--nginx)
4. [Langkah 4: Clone Repository (Branch v3) & Install Dependencies](#langkah-4-clone-repository-branch-v3--install-dependencies)
5. [Langkah 5: Build Frontend (Vite) & Menjalankan Backend (PM2)](#langkah-5-build-frontend-vite--menjalankan-backend-pm2)
6. [Langkah 6: Konfigurasi SSL Cloudflare & Nginx Reverse Proxy](#langkah-6-konfigurasi-ssl-cloudflare--nginx-reverse-proxy)
7. [Langkah 7: Verifikasi & Testing](#langkah-7-verifikasi--testing)
8. [Lampiran: Script Deploy Otomatis (CI/CD Deploy Script)](#lampiran-script-deploy-otomatis-cicd-deploy-script)

---

## LANGKAH 1: SETUP DNS & SSL DI CLOUDFLARE

### 1.1. Tambahkan DNS Record
1. Buka dashboard [Cloudflare](https://dash.cloudflare.com/) > domain **`deltaindo.co.id`**.
2. Masuk ke **DNS** > **Records** > klik **Add record**:
   - **Type**: `A`
   - **Name**: `monitorv3`
   - **IPv4 address**: `157.10.160.135`
   - **Proxy status**: `Proxied` (Awan Oranye menyala)
   - **TTL**: `Auto`
3. Klik **Save**.

### 1.2. Pengaturan SSL/TLS
1. Masuk ke menu **SSL/TLS** > **Overview** > pilih **Full (strict)** (atau **Full**).
2. Di menu **SSL/TLS** > **Edge Certificates**:
   - **Always Use HTTPS**: `ON`
   - **Automatic HTTPS Rewrites**: `ON`

### 1.3. Buat Cloudflare Origin Certificate
1. Buka menu **SSL/TLS** > **Origin Server** > klik **Create Certificate**.
2. Biarkan default (`RSA 2048`, `monitorv3.deltaindo.co.id`, `*.deltaindo.co.id`, `15 years`).
3. Klik **Create**.
4. Simpan teks yang muncul:
   - **Origin Certificate** (simpan untuk `certificate.pem`)
   - **Private Key** (simpan untuk `private.key`)

---

## LANGKAH 2: INISIALISASI & FIREWALL VPS (UBUNTU 24.04 LTS)

Login ke VPS via SSH:
```bash
ssh delta@157.10.160.135
```

### 2.1. Update Sistem & Tool Pendukung
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip zip build-essential sqlite3 ufw htop nano
```

### 2.2. Set Timezone ke WIB (Asia/Jakarta)
```bash
sudo timedatectl set-timezone Asia/Jakarta
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

## LANGKAH 3: INSTALASI NODE.JS 20, PM2, BUILD TOOLS & NGINX

### 3.1. Instal Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3.2. Instal PM2 Secara Global
```bash
sudo npm install -g pm2
pm2 -v
```

### 3.3. Instal Nginx Web Server (IPv4-Only Safe)
```bash
sudo apt install -y nginx

# Nonaktifkan listen IPv6 default agar tidak error socket di VPS IPv4-only
sudo sed -i 's/listen \[::\]:80/#listen [::]:80/g' /etc/nginx/sites-available/default 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default

sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## LANGKAH 4: CLONE REPOSITORY (BRANCH V3) & INSTALL DEPENDENCIES

### 4.1. Siapkan Direktori Web
```bash
sudo mkdir -p /var/www/dnp-monitor
sudo chown -R $USER:$USER /var/www/dnp-monitor
```

### 4.2. Clone Repository Branch v3
```bash
cd /var/www/dnp-monitor
git clone -b v3 https://github.com/nantaa/demo-dnp.git .
```

### 4.3. Install Dependencies NPM
```bash
cd /var/www/dnp-monitor
npm install
```

---

## LANGKAH 5: BUILD FRONTEND (VITE) & MENJALANKAN BACKEND (PM2)

### 5.1. Build Frontend Assets ke Folder `dist/`
```bash
cd /var/www/dnp-monitor
npm run build
```
*(Perintah ini akan mengompilasi React ke dalam folder `/var/www/dnp-monitor/dist`)*.

### 5.2. Jalankan Backend Express Server dengan PM2
```bash
cd /var/www/dnp-monitor
pm2 start server/index.js --name "dnp-monitor-api"

# Pastikan PM2 berjalan otomatis saat server reboot
pm2 startup
```
*(Copy dan jalankan perintah `sudo env PATH=...` yang ditampilkan oleh output `pm2 startup` jika diminta)*, lalu simpan state PM2:
```bash
pm2 save
```

Cek status PM2:
```bash
pm2 status
```
*Backend API sekarang aktif di `http://127.0.0.1:3001`.*

---

## LANGKAH 6: KONFIGURASI SSL CLOUDFLARE & NGINX REVERSE PROXY

### 6.1. Simpan Sertifikat SSL Cloudflare
Buat folder sertifikat:
```bash
sudo mkdir -p /etc/ssl/cloudflare
```

1. File Sertifikat Publik:
```bash
sudo nano /etc/ssl/cloudflare/monitorv3_deltaindo.pem
```
*Paste seluruh isi teks **Origin Certificate** dari Langkah 1.3, simpan (`Ctrl+O`, `Enter`, `Ctrl+X`).*

2. File Private Key:
```bash
sudo nano /etc/ssl/cloudflare/monitorv3_deltaindo.key
```
*Paste seluruh isi teks **Private Key** dari Langkah 1.3, simpan (`Ctrl+O`, `Enter`, `Ctrl+X`).*

3. Kunci hak akses:
```bash
sudo chmod 600 /etc/ssl/cloudflare/monitorv3_deltaindo.key
sudo chmod 644 /etc/ssl/cloudflare/monitorv3_deltaindo.pem
```

### 6.2. Buat File Konfigurasi Nginx
Buat file virtual host:
```bash
sudo nano /etc/nginx/sites-available/monitorv3.deltaindo.co.id
```

Masukkan konfigurasi lengkap berikut:
```nginx
# 1. HTTP Redirect ke HTTPS
server {
    listen 80;
    server_name monitorv3.deltaindo.co.id;

    return 301 https://$host$request_uri;
}

# 2. HTTPS Main Server
server {
    listen 443 ssl http2;
    server_name monitorv3.deltaindo.co.id;

    # Frontend Single Page Application (Vite Dist)
    root /var/www/dnp-monitor/dist;
    index index.html index.htm;

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

    client_max_body_size 64M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";

    # React Client-side Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests ke Backend Express (Port 3001)
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Static Assets Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    access_log /var/log/nginx/monitorv3_access.log;
    error_log /var/log/nginx/monitorv3_error.log error;
}
```

### 6.3. Aktifkan Site & Reload Nginx
```bash
# Buat symlink
sudo ln -sf /etc/nginx/sites-available/monitorv3.deltaindo.co.id /etc/nginx/sites-enabled/

# Hapus default nginx jika masih ada
sudo rm -f /etc/nginx/sites-enabled/default

# Test sintaks konfigurasi Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## LANGKAH 7: VERIFIKASI & TESTING

1. Buka browser dan akses **`https://monitorv3.deltaindo.co.id`**
2. Cek apakah halaman UI Kanban / Dashboard muncul dengan baik.
3. Buka Console DevTools (`F12`) > tab **Network** > pastikan request ke `/api/*` merespons dengan status `200 OK`.
4. Jika perlu melihat log API backend secara live:
   ```bash
   pm2 logs dnp-monitor-api
   ```

---

## LAMPIRAN: SCRIPT DEPLOY OTOMATIS (CI/CD DEPLOY SCRIPT)

Buat script auto-update di server untuk kemudahan maintenance di masa depan:

```bash
nano /var/www/dnp-monitor/deploy.sh
```

Isi dengan:
```bash
#!/bin/bash
set -e

echo "📥 [1/4] Mengambil update code terbaru dari GitHub (Branch v3)..."
cd /var/www/dnp-monitor
git pull origin v3

echo "📦 [2/4] Menginstall dependencies npm..."
npm install

echo "⚡ [3/4] Melakukan build frontend assets (Vite)..."
npm run build

echo "🔄 [4/4] Merestart backend Express API di PM2 & reload Nginx..."
pm2 restart dnp-monitor-api
sudo systemctl reload nginx

echo "✅ DEPLOYMENT BERHASIL! https://monitorv3.deltaindo.co.id siap digunakan."
```

Beri izin eksekusi:
```bash
chmod +x /var/www/dnp-monitor/deploy.sh
```

Setiap kali Anda selesai push update di komputer lokal, di server cukup jalankan satu perintah:
```bash
/var/www/dnp-monitor/deploy.sh
```
