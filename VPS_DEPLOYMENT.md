# DNP Monitor V3 — Production VPS Hosting & Deployment Guide

> **Version:** 3.0.0 (Supports 17-Column Kanban & Stage Rail + Work Queue Views)\
> **Target OS:** Ubuntu Server 22.04 / 24.04 LTS\
> **Stack:** React 18 (Vite SPA) + Inertia Client + Express.js Node Backend (Port 3001) + SQLite (WAL Mode) + Nginx + PM2 + Cloudflare / Let's Encrypt SSL

---

## 1. Production Architecture Overview

The DNP Monitor production stack separates static asset delivery from backend REST and Inertia JSON endpoints:

```text
                           ┌──────────────────────────────────────────────────────────┐
                           │                     CLOUDFLARE CDN                       │
                           │   (DNS + DDoS Protection + Full Strict SSL + WAF)        │
                           └────────────────────────────┬─────────────────────────────┘
                                                        │ HTTPS (Port 443)
                                                        ▼
                           ┌──────────────────────────────────────────────────────────┐
                           │                     YOUR UBUNTU VPS                      │
                           │                                                          │
                           │                 ┌──────────────────────┐                 │
                           │                 │   Nginx Web Server   │                 │
                           │                 └──────────┬───────────┘                 │
                           │                            │                             │
                           │         ┌──────────────────┴──────────────────┐          │
                           │         ▼                                     ▼          │
                           │  Static SPA Assets                  Inertia & REST API   │
                           │  (try_files /index.html)            (/api, /kanban, ...) │
                           │  /var/www/dnp-monitor/dist          Proxy to Port 3001   │
                           │                                               │          │
                           │                                               ▼          │
                           │                                     ┌──────────────────┐ │
                           │                                     │  PM2 Cluster /   │ │
                           │                                     │  Express Server  │ │
                           │                                     └────────┬─────────┘ │
                           │                                              │           │
                           │                                              ▼           │
                           │                                     ┌──────────────────┐ │
                           │                                     │  SQLite Database │ │
                           │                                     │  (server/dnp.db) │ │
                           │                                     └──────────────────┘ │
                           └──────────────────────────────────────────────────────────┘
```

---

## 2. Server Preparation & System Prerequisites

### Step 1: Connect and Update VPS Packages
```bash
# Connect to your VPS via SSH
ssh root@YOUR_SERVER_IP

# Update system repositories and upgrade base packages
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 20 LTS, Git, and Build Essentials
`better-sqlite3` requires C++ build tools (`gcc`, `g++`, `make`, `python3`) to compile native bindings during `npm install`.

```bash
# Install core build utilities and sqlite3 tools
sudo apt install -y curl git build-essential sqlite3 python3

# Install Node.js 20.x LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Expected: v20.x.x
npm -v    # Expected: 10.x.x
```

### Step 3: Install Process Manager (PM2) Globally
```bash
sudo npm install -g pm2
```

---

## 3. Application Setup & Deployment Directory

### Step 1: Create App Directory & Configure Permissions
```bash
# Create dedicated web root
sudo mkdir -p /var/www/dnp-monitor
sudo chown -R $USER:$USER /var/www/dnp-monitor

# Navigate into directory
cd /var/www/dnp-monitor
```

### Step 2: Clone Codebase from Git
```bash
# Clone the repository
git clone https://github.com/nantaa/demo-dnp.git .

# Install dependencies (root package.json includes all Vite + Express + Inertia modules)
npm install
```

### Step 3: Run Automated Verification Test Suite
Before compiling for production, verify that all test suites pass on the server environment:
```bash
npm test
# Expected Output: 65 tests passing across 27 suites (0 failures)
```

### Step 4: Compile Production Frontend Assets
```bash
npm run build
```
This compiles all React components, icons, and Tailwind utility classes into `/var/www/dnp-monitor/dist/`.

---

## 4. Backend Process Management (PM2)

### Step 1: Start Express Backend under PM2
```bash
# Start backend server under PM2 on port 3001
pm2 start server/index.js --name "dnp-monitor"

# Configure PM2 to auto-start on server reboot
pm2 startup
```
*Copy and run the `sudo env PATH=...` command generated by `pm2 startup`.*

### Step 2: Save PM2 State
```bash
pm2 save
```

### Useful PM2 Commands
```bash
pm2 status                  # Check process health and CPU/Memory usage
pm2 logs dnp-monitor        # View real-time output and error logs
pm2 reload dnp-monitor      # Zero-downtime reload
pm2 restart dnp-monitor     # Hard restart
```

---

## 5. Nginx Reverse Proxy Configuration

> [!IMPORTANT]
> **Inertia.js Routing Gotcha:**\
> DNP Monitor uses Inertia SPA routing. When a user requests `/kanban`, `/stage-rail`, or `/jobs` directly in a browser, Nginx serves `dist/index.html`. When React makes background data fetches (`X-Inertia: true`) or API calls, Nginx **must** proxy them to port `3001`.

### Step 1: Install Nginx
```bash
sudo apt install nginx -y
```

### Step 2: Create Site Configuration File
```bash
sudo nano /etc/nginx/sites-available/dnp-monitor
```

Paste the complete configuration block below (replace `monitor.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name monitor.yourdomain.com;

    # Static assets compiled from Vite
    root /var/www/dnp-monitor/dist;
    index index.html;

    # Gzip Compression for maximum page speed
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Maximum file upload size for documents/photos (BAP, Surat Tugas, LHPP, Suket)
    client_max_body_size 25M;

    # 1. Static Assets Cache Optimization
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # 2. Uploaded Documents Storage (PDF, JPG, PNG)
    location /storage/ {
        alias /var/www/dnp-monitor/server/storage/;
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    # 3. Express REST API & Health Check Proxies
    location ~ ^/(api|notifications)/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 4. Inertia Endpoints & Mutating Routes (Jobs, Kanban, Stage Rail)
    location ~ ^/(jobs|kanban|stage-rail) {
        # If request is an Inertia background JSON request or a mutating POST/PUT/DELETE
        if ($http_x_inertia = "true") {
            proxy_pass http://127.0.0.1:3001;
            break;
        }
        if ($request_method != GET) {
            proxy_pass http://127.0.0.1:3001;
            break;
        }

        # Otherwise serve SPA frontend entry point
        try_files $uri $uri/ /index.html;
    }

    # 5. SPA Fallback for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Custom Logging Paths
    access_log /var/log/nginx/dnp_monitor_access.log;
    error_log /var/log/nginx/dnp_monitor_error.log;
}
```

### Step 3: Enable Site & Test Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/dnp-monitor /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Verify Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 6. SSL / HTTPS Setup

### Option A: Automatic Let's Encrypt (Certbot)
```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL Certificate (Certbot automatically updates Nginx configuration)
sudo certbot --nginx -d monitor.yourdomain.com

