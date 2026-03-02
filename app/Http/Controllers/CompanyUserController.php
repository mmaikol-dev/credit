<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompanyUserRequest;
use App\Http\Requests\UpdateCompanyUserRequest;
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
            'currentUserId' => $user->id,
            'companyOwnerId' => $company->owner_id,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'status' => request()->session()->get('status'),
            'statusType' => request()->session()->get('status_type', 'success'),
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

        return back()
            ->with('status', 'Company user created successfully.')
            ->with('status_type', 'success');
    }

    public function update(UpdateCompanyUserRequest $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();
        $companyId = $currentUser?->company_id;

        abort_unless($companyId !== null, 404);
        abort_unless($user->company_id === $companyId, 404);

        $payload = [
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'is_company_admin' => $request->boolean('is_company_admin'),
        ];

        if ($request->filled('password')) {
            $payload['password'] = Hash::make($request->string('password')->toString());
        }

        $user->update($payload);

        Log::info('company.users.updated', [
            'company_id' => $companyId,
            'updated_by_user_id' => $currentUser?->id,
            'updated_user_id' => $user->id,
        ]);

        return back()
            ->with('status', 'Company user updated successfully.')
            ->with('status_type', 'success');
    }

    public function destroy(User $user): RedirectResponse
    {
        $currentUser = request()->user();
        $companyId = $currentUser?->company_id;

        abort_unless($companyId !== null, 404);
        abort_unless($user->company_id === $companyId, 404);

        if ($currentUser?->id === $user->id) {
            return back()
                ->with('status', 'You cannot delete your own account.')
                ->with('status_type', 'error');
        }

        if ($currentUser?->company?->owner_id === $user->id) {
            return back()
                ->with('status', 'You cannot delete the company owner.')
                ->with('status_type', 'error');
        }

        $deletedUserId = $user->id;
        $user->delete();

        Log::info('company.users.deleted', [
            'company_id' => $companyId,
            'deleted_by_user_id' => $currentUser?->id,
            'deleted_user_id' => $deletedUserId,
        ]);

        return back()
            ->with('status', 'Company user deleted successfully.')
            ->with('status_type', 'success');
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
