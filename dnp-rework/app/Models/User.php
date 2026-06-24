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

    /**
     * Helper to check if user is a superadmin
     */
    public function isSuperadmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user has permission to 'own' or edit a specific stage
     */
    public function canOwnStage(int $stage): bool
    {
        if ($this->isSuperadmin()) return true;

        // Fetch stage mapping for this user
        $permission = $this->stagePermissions()->where('stage', $stage)->first();
        return $permission && $permission->is_owner;
    }
}
