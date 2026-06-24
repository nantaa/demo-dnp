<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlatUji extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_alat',
        'nama',
        'merk',
        'serial',
        'kategori',
        'kalibrasi_terakhir',
        'kalibrasi_expired',
        'lab',
        'status',
    ];

    protected $casts = [
        'kategori' => 'array',
        'kalibrasi_terakhir' => 'date',
        'kalibrasi_expired' => 'date',
    ];
}
