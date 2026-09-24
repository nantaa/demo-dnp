# DNP Monitor — Blue-Green & Zero-Downtime Deployment Guide (VPS: RiksaUjiServer)

> **Spesifikasi Server VPS:**\
> **Host / User:** `delta@RiksaUjiServer`\
> **Base Directory:** `/var/www/demo-dnp/demo-dnp`\
> **Production Target:** `/var/www/demo-dnp/demo-dnp/dnp-monitor-production` (Symlink Aktif)\
> **Repository:** `/var/www/demo-dnp/demo-dnp/` (Repo clone)

---

## 1. Konsep Blue-Green Deployment

Nginx tetap mengarah ke `/var/www/demo-dnp/demo-dnp/dnp-monitor-production/public`. Folder `dnp-monitor-production` dijadikan **Symlink Aktif** yang bergantian mengarah ke `releases/blue` atau `releases/green`.

```text
/var/www/demo-dnp/demo-dnp/
├── .env.shared                        # File .env master bersama
├── shared-storage/                    # Folder upload dokumen/BAP bersama (persistent)
│   ├── app/public/
│   ├── framework/
│   └── logs/
├── releases/
│   ├── blue/                          # Slot Release A
│   └── green/                         # Slot Release B
└── dnp-monitor-production -> /var/www/demo-dnp/demo-dnp/releases/blue  # <-- Symlink yang dibaca Nginx
```

---

## 2. Cara Deploy & Seamless Switching

Script `deploy.sh` dan `rollback.sh` tersedia langsung di dalam repository.

### A. Deploy Versi `main` (Produksi Utama):
```bash
cd /var/www/demo-dnp/demo-dnp
git pull origin main
./deploy.sh main
```

### B. Deploy Versi Modular Refactor (`main-refactor`):
```bash
cd /var/www/demo-dnp/demo-dnp
git pull origin main-refactor
./deploy.sh main-refactor
```

---

## 3. Cara Rollback Instan (0.001 Detik)

Jika slot yang baru dideploy bermasalah dan ingin langsung kembali ke slot sebelumnya:
```bash
cd /var/www/demo-dnp/demo-dnp
./rollback.sh
```
