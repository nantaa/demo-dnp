<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Notification;
use App\Services\WablasService;
use Carbon\Carbon;

class SendWaEscalations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:wa-escalate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send Wablas WhatsApp escalation messages for notifications unread for over 30 minutes.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = Carbon::now()->subMinutes(30);

        $pendingNotifications = Notification::where('is_read', false)
            ->whereNull('wa_sent_at')
            ->where('created_at', '<=', $cutoff)
            ->with(['user', 'job'])
            ->get();

        $count = 0;
        foreach ($pendingNotifications as $notif) {
            $user = $notif->user;
            if (!$user || !$user->phone) {
                continue;
            }

            $jobKode = $notif->job ? " [Job: {$notif->job->kode}]" : '';
            $message = "⏰ *REMINDER DNP MONITOR*{$jobKode}\n\n*{$notif->title}*\n{$notif->body}\n\nMohon segera ditindaklanjuti di aplikasi DNP Monitor.\nhttps://dnp.deltanusanpersada.co.id";

            $sent = WablasService::send($user->phone, $message);
            if ($sent) {
                $notif->update(['wa_sent_at' => now()]);
                $count++;
            }
        }

        $this->info("Wablas escalation completed. Sent {$count} WhatsApp messages.");
    }
}
