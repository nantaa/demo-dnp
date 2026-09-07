<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Batch extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dnp_batches';

    protected $guarded = [];

    protected $casts = [
        'tanggal_verifikasi_dinas' => 'date',
        'tanggal_input_suket'      => 'date',
        'tanggal_terbit_suket'     => 'date',
        'tanggal_kirim'            => 'date',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function units(): BelongsToMany
    {
        return $this->belongsToMany(Unit::class, 'batch_units', 'batch_id', 'unit_id');
    }

    /**
     * Compute duration in calendar days from input to terbit.
     */
    public function calculateDuration(): int
    {
        if ($this->tanggal_input_suket && $this->tanggal_terbit_suket) {
            return $this->tanggal_input_suket->diffInDays($this->tanggal_terbit_suket);
        }
        return 0;
    }
}
