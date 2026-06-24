<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobEvaluation extends Model
{
    /**
     * The attributes that aren't mass assignable.
     */
    protected $guarded = [];

    /**
     * Get the job that owns the evaluation.
     */
    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }
}
