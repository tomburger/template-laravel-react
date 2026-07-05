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
     * Uses PHP native mail() instead of Symfony Mailer for better host compatibility.
     */
    public function send(string $recipientEmail, string $recipientName, Mailable $mailable): void
    {
        if (app()->environment('local')) {
            $this->logEmail($recipientEmail, $recipientName, $mailable);
        } else {
            $this->sendNativeMail($recipientEmail, $recipientName, $mailable);
        }
    }

    /**
     * Send email using PHP native mail() function.
     */
    private function sendNativeMail(string $recipientEmail, string $recipientName, Mailable $mailable): void
    {
        if (config('mail.default') === 'log') {
            $this->logEmail($recipientEmail, $recipientName, $mailable);
            return;
        }

        $subject = $mailable->envelope()->subject ?? '(no subject)';
        $html = $mailable->render();

        $fromEmail = (string) config('mail.from.address', 'noreply@example.com');
        $fromName = (string) config('mail.from.name', config('app.name'));

        $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>\n"
            . "Reply-To: {$fromEmail}\n"
            . "MIME-Version: 1.0\n"
            . "Content-Type: text/html; charset=utf-8\n"
            . "Content-Transfer-Encoding: 8bit\n";

        $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
        $to = $recipientName ? "{$recipientName} <{$recipientEmail}>" : $recipientEmail;

        $result = mail($recipientEmail, $encodedSubject, $html, $headers);

        if (!$result) {
            Log::warning('Failed to send email via mail()', [
                'to' => $to,
                'subject' => $subject,
                'from' => $fromEmail,
            ]);
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
