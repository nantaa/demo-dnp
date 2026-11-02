#!/bin/bash
set -e

echo "=================================================="
echo "🕒 Setting Ubuntu VPS Timezone to Asia/Jakarta (WIB)"
echo "=================================================="

# 1. Set system timezone to Asia/Jakarta (UTC+7)
sudo timedatectl set-timezone Asia/Jakarta

# 2. Restart services that rely on system clock
sudo systemctl restart cron 2>/dev/null || true
sudo systemctl restart rsyslog 2>/dev/null || true
sudo systemctl reload php8.2-fpm 2>/dev/null || sudo systemctl reload php8.3-fpm 2>/dev/null || true

# 3. Print verified current time
echo ""
echo "✅ Timezone successfully updated:"
timedatectl
echo ""
echo "Current Date & Time:"
date
echo "=================================================="
