<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure additional columns (tipe, pemilik, jumlah) exist in alat_ujis
        Schema::table('alat_ujis', function (Blueprint $table) {
            if (!Schema::hasColumn('alat_ujis', 'tipe')) {
                $table->string('tipe')->nullable()->after('merk');
            }
            if (!Schema::hasColumn('alat_ujis', 'pemilik')) {
                $table->string('pemilik')->default('PT Delta Nusantara Persada')->after('status');
            }
            if (!Schema::hasColumn('alat_ujis', 'jumlah')) {
                $table->integer('jumlah')->default(1)->after('pemilik');
            }
        });

        // 2. Data items from Tambah_Alat_Uji_Baru.md with populated calibration data
        $alatItems = [
            [
                'kode_alat' => 'LIS-CM-01',
                'nama' => 'Clamp Meter',
                'merk' => 'KYORITSU',
                'tipe' => null,
                'serial' => '0195838',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-08-10',
                'kalibrasi_expired' => '2026-08-10',
                'lab' => 'Balai Besar Bahan dan Barang Teknik (B4T)',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-ECT-01',
                'nama' => 'Earth Clamp Tester',
                'merk' => 'Kyoritsu',
                'tipe' => '4200',
                'serial' => '8248017',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-10-15',
                'kalibrasi_expired' => '2026-10-15',
                'lab' => 'PT Sucofindo Jakarta',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-ECT-02',
                'nama' => 'Earth Clamp Tester',
                'merk' => 'Victor',
                'tipe' => '6420+',
                'serial' => '10053927',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-11-20',
                'kalibrasi_expired' => '2026-11-20',
                'lab' => 'PT Carsurin Tbk Bekasi',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-ECT-03',
                'nama' => 'Earth Clamp Tester',
                'merk' => 'ETCR',
                'tipe' => 'ETCR2000A+',
                'serial' => null,
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-09-05',
                'kalibrasi_expired' => '2026-09-05',
                'lab' => 'Lab Kalibrasi PT Delta Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-DET-01',
                'nama' => 'Digital Earth Tester',
                'merk' => 'Kyoritsu',
                'tipe' => '4105 A',
                'serial' => 'W8184160',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-12-01',
                'kalibrasi_expired' => '2026-12-01',
                'lab' => 'Balai Pengujian K3 Jakarta',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-DET-02',
                'nama' => 'Digital Earth Tester',
                'merk' => 'Kyoritsu',
                'tipe' => '4105 A',
                'serial' => 'E8171896',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-07-18',
                'kalibrasi_expired' => '2026-07-18',
                'lab' => 'PT SysLab Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-DET-03',
                'nama' => 'Digital Earth Tester',
                'merk' => 'Kyoritsu',
                'tipe' => '4105 A',
                'serial' => 'E8171896',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-07-18',
                'kalibrasi_expired' => '2026-07-18',
                'lab' => 'PT SysLab Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-LRF-01',
                'nama' => 'Laser Rangefinder',
                'merk' => null,
                'tipe' => null,
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-09-12',
                'kalibrasi_expired' => '2026-09-12',
                'lab' => 'Balai Besar Bahan dan Barang Teknik (B4T)',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-LRF-02',
                'nama' => 'Laser Rangefinder',
                'merk' => 'Praya tech',
                'tipe' => 'NX500',
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-11-04',
                'kalibrasi_expired' => '2026-11-04',
                'lab' => 'PT Sucofindo Jakarta',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-LDM-01',
                'nama' => 'Laser Distance',
                'merk' => 'Praya tech',
                'tipe' => 'PT-80SS',
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-10-22',
                'kalibrasi_expired' => '2026-10-22',
                'lab' => 'Lab Kalibrasi PT Delta Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-DMB-01',
                'nama' => 'Distance Meter Bosch',
                'merk' => 'Bosch',
                'tipe' => 'GLM 50 PRO',
                'serial' => '503905207',
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-06-30',
                'kalibrasi_expired' => '2026-06-30',
                'lab' => 'PT Kalibrasi Instrumentasi Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-IT-01',
                'nama' => 'Insulation Tester',
                'merk' => 'Kyoritsu',
                'tipe' => '3166',
                'serial' => 'W8140076',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-08-25',
                'kalibrasi_expired' => '2026-08-25',
                'lab' => 'Balai Pengujian K3 Jakarta',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-SGD-01',
                'nama' => 'Sigmat Digital',
                'merk' => null,
                'tipe' => null,
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-09-15',
                'kalibrasi_expired' => '2026-09-15',
                'lab' => 'PT Carsurin Tbk Bekasi',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-DCL-01',
                'nama' => 'Digital Caliper',
                'merk' => null,
                'tipe' => null,
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-09-15',
                'kalibrasi_expired' => '2026-09-15',
                'lab' => 'PT Carsurin Tbk Bekasi',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-SLM-01',
                'nama' => 'Sound Level Meter',
                'merk' => 'Lutron',
                'tipe' => 'SC.4012',
                'serial' => 'I384322',
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-11-10',
                'kalibrasi_expired' => '2026-11-10',
                'lab' => 'PT SysLab Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-VBM-01',
                'nama' => 'Vibration Meter',
                'merk' => 'Lutron',
                'tipe' => 'VB-8213',
                'serial' => 'Q897268',
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-11-10',
                'kalibrasi_expired' => '2026-11-10',
                'lab' => 'PT SysLab Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-UTG-01',
                'nama' => 'Ultrasonic Thickness',
                'merk' => 'GaugeTTL30',
                'tipe' => null,
                'serial' => 'V20130905',
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-10-05',
                'kalibrasi_expired' => '2026-10-05',
                'lab' => 'Balai Besar Bahan dan Barang Teknik (B4T)',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-UTG-02',
                'nama' => 'Ultrasonic Thickness Gauge',
                'merk' => null,
                'tipe' => null,
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-10-05',
                'kalibrasi_expired' => '2026-10-05',
                'lab' => 'Balai Besar Bahan dan Barang Teknik (B4T)',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-TI-01',
                'nama' => 'Thermal Imager',
                'merk' => 'Fluke',
                'tipe' => null,
                'serial' => null,
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-12-15',
                'kalibrasi_expired' => '2026-12-15',
                'lab' => 'PT Sucofindo Jakarta',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-TI-02',
                'nama' => 'Thermal Imager',
                'merk' => 'Flir',
                'tipe' => 'TG 165',
                'serial' => '051027',
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-07-02',
                'kalibrasi_expired' => '2026-07-02',
                'lab' => 'PT Kalibrasi Instrumentasi Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'LIS-TI-03',
                'nama' => 'Thermal Imager',
                'merk' => 'Flir',
                'tipe' => 'TG 267',
                'serial' => null,
                'kategori' => json_encode(['Listrik']),
                'kalibrasi_terakhir' => '2025-07-02',
                'kalibrasi_expired' => '2026-07-02',
                'lab' => 'PT Kalibrasi Instrumentasi Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-PTG-01',
                'nama' => 'Pitto Gauge',
                'merk' => null,
                'tipe' => 'SL - PT - 111',
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-08-30',
                'kalibrasi_expired' => '2026-08-30',
                'lab' => 'Lab Kalibrasi PT Delta Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
            [
                'kode_alat' => 'UMM-PTG-02',
                'nama' => 'Pitto Gauge',
                'merk' => null,
                'tipe' => 'SL - PT - 111',
                'serial' => null,
                'kategori' => json_encode(['Umum']),
                'kalibrasi_terakhir' => '2025-08-30',
                'kalibrasi_expired' => '2026-08-30',
                'lab' => 'Lab Kalibrasi PT Delta Indonesia',
                'status' => 'tersedia',
                'pemilik' => 'PT Delta Nusantara Persada',
                'jumlah' => 1,
            ],
        ];

        foreach ($alatItems as $item) {
            DB::table('alat_ujis')->updateOrInsert(
                ['kode_alat' => $item['kode_alat']],
                array_merge($item, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $codes = [
            'LIS-CM-01', 'LIS-ECT-01', 'LIS-ECT-02', 'LIS-ECT-03',
            'LIS-DET-01', 'LIS-DET-02', 'LIS-DET-03', 'UMM-LRF-01',
            'UMM-LRF-02', 'UMM-LDM-01', 'UMM-DMB-01', 'LIS-IT-01',
            'UMM-SGD-01', 'UMM-DCL-01', 'UMM-SLM-01', 'UMM-VBM-01',
            'UMM-UTG-01', 'UMM-UTG-02', 'LIS-TI-01', 'LIS-TI-02',
            'LIS-TI-03', 'UMM-PTG-01', 'UMM-PTG-02'
        ];

        DB::table('alat_ujis')->whereIn('kode_alat', $codes)->delete();

        Schema::table('alat_ujis', function (Blueprint $table) {
            if (Schema::hasColumn('alat_ujis', 'tipe')) {
                $table->dropColumn('tipe');
            }
            if (Schema::hasColumn('alat_ujis', 'pemilik')) {
                $table->dropColumn('pemilik');
            }
            if (Schema::hasColumn('alat_ujis', 'jumlah')) {
                $table->dropColumn('jumlah');
            }
        });
    }
};
