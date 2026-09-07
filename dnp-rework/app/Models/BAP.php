<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BAP extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dnp_baps';

    protected $guarded = [];

    protected $casts = [
        'tanggal_terbit' => 'date',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(InspectionEvent::class, 'inspection_id');
    }
}
