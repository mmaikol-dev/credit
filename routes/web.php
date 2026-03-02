<?php

use App\Http\Controllers\AirtimeScheduleController;
use App\Http\Controllers\AirtimeTransferController;
use App\Http\Controllers\AirtimeWebhookController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\CompanyUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MpesaB2BCallbackController;
use App\Http\Controllers\MpesaB2BController;
use App\Http\Controllers\MpesaB2CCallbackController;
use App\Http\Controllers\MpesaB2CController;
use App\Http\Middleware\EnsureMpesaCallbackRequest;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('airtime/transfers', [AirtimeTransferController::class, 'index'])->name('airtime.transfers.index');
    Route::post('airtime/transfers', [AirtimeTransferController::class, 'store'])->name('airtime.transfers.store');
    Route::patch('airtime/transfers/{airtimeTransfer}', [AirtimeTransferController::class, 'update'])->name('airtime.transfers.update');
    Route::delete('airtime/transfers/{airtimeTransfer}', [AirtimeTransferController::class, 'destroy'])->name('airtime.transfers.destroy');
    Route::get('airtime/schedules', [AirtimeScheduleController::class, 'index'])->name('airtime.schedules.index');
    Route::post('airtime/schedules', [AirtimeScheduleController::class, 'store'])->name('airtime.schedules.store');
    Route::patch('airtime/schedules/{airtimeSchedule}', [AirtimeScheduleController::class, 'update'])->name('airtime.schedules.update');
    Route::delete('airtime/schedules/{airtimeSchedule}', [AirtimeScheduleController::class, 'destroy'])->name('airtime.schedules.destroy');
    Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
    Route::post('billing/top-ups', [BillingController::class, 'store'])->name('billing.top-ups.store');
    Route::patch('billing/transactions/{companyBillingTransaction}', [BillingController::class, 'updateTransaction'])->name('billing.transactions.update');
    Route::delete('billing/transactions/{companyBillingTransaction}', [BillingController::class, 'destroyTransaction'])->name('billing.transactions.destroy');
    Route::get('company/users', [CompanyUserController::class, 'index'])->name('company.users.index');
    Route::post('company/users', [CompanyUserController::class, 'store'])->name('company.users.store');
    Route::patch('company/users/{user}', [CompanyUserController::class, 'update'])->name('company.users.update');
    Route::delete('company/users/{user}', [CompanyUserController::class, 'destroy'])->name('company.users.destroy');
    Route::get('mpesa/send-money', [MpesaB2CController::class, 'index'])->name('mpesa.b2c.index');
    Route::post('api/b2c/payment-request', [MpesaB2CController::class, 'store'])->name('mpesa.b2c.store');
    Route::post('api/mpesa/b2b/payment-request', [MpesaB2BController::class, 'store'])->name('mpesa.b2b.store');
});

Route::post('webhooks/statum/airtime', [AirtimeWebhookController::class, 'handle'])->name('airtime.webhook');
Route::post('api/b2c/result', [MpesaB2CCallbackController::class, 'result'])->name('mpesa.b2c.result');
Route::post('api/b2c/timeout', [MpesaB2CCallbackController::class, 'timeout'])->name('mpesa.b2c.timeout');
Route::middleware([EnsureMpesaCallbackRequest::class])->group(function () {
    Route::post('api/mpesa/b2b/result', [MpesaB2BCallbackController::class, 'result'])->name('mpesa.b2b.result');
    Route::post('api/mpesa/b2b/timeout', [MpesaB2BCallbackController::class, 'timeout'])->name('mpesa.b2b.timeout');
});

require __DIR__.'/settings.php';
