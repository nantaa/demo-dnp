# Future Feature Requirements & Pending Revisions

## Pending Requirements (Not Implemented Yet as Requested)

1. **Ubah Label "Jumlah Unit" Menjadi "Jumlah"**
   - **Lokasi**: Form Buat Job Baru (`Create.jsx`) & Detail Job Sheet (`JobDetailSheet.jsx`).
   - **Deskripsi**: Mengubah label input dari "Jumlah Unit" menjadi hanya "Jumlah" agar lebih umum dan fleksibel untuk berbagai jenis satuan.

2. **Tambah Input "Satuan" Setelah Input "Jumlah"**
   - **Lokasi**: Tepat di sebelah / setelah input "Jumlah" pada Form Buat Job Baru & Detail Job.
   - **Pilihan Dropdown/Select**: `Unit`, `Lot`, `Lusin`, dll.
   - **Skema Database (Perencanaan Next Sprint)**:
     - Tambah kolom `satuan` (string / enum) pada tabel `jobs` (default: `'Unit'`).
     - Update controller `store` & `update` untuk memvalidasi dan menyimpan kolom `satuan`.
