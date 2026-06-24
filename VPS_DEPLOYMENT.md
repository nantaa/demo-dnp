# DNP Monitor - VPS Hosting & Deployment Guide

This guide provides step-by-step instructions to deploy the **DNP Monitor** (React Vite Frontend + Express Node.js Backend + SQLite Database) on a virtual private server (VPS) running Ubuntu Server (20.04 / 22.04 / 24.04 LTS).

---

## 🏗️ Deployment Architecture

In production, the application is set up as follows:
1. **Nginx** serves as the front-facing web server. It handles incoming HTTP/HTTPS traffic:
   - Serves the compiled static frontend files directly (efficiently handling assets, caching, and compression).
   - Proxies API requests (`/api/*`) to the Node.js Express backend running locally on port `3001`.
2. **PM2** (Process Manager) runs the Express backend in the background and restarts it automatically in case of crashes or system reboots.
3. **SQLite** stores the data inside the `server/dnp.db` file.

```
                  ┌──────────────────────────────────────────────┐
                  │                  Your VPS                    │
                  │                                              │
                  │            ┌──────────────────────┐          │
                  │            │     Nginx Web Server │          │
                  │            └──────────┬───────────┘          │
                  │                       │                      │
       HTTP/HTTPS │        / (Frontend)   │    /api (API Proxy)  │
 ────────────────►│      ┌────────────────┴──────────────┐       │
   (Ports 80/443) │      ▼                               ▼       │
                  │ ┌───────────────┐           ┌────────────────┐│
                  │ │ Static Assets │           │ Express Server ││
                  │ │ (dist/ folder)│           │ (PM2 Port 3001)││
                  │ └───────────────┘           └────────┬───────┘│
                  │                                      │       │
                  │                                      ▼       │
                  │                             ┌────────────────┐│
                  │                             │ SQLite Database││
                  │                             │  (server/db)   ││
                  │                             └────────────────┘│
                  └──────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before starting, ensure you have:
* An active VPS with **Ubuntu Server** (fresh installation recommended).
* A **Domain Name** (e.g., `monitor.dnp.co.id` or `dnp-monitor.yourcompany.com`) pointed to your VPS public IP address via an **A Record** in your DNS provider settings.
* Standard **SSH root/sudo access** to your VPS.

---

## 🛠️ Step-by-Step Installation

### Step 1: Connect and Update the VPS

SSH into your server and update the local package list to ensure all dependencies are up to date:

```bash
# Connect to your VPS (replace with your IP and username)
ssh root@your_vps_ip

# Update system repositories and upgrade installed packages
sudo apt update && sudo apt upgrade -y
```

---

### Step 2: Install Node.js, Git, and Build Essentials

The backend requires **Node.js LTS** (version 18 or 20). We will install it using the official NodeSource binary distribution. We also need `build-essential` and `sqlite3` to compile native SQLite modules if required.

```bash
# Download and import the NodeSource GPG key and add the repository
sudo apt install -y curl git build-essential sqlite3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify the installed versions
node -v
npm -v
```

---

### Step 3: Clone and Setup the Project

We will place the project folder in `/var/www/dnp-monitor`.

```bash
# Create the deployment directory and change ownership to your user
sudo mkdir -p /var/www/dnp-monitor
sudo chown -R $USER:$USER /var/www/dnp-monitor

# Navigate to the directory
cd /var/www/dnp-monitor

# Clone your repository (replace with your actual git repository URL)
# If using SSH, make sure your SSH keys are set up, otherwise use HTTPS:
git clone https://github.com/nantaa/demo-dnp.git .

# Install dependencies for both frontend and backend (root package.json)
npm install
```

> [!IMPORTANT]
> **Directory Permissions for SQLite**: 
> SQLite creates temporary journaling files (`dnp.db-wal` and `dnp.db-shm`) in the same directory as the database file (`/var/www/dnp-monitor/server/`). The user running the Node.js application **must** have full write permissions to the `/var/www/dnp-monitor/server` directory.

---

### Step 4: Run the Production Build

Vite compiles all React components, styles, and assets into optimized static assets.

```bash
# Build the frontend assets
npm run build
```

This command will create a `dist/` directory inside `/var/www/dnp-monitor/`. This folder contains the raw `index.html` and assets that Nginx will serve directly.

---

### Step 5: Configure the Backend Server with PM2

We will use **PM2** to run the Express API server. PM2 manages application clustering, logging, and handles automatic restarts if the server crashes or the VPS reboots.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the Express server
pm2 start server/index.js --name "dnp-monitor-api"

# Configure PM2 to launch on system startup
pm2 startup
```

Running `pm2 startup` will output a command that you **must copy and paste** into your terminal. It looks like:
`sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username`

Once you run that command, save the current process list so it persists across reboots:

```bash
# Save the running PM2 processes
pm2 save
```

