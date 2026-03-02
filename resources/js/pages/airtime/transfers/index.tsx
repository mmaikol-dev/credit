import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowDownUp,
    Calendar,
    Coins,
    Filter,
    MessageSquareText,
    MoreHorizontal,
    Pencil,
    Phone,
    Search,
    Signal,
    Trash2,
    UserRound,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import ToastNotification from '@/components/ui/toast-notification';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { destroy, index, store, update } from '@/routes/airtime/transfers';
import type { BreadcrumbItem } from '@/types';

type Transfer = {
    id: number;
    recipient: string;
    sender: string | null;
    amount: string;
    status: string;
    provider_message: string | null;
    can_delete: boolean;
    created_at: string | null;
};

type PaginatedTransfers = {
    data: Transfer[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Transfer Airtime',
        href: index(),
    },
];

const statusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalized = status.toLowerCase();

    if (normalized === 'accepted' || normalized === 'success') {
        return 'default';
    }

    if (normalized === 'queued' || normalized === 'pending') {
        return 'secondary';
    }

    if (normalized === 'failed' || normalized === 'error') {
        return 'destructive';
    }

    return 'outline';
};

export default function TransferAirtime({
    company,
    transfers,
    status,
    statusType = 'success',
}: {
    company: { airtime_balance: string };
    transfers: PaginatedTransfers;
    status?: string;
    statusType?: 'success' | 'error' | 'info';
}) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(
        null,
    );
    const [deletingTransfer, setDeletingTransfer] = useState<Transfer | null>(
        null,
    );
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const visibleTransfers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return [...transfers.data]
            .filter((transfer) => {
                const matchesSearch =
                    term === '' ||
                    transfer.recipient.toLowerCase().includes(term) ||
                    (transfer.sender ?? '').toLowerCase().includes(term) ||
                    (transfer.provider_message ?? '')
                        .toLowerCase()
                        .includes(term);

                const matchesStatus =
                    statusFilter === 'all' ||
                    transfer.status.toLowerCase() === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'amount_desc') {
                    return Number(b.amount) - Number(a.amount);
                }

                if (sortBy === 'amount_asc') {
                    return Number(a.amount) - Number(b.amount);
                }

                if (sortBy === 'oldest') {
                    return (
                        new Date(a.created_at ?? 0).getTime() -
                        new Date(b.created_at ?? 0).getTime()
                    );
                }

                return (
                    new Date(b.created_at ?? 0).getTime() -
                    new Date(a.created_at ?? 0).getTime()
                );
            });
    }, [transfers.data, search, statusFilter, sortBy]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer Airtime" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Transfer Airtime"
                        description="Send airtime to employees and monitor transfer outcomes in one place."
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
                                <Phone className="size-4" />
                                Create Transfer
                            </CardTitle>
                            <CardDescription>
                                Start a new airtime transfer from a guided modal
                                form.
                            </CardDescription>
                        </div>
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button type="button">New Transfer</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>New Transfer</DialogTitle>
                                    <DialogDescription>
                                        Enter recipient details and amount to
                                        send airtime.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    {...store.form()}
                                    onSuccess={() => setIsCreateOpen(false)}
                                    className="grid gap-4 md:grid-cols-3"
                                >
                                    {({ processing, errors }) => (
                                        <>
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
                                                    name="recipient"
                                                    placeholder="254712345678"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.recipient}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="amount"
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    <Coins className="size-4" />{' '}
                                                    Amount (KES)
                                                </Label>
                                                <Input
                                                    id="amount"
                                                    name="amount"
                                                    type="number"
                                                    min="10"
                                                    step="0.01"
                                                    placeholder="100"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.amount}
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
                                                    name="sender"
                                                    placeholder="COMPANY"
                                                />
                                                <InputError
                                                    message={errors.sender}
                                                />
                                            </div>

                                            <div className="md:col-span-3">
                                                <Button
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    {processing && (
                                                        <Spinner className="size-4" />
                                                    )}
                                                    Send Airtime
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                </Card>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Recent Transfers</CardTitle>
                                <CardDescription>
                                    Track all company transfers with searchable
                                    and sortable results.
                                </CardDescription>
                            </div>
                            <Link
                                href={dashboard()}
                                className="text-sm text-muted-foreground underline underline-offset-2"
                            >
                                Back to dashboard
                            </Link>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="relative md:col-span-1">
                                <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="pl-9"
                                    placeholder="Search recipient, sender, message"
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
                                        <SelectItem value="accepted">
                                            Accepted
                                        </SelectItem>
                                        <SelectItem value="queued">
                                            Queued
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
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">
                                            Newest first
                                        </SelectItem>
                                        <SelectItem value="oldest">
                                            Oldest first
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
                            <table className="w-full min-w-[920px] text-left text-sm">
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
                                                <UserRound className="size-4" />{' '}
                                                Sender
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
                                                Status
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <MessageSquareText className="size-4" />{' '}
                                                Provider Message
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Calendar className="size-4" />{' '}
                                                Created
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleTransfers.map((transfer) => (
                                        <tr
                                            key={transfer.id}
                                            className="border-t border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {transfer.recipient}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transfer.sender ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                KES {transfer.amount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={statusVariant(
                                                        transfer.status,
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {transfer.status}
                                                </Badge>
                                            </td>
                                            <td className="max-w-[240px] px-4 py-3 text-muted-foreground">
                                                <span className="block truncate">
                                                    {transfer.provider_message ??
                                                        '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transfer.created_at ?? '-'}
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
                                                                    setEditingTransfer(
                                                                        transfer,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Edit transfer
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
                                                                    setEditingTransfer(
                                                                        transfer,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-4" />{' '}
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                disabled={
                                                                    !transfer.can_delete
                                                                }
                                                                onClick={() =>
                                                                    setDeletingTransfer(
                                                                        transfer,
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

                            {visibleTransfers.length === 0 && (
                                <p className="px-4 py-8 text-sm text-muted-foreground">
                                    No transfers match your current filters.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={editingTransfer !== null}
                onOpenChange={(open) => !open && setEditingTransfer(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Transfer</DialogTitle>
                        <DialogDescription>
                            Update sender ID for transfer #{editingTransfer?.id}
                            .
                        </DialogDescription>
                    </DialogHeader>
                    {editingTransfer && (
                        <Form
                            {...update.form({
                                airtimeTransfer: editingTransfer.id,
                            })}
                            onSuccess={() => setEditingTransfer(null)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Recipient</Label>
                                        <Input
                                            value={editingTransfer.recipient}
                                            disabled
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Amount</Label>
                                        <Input
                                            value={`KES ${editingTransfer.amount}`}
                                            disabled
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_sender">
                                            Sender (optional)
                                        </Label>
                                        <Input
                                            id="edit_sender"
                                            name="sender"
                                            defaultValue={
                                                editingTransfer.sender ?? ''
                                            }
                                            placeholder="COMPANY"
                                        />
                                        <InputError message={errors.sender} />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingTransfer(null)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            disabled={processing}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {processing && (
                                                <Spinner className="size-4" />
                                            )}
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deletingTransfer !== null}
                onOpenChange={(open) => !open && setDeletingTransfer(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Transfer</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingTransfer && (
                        <Form
                            {...destroy.form({
                                airtimeTransfer: deletingTransfer.id,
                            })}
                            onSuccess={() => setDeletingTransfer(null)}
                            className="space-y-4"
                        >
                            {({ processing }) => (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Delete transfer to{' '}
                                        {deletingTransfer.recipient} for KES{' '}
                                        {deletingTransfer.amount}?
                                    </p>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setDeletingTransfer(null)
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
