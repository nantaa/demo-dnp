<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class InspectionEvent extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'inspection_events';

    protected $guarded = [];

    protected $casts = [
        'tanggal_pelaksanaan' => 'date',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function bap(): HasOne
    {
        return $this->hasOne(BAP::class, 'inspection_id');
    }

    public function units(): BelongsToMany
    {
        return $this->belongsToMany(Unit::class, 'inspection_units', 'inspection_id', 'unit_id')
            ->withPivot('hasil_unit', 'catatan_temuan');
    }
}
