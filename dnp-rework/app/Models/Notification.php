<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'job_id',
        'type',
        'title',
        'body',
        'is_read',
        'wa_sent_at',
        'read_at',
    ];

    protected $casts = [
        'is_read'    => 'boolean',
        'wa_sent_at' => 'datetime',
        'read_at'    => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }
}
