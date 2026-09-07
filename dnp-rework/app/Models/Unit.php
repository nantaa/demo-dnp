<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Unit extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dnp_units';

    protected $guarded = [];

    protected $casts = [
        'rework_started_at' => 'datetime',
        'closed_at'         => 'datetime',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function lhpps(): HasMany
    {
        return $this->hasMany(LHPP::class, 'unit_id');
    }

    public function finalLhpp(): BelongsTo
    {
        return $this->belongsTo(LHPP::class, 'final_lhpp_id');
    }

    public function batches(): BelongsToMany
    {
        return $this->belongsToMany(Batch::class, 'batch_units', 'unit_id', 'batch_id');
    }

    public function inspections(): BelongsToMany
    {
        return $this->belongsToMany(InspectionEvent::class, 'inspection_units', 'unit_id', 'inspection_id')
            ->withPivot('hasil_unit', 'catatan_temuan');
    }

    /**
     * Scope for units needing manager escalation in 4b-4c-4d loop (> 14 days)
     */
    public function scopeNeedsManagerEscalation($query)
    {
        return $query->where('unit_status', 'ReworkLoop')
            ->whereNotNull('rework_started_at')
            ->where('rework_started_at', '<=', now()->subDays(14));
    }
}
