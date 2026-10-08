# Panduan Konfigurasi Email Google Workspace (DNP Monitor)

Dokumen ini memandu Anda menghubungkan akun email resmi Google Workspace (misal: `notifikasi@deltaindo.co.id` atau `admin@deltaindo.co.id`) ke sistem **MORIKU (DNP Monitor)** untuk pengiriman rekap harian otomatis (**08:00 WIB** & **16:00 WIB**).

---

## Langkah 1: Buat "App Password" (Sandi Aplikasi) di Akun Google

> ⚠️ **PENTING:** Jangan gunakan password login akun Google Anda secara langsung. Google mewajibkan penggunaan **16-karakter App Password** untuk koneksi SMTP dari server.

1. Buka [https://myaccount.google.com/](https://myaccount.google.com/) dan login menggunakan akun email Google Workspace pengirim Anda.
2. Di menu kiri, pilih **Keamanan (Security)**.
3. Pastikan **Verifikasi 2 Langkah (2-Step Verification)** sudah aktif.
4. Cari menu **Sandi Aplikasi (App Passwords)**:
   * *(Jika tidak terlihat di menu, ketik "Sandi Aplikasi" atau "App Passwords" di kolom pencarian atas halaman Akun Google).*
5. Pada kolom *Nama Aplikasi*, ketik: `DNP Monitor Server`.
6. Klik **Buat (Create)**.
7. Google akan menampilkan **16 karakter acak** (contoh: `abcd efgh ijkl mnop`).
8. **Salin kode 16 karakter ini** (tanpa spasi). Simpan dengan aman.

---

## Langkah 2: Konfigurasi File `.env` di Server

Buka file `.env` aplikasi Anda (di `dnp-rework/.env`), lalu isi konfigurasi `MAIL_*` berikut:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email-pengirim-anda@deltaindo.co.id
MAIL_PASSWORD=abcdefghijklmnop
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=email-pengirim-anda@deltaindo.co.id
MAIL_FROM_NAME="DNP Monitor"
```

*Ganti `email-pengirim-anda@deltaindo.co.id` dengan email Google Workspace Anda, dan ganti `abcdefghijklmnop` dengan 16 karakter App Password dari Langkah 1.*

Simpan file `.env`, lalu jalankan:
```bash
php artisan config:clear
```

---

## Langkah 3: Uji Coba Simulasi (Dry-Run / Tanpa Kirim Email)

Sebelum mengirim email sungguhan, Anda dapat melihat daftar penerima dan rekap tugas langsung di terminal:

```bash
# Simulasi Edisi Pagi (08:00 WIB)
php artisan report:daily-digest --time=morning --dry-run

# Simulasi Edisi Sore (16:00 WIB)
php artisan report:daily-digest --time=afternoon --dry-run
```

Sistem akan menampilkan tabel terminal berisi nama karyawan, email, role, jumlah pekerjaan yang sedang menunggu tindakan mereka, dan status validasi.

---

## Langkah 4: Uji Coba Kirim ke 1 User Tertentu

Untuk memastikan koneksi SMTP Google Workspace bekerja dengan baik tanpa mengirim ke semua karyawan:

```bash
# Ganti angka 1 dengan ID user Anda
php artisan report:daily-digest --time=morning --user=1
```

Periksa kotak masuk (Inbox) email penerima tersebut.

---

## Langkah 5: Otomasi Penjadwalan di Server (Linux Cron)

Sistem sudah diatur untuk otomatis berjalan setiap **Hari Kerja (Senin–Jumat)**:
* **08:00 WIB:** Agenda Pekerjaan & Target Hari Ini
* **16:00 WIB:** Rekap Pekerjaan Tertunda Sebelum Pulang Kantor

Pastikan Linux crontab di server VPS Anda sudah memanggil scheduler Laravel:
```bash
# Edit crontab server
crontab -e

# Tambahkan baris ini di paling bawah:
* * * * * cd /var/www/dnp-production && php artisan schedule:run >> /dev/null 2>&1
```

---

## Fitur Anti-Spam & Keamanan Bawaan

1. **Suppression Nol Tugas:** Karyawan yang tidak memiliki pekerjaan aktif pada hari tersebut **tidak akan dikirimi email** (mencegah email kosong).
2. **Pencegahan Duplikat (Idempotency):** Sistem mencatat cache pengiriman selama 6 jam. Jika cron tidak sengaja terpanggil 2 kali, email kedua otomatis dibatalkan.
3. **Throttling Socket SMTP:** Terdapat jeda 250ms antar email agar tidak memicu deteksi burst spam dari Google.
4. **Format Tabel Standar:** Tampilan email menggunakan struktur HTML tabel yang kompatibel dengan Microsoft Outlook, Gmail App, dan Apple Mail.
