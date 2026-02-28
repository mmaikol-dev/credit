<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $companyName = trim($input['name']).' Company';

        $company = Company::query()->create([
            'name' => $companyName,
            'slug' => Str::slug($companyName).'-'.substr(md5($input['email']), 0, 8),
        ]);

        $user = User::query()->create([
            'company_id' => $company->id,
            'is_company_admin' => true,
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        $company->update([
            'owner_id' => $user->id,
        ]);

        return $user;
    }
}
