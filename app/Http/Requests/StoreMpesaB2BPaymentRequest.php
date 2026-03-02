<?php

namespace App\Http\Requests;

use App\DataTransferObjects\MpesaB2BPaymentData;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMpesaB2BPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $commandId = (string) $this->input('CommandID', '');
        $defaultTillAccountReference = (string) config('services.mpesa.b2b_till_account_reference', 'TILLPAY');
        $accountReference = $this->input('AccountReference');

        if (
            $commandId === 'BusinessBuyGoods'
            && (! is_string($accountReference) || trim($accountReference) === '')
        ) {
            $accountReference = $defaultTillAccountReference;
        }

        $this->merge([
            'Initiator' => $this->input('Initiator', config('services.mpesa.b2b_initiator_name')),
            'SecurityCredential' => $this->input('SecurityCredential', config('services.mpesa.b2b_security_credential')),
            'SenderIdentifierType' => 4,
            'ReceiverIdentifierType' => 4,
            'PartyA' => $this->input('PartyA', config('services.mpesa.shortcode')),
            'AccountReference' => $accountReference,
            'QueueTimeOutURL' => $this->input('QueueTimeOutURL', config('services.mpesa.b2b_timeout_url')),
            'ResultURL' => $this->input('ResultURL', config('services.mpesa.b2b_result_url')),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'Initiator' => ['required', 'string', 'max:255'],
            'SecurityCredential' => ['required', 'string'],
            'CommandID' => ['required', 'string', 'in:BusinessPayBill,BusinessBuyGoods'],
            'SenderIdentifierType' => ['required', 'integer', 'in:4'],
            'ReceiverIdentifierType' => ['required', 'integer', 'in:4'],
            'Amount' => ['required', 'numeric', 'gt:0'],
            'PartyA' => ['required', 'string', 'max:20'],
            'PartyB' => ['required', 'string', 'max:20'],
            'AccountReference' => ['required_if:CommandID,BusinessPayBill', 'nullable', 'string', 'max:13'],
            'Requester' => ['nullable', 'string', 'regex:/^254\d{9}$/'],
            'Remarks' => ['required', 'string', 'max:100'],
            'QueueTimeOutURL' => [
                'required',
                'url',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (app()->isProduction() && is_string($value) && ! str_starts_with($value, 'https://')) {
                        $fail($attribute.' must be an HTTPS URL in production.');
                    }
                },
            ],
            'ResultURL' => [
                'required',
                'url',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (app()->isProduction() && is_string($value) && ! str_starts_with($value, 'https://')) {
                        $fail($attribute.' must be an HTTPS URL in production.');
                    }
                },
            ],
            'Occasion' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'CommandID.in' => 'CommandID must be either BusinessPayBill or BusinessBuyGoods.',
            'Requester.regex' => 'Requester must be in international format, e.g. 254712345678.',
            'SenderIdentifierType.in' => 'SenderIdentifierType must be 4.',
            'ReceiverIdentifierType.in' => 'ReceiverIdentifierType must be 4.',
        ];
    }

    public function toData(): MpesaB2BPaymentData
    {
        return MpesaB2BPaymentData::fromValidated($this->validated());
    }
}