#### Monitor PM2 Application Status
```bash
# Check status
pm2 status

# View real-time logs
pm2 logs dnp-monitor-api

# Restart the backend
pm2 restart dnp-monitor-api
```

---

### Step 6: Install and Configure Nginx

Nginx will serve as the HTTP reverse proxy to handle requests.

```bash
# Install Nginx
sudo apt install nginx -y
```

Create a new Nginx server configuration block for the DNP Monitor:

```bash
sudo nano /etc/nginx/sites-available/dnp-monitor
```

Paste the following configuration, replacing `monitor.yourdomain.com` with your actual domain name:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name monitor.yourdomain.com;

    # Frontend compiled assets directory
    root /var/www/dnp-monitor/dist;
    index index.html;

    # Gzip Compression settings
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;

    # Handle client-side routing in React (Single Page Application fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js Express server running on port 3001
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
    }

    # Custom logs paths
    access_log /var/log/nginx/dnp-monitor.access.log;
    error_log /var/log/nginx/dnp-monitor.error.log;
}
```

Enable the new site by creating a symlink to the `sites-enabled` directory:

```bash
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/dnp-monitor /etc/nginx/sites-enabled/

# Remove Nginx default index site configuration to avoid conflicts
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration for syntax errors
sudo nginx -t

# If syntax is OK, restart Nginx to apply changes
sudo systemctl restart nginx
```

---

### Step 7: Secure the Site with SSL/TLS (HTTPS)

Deploy a free, automatic SSL certificate using **Let's Encrypt** and **Certbot**.

```bash
# Install Certbot and the Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Obtain and install the SSL certificate
# (Certbot will automatically modify your Nginx file to enable HTTPS and force redirects)
sudo certbot --nginx -d monitor.yourdomain.com
```

Follow the prompts:
1. Enter an email address (for renewal and security notices).
2. Agree to the Terms of Service.
3. Choose whether to share your email.
4. Let's Encrypt will verify DNS, provision the certificates, and automatically configure Nginx to redirect HTTP to HTTPS.

Certbot automatically schedules a cron job to renew the certificate before it expires. You can verify it works by running:
```bash
sudo certbot renew --dry-run
```

---

## 💾 Database Maintenance & Backup Strategy

Since DNP Monitor uses **SQLite**, all data is stored inside a single file: `/var/www/dnp-monitor/server/dnp.db`. Because SQLite is in WAL (Write-Ahead Logging) mode, you should not copy the database directly during high traffic to avoid capturing a partial transaction state.

Here is a recommended script to safely backup the database using the official sqlite `.backup` tool.

### 1. Create a Backup Script

Create a script file at `/var/www/dnp-monitor/server/backup.sh`:

```bash
nano /var/www/dnp-monitor/server/backup.sh
```

Paste the following script content:

```bash
#!/bin/bash

# Configuration
DB_FILE="/var/www/dnp-monitor/server/dnp.db"
BACKUP_DIR="/var/www/dnp-monitor/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/dnp_backup_$TIMESTAMP.db"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Perform online safe backup using SQLite CLI
sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"

# Compress the backup
gzip "$BACKUP_FILE"

# Delete backups older than 30 days to save space
find "$BACKUP_DIR" -type f -name "*.db.gz" -mtime +30 -delete

echo "Backup created successfully: ${BACKUP_FILE}.gz"
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

Make the script executable:
```bash
chmod +x /var/www/dnp-monitor/server/backup.sh
```

### 2. Schedule Daily Automatic Backups

Open your crontab editor:
```bash
crontab -e
```

Add the following line at the bottom of the file to execute the backup script every night at 2:00 AM:
```cron
0 2 * * * /var/www/dnp-monitor/server/backup.sh >> /var/www/dnp-monitor/server/backup.log 2>&1
```

---

## 🔄 Updating the Application (Continuous Deployment)

When you make changes to the codebase and push them to GitHub, run these commands to update your live app:

```bash
cd /var/www/dnp-monitor

# 1. Fetch latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Rebuild the React frontend
npm run build

# 4. Restart backend processes to load new code
pm2 restart dnp-monitor-api
```

---

## 🔍 Troubleshooting & Verification

### Check Server Health endpoint
Verify the backend is serving requests properly from localhost:
```bash
curl http://localhost:3001/api/health
# Expected Output: {"ok":true,"jobs":X,"timestamp":"..."}
```

### Common Commands Quick Reference
| Service / Task | Command |
| :--- | :--- |
| **Check PM2 logs** | `pm2 logs` |
| **Restart backend app** | `pm2 restart dnp-monitor-api` |
| **Nginx Access logs** | `tail -f /var/log/nginx/dnp-monitor.access.log` |
| **Nginx Error logs** | `tail -f /var/log/nginx/dnp-monitor.error.log` |
| **Test Nginx config** | `sudo nginx -t` |
| **Reload Nginx config** | `sudo systemctl reload nginx` |
| **Inspect SQLite DB size** | `ls -la /var/www/dnp-monitor/server/` |
