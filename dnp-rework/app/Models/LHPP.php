<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LHPP extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dnp_lhpps';

    protected $guarded = [];

    protected $casts = [
        'is_final'                       => 'boolean',
        'tanggal_data_teknis_diserahkan' => 'date',
        'tanggal_mulai_pengerjaan'       => 'date',
        'tanggal_selesai'                => 'date',
        'reviewed_at'                    => 'datetime',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function sourceInspection(): BelongsTo
    {
        return $this->belongsTo(InspectionEvent::class, 'source_inspection_id');
    }
}
