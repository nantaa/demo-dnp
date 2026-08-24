<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\UserStagePermission;
use App\Models\Job;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send in-app notification to target user IDs.
     */
    public static function send(array|int $userIds, string $type, string $title, string $body, string|int|null $jobId = null): void
    {
        $ids = is_array($userIds) ? $userIds : [$userIds];
        $uniqueIds = array_unique(array_filter($ids));

        if (empty($uniqueIds)) return;

        foreach ($uniqueIds as $uid) {
            Notification::create([
                'user_id' => $uid,
                'job_id'  => $jobId,
                'type'    => $type,
                'title'   => $title,
                'body'    => $body,
                'is_read' => false,
            ]);
        }
    }

    /**
     * Get user IDs who own a specific stage.
     */
    public static function getStageOwnerUserIds(int $stage): array
    {
        return UserStagePermission::where('stage', $stage)
            ->where('is_owner', true)
            ->pluck('user_id')
            ->toArray();
    }

    /**
     * Get manager user IDs.
     */
    public static function getManagerUserIds(): array
    {
        return User::where('role', 'manager')->pluck('id')->toArray();
    }

    /**
     * Get finance user IDs.
     */
    public static function getFinanceUserIds(): array
    {
        return User::where('role', 'finance')->pluck('id')->toArray();
    }
}
