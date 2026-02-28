<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAirtimeScheduleRequest;
use App\Models\AirtimeSchedule;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AirtimeScheduleController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $companyId = $user?->company_id;

        abort_unless($companyId !== null, 404);

        return Inertia::render('airtime/schedules/index', [
            'status' => request()->session()->get('status'),
            'statusType' => request()->session()->get('status_type', 'success'),
            'company' => [
                'airtime_balance' => $user?->company?->airtime_balance ?? '0.00',
            ],
            'schedules' => AirtimeSchedule::query()
                ->where('company_id', $companyId)
                ->latest()
                ->paginate(20)
                ->through(fn (AirtimeSchedule $schedule) => [
                    'id' => $schedule->id,
                    'recipient' => $schedule->recipient,
                    'sender' => $schedule->sender,
                    'amount' => $schedule->amount,
                    'schedule_type' => $schedule->schedule_type,
                    'recurrence' => $schedule->recurrence,
                    'start_date' => $schedule->start_date?->toDateString(),
                    'send_time' => $schedule->send_time,
                    'next_run_at' => $schedule->next_run_at?->toDateTimeString(),
                    'last_run_at' => $schedule->last_run_at?->toDateTimeString(),
                    'status' => $schedule->status,
                    'occurrences_count' => $schedule->occurrences_count,
                ]),
        ]);
    }

    public function store(StoreAirtimeScheduleRequest $request): RedirectResponse
    {
        $user = $request->user();
        $companyId = $user?->company_id;

        abort_unless($companyId !== null, 404);

        $nextRunAt = Carbon::parse(sprintf(
            '%s %s',
            $request->string('start_date')->toString(),
            $request->string('send_time')->toString(),
        ));

        $schedule = AirtimeSchedule::query()->create([
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'recipient' => $request->string('recipient')->toString(),
            'sender' => $request->filled('sender') ? $request->string('sender')->toString() : null,
            'amount' => number_format((float) $request->input('amount'), 2, '.', ''),
            'schedule_type' => $request->string('schedule_type')->toString(),
            'recurrence' => $request->filled('recurrence') ? $request->string('recurrence')->toString() : null,
            'start_date' => $request->string('start_date')->toString(),
            'send_time' => $request->string('send_time')->toString().':00',
            'next_run_at' => $nextRunAt->toDateTimeString(),
            'status' => 'active',
            'max_occurrences' => $request->integer('max_occurrences') ?: null,
        ]);

        Log::info('airtime.schedule.created', [
            'schedule_id' => $schedule->id,
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'schedule_type' => $schedule->schedule_type,
            'recurrence' => $schedule->recurrence,
            'next_run_at' => $schedule->next_run_at?->toDateTimeString(),
            'amount' => $schedule->amount,
            'recipient' => $this->maskPhone($schedule->recipient),
        ]);

        return back()
            ->with('status', 'Airtime schedule created successfully.')
            ->with('status_type', 'success');
    }

    private function maskPhone(string $phone): string
    {
        $length = strlen($phone);
        if ($length <= 4) {
            return '****';
        }

        return substr($phone, 0, 3).str_repeat('*', max(0, $length - 7)).substr($phone, -4);
    }
}
