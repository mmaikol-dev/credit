<?php

use App\Http\Controllers\AirtimeScheduleController;
use App\Http\Controllers\AirtimeTransferController;
use App\Http\Controllers\AirtimeWebhookController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\CompanyUserController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('airtime/transfers', [AirtimeTransferController::class, 'index'])->name('airtime.transfers.index');
    Route::post('airtime/transfers', [AirtimeTransferController::class, 'store'])->name('airtime.transfers.store');
    Route::get('airtime/schedules', [AirtimeScheduleController::class, 'index'])->name('airtime.schedules.index');
    Route::post('airtime/schedules', [AirtimeScheduleController::class, 'store'])->name('airtime.schedules.store');
    Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
    Route::post('billing/top-ups', [BillingController::class, 'store'])->name('billing.top-ups.store');
    Route::get('company/users', [CompanyUserController::class, 'index'])->name('company.users.index');
    Route::post('company/users', [CompanyUserController::class, 'store'])->name('company.users.store');
});

Route::post('webhooks/statum/airtime', [AirtimeWebhookController::class, 'handle'])->name('airtime.webhook');

require __DIR__.'/settings.php';
