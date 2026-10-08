<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get unread & recent notifications for the logged-in user.
     */
    public function index()
    {
        $userId = Auth::id();
        $user = Auth::user();

        // Auto-purge legacy notifications where this user was not related to the job
        if ($user && $user->role === 'marketing') {
            Notification::where('user_id', $userId)
                ->whereHas('job', function ($q) use ($user) {
                    $q->whereNotNull('owner_marketing')
                      ->where('owner_marketing', '!=', '')
                      ->where('owner_marketing', '!=', $user->name);
                })
                ->delete();
        } elseif ($user && $user->role === 'inspektur') {
            Notification::where('user_id', $userId)
                ->whereHas('job', function ($q) use ($userId) {
                    $q->whereDoesntHave('inspectors', function ($iq) use ($userId) {
                        $iq->where('users.id', $userId);
                    })->where(function ($rq) use ($userId) {
                        $rq->whereNull('report_writer_id')
                           ->orWhere('report_writer_id', '!=', $userId);
                    });
                })
                ->delete();
        }

        $notifications = Notification::where('user_id', $userId)
            ->with(['job:id,kode,klien,pesawat,stage,owner_marketing'])
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get();

        $unreadCount = Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Mark single notification as read.
     */
    public function markRead(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            abort(403);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications for the user as read.
     */
    public function markAllRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }
}
