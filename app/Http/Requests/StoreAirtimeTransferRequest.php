<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAirtimeTransferRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient' => ['required', 'string', 'regex:/^254\d{9}$/'],
            'amount' => ['required', 'numeric', 'min:10'],
            'sender' => ['nullable', 'string', 'max:11'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recipient.regex' => 'Recipient must be in international format, e.g. 254712345678.',
            'amount.min' => 'Airtime amount must be at least KES 10.',
        ];
    }
}
