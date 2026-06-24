<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlatUji;
use App\Models\SertifikatPjk3;
use App\Models\RegulasiK3;
use App\Models\FormDisnaker;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $alatInventory = [
            ['kode_alat' => 'A001', 'nama' => 'Earth Tester Kyoritsu 4105A', 'merk' => 'Kyoritsu', 'serial' => 'KYO-4105-012', 'kategori' => ['Listrik', 'Petir'], 'kalibrasi_terakhir' => '2025-06-15', 'kalibrasi_expired' => '2026-06-15', 'lab' => 'KAN-LK-089-IDN', 'status' => 'sedang dipakai'],
            ['kode_alat' => 'A002', 'nama' => 'Insulation Tester Fluke 1507', 'merk' => 'Fluke', 'serial' => 'FLK-1507-443', 'kategori' => ['Listrik'], 'kalibrasi_terakhir' => '2025-02-10', 'kalibrasi_expired' => '2026-02-10', 'lab' => 'KAN-LK-089-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A003', 'nama' => 'Lux Meter Sanwa LX3132', 'merk' => 'Sanwa', 'serial' => 'SNW-LX-092', 'kategori' => ['Umum'], 'kalibrasi_terakhir' => '2024-05-20', 'kalibrasi_expired' => '2025-05-20', 'lab' => 'KAN-LK-145-IDN', 'status' => 'rusak'],
            ['kode_alat' => 'A004', 'nama' => 'Earth Tester Kyoritsu 4105A', 'merk' => 'Kyoritsu', 'serial' => 'KYO-4105-088', 'kategori' => ['Listrik'], 'kalibrasi_terakhir' => '2025-07-12', 'kalibrasi_expired' => '2026-07-12', 'lab' => 'KAN-LK-089-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A005', 'nama' => 'Insulation Tester Megger MIT515', 'merk' => 'Megger', 'serial' => 'MGR-515-201', 'kategori' => ['Listrik'], 'kalibrasi_terakhir' => '2025-05-30', 'kalibrasi_expired' => '2026-05-30', 'lab' => 'KAN-LK-089-IDN', 'status' => 'sedang dipakai'],
            ['kode_alat' => 'A006', 'nama' => 'Ultrasonic Thickness Gauge GE DM5E', 'merk' => 'GE', 'serial' => 'GE-DM5E-077', 'kategori' => ['PUBT', 'PV', 'BOILER'], 'kalibrasi_terakhir' => '2025-04-22', 'kalibrasi_expired' => '2026-04-22', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A007', 'nama' => 'Pitot Tube + Manometer (Hydrant)', 'merk' => 'Dwyer', 'serial' => 'DWY-477-1011', 'kategori' => ['Kebakaran'], 'kalibrasi_terakhir' => '2025-10-08', 'kalibrasi_expired' => '2026-10-08', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A008', 'nama' => 'Smoke Detector Tester Solo A10', 'merk' => 'Solo', 'serial' => 'SLO-A10-453', 'kategori' => ['Kebakaran'], 'kalibrasi_terakhir' => '2024-12-15', 'kalibrasi_expired' => '2025-12-15', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A009', 'nama' => 'Anemometer Kestrel 5500', 'merk' => 'Kestrel', 'serial' => 'KES-5500-302', 'kategori' => ['Kebakaran', 'Umum'], 'kalibrasi_terakhir' => '2025-03-18', 'kalibrasi_expired' => '2026-03-18', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A010', 'nama' => 'Lux Meter Lutron LX-1108', 'merk' => 'Lutron', 'serial' => 'LUT-1108-066', 'kategori' => ['Umum'], 'kalibrasi_terakhir' => '2025-09-22', 'kalibrasi_expired' => '2026-09-22', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A011', 'nama' => 'Vibration Meter SKF Microlog', 'merk' => 'SKF', 'serial' => 'SKF-CMVL-077', 'kategori' => ['PAA', 'PTP'], 'kalibrasi_terakhir' => '2025-08-30', 'kalibrasi_expired' => '2026-08-30', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
            ['kode_alat' => 'A012', 'nama' => 'Load Cell 10 Ton (Crane Test)', 'merk' => 'Dillon', 'serial' => 'DIL-10T-422', 'kategori' => ['PAA'], 'kalibrasi_terakhir' => '2025-07-05', 'kalibrasi_expired' => '2026-07-05', 'lab' => 'KAN-LK-145-IDN', 'status' => 'tersedia'],
        ];

        foreach ($alatInventory as $alat) {
            AlatUji::create($alat);
        }

        $pjk3Certs = [
            ['kode_cert' => 'CERT1', 'nama' => 'SK Kemnaker PJK3 Riksa Uji', 'no_sk' => 'KEP.001/PPK-PJK3/V/2023', 'terbit' => '2023-05-10', 'expired' => '2028-05-10', 'file' => 'SK-PJK3-DNP.pdf', 'kategori' => 'umum'],
            ['kode_cert' => 'CERT2', 'nama' => 'SK Penunjukan PJK3 Lift', 'no_sk' => 'KEP.045/PPK-PNK3/X/2023', 'terbit' => '2023-10-20', 'expired' => '2026-10-20', 'file' => 'SK-PJK3-Lift-DNP.pdf', 'kategori' => 'PAA'],
            ['kode_cert' => 'CERT3', 'nama' => 'SK Penunjukan PJK3 Listrik', 'no_sk' => 'KEP.078/PPK-PNK3/III/2024', 'terbit' => '2024-03-15', 'expired' => '2027-03-15', 'file' => 'SK-PJK3-Listrik-DNP.pdf', 'kategori' => 'Listrik'],
            ['kode_cert' => 'CERT4', 'nama' => 'SK Penunjukan PJK3 Kebakaran', 'no_sk' => 'KEP.112/PPK-PNK3/VI/2024', 'terbit' => '2024-06-08', 'expired' => '2027-06-08', 'file' => 'SK-PJK3-Fire-DNP.pdf', 'kategori' => 'Kebakaran'],
        ];

        foreach ($pjk3Certs as $cert) {
            SertifikatPjk3::create($cert);
        }

        $regulasiK3 = [
            ['kode_reg' => 'R001', 'kategori' => 'Umum', 'nama' => 'UU No. 1 Tahun 1970', 'tentang' => 'Keselamatan Kerja', 'terbit' => '1970-01-12', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R002', 'kategori' => 'Umum', 'nama' => 'UU No. 13 Tahun 2003', 'tentang' => 'Ketenagakerjaan', 'terbit' => '2003-03-25', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => 'UU Cipta Kerja 2023'],
            ['kode_reg' => 'R003', 'kategori' => 'PJK3', 'nama' => 'Permenaker No. 26 Tahun 2014', 'tentang' => 'Penyelenggaraan Penilaian Penerapan SMK3', 'terbit' => '2014-12-31', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R004', 'kategori' => 'PAA', 'nama' => 'Permenaker No. 8 Tahun 2020', 'tentang' => 'Keselamatan dan Kesehatan Kerja Pesawat Angkat dan Angkut', 'terbit' => '2020-04-30', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => 'Pengganti Permenaker 5/1985'],
            ['kode_reg' => 'R005', 'kategori' => 'PUBT', 'nama' => 'Permenaker No. 37 Tahun 2016', 'tentang' => 'K3 Bejana Tekanan dan Tangki Timbun', 'terbit' => '2016-12-30', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R006', 'kategori' => 'PUBT', 'nama' => 'Permenaker No. 1 Tahun 1988', 'tentang' => 'Kualifikasi Operator Pesawat Uap', 'terbit' => '1988-01-12', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R007', 'kategori' => 'Listrik', 'nama' => 'Permenaker No. 12 Tahun 2015', 'tentang' => 'K3 Listrik di Tempat Kerja', 'terbit' => '2015-04-21', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R008', 'kategori' => 'Listrik', 'nama' => 'Permenaker No. 33 Tahun 2015', 'tentang' => 'Perubahan Permenaker 12/2015', 'terbit' => '2015-12-30', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R009', 'kategori' => 'Listrik', 'nama' => 'Permenaker No. 31 Tahun 2015', 'tentang' => 'Penyelenggaraan Pengawasan K3 Listrik', 'terbit' => '2015-12-23', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R010', 'kategori' => 'Kebakaran', 'nama' => 'Permenaker No. 4 Tahun 1980', 'tentang' => 'Syarat Pemasangan dan Pemeliharaan APAR', 'terbit' => '1980-04-14', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R011', 'kategori' => 'Kebakaran', 'nama' => 'Permenaker No. 2 Tahun 1983', 'tentang' => 'Instalasi Alarm Kebakaran Automatik', 'terbit' => '1983-04-12', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R012', 'kategori' => 'Kebakaran', 'nama' => 'Kepmenaker No. 186 Tahun 1999', 'tentang' => 'Unit Penanggulangan Kebakaran di Tempat Kerja', 'terbit' => '1999-09-29', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => '-'],
            ['kode_reg' => 'R013', 'kategori' => 'Lift', 'nama' => 'Permenaker No. 6 Tahun 2017', 'tentang' => 'K3 Elevator dan Eskalator', 'terbit' => '2017-04-04', 'status' => 'aktif', 'source' => 'Kemnaker RI', 'revisi_terakhir' => 'Pengganti Permenaker 3/1999'],
        ];

        foreach ($regulasiK3 as $reg) {
            RegulasiK3::create($reg);
        }

        $formChecklist = [
            ['kode_form' => 'F001', 'kode_disnaker' => 'Form 6', 'nama' => 'Pemeriksaan Pesawat Uap (Boiler)', 'pesawat' => 'BOILER', 'revisi' => 'Rev. 2016', 'last_updated' => '2016-01-15', 'file' => 'Form-6-PesawatUap.pdf'],
            ['kode_form' => 'F002', 'kode_disnaker' => 'Form 36/38/39', 'nama' => 'Pemeriksaan Lift Penumpang/Barang', 'pesawat' => 'LIFT', 'revisi' => 'Rev. 2017', 'last_updated' => '2017-04-04', 'file' => 'Form-36-Lift.pdf'],
            ['kode_form' => 'F003', 'kode_disnaker' => 'Form 45 A.1', 'nama' => 'Pemeriksaan Bejana Tekan', 'pesawat' => 'PV', 'revisi' => 'Rev. 2016', 'last_updated' => '2016-12-30', 'file' => 'Form-45A1-PV.pdf'],
            ['kode_form' => 'F004', 'kode_disnaker' => 'Form 52', 'nama' => 'Pemeriksaan Eskalator / Travelator', 'pesawat' => 'ESC', 'revisi' => 'Rev. 2017', 'last_updated' => '2017-04-04', 'file' => 'Form-52-Escalator.pdf'],
            ['kode_form' => 'F005', 'kode_disnaker' => 'Form A 52', 'nama' => 'Pemeriksaan PAA (Crane, Forklift, Hoist)', 'pesawat' => 'PAPA', 'revisi' => 'Rev. 2020', 'last_updated' => '2020-04-30', 'file' => 'Form-A52-PAA.pdf'],
            ['kode_form' => 'F006', 'kode_disnaker' => 'Form 54 A', 'nama' => 'Pemeriksaan PTP (Compressor, Genset)', 'pesawat' => 'PTP', 'revisi' => 'Rev. 2020', 'last_updated' => '2020-05-10', 'file' => 'Form-54A-PTP.pdf'],
            ['kode_form' => 'F007', 'kode_disnaker' => 'Form 55 L', 'nama' => 'Pemeriksaan Instalasi Listrik & Penyalur Petir', 'pesawat' => 'LISTRIK', 'revisi' => 'Rev. 2015', 'last_updated' => '2015-12-30', 'file' => 'Form-55L-Listrik.pdf'],
            ['kode_form' => 'F008', 'kode_disnaker' => 'Form 65 K', 'nama' => 'Pemeriksaan Sistem Proteksi Kebakaran', 'pesawat' => 'FIRE', 'revisi' => 'Rev. 1980/1983', 'last_updated' => '2024-02-10', 'file' => 'Form-65K-Fire.pdf'],
        ];

        foreach ($formChecklist as $form) {
            FormDisnaker::create($form);
        }
    }
}