# Test automated certificate renewal
sudo certbot renew --dry-run
```

### Option B: Cloudflare SSL (Full / Strict Mode)
If using Cloudflare:
1. In Cloudflare Dashboard $\rightarrow$ **SSL/TLS** $\rightarrow$ Set encryption mode to **Full (strict)**.
2. In **SSL/TLS** $\rightarrow$ **Origin Server** $\rightarrow$ Create Certificate $\rightarrow$ Save `cert.pem` and `key.pem` on your VPS at `/etc/ssl/certs/dnp.pem` and `/etc/ssl/private/dnp.key`.
3. In Nginx configuration, point `ssl_certificate` and `ssl_certificate_key` to those files.

---

## 7. SQLite Maintenance & Safe Automated Backups

Since SQLite operates with Write-Ahead Logging (WAL), copying `dnp.db` directly during live traffic may cause data corruption. Use SQLite's online `.backup` command.

### Step 1: Create Backup Script
```bash
nano /var/www/dnp-monitor/server/backup.sh
```

Paste the following script:
```bash
#!/bin/bash
set -e

DB_PATH="/var/www/dnp-monitor/server/dnp.db"
BACKUP_DIR="/var/www/dnp-monitor/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
TARGET_FILE="$BACKUP_DIR/dnp_backup_$DATE.db"

mkdir -p "$BACKUP_DIR"

# Online safe SQLite backup
sqlite3 "$DB_PATH" ".backup '$TARGET_FILE'"

# Compress backup
gzip "$TARGET_FILE"

# Rotate: remove backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.db.gz" -mtime +30 -delete

echo "[$(date)] Backup completed successfully: ${TARGET_FILE}.gz"
```

### Step 2: Make Executable and Schedule Cron Job
```bash
chmod +x /var/www/dnp-monitor/server/backup.sh

# Open crontab
crontab -e
```
Add this entry to run the backup every night at 02:00 AM:
```cron
0 2 * * * /var/www/dnp-monitor/server/backup.sh >> /var/www/dnp-monitor/backups/backup.log 2>&1
```

---

## 8. One-Click Continuous Deployment Script (`deploy.sh`)

Create an automated deployment script in the project root to update the app with zero downtime whenever changes are pushed to GitHub:

```bash
nano /var/www/dnp-monitor/deploy.sh
```

Paste:
```bash
#!/bin/bash
set -e

echo "🚀 Starting DNP Monitor V3 Deployment..."

cd /var/www/dnp-monitor

echo "📥 1. Pulling latest commits from GitHub..."
git pull origin main

echo "📦 2. Installing dependencies..."
npm install

echo "🧪 3. Running automated test suite..."
npm test

echo "🏗️ 4. Building production frontend bundle..."
npm run build

echo "🔄 5. Reloading backend with zero downtime..."
pm2 reload dnp-monitor

echo "🌐 6. Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
```

Make it executable:
```bash
chmod +x /var/www/dnp-monitor/deploy.sh
```

Whenever you want to deploy an update in the future, simply run:
```bash
./deploy.sh
```

---

## 9. Deployment Verification & Troubleshooting Checklist

| Check | Command | Expected Result |
| :--- | :--- | :--- |
| **1. Backend Health Check** | `curl http://localhost:3001/api/health` | `{"ok":true,"jobs":X,...}` |
| **2. PM2 Status** | `pm2 status` | `dnp-monitor` status is `online` |
| **3. Test Suite Integrity** | `npm test` | `pass 65, fail 0` |
| **4. Nginx Configuration** | `sudo nginx -t` | `syntax is ok, test is successful` |
| **5. Nginx Error Logs** | `tail -f /var/log/nginx/dnp_monitor_error.log` | No 502/504 errors |
| **6. Stage Rail Endpoint** | `curl -H "x-inertia: true" http://localhost:3001/stage-rail` | Returns JSON with `"component":"StageRail/Index"` |
| **7. Kanban Endpoint** | `curl -H "x-inertia: true" http://localhost:3001/kanban` | Returns JSON with `"component":"Kanban/Index"` |
