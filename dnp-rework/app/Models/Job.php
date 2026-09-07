<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

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
        's2_verify_data'              => 'array',
        's4_checklist'                => 'array',
        's7_bundel_checklist'         => 'array',
        'schedule_days'               => 'array',
        'reschedule_reason_log'       => 'array',
        'dp_paid'                     => 'boolean',
        'dp_amount'                   => 'decimal:2',
        'total_unit_count'            => 'integer',
        'payment_retry_count'         => 'integer',
    ];

    // -------------------------------------------------------------------------
    // v3 Computed Accessors (never stored — rollup from units)
    // -------------------------------------------------------------------------

    /**
     * Computed job_status: Open / Partial / Closed based on unit rollup.
     * - Open    = no units, or all units are InProgress/ReworkLoop
     * - Partial = some units Closed, some still InProgress/ReworkLoop
     * - Closed  = all units are Closed
     */
    protected function jobStatus(): Attribute
    {
        return Attribute::make(
            get: function () {
                $units = $this->units;
                if ($units->isEmpty()) {
                    return 'Open';
                }
                $closedCount = $units->where('unit_status', 'Closed')->count();
                if ($closedCount === 0) {
                    return 'Open';
                }
                if ($closedCount === $units->count()) {
                    return 'Closed';
                }
                return 'Partial';
            }
        );
    }

    /**
     * Count of units with status = Closed (for display: "95/100 Units Closed").
     */
    protected function closedUnitCount(): Attribute
    {
        return Attribute::make(
            get: function () {
                $units = $this->relationLoaded('units') ? $this->getRelation('units') : $this->units()->get();
                return $units->where('unit_status', 'Closed')->count();
            }
        );
    }

    /**
     * Total unit count (numeric) safely retrieved without collision with units relationship.
     */
    protected function unitCount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->total_unit_count ?? $this->getRawOriginal('units') ?? 1
        );
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The user designated to prepare the report/document (Assigned in Stage 3)
     */
    public function reportWriter()
    {
        return $this->belongsTo(User::class, 'report_writer_id');
    }

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

    // -------------------------------------------------------------------------
    // v3 Relationships
    // -------------------------------------------------------------------------

    /**
     * Units (Alat) — the core v3 entity; each has its own stage and RU result.
     */
    public function units(): HasMany
    {
        return $this->hasMany(Unit::class, 'job_id');
    }

    /**
     * Inspection events (Sesi Riksa Uji) — each produces one BAP.
     */
    public function inspectionEvents(): HasMany
    {
        return $this->hasMany(InspectionEvent::class, 'job_id');
    }

    /**
     * Batches — groups of Approved-LHPP units submitted together to Disnaker.
     */
    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class, 'job_id');
    }

    /**
     * Payment verifications (Stage 11c) — Finance confirms payment before SUKET sent.
     */
    public function paymentVerifications(): HasMany
    {
        return $this->hasMany(PaymentVerification::class, 'job_id');
    }

    /**
     * Latest payment verification record.
     */
    public function latestPaymentVerification()
    {
        return $this->hasOne(PaymentVerification::class, 'job_id')->latestOfMany();
    }
}
