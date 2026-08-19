<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlatUji extends Model
{
    use HasFactory;

    protected $table = 'alat_ujis';

    protected $fillable = [
        'kode_alat',
        'nama',
        'merk',
        'tipe',
        'serial',
        'kategori',
        'kalibrasi_terakhir',
        'kalibrasi_expired',
        'lab',
        'pemilik',
        'jumlah',
        'status',
    ];

    protected $casts = [
        'kategori' => 'array',
        'kalibrasi_terakhir' => 'date',
        'kalibrasi_expired' => 'date',
    ];
}
