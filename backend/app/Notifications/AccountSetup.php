<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Sent when the Owner creates an account: a link to choose a password. */
class AccountSetup extends Notification
{
    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim(config('bonsoir.frontend_url'), '/').'/admin/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
            'setup' => 1,
        ]);
        $minutes = config('auth.passwords.users.expire');

        return (new MailMessage)
            ->subject('Your Bonsoir admin account')
            ->greeting("Hello {$notifiable->name},")
            ->line('An admin account has been created for you on the Bonsoir menu dashboard.')
            ->action('Choose your password', $url)
            ->line("This link expires in {$minutes} minutes. If it expires, ask the Owner to send a new one.");
    }
}
