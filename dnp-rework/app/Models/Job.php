<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Job extends Model
{
    use HasFactory, HasUuids;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'dnp_jobs';

    /**
     * The attributes that aren't mass assignable.
     */
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'tgl_po'                      => 'date',
        'tgl_pelaksanaan'             => 'date',
        'tgl_surat_tugas'             => 'date',
        'tgl_h5'                      => 'date',
        'h5_confirmed'                => 'boolean',
        'h5_confirmed_at'             => 'datetime',
        'peer_review_submitted_at'    => 'datetime',
        'peer_review_approved_at'     => 'datetime',
        'disnaker_deadline_at'        => 'date',
        'tgl_submit_disnaker'         => 'date',
        'tgl_doc_submitted_disnaker'  => 'date',
        'tgl_doc_received_disnaker'   => 'date',
        's5_reviewed_at'              => 'datetime',
        'paid'                        => 'boolean',
        'invoice_date'                => 'date',
        'tgl_invoice_issued'          => 'date',
        'payment_due_date'            => 'date',
        'payment_paid_at'             => 'datetime',
        'tanda_terima_kembali'        => 'boolean',
        'stage_started_at'            => 'datetime',
        'nilai'                       => 'decimal:2',
        'payment_amount_received'     => 'decimal:2',
        'total_invoice_amount'        => 'decimal:2',
        'alat_ids'                    => 'array',
        'cert_ids'                    => 'array',
    ];

    /**
     * The inspectors assigned to this job (Pivot relation)
     */
    public function inspectors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'job_inspectors', 'job_id', 'inspector_id');
    }

    /**
     * The uploaded documents for this job
     */
    public function documents(): HasMany
    {
        return $this->hasMany(JobDocument::class);
    }

    /**
     * The history/audit trail log
     */
    public function historyLogs(): HasMany
    {
        return $this->hasMany(JobHistory::class);
    }

    /**
     * The riksa uji evaluations per unit
     */
    public function evaluations(): HasMany
    {
        return $this->hasMany(JobEvaluation::class);
    }

    /**
     * The specific tracking for units progressing through Suket/Disnaker lifecycle
     */
    public function unitsTracking(): HasMany
    {
        return $this->hasMany(UnitTracking::class);
    }

    /**
     * Disnaker specific followups made by Admin/Kadiv
     */
    public function disnakerFollowups(): HasMany
    {
        return $this->hasMany(DisnakerFollowup::class);
    }
}
