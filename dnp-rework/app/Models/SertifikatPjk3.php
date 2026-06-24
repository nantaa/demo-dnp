<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SertifikatPjk3 extends Model
{
    use HasFactory;

    protected $table = 'sertifikat_pjk3s';

    protected $fillable = [
        'kode_cert',
        'nama',
        'no_sk',
        'terbit',
        'expired',
        'file',
        'kategori',
    ];

    protected $casts = [
        'terbit' => 'date',
        'expired' => 'date',
    ];
}
