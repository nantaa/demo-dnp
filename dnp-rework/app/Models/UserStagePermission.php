<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStagePermission extends Model
{
    /**
     * The attributes that aren't mass assignable.
     */
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_owner' => 'boolean',
        'can_view' => 'boolean',
    ];

    /**
     * Get the user that owns this permission.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
