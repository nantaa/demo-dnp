<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegulasiK3 extends Model
{
    use HasFactory;

    protected $table = 'regulasi_k3s';

    protected $fillable = [
        'kode_reg',
        'kategori',
        'nama',
        'tentang',
        'terbit',
        'status',
        'source',
        'revisi_terakhir',
    ];

    protected $casts = [
        'terbit' => 'date',
    ];
}
