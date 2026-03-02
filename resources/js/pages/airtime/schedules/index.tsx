import { Head, useForm } from '@inertiajs/react';
import {
    AlarmClockPlus,
    ArrowDownUp,
    Calendar as CalendarIcon,
    CalendarDays,
    Clock3,
    Coins,
    Filter,
    MessageSquareText,
    MoreHorizontal,
    Pencil,
    Phone,
    Repeat2,
    Search,
    Signal,
    TerminalSquare,
    Trash2,
    UserRound,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import ToastNotification from '@/components/ui/toast-notification';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { destroy, index, store, update } from '@/routes/airtime/schedules';
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
    max_occurrences?: number | null;
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

const statusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalized = status.toLowerCase();

    if (normalized === 'active' || normalized === 'scheduled') {
        return 'default';
    }

    if (normalized === 'paused') {
        return 'secondary';
    }

    if (normalized === 'failed' || normalized === 'cancelled') {
        return 'destructive';
    }

    return 'outline';
};

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
    const createForm = useForm({
        recipient: '',
        amount: '10',
        sender: '',
        schedule_type: 'one_time',
        start_date: '',
        send_time: '09:00',
        recurrence: 'daily',
        max_occurrences: '',
    });

    const editForm = useForm({
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
    const [editCommandInput, setEditCommandInput] = useState('');
    const [createDatePickerOpen, setCreateDatePickerOpen] = useState(false);
    const [editDatePickerOpen, setEditDatePickerOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] =
        useState<AirtimeSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] =
        useState<AirtimeSchedule | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const commandExample = useMemo(
        () => 'Try: recurring weekly 2026-03-02 09:30',
        [],
    );

    const openEditSchedule = (schedule: AirtimeSchedule): void => {
        setEditingSchedule(schedule);
        editForm.setData({
            recipient: schedule.recipient,
            amount: schedule.amount,
            sender: schedule.sender ?? '',
            schedule_type: schedule.schedule_type,
            start_date: schedule.start_date ?? '',
            send_time: (schedule.send_time ?? '09:00').slice(0, 5),
            recurrence: schedule.recurrence ?? 'daily',
            max_occurrences: schedule.max_occurrences
                ? String(schedule.max_occurrences)
                : '',
        });
        editForm.clearErrors();
        setEditCommandInput('');
    };

    const applyCreateCommand = (): void => {
        const raw = commandInput.trim().toLowerCase();
        if (raw === '') {
            return;
        }

        if (
            raw.includes('one-time') ||
            raw.includes('one time') ||
            raw.includes('once')
        ) {
            createForm.setData('schedule_type', 'one_time');
        }

        if (raw.includes('recurring')) {
            createForm.setData('schedule_type', 'recurring');
        }

        if (raw.includes('daily')) {
            createForm.setData('recurrence', 'daily');
            createForm.setData('schedule_type', 'recurring');
        }

        if (raw.includes('weekly')) {
            createForm.setData('recurrence', 'weekly');
            createForm.setData('schedule_type', 'recurring');
        }

        if (raw.includes('monthly')) {
            createForm.setData('recurrence', 'monthly');
            createForm.setData('schedule_type', 'recurring');
        }

        const dateMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch !== null) {
            createForm.setData('start_date', dateMatch[0]);
        }

        const timeMatch = raw.match(/\d{2}:\d{2}/);
        if (timeMatch !== null) {
            createForm.setData('send_time', timeMatch[0]);
        }
    };

    const applyEditCommand = (): void => {
        const raw = editCommandInput.trim().toLowerCase();
        if (raw === '') {
            return;
        }

        if (
            raw.includes('one-time') ||
            raw.includes('one time') ||
            raw.includes('once')
        ) {
            editForm.setData('schedule_type', 'one_time');
        }

        if (raw.includes('recurring')) {
            editForm.setData('schedule_type', 'recurring');
        }

        if (raw.includes('daily')) {
            editForm.setData('recurrence', 'daily');
            editForm.setData('schedule_type', 'recurring');
        }

        if (raw.includes('weekly')) {
            editForm.setData('recurrence', 'weekly');
            editForm.setData('schedule_type', 'recurring');
        }

        if (raw.includes('monthly')) {
            editForm.setData('recurrence', 'monthly');
            editForm.setData('schedule_type', 'recurring');
        }

        const dateMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch !== null) {
            editForm.setData('start_date', dateMatch[0]);
        }

        const timeMatch = raw.match(/\d{2}:\d{2}/);
        if (timeMatch !== null) {
            editForm.setData('send_time', timeMatch[0]);
        }
    };

    const submitCreate = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        createForm.post(store().url, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                setCommandInput('');
            },
        });
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (!editingSchedule) {
            return;
        }

        editForm.patch(update({ airtimeSchedule: editingSchedule.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingSchedule(null);
            },
        });
    };

    const visibleSchedules = useMemo(() => {
        const term = search.trim().toLowerCase();

        return [...schedules.data]
            .filter((schedule) => {
                const matchesSearch =
                    term === '' ||
                    schedule.recipient.toLowerCase().includes(term) ||
                    (schedule.sender ?? '').toLowerCase().includes(term);

                const matchesStatus =
                    statusFilter === 'all' ||
                    schedule.status.toLowerCase() === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'amount_desc') {
                    return Number(b.amount) - Number(a.amount);
                }

                if (sortBy === 'amount_asc') {
                    return Number(a.amount) - Number(b.amount);
                }

                if (sortBy === 'next_run_asc') {
                    return (
                        new Date(a.next_run_at ?? 0).getTime() -
                        new Date(b.next_run_at ?? 0).getTime()
                    );
                }

                if (sortBy === 'next_run_desc') {
                    return (
                        new Date(b.next_run_at ?? 0).getTime() -
                        new Date(a.next_run_at ?? 0).getTime()
                    );
                }

                return (
                    new Date(b.next_run_at ?? 0).getTime() -
                    new Date(a.next_run_at ?? 0).getTime()
                );
            });
    }, [schedules.data, search, statusFilter, sortBy]);

    const selectedCreateDate = createForm.data.start_date
        ? new Date(createForm.data.start_date)
        : undefined;
    const selectedEditDate = editForm.data.start_date
        ? new Date(editForm.data.start_date)
        : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Airtime Schedules" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Airtime Schedules"
                        description="Configure one-time and recurring airtime sends with operational controls."
                    />
                    <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            <Wallet className="mr-2 inline size-4" />
                            Wallet Balance
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            KES {company.airtime_balance}
                        </p>
                    </div>
                </div>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle className="inline-flex items-center gap-2">
                                <AlarmClockPlus className="size-4" /> Schedule
                                Actions
                            </CardTitle>
                            <CardDescription>
                                Create new schedules with command-assisted input
                                and form validation.
                            </CardDescription>
                        </div>
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button type="button">New Schedule</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle className="inline-flex items-center gap-2">
                                        <AlarmClockPlus className="size-4" />{' '}
                                        New Schedule
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create one-time or recurring airtime
                                        sends by date and time.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    className="grid gap-4 md:grid-cols-3"
                                    onSubmit={submitCreate}
                                >
                                    <div className="grid gap-2 md:col-span-3">
                                        <Label
                                            htmlFor="schedule_command"
                                            className="inline-flex items-center gap-2"
                                        >
                                            <TerminalSquare className="size-4" />{' '}
                                            Schedule Command Input
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="schedule_command"
                                                value={commandInput}
                                                onChange={(event) =>
                                                    setCommandInput(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={commandExample}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={applyCreateCommand}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="recipient"
                                            className="inline-flex items-center gap-2"
                                        >
                                            <Phone className="size-4" />{' '}
                                            Recipient
                                        </Label>
                                        <Input
                                            id="recipient"
                                            value={createForm.data.recipient}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'recipient',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="254712345678"
                                            required
                                        />
                                        <InputError
                                            message={
                                                createForm.errors.recipient
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="amount"
                                            className="inline-flex items-center gap-2"
                                        >
                                            <Coins className="size-4" /> Amount
                                            (KES)
                                        </Label>
                                        <Input
                                            id="amount"
                                            value={createForm.data.amount}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'amount',
                                                    event.target.value,
                                                )
                                            }
                                            type="number"
                                            min="10"
                                            step="0.01"
                                            required
                                        />
                                        <InputError
                                            message={createForm.errors.amount}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="sender"
                                            className="inline-flex items-center gap-2"
                                        >
                                            <UserRound className="size-4" />{' '}
                                            Sender (optional)
                                        </Label>
                                        <Input
                                            id="sender"
                                            value={createForm.data.sender}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'sender',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="COMPANY"
                                        />
                                        <InputError
                                            message={createForm.errors.sender}
                                        />
                                    </div>

                                    <div className="grid gap-2 md:col-span-3">
                                        <Label className="inline-flex items-center gap-2">
                                            <Repeat2 className="size-4" />{' '}
                                            Schedule Type
                                        </Label>
                                        <ToggleGroup
                                            type="single"
                                            value={
                                                createForm.data.schedule_type
                                            }
                                            onValueChange={(value) => {
                                                if (value !== '') {
                                                    createForm.setData(
                                                        'schedule_type',
                                                        value,
                                                    );
                                                }
                                            }}
                                            variant="outline"
                                        >
                                            <ToggleGroupItem
                                                value="one_time"
                                                aria-label="One-time"
                                            >
                                                One-time
                                            </ToggleGroupItem>
                                            <ToggleGroupItem
                                                value="recurring"
                                                aria-label="Recurring"
                                            >
                                                Recurring
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                        <InputError
                                            message={
                                                createForm.errors.schedule_type
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="start_date"
                                            className="inline-flex items-center gap-2"
                                        >
                                            <CalendarDays className="size-4" />{' '}
                                            Date
                                        </Label>
                                        <Popover
                                            open={createDatePickerOpen}
                                            onOpenChange={
                                                setCreateDatePickerOpen
                                            }
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="start_date"
                                                    variant="outline"
                                                    type="button"
                                                    className="justify-start font-normal"
                                                >
                                                    {selectedCreateDate
                                                        ? selectedCreateDate.toLocaleDateString()
                                                        : 'Select date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto overflow-hidden p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        selectedCreateDate
                                                    }
                                                    defaultMonth={
                                                        selectedCreateDate
                                                    }
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        if (!date) {
                                                            return;
                                                        }

                                                        const year =
                                                            date.getFullYear();
                                                        const month = String(
                                                            date.getMonth() + 1,
                                                        ).padStart(2, '0');
                                                        const day = String(
                                                            date.getDate(),
                                                        ).padStart(2, '0');
                                                        createForm.setData(
                                                            'start_date',
                                                            `${year}-${month}-${day}`,
                                                        );
                                                        setCreateDatePickerOpen(
                                                            false,
                                                        );
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError
                                            message={
                                                createForm.errors.start_date
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="send_time"
                                            className="inline-flex items-center gap-2"
                                        >
                                            <Clock3 className="size-4" /> Time
                                        </Label>
                                        <Input
                                            id="send_time"
                                            value={createForm.data.send_time}
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'send_time',
                                                    event.target.value,
                                                )
                                            }
                                            type="time"
                                            required
                                        />
                                        <InputError
                                            message={
                                                createForm.errors.send_time
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="recurrence">
                                            Recurrence
                                        </Label>
                                        <Select
                                            value={createForm.data.recurrence}
                                            onValueChange={(value) =>
                                                createForm.setData(
                                                    'recurrence',
                                                    value,
                                                )
                                            }
                                            disabled={
                                                createForm.data
                                                    .schedule_type ===
                                                'one_time'
                                            }
                                        >
                                            <SelectTrigger
                                                id="recurrence"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select recurrence" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">
                                                    Daily
                                                </SelectItem>
                                                <SelectItem value="weekly">
                                                    Weekly
                                                </SelectItem>
                                                <SelectItem value="monthly">
                                                    Monthly
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                createForm.errors.recurrence
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="max_occurrences">
                                            Max Runs (optional)
                                        </Label>
                                        <Input
                                            id="max_occurrences"
                                            value={
                                                createForm.data.max_occurrences
                                            }
                                            onChange={(event) =>
                                                createForm.setData(
                                                    'max_occurrences',
                                                    event.target.value,
                                                )
                                            }
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 10"
                                            disabled={
                                                createForm.data
                                                    .schedule_type ===
                                                'one_time'
                                            }
                                        />
                                        <InputError
                                            message={
                                                createForm.errors
                                                    .max_occurrences
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <Button
                                            disabled={createForm.processing}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {createForm.processing && (
                                                <Spinner className="size-4" />
                                            )}
                                            Create Schedule
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                </Card>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="space-y-4">
                        <div>
                            <CardTitle>Scheduled Airtime Sends</CardTitle>
                            <CardDescription>
                                Search and sort schedules, then manage each
                                entry from grouped actions.
                            </CardDescription>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="pl-9"
                                    placeholder="Search recipient or sender"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-muted-foreground" />
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All statuses
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="paused">
                                            Paused
                                        </SelectItem>
                                        <SelectItem value="failed">
                                            Failed
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowDownUp className="size-4 text-muted-foreground" />
                                <Select
                                    value={sortBy}
                                    onValueChange={setSortBy}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sort schedules" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">
                                            Next run (latest)
                                        </SelectItem>
                                        <SelectItem value="next_run_asc">
                                            Next run (soonest)
                                        </SelectItem>
                                        <SelectItem value="amount_desc">
                                            Amount high to low
                                        </SelectItem>
                                        <SelectItem value="amount_asc">
                                            Amount low to high
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Phone className="size-4" />{' '}
                                                Recipient
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Coins className="size-4" />{' '}
                                                Amount
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Signal className="size-4" />{' '}
                                                Type
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <MessageSquareText className="size-4" />{' '}
                                                Recurrence
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarIcon className="size-4" />{' '}
                                                Next Run
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Signal className="size-4" />{' '}
                                                Status
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleSchedules.map((schedule) => (
                                        <tr
                                            key={schedule.id}
                                            className="border-t border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {schedule.recipient}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                KES {schedule.amount}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {schedule.schedule_type.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {schedule.recurrence ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {schedule.next_run_at ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={statusVariant(
                                                        schedule.status,
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {schedule.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openEditSchedule(
                                                                        schedule,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Edit schedule
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEditSchedule(
                                                                        schedule,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />{' '}
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setDeletingSchedule(
                                                                        schedule,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />{' '}
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {visibleSchedules.length === 0 && (
                                <p className="px-4 py-8 text-sm text-muted-foreground">
                                    No schedules match your current filters.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={editingSchedule !== null}
                onOpenChange={(open) => !open && setEditingSchedule(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Schedule</DialogTitle>
                        <DialogDescription>
                            Update schedule details and recurrence settings.
                        </DialogDescription>
                    </DialogHeader>

                    {editingSchedule && (
                        <form
                            className="grid gap-4 md:grid-cols-3"
                            onSubmit={submitEdit}
                        >
                            <div className="grid gap-2 md:col-span-3">
                                <Label
                                    htmlFor="edit_schedule_command"
                                    className="inline-flex items-center gap-2"
                                >
                                    <TerminalSquare className="size-4" />{' '}
                                    Schedule Command Input
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="edit_schedule_command"
                                        value={editCommandInput}
                                        onChange={(event) =>
                                            setEditCommandInput(
                                                event.target.value,
                                            )
                                        }
                                        placeholder={commandExample}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={applyEditCommand}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="edit_recipient"
                                    className="inline-flex items-center gap-2"
                                >
                                    <Phone className="size-4" /> Recipient
                                </Label>
                                <Input
                                    id="edit_recipient"
                                    value={editForm.data.recipient}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'recipient',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="254712345678"
                                    required
                                />
                                <InputError
                                    message={editForm.errors.recipient}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="edit_amount"
                                    className="inline-flex items-center gap-2"
                                >
                                    <Coins className="size-4" /> Amount (KES)
                                </Label>
                                <Input
                                    id="edit_amount"
                                    value={editForm.data.amount}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                    type="number"
                                    min="10"
                                    step="0.01"
                                    required
                                />
                                <InputError message={editForm.errors.amount} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="edit_sender"
                                    className="inline-flex items-center gap-2"
                                >
                                    <UserRound className="size-4" /> Sender
                                    (optional)
                                </Label>
                                <Input
                                    id="edit_sender"
                                    value={editForm.data.sender}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'sender',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="COMPANY"
                                />
                                <InputError message={editForm.errors.sender} />
                            </div>

                            <div className="grid gap-2 md:col-span-3">
                                <Label className="inline-flex items-center gap-2">
                                    <Repeat2 className="size-4" /> Schedule Type
                                </Label>
                                <ToggleGroup
                                    type="single"
                                    value={editForm.data.schedule_type}
                                    onValueChange={(value) => {
                                        if (value !== '') {
                                            editForm.setData(
                                                'schedule_type',
                                                value,
                                            );
                                        }
                                    }}
                                    variant="outline"
                                >
                                    <ToggleGroupItem
                                        value="one_time"
                                        aria-label="One-time"
                                    >
                                        One-time
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="recurring"
                                        aria-label="Recurring"
                                    >
                                        Recurring
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                <InputError
                                    message={editForm.errors.schedule_type}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="edit_start_date"
                                    className="inline-flex items-center gap-2"
                                >
                                    <CalendarDays className="size-4" /> Date
                                </Label>
                                <Popover
                                    open={editDatePickerOpen}
                                    onOpenChange={setEditDatePickerOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="edit_start_date"
                                            variant="outline"
                                            type="button"
                                            className="justify-start font-normal"
                                        >
                                            {selectedEditDate
                                                ? selectedEditDate.toLocaleDateString()
                                                : 'Select date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={selectedEditDate}
                                            defaultMonth={selectedEditDate}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                if (!date) {
                                                    return;
                                                }

                                                const year = date.getFullYear();
                                                const month = String(
                                                    date.getMonth() + 1,
                                                ).padStart(2, '0');
                                                const day = String(
                                                    date.getDate(),
                                                ).padStart(2, '0');
                                                editForm.setData(
                                                    'start_date',
                                                    `${year}-${month}-${day}`,
                                                );
                                                setEditDatePickerOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <InputError
                                    message={editForm.errors.start_date}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="edit_send_time"
                                    className="inline-flex items-center gap-2"
                                >
                                    <Clock3 className="size-4" /> Time
                                </Label>
                                <Input
                                    id="edit_send_time"
                                    value={editForm.data.send_time}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'send_time',
                                            event.target.value,
                                        )
                                    }
                                    type="time"
                                    required
                                />
                                <InputError
                                    message={editForm.errors.send_time}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit_recurrence">
                                    Recurrence
                                </Label>
                                <Select
                                    value={editForm.data.recurrence}
                                    onValueChange={(value) =>
                                        editForm.setData('recurrence', value)
                                    }
                                    disabled={
                                        editForm.data.schedule_type ===
                                        'one_time'
                                    }
                                >
                                    <SelectTrigger
                                        id="edit_recurrence"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select recurrence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">
                                            Daily
                                        </SelectItem>
                                        <SelectItem value="weekly">
                                            Weekly
                                        </SelectItem>
                                        <SelectItem value="monthly">
                                            Monthly
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editForm.errors.recurrence}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit_max_occurrences">
                                    Max Runs (optional)
                                </Label>
                                <Input
                                    id="edit_max_occurrences"
                                    value={editForm.data.max_occurrences}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'max_occurrences',
                                            event.target.value,
                                        )
                                    }
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 10"
                                    disabled={
                                        editForm.data.schedule_type ===
                                        'one_time'
                                    }
                                />
                                <InputError
                                    message={editForm.errors.max_occurrences}
                                />
                            </div>

                            <DialogFooter className="md:col-span-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingSchedule(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={editForm.processing}
                                    className="inline-flex items-center gap-2"
                                >
                                    {editForm.processing && (
                                        <Spinner className="size-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingSchedule !== null}
                onOpenChange={(open) => !open && setDeletingSchedule(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Schedule</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingSchedule && (
                        <Form
                            {...destroy.form({
                                airtimeSchedule: deletingSchedule.id,
                            })}
                            onSuccess={() => setDeletingSchedule(null)}
                            className="space-y-4"
                        >
                            {({ processing }) => (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Delete schedule for{' '}
                                        {deletingSchedule.recipient} (KES{' '}
                                        {deletingSchedule.amount})?
                                    </p>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setDeletingSchedule(null)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {processing && (
                                                <Spinner className="size-4" />
                                            )}
                                            Confirm Delete
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
