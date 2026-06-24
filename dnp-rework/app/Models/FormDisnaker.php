<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormDisnaker extends Model
{
    use HasFactory;

    protected $table = 'form_disnakers';

    protected $fillable = [
        'kode_form',
        'kode_disnaker',
        'nama',
        'pesawat',
        'revisi',
        'last_updated',
        'file',
    ];

    protected $casts = [
        'last_updated' => 'date',
    ];
}
