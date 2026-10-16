# VPS Deployment Guide for 2GB Low-Resource Server (VPS1)

This guide is tailored specifically for deploying this portfolio (Next.js 16 + Laravel 11/13 + Filament v5) to **VPS1 (2GB RAM, shared with MySQL, AdGuardHome, and existing PHP apps)** without causing Out-Of-Memory (OOM) crashes.

---

## 1. What the Three Core Concepts Mean

| Concept | What It Is | Why It Is Mandatory for VPS1 |
|---|---|---|
| **1. Enable Swap (2GB)** | Disk-backed overflow RAM (`/swapfile`). When physical RAM fills up, the Linux kernel temporarily swaps inactive memory to disk instead of killing processes. | VPS1 currently has **0B Swap**. The instant RAM hits 100%, the Linux kernel kills `mysqld` or `node`. A 2GB swap file prevents abrupt server crashes. |
| **2. Offload Build to CI / Local** | Building your frontend on a free GitHub Actions runner (16GB RAM) or your local laptop, then transferring only the finished build output to the VPS via `rsync`/SSH. | `next build` with TypeScript, React 19, and Three.js peaks at **1.2 GB - 1.8 GB RAM**. Running it on VPS1 (972MB available) is guaranteed to crash the machine. |
| **3. Avoid Permanent Node SSR Daemon** | Using Next.js Static Export (`output: 'export'`) so the frontend compiles into pure HTML, CSS, and client JS (`out/` folder). | A Next.js SSR server running under PM2 sits in RAM 24/7 consuming **120MB - 220MB RSS**. Serving static files via Nginx takes **0 MB** additional RAM. |

---

## 2. Server Resource Comparison

```
Standard Deployment (VPS_DEPLOYMENT_GUIDE.md):
Total RAM (1.9 GB)
┌──────────────────┬──────────────┬─────────────┬─────────────┬─────────────┬──────────────┐
│ mysqld (~385MB)  │ AdGuard(130) │ PHP-FPM(230)│ PM2 Node(200│ System(100) │ Free (~0MB)  │ 💥 OOM CRASH
└──────────────────┴──────────────┴─────────────┴─────────────┴─────────────┴──────────────┘
                       ▲ When `npm run build` runs: Spikes +1.5GB -> Kills mysqld!

Optimized Deployment (This Guide):
Total RAM (1.9 GB) + 2GB Swap Safety Net
┌──────────────────┬──────────────┬─────────────┬─────────────┬────────────────────────────┐
│ mysqld (~385MB)  │ AdGuard(130) │ PHP-FPM(250)│ System(100) │ Healthy Available (~1.1GB) │ ✅ STABLE
└──────────────────┴──────────────┴─────────────┴─────────────┴────────────────────────────┘
     (Frontend served directly by Nginx static file cache: 0MB Node process required)
```

---

## Step 1: Configure 2GB Swap on VPS1 (One-Time Setup)

SSH into VPS1 as root or sudoer:

```bash
# 1. Create a 2GB swap file
sudo fallocate -l 2G /swapfile

# 2. Secure permissions (read/write only by root)
sudo chmod 600 /swapfile

# 3. Format and activate swap
sudo mkswap /swapfile
sudo swapon /swapfile

# 4. Make it persistent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 5. Tune swappiness (10 means Linux prefers RAM and uses swap only under real pressure)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 6. Verify (Swap should now show 2.0Gi)
free -h
```

---

## Step 2: Configure Next.js for Static Export (0MB Node Daemon)

Since this portfolio fetches project listings and settings, we configure Next.js to export static files and let the client fetch from Laravel `/api`.

### 2.1 Update `frontend/next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
```

### 2.2 Verify `frontend/src/lib/api.ts`
Ensure the API URL points to the relative path `/api` so Nginx routes requests directly to the Laravel backend:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';
```

When you run `npm run build` locally or in CI, Next.js generates an `out/` folder containing pure HTML, CSS, and JS. **No PM2, no Node daemon, no port 3000 required.**

---

