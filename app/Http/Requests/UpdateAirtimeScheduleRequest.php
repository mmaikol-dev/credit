<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAirtimeScheduleRequest extends FormRequest
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
            'recipient' => ['required', 'string', 'regex:/^254\d{9}$/'],
            'amount' => ['required', 'numeric', 'min:10'],
            'sender' => ['nullable', 'string', 'max:11'],
            'schedule_type' => ['required', Rule::in(['one_time', 'recurring'])],
            'start_date' => ['required', 'date'],
            'send_time' => ['required', 'date_format:H:i'],
            'recurrence' => ['required_if:schedule_type,recurring', 'nullable', Rule::in(['daily', 'weekly', 'monthly'])],
            'max_occurrences' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recipient.regex' => 'Recipient must be in international format, e.g. 254712345678.',
            'amount.min' => 'Scheduled airtime amount must be at least KES 10.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('schedule_type') === 'one_time') {
            $this->merge([
                'recurrence' => null,
                'max_occurrences' => 1,
            ]);
        }
    }
}
