<?php

namespace App\Services\Airtime;

use App\Models\AirtimeTransfer;
use App\Models\User;
use App\Notifications\AirtimeTransferStatusNotification;

class AirtimeTransferNotifier
{
    public function notifyCompanyStakeholders(
        AirtimeTransfer $transfer,
        string $eventType,
        ?string $message = null,
    ): void {
        $admins = User::query()
            ->where('company_id', $transfer->company_id)
            ->where('is_company_admin', true)
            ->get();

        $recipients = $admins;
        if ($transfer->user_id !== null) {
            $initiator = User::query()->find($transfer->user_id);
            if ($initiator !== null && ! $recipients->contains('id', $initiator->id)) {
                $recipients->push($initiator);
            }
        }

        $recipients->each(function (User $recipient) use ($transfer, $eventType, $message): void {
            $recipient->notify(new AirtimeTransferStatusNotification($transfer, $eventType, $message));
        });
    }
}
