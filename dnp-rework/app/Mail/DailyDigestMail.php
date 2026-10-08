<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DailyDigestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public array $payload;

    /**
     * Create a new message instance.
     */
    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $editionTitle = $this->payload['edition_title'] ?? 'Agenda Pekerjaan';
        $dateFormatted = $this->payload['date_formatted'] ?? date('d M Y');
        $subject = "[DNP Monitor] {$editionTitle} - {$dateFormatted}";

        return $this->subject($subject)
            ->view('emails.daily_digest')
            ->text('emails.daily_digest_plain')
            ->with($this->payload);
    }
}
