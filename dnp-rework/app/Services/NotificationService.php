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

    /**
     * Get all user IDs related to a job (Target Stage owners, marketing owner, assigned inspectors, report writer).
     * Excludes current actor to prevent redundant self-notifications.
     */
    public static function getRelatedUserIds(Job $job, ?int $targetStage = null): array
    {
        $userIds = [];

        // 1. Target stage owners (who need to act on the next stage)
        if ($targetStage !== null) {
            $userIds = array_merge($userIds, self::getStageOwnerUserIds($targetStage));
        }

        // 2. Marketing owner of this specific job
        if (!empty($job->owner_marketing)) {
            $mktId = User::where('name', $job->owner_marketing)->value('id');
            if ($mktId) {
                $userIds[] = $mktId;
            }
        }

        // 3. Assigned inspectors of this specific job
        $inspectorIds = $job->inspectors()->pluck('users.id')->toArray();
        $userIds = array_merge($userIds, $inspectorIds);

        // 4. Report writer of this specific job
        if ($job->report_writer_id) {
            $userIds[] = $job->report_writer_id;
        }

        // 5. Exclude current acting user (so they don't get notified for their own action)
        $actorId = \Illuminate\Support\Facades\Auth::id();
        if ($actorId) {
            $userIds = array_filter($userIds, fn($id) => (int)$id !== (int)$actorId);
        }

        return array_values(array_unique(array_filter($userIds)));
    }
}

