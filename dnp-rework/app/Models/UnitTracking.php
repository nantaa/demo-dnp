<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitTracking extends Model
{
    protected $table = 'units_tracking';

    /**
     * The attributes that aren't mass assignable.
     */
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'tgl_submit' => 'date',
        'tgl_suket' => 'date',
        'suket_expired_at' => 'date',
    ];

    /**
     * Get the job that owns this tracking record.
     */
    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }
}
