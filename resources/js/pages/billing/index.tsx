import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowDownUp,
    Calendar,
    CircleDollarSign,
    FileText,
    Filter,
    MoreHorizontal,
    Pencil,
    Phone,
    PlusCircle,
    Search,
    Signal,
    Trash2,
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
import { index as airtimeTransfersIndex } from '@/routes/airtime/transfers';
import { index } from '@/routes/billing';
import { store as storeTopUp } from '@/routes/billing/top-ups';
import { destroy, update } from '@/routes/billing/transactions';
import type { BreadcrumbItem } from '@/types';

type Company = {
    id: number;
    name: string;
    airtime_balance: string;
};

type BillingTransaction = {
    id: number;
    type: string;
    amount: string;
    balance_after: string;
    note: string | null;
    can_delete: boolean;
    created_at: string | null;
};

type PaginatedTransactions = {
    data: BillingTransaction[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Billing',
        href: index(),
    },
];

const typeVariant = (
    type: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalized = type.toLowerCase();

    if (
        normalized === 'top_up' ||
        normalized === 'credit' ||
        normalized === 'reversal'
    ) {
        return 'default';
    }

    if (normalized === 'debit') {
        return 'destructive';
    }

    return 'outline';
};

export default function BillingPage({
    company,
    canTopUp,
    transactions,
    status,
    statusType = 'success',
}: {
    company: Company;
    canTopUp: boolean;
    transactions: PaginatedTransactions;
    status?: string;
    statusType?: 'success' | 'error' | 'info';
}) {
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] =
        useState<BillingTransaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] =
        useState<BillingTransaction | null>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const visibleTransactions = useMemo(() => {
        const term = search.trim().toLowerCase();

        return [...transactions.data]
            .filter((transaction) => {
                const matchesSearch =
                    term === '' ||
                    transaction.type.toLowerCase().includes(term) ||
                    (transaction.note ?? '').toLowerCase().includes(term);

                const matchesType =
                    typeFilter === 'all' ||
                    transaction.type.toLowerCase() === typeFilter;

                return matchesSearch && matchesType;
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
    }, [transactions.data, search, typeFilter, sortBy]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                        <Heading
                            title="Billing"
                            description="Top up your company wallet and review billing records with improved control."
                        />
                    </div>
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                <Wallet className="size-4" /> Current Wallet
                                Balance
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                KES {company.airtime_balance}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {company.name}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {canTopUp && (
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div>
                                <CardTitle className="inline-flex items-center gap-2">
                                    <CircleDollarSign className="size-4" />
                                    Wallet Top Up
                                </CardTitle>
                                <CardDescription>
                                    Trigger Mpesa STK push to top up your
                                    wallet. Account reference is mapped
                                    automatically to your company.
                                </CardDescription>
                            </div>
                            <Dialog
                                open={isTopUpOpen}
                                onOpenChange={setIsTopUpOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        className="inline-flex items-center gap-2"
                                    >
                                        <PlusCircle className="size-4" /> Top Up
                                        Balance
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Top Up Wallet</DialogTitle>
                                        <DialogDescription>
                                            Enter phone number and amount.
                                            Account reference is derived
                                            securely from your company ID.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        {...storeTopUp.form()}
                                        onSuccess={() => setIsTopUpOpen(false)}
                                        className="grid gap-4 md:grid-cols-3"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="phone_number">
                                                        Mpesa Phone Number
                                                    </Label>
                                                    <div className="relative">
                                                        <Phone className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                                        <Input
                                                            id="phone_number"
                                                            name="phone_number"
                                                            placeholder="254712345678"
                                                            className="pl-9"
                                                            required
                                                        />
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors.phone_number
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2 md:col-span-1">
                                                    <Label htmlFor="amount">
                                                        Amount (KES)
                                                    </Label>
                                                    <Input
                                                        id="amount"
                                                        name="amount"
                                                        type="number"
                                                        min="1"
                                                        step="0.01"
                                                        placeholder="5000"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.amount}
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
                                                        Initiate STK Push
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                    </Card>
                )}

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Billing Transactions</CardTitle>
                                <CardDescription>
                                    Use filters and sorting to find and manage
                                    billing entries quickly.
                                </CardDescription>
                            </div>
                            <Link
                                href={airtimeTransfersIndex()}
                                className="text-sm text-muted-foreground underline underline-offset-2"
                            >
                                Go to airtime transfers
                            </Link>
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
                                    placeholder="Search type or note"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-muted-foreground" />
                                <Select
                                    value={typeFilter}
                                    onValueChange={setTypeFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All types
                                        </SelectItem>
                                        <SelectItem value="top_up">
                                            Top Up
                                        </SelectItem>
                                        <SelectItem value="debit">
                                            Debit
                                        </SelectItem>
                                        <SelectItem value="reversal">
                                            Reversal
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
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Signal className="size-4" />{' '}
                                                Type
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <CircleDollarSign className="size-4" />{' '}
                                                Amount
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Wallet className="size-4" />{' '}
                                                Balance After
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <FileText className="size-4" />{' '}
                                                Note
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Calendar className="size-4" />{' '}
                                                Date
                                            </span>
                                        </th>
                                        {canTopUp && (
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleTransactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="border-t border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={typeVariant(
                                                        transaction.type,
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {transaction.type.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                KES {transaction.amount}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                KES {transaction.balance_after}
                                            </td>
                                            <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                                                <span className="block truncate">
                                                    {transaction.note ?? '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transaction.created_at ?? '-'}
                                            </td>
                                            {canTopUp && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setEditingTransaction(
                                                                            transaction,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Edit note
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
                                                                        setEditingTransaction(
                                                                            transaction,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />{' '}
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    disabled={
                                                                        !transaction.can_delete
                                                                    }
                                                                    onClick={() =>
                                                                        setDeletingTransaction(
                                                                            transaction,
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
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {visibleTransactions.length === 0 && (
                                <p className="px-4 py-8 text-sm text-muted-foreground">
                                    No billing records match your current
                                    filters.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={editingTransaction !== null}
                onOpenChange={(open) => !open && setEditingTransaction(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Billing Transaction</DialogTitle>
                        <DialogDescription>
                            Update note for transaction #
                            {editingTransaction?.id}.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTransaction && (
                        <Form
                            {...update.form({
                                companyBillingTransaction:
                                    editingTransaction.id,
                            })}
                            onSuccess={() => setEditingTransaction(null)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Type</Label>
                                        <Input
                                            value={editingTransaction.type}
                                            disabled
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_note">Note</Label>
                                        <Input
                                            id="edit_note"
                                            name="note"
                                            defaultValue={
                                                editingTransaction.note ?? ''
                                            }
                                            placeholder="Transaction note"
                                        />
                                        <InputError message={errors.note} />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingTransaction(null)
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
                open={deletingTransaction !== null}
                onOpenChange={(open) => !open && setDeletingTransaction(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Billing Transaction</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingTransaction && (
                        <Form
                            {...destroy.form({
                                companyBillingTransaction:
                                    deletingTransaction.id,
                            })}
                            onSuccess={() => setDeletingTransaction(null)}
                            className="space-y-4"
                        >
                            {({ processing }) => (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Delete {deletingTransaction.type}{' '}
                                        transaction of KES{' '}
                                        {deletingTransaction.amount}?
                                    </p>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setDeletingTransaction(null)
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
