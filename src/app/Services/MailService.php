<?php

namespace App\Services;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailService
{
    /**
     * Send a mailable to a recipient.
     * On local environment, prints the email to the PHP console instead.
     */
    public function send(string $recipientEmail, string $recipientName, Mailable $mailable): void
    {
        if (app()->environment('local')) {
            $this->logEmail($recipientEmail, $recipientName, $mailable);
        } else {
            Mail::to($recipientEmail, $recipientName)->send($mailable);
        }
    }

    /**
     * Render the mailable and write a summary to storage/logs/laravel.log.
     */
    private function logEmail(string $recipientEmail, string $recipientName, Mailable $mailable): void
    {
        $subject = $mailable->envelope()->subject ?? '(no subject)';
        $html    = $mailable->render();

        // Extract all http(s) links from the rendered HTML
        preg_match_all('/href=["\']((https?:\/\/)[^"\']+)["\']/', $html, $matches);
        $links = array_unique($matches[1] ?? []);

        $context = [
            'to'      => "{$recipientName} <{$recipientEmail}>",
            'subject' => $subject,
            'links'   => $links,
        ];

        Log::info('EMAIL (local — not sent)', $context);
    }
}
