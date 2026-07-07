<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectorProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'skp',
        'skp_expired_at',
        'spesialisasi',
        'domisili',
        'senior_level',
        'subrole',  // tenaga_ahli | teknisi
        'active',
    ];

    protected $casts = [
        'skp_expired_at' => 'date',
        'spesialisasi' => 'array',
        'active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
