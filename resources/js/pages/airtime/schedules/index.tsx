import { Head, useForm } from '@inertiajs/react';
import { AlarmClockPlus, CalendarDays, Clock3, Coins, Phone, Repeat2, TerminalSquare, UserRound } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ToastNotification from '@/components/ui/toast-notification';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index, store } from '@/routes/airtime/schedules';
import type { BreadcrumbItem } from '@/types';

type AirtimeSchedule = {
    id: number;
    recipient: string;
    sender: string | null;
    amount: string;
    schedule_type: string;
    recurrence: string | null;
    start_date: string | null;
    send_time: string | null;
    next_run_at: string | null;
    last_run_at: string | null;
    status: string;
    occurrences_count: number;
};

type PaginatedSchedules = {
    data: AirtimeSchedule[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Airtime Schedules',
        href: index(),
    },
];

export default function AirtimeSchedulesPage({
    company,
    schedules,
    status,
    statusType = 'success',
}: {
    company: { airtime_balance: string };
    schedules: PaginatedSchedules;
    status?: string;
    statusType?: 'success' | 'error' | 'info';
}) {
    const form = useForm({
        recipient: '',
        amount: '10',
        sender: '',
        schedule_type: 'one_time',
        start_date: '',
        send_time: '09:00',
        recurrence: 'daily',
        max_occurrences: '',
    });

    const [commandInput, setCommandInput] = useState('');
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const commandExample = useMemo(
        () => 'Try: recurring weekly 2026-03-02 09:30',
        [],
    );

    const applyCommand = (): void => {
        const raw = commandInput.trim().toLowerCase();
        if (raw === '') {
            return;
        }

        if (raw.includes('one-time') || raw.includes('one time') || raw.includes('once')) {
            form.setData('schedule_type', 'one_time');
        }

        if (raw.includes('recurring')) {
            form.setData('schedule_type', 'recurring');
        }

        if (raw.includes('daily')) {
            form.setData('recurrence', 'daily');
            form.setData('schedule_type', 'recurring');
        }

        if (raw.includes('weekly')) {
            form.setData('recurrence', 'weekly');
            form.setData('schedule_type', 'recurring');
        }

        if (raw.includes('monthly')) {
            form.setData('recurrence', 'monthly');
            form.setData('schedule_type', 'recurring');
        }

        const dateMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch !== null) {
            form.setData('start_date', dateMatch[0]);
        }

        const timeMatch = raw.match(/\d{2}:\d{2}/);
        if (timeMatch !== null) {
            form.setData('send_time', timeMatch[0]);
        }
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post(store().url, {
            preserveScroll: true,
        });
    };

    const selectedDate = form.data.start_date ? new Date(form.data.start_date) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Airtime Schedules" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4">
                <Heading
                    title="Airtime Schedules"
                    description="Create one-time or recurring airtime sends by date and time."
                />

                <p className="text-sm text-muted-foreground">
                    Wallet balance: <span className="font-medium text-foreground">KES {company.airtime_balance}</span>
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle className="inline-flex items-center gap-2">
                            <AlarmClockPlus className="size-4" /> New Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
                            <div className="grid gap-2 md:col-span-3">
                                <Label htmlFor="schedule_command" className="inline-flex items-center gap-2">
                                    <TerminalSquare className="size-4" /> Schedule Command Input
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="schedule_command"
                                        value={commandInput}
                                        onChange={(event) => setCommandInput(event.target.value)}
                                        placeholder={commandExample}
                                    />
                                    <Button type="button" variant="outline" onClick={applyCommand}>
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="recipient" className="inline-flex items-center gap-2">
                                    <Phone className="size-4" /> Recipient
                                </Label>
                                <Input
                                    id="recipient"
                                    value={form.data.recipient}
                                    onChange={(event) => form.setData('recipient', event.target.value)}
                                    placeholder="254712345678"
                                    required
                                />
                                <InputError message={form.errors.recipient} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="amount" className="inline-flex items-center gap-2">
                                    <Coins className="size-4" /> Amount (KES)
                                </Label>
                                <Input
                                    id="amount"
                                    value={form.data.amount}
                                    onChange={(event) => form.setData('amount', event.target.value)}
                                    type="number"
                                    min="10"
                                    step="0.01"
                                    required
                                />
                                <InputError message={form.errors.amount} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sender" className="inline-flex items-center gap-2">
                                    <UserRound className="size-4" /> Sender (optional)
                                </Label>
                                <Input
                                    id="sender"
                                    value={form.data.sender}
                                    onChange={(event) => form.setData('sender', event.target.value)}
                                    placeholder="COMPANY"
                                />
                                <InputError message={form.errors.sender} />
                            </div>

                            <div className="grid gap-2 md:col-span-3">
                                <Label className="inline-flex items-center gap-2">
                                    <Repeat2 className="size-4" /> Schedule Type
                                </Label>
                                <ToggleGroup
                                    type="single"
                                    value={form.data.schedule_type}
                                    onValueChange={(value) => {
                                        if (value !== '') {
                                            form.setData('schedule_type', value);
                                        }
                                    }}
                                    variant="outline"
                                >
                                    <ToggleGroupItem value="one_time" aria-label="One-time">
                                        One-time
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="recurring" aria-label="Recurring">
                                        Recurring
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                <InputError message={form.errors.schedule_type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="start_date" className="inline-flex items-center gap-2">
                                    <CalendarDays className="size-4" /> Date
                                </Label>
                                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="start_date"
                                            variant="outline"
                                            type="button"
                                            className="justify-start font-normal"
                                        >
                                            {selectedDate
                                                ? selectedDate.toLocaleDateString()
                                                : 'Select date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            defaultMonth={selectedDate}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                if (!date) {
                                                    return;
                                                }

                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                form.setData('start_date', `${year}-${month}-${day}`);
                                                setDatePickerOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <InputError message={form.errors.start_date} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="send_time" className="inline-flex items-center gap-2">
                                    <Clock3 className="size-4" /> Time
                                </Label>
                                <Input
                                    id="send_time"
                                    value={form.data.send_time}
                                    onChange={(event) => form.setData('send_time', event.target.value)}
                                    type="time"
                                    required
                                />
                                <InputError message={form.errors.send_time} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="recurrence">Recurrence</Label>
                                <Select
                                    value={form.data.recurrence}
                                    onValueChange={(value) => form.setData('recurrence', value)}
                                    disabled={form.data.schedule_type === 'one_time'}
                                >
                                    <SelectTrigger id="recurrence" className="w-full">
                                        <SelectValue placeholder="Select recurrence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.recurrence} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="max_occurrences">Max Runs (optional)</Label>
                                <Input
                                    id="max_occurrences"
                                    value={form.data.max_occurrences}
                                    onChange={(event) => form.setData('max_occurrences', event.target.value)}
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 10"
                                    disabled={form.data.schedule_type === 'one_time'}
                                />
                                <InputError message={form.errors.max_occurrences} />
                            </div>

                            <div className="md:col-span-3">
                                <Button disabled={form.processing}>Create Schedule</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled Airtime Sends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground">
                                    <tr>
                                        <th className="py-2">Recipient</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Type</th>
                                        <th className="py-2">Recurrence</th>
                                        <th className="py-2">Next Run</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.data.map((schedule) => (
                                        <tr key={schedule.id} className="border-t">
                                            <td className="py-2">{schedule.recipient}</td>
                                            <td className="py-2">KES {schedule.amount}</td>
                                            <td className="py-2">{schedule.schedule_type}</td>
                                            <td className="py-2">{schedule.recurrence ?? '-'}</td>
                                            <td className="py-2">{schedule.next_run_at ?? '-'}</td>
                                            <td className="py-2">
                                                <Badge variant="secondary">{schedule.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {schedules.data.length === 0 && (
                                <p className="py-6 text-sm text-muted-foreground">No schedules yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
