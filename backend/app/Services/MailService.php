<?php

namespace App\Services;

use Illuminate\Mail\Mailable;
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
            $this->printToConsole($recipientEmail, $recipientName, $mailable);
        } else {
            Mail::to($recipientEmail, $recipientName)->send($mailable);
        }
    }

    /**
     * Render the mailable and print a summary to STDERR (visible in `php artisan serve`).
     */
    private function printToConsole(string $recipientEmail, string $recipientName, Mailable $mailable): void
    {
        $subject = $mailable->envelope()->subject ?? '(no subject)';
        $html    = $mailable->render();

        // Extract all http(s) links from the rendered HTML
        preg_match_all('/href=["\']((https?:\/\/)[^"\']+)["\']/', $html, $matches);
        $links = array_unique($matches[1] ?? []);

        $separator = str_repeat('─', 64);

        $output  = "\n\e[33m" . $separator . "\e[0m\n";
        $output .= "\e[1;33m📧  EMAIL (local — not sent)\e[0m\n";
        $output .= $separator . "\n";
        $output .= "\e[36mTo     :\e[0m {$recipientName} <{$recipientEmail}>\n";
        $output .= "\e[36mSubject:\e[0m {$subject}\n";

        if (!empty($links)) {
            $output .= $separator . "\n";
            foreach ($links as $link) {
                $output .= "\e[32m🔗  " . $link . "\e[0m\n";
            }
        }

        $output .= "\e[33m" . $separator . "\e[0m\n\n";

        fwrite(\STDERR, $output);
    }
}
