<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompanyUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CompanyUserController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $companyId = $user?->company_id;

        abort_unless($companyId !== null, 404);

        $company = $user->company()->firstOrFail();

        Log::debug('company.users.page_viewed', [
            'company_id' => $companyId,
            'viewer_user_id' => $user?->id,
            'is_company_admin' => $user?->is_company_admin,
        ]);

        return Inertia::render('company/users/index', [
            'canManageUsers' => $user->is_company_admin,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'status' => request()->session()->get('status'),
            'users' => User::query()
                ->where('company_id', $companyId)
                ->latest()
                ->get([
                    'id',
                    'name',
                    'email',
                    'is_company_admin',
                    'created_at',
                ]),
        ]);
    }

    public function store(StoreCompanyUserRequest $request): RedirectResponse
    {
        $currentUser = $request->user();
        $companyId = $currentUser?->company_id;

        abort_unless($companyId !== null, 404);

        $newUser = User::query()->create([
            'company_id' => $companyId,
            'is_company_admin' => $request->boolean('is_company_admin'),
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => Hash::make($request->string('password')->toString()),
        ]);

        Log::info('company.users.created', [
            'company_id' => $companyId,
            'created_by_user_id' => $currentUser?->id,
            'new_user_id' => $newUser->id,
            'new_user_email' => $this->maskEmail($newUser->email),
            'new_user_is_admin' => $newUser->is_company_admin,
        ]);

        return back()->with('status', 'Company user created successfully.');
    }

    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***';
        }

        $namePart = $parts[0];
        $domainPart = $parts[1];
        if (strlen($namePart) <= 2) {
            return '*@'.$domainPart;
        }

        return substr($namePart, 0, 2).str_repeat('*', strlen($namePart) - 2).'@'.$domainPart;
    }
}
