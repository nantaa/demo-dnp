<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisnakerFollowup extends Model
{
    /**
     * The attributes that aren't mass assignable.
     */
    protected $guarded = [];

    /**
     * Get the job associated with the followup.
     */
    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    /**
     * Get the user who performed the action.
     */
    public function actionBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'action_by_user_id');
    }
}