## Step 3: Setup Backend on VPS1 (Using Existing MySQL)

Do **NOT** install PostgreSQL. Use the existing `mysqld` service already running on VPS1.

```bash
# 1. Create database and user in existing MySQL
sudo mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS portfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'portfolio_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON portfolio_db.* TO 'portfolio_user'@'localhost';
FLUSH PRIVILEGES;
"

# 2. Clone repository to server
sudo mkdir -p /var/www/portfolio
sudo chown -R $USER:www-data /var/www/portfolio
cd /var/www/portfolio
git clone https://github.com/nantaa/portfolio.git .

# 3. Setup Laravel Backend
cd /var/www/portfolio/backend
cp .env.example .env

# Configure .env with your MySQL credentials:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=portfolio_db
# DB_USERNAME=portfolio_user
# DB_PASSWORD=STRONG_PASSWORD_HERE

composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Set storage permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## Step 4: Automate CI/CD with GitHub Actions (Offloaded Build)

Create `.github/workflows/deploy.yml` in your repository root. This workflow builds the frontend on GitHub's free 16GB runner and copies only the static files to your VPS via SSH.

```yaml
name: Build and Deploy Portfolio

on:
  push:
    branches: [ main, master ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build Next.js Static Export (Offloaded to GitHub 16GB RAM)
        working-directory: frontend
        env:
          NEXT_PUBLIC_API_URL: /api
        run: |
          npm ci
          npm run build

      - name: Deploy Frontend Static Files to VPS
        uses: easingthemes/ssh-deploy@v5.0.3
        with:
          SSH_PRIVATE_KEY: ${{ secrets.VPS_SSH_KEY }}
          REMOTE_HOST: ${{ secrets.VPS_HOST }}
          REMOTE_USER: ${{ secrets.VPS_USER }}
          SOURCE: "frontend/out/"
          TARGET: "/var/www/portfolio/frontend_dist"
          EXCLUDE: "/node_modules/"

      - name: Update Backend on VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/portfolio
            git pull origin main
            cd backend
            composer install --no-dev --optimize-autoloader
            php artisan migrate --force
            php artisan optimize:clear
            php artisan optimize
            sudo chown -R www-data:www-data storage bootstrap/cache
```

*(Add `VPS_SSH_KEY`, `VPS_HOST`, and `VPS_USER` to your GitHub Repository Secrets).*

---

## Step 5: Nginx Configuration on VPS1

Create `/etc/nginx/sites-available/portfolio.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/portfolio/frontend_dist;
    index index.html;

    client_max_body_size 20M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript image/svg+xml;

    # 1. Laravel API Backend & Filament Admin
    location ^~ /api {
        alias /var/www/portfolio/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME /var/www/portfolio/backend/public/index.php;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
        }
    }

    # Filament Admin panel routes
    location ^~ /admin {
        alias /var/www/portfolio/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME /var/www/portfolio/backend/public/index.php;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
        }
    }

    location @laravel {
        rewrite ^/(?:api|admin)(/.*)?$ /index.php?$1 last;
    }

    # 2. Next.js Static Export Assets Caching
    location /_next/static/ {
        alias /var/www/portfolio/frontend_dist/_next/static/;
        expires 365d;
        access_log off;
    }

    # 3. Frontend Static Routes (Single-Page App fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and reload Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/portfolio.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain SSL certificate via Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Summary of Results

| Metric | Original Plan | Optimized Plan |
|---|---|---|
| **Build Location** | VPS1 (crashes at 1.5GB peak) | GitHub Actions CI (16GB RAM) |
| **Node Daemon on VPS** | PM2 running `next start` (150–220MB) | None (0MB - pure Nginx static file serving) |
| **Swap Buffer** | 0B (Immediate OOM kill) | 2GB `/swapfile` (Zero crashes) |
| **Database** | New Postgres (+120MB) | Existing MySQL (0MB extra daemon) |
| **VPS Health Risk** | High (Threatens existing live sites) | Minimal (Rock solid) |
