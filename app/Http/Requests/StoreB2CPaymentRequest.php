<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreB2CPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string', 'regex:/^254\d{9}$/'],
            'amount' => ['required', 'numeric', 'min:1'],
            'remarks' => ['required', 'string', 'max:100'],
            'occasion' => ['nullable', 'string', 'max:100'],
            'command_id' => ['nullable', 'string', 'in:BusinessPayment,SalaryPayment,PromotionPayment'],
            'originator_conversation_id' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone_number.regex' => 'Phone number must be in international format, e.g. 254712345678.',
            'command_id.in' => 'CommandID must be BusinessPayment, SalaryPayment, or PromotionPayment.',
        ];
    }
}
