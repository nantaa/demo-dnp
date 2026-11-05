<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role', // superadmin, marketing, admin, inspektur, manager, finance
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Stage permissions assigned by Superadmin
     */
    public function stagePermissions()
    {
        return $this->hasMany(UserStagePermission::class, 'user_id');
    }

    public function inspectorProfile()
    {
        return $this->hasOne(InspectorProfile::class, 'user_id');
    }

    /**
     * Jobs where this user is assigned as an inspector
     */
    public function assignedJobs(): BelongsToMany
    {
        return $this->belongsToMany(Job::class, 'job_inspectors', 'inspector_id', 'job_id');
    }

    public const MANAGER_ROLES = ['manager', 'general_manager', 'management', 'manager_ops', 'manager_operasional'];
    public const NON_TECHNICAL_MANAGER_ROLES = ['general_manager', 'management', 'manager_ops', 'manager_operasional'];

    /**
     * Helper to check if user is a superadmin
     */
    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Helper to check if user is a manager (technical or non-technical)
     */
    public function isManager(): bool
    {
        return in_array(strtolower($this->role ?? ''), self::MANAGER_ROLES);
    }

    /**
     * Helper to check if user is a non-technical manager (cannot be assigned at S3)
     */
    public function isNonTechnicalManager(): bool
    {
        return in_array(strtolower($this->role ?? ''), self::NON_TECHNICAL_MANAGER_ROLES);
    }

    /**
     * Check if user has permission to 'own' or edit a specific stage
     */
    public function canOwnStage(int $stage): bool
    {
        if ($this->isSuperadmin()) return true;

        // Query directly — do not rely on loaded collection which may be stale.
        // Cast is_owner to int to handle PostgreSQL boolean storage (true/1/"1").
        $permission = $this->stagePermissions()
            ->where('stage', $stage)
            ->first();

        if ($permission) {
            return ((int) $permission->is_owner === 1);
        }

        // Role default stage ownership fallbacks if specific permission row is not yet seeded
        if ($this->role === 'marketing' && in_array($stage, [1, 11, 13, 15])) return true;
        if ($this->role === 'finance' && in_array($stage, [10, 12, 14])) return true;
        if ($this->role === 'admin' && in_array($stage, [2, 3, 7, 8, 9])) return true;
        if (in_array($this->role, ['inspektur', 'inspector']) && in_array($stage, [4, 5])) return true;
        if ($this->role === 'tim_ru' && in_array($stage, [4, 5])) return true;
        if (in_array($this->role, ['tim_ahli', 'ahli']) && $stage === 6) return true;

        return false;
    }
}
