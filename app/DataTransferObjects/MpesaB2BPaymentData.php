<?php

namespace App\DataTransferObjects;

final class MpesaB2BPaymentData
{
    public function __construct(
        public readonly string $initiator,
        public readonly string $securityCredential,
        public readonly string $commandId,
        public readonly int $senderIdentifierType,
        public readonly int $receiverIdentifierType,
        public readonly string $amount,
        public readonly string $partyA,
        public readonly string $partyB,
        public readonly string $accountReference,
        public readonly string $remarks,
        public readonly string $queueTimeOutUrl,
        public readonly string $resultUrl,
        public readonly ?string $requester,
        public readonly ?string $occasion,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            initiator: (string) $validated['Initiator'],
            securityCredential: (string) $validated['SecurityCredential'],
            commandId: (string) $validated['CommandID'],
            senderIdentifierType: (int) $validated['SenderIdentifierType'],
            receiverIdentifierType: (int) $validated['ReceiverIdentifierType'],
            amount: number_format((float) $validated['Amount'], 2, '.', ''),
            partyA: (string) $validated['PartyA'],
            partyB: (string) $validated['PartyB'],
            accountReference: (string) $validated['AccountReference'],
            remarks: (string) $validated['Remarks'],
            queueTimeOutUrl: (string) $validated['QueueTimeOutURL'],
            resultUrl: (string) $validated['ResultURL'],
            requester: isset($validated['Requester']) ? (string) $validated['Requester'] : null,
            occasion: isset($validated['Occasion']) ? (string) $validated['Occasion'] : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toPayload(): array
    {
        $payload = [
            'Initiator' => $this->initiator,
            'SecurityCredential' => $this->securityCredential,
            'CommandID' => $this->commandId,
            'SenderIdentifierType' => (string) $this->senderIdentifierType,
            'ReceiverIdentifierType' => (string) $this->receiverIdentifierType,
            'Amount' => $this->amount,
            'PartyA' => $this->partyA,
            'PartyB' => $this->partyB,
            'AccountReference' => $this->accountReference,
            'Remarks' => $this->remarks,
            'QueueTimeOutURL' => $this->queueTimeOutUrl,
            'ResultURL' => $this->resultUrl,
        ];

        if ($this->requester !== null && $this->requester !== '') {
            $payload['Requester'] = $this->requester;
        }

        if ($this->occasion !== null && $this->occasion !== '') {
            $payload['Occasion'] = $this->occasion;
        }

        return $payload;
    }
}
