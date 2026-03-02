<?php

namespace App\Notifications;

use App\Models\AirtimeTransfer;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AirtimeTransferStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly AirtimeTransfer $transfer,
        private readonly string $eventType,
        private readonly ?string $message = null,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $eventLabel = str_replace('_', ' ', $this->eventType);

        return (new MailMessage)
            ->subject('Airtime transfer '.$eventLabel)
            ->line('Transfer #'.$this->transfer->id.' is now '.$this->transfer->status.'.')
            ->line('Recipient: '.$this->transfer->recipient)
            ->line('Amount: KES '.$this->transfer->amount)
            ->line($this->message ?? ($this->transfer->result_description ?? 'No provider message returned.'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_type' => $this->eventType,
            'transfer_id' => $this->transfer->id,
            'status' => $this->transfer->status,
            'recipient' => $this->transfer->recipient,
            'amount' => (string) $this->transfer->amount,
            'result_code' => $this->transfer->result_code,
            'message' => $this->message ?? $this->transfer->result_description,
            'created_at' => now()->toISOString(),
        ];
    }
}
