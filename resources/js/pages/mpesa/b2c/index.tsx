import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowDownUp,
    Calendar,
    Coins,
    Filter,
    HandCoins,
    Landmark,
    MessageSquareText,
    Phone,
    Search,
    Signal,
    Store,
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { store as b2bStore } from '@/routes/mpesa/b2b';
import { index, store as b2cStore } from '@/routes/mpesa/b2c';
import type { BreadcrumbItem } from '@/types';

type B2CTransaction = {
    id: number;
    originator_conversation_id: string;
    conversation_id: string | null;
    transaction_id: string | null;
    phone_number: string;
    amount: string;
    result_code: string | null;
    result_desc: string | null;
    status: string;
    created_at: string | null;
};

type PaginatedTransactions = {
    data: B2CTransaction[];
};

type TransactionType = 'b2c' | 'paybill' | 'buygoods';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Send Money',
        href: index(),
    },
];

const statusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalized = status.toLowerCase();

    if (normalized === 'success') {
        return 'default';
    }

    if (normalized === 'pending') {
        return 'secondary';
    }

    if (normalized === 'failed' || normalized === 'timeout') {
        return 'destructive';
    }

    return 'outline';
};

export default function MpesaSendMoneyPage({
    transactions,
    status,
    statusType = 'success',
}: {
    transactions: PaginatedTransactions;
    status?: string;
    statusType?: 'success' | 'error' | 'info';
}) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [b2cCommandId, setB2cCommandId] = useState('BusinessPayment');
    const [transactionType, setTransactionType] =
        useState<TransactionType>('b2c');

    const visibleTransactions = useMemo(() => {
        const term = search.trim().toLowerCase();

        return [...transactions.data]
            .filter((transaction) => {
                const matchesSearch =
                    term === '' ||
                    transaction.phone_number.toLowerCase().includes(term) ||
                    transaction.originator_conversation_id
                        .toLowerCase()
                        .includes(term) ||
                    (transaction.result_desc ?? '').toLowerCase().includes(term);

                const matchesStatus =
                    statusFilter === 'all' ||
                    transaction.status.toLowerCase() === statusFilter;

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
    }, [transactions.data, search, statusFilter, sortBy]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Send Money" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Send Money"
                        description="Choose payout type first, then submit Send Money, Pay Bill, or Till payments from one place."
                    />
                    <Link
                        href={dashboard()}
                        className="text-sm text-muted-foreground underline underline-offset-2"
                    >
                        Back to dashboard
                    </Link>
                </div>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle className="inline-flex items-center gap-2">
                                <HandCoins className="size-4" /> New Mpesa
                                Transaction
                            </CardTitle>
                            <CardDescription>
                                Pick transaction type, then complete the form
                                in the modal.
                            </CardDescription>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button type="button">Send Money</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Send Money</DialogTitle>
                                    <DialogDescription>
                                        Choose transaction type before filling
                                        the form.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('b2c')}
                                        className={`rounded-xl border px-3 py-3 text-left transition ${
                                            transactionType === 'b2c'
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:bg-muted/40'
                                        }`}
                                    >
                                        <p className="inline-flex items-center gap-2 text-sm font-semibold">
                                            <HandCoins className="size-4" /> Send
                                            Money
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Send to mobile number (B2C).
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTransactionType('paybill')
                                        }
                                        className={`rounded-xl border px-3 py-3 text-left transition ${
                                            transactionType === 'paybill'
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:bg-muted/40'
                                        }`}
                                    >
                                        <p className="inline-flex items-center gap-2 text-sm font-semibold">
                                            <Landmark className="size-4" /> Pay
                                            Bill
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            BusinessPayBill to paybill number.
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTransactionType('buygoods')
                                        }
                                        className={`rounded-xl border px-3 py-3 text-left transition ${
                                            transactionType === 'buygoods'
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:bg-muted/40'
                                        }`}
                                    >
                                        <p className="inline-flex items-center gap-2 text-sm font-semibold">
                                            <Store className="size-4" /> Send to
                                            Till
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            BusinessBuyGoods to till.
                                        </p>
                                    </button>
                                </div>

                                {transactionType === 'b2c' ? (
                                    <Form
                                        {...b2cStore.form()}
                                        onSuccess={() => setIsCreateOpen(false)}
                                        className="mt-4 grid gap-4 md:grid-cols-5"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="phone_number">
                                                        Recipient Number
                                                    </Label>
                                                    <Input
                                                        id="phone_number"
                                                        name="phone_number"
                                                        placeholder="254712345678"
                                                        required
                                                    />
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
                                                        placeholder="100"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.amount}
                                                    />
                                                </div>

                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="remarks">
                                                        Remarks
                                                    </Label>
                                                    <Input
                                                        id="remarks"
                                                        name="remarks"
                                                        placeholder="Withdrawal"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.remarks}
                                                    />
                                                </div>

                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="occasion">
                                                        Occasion (optional)
                                                    </Label>
                                                    <Input
                                                        id="occasion"
                                                        name="occasion"
                                                        placeholder="WalletWithdrawal"
                                                    />
                                                    <InputError
                                                        message={errors.occasion}
                                                    />
                                                </div>

                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="command_id">
                                                        Command
                                                    </Label>
                                                    <input
                                                        type="hidden"
                                                        name="command_id"
                                                        value={b2cCommandId}
                                                    />
                                                    <Select
                                                        value={b2cCommandId}
                                                        onValueChange={
                                                            setB2cCommandId
                                                        }
                                                    >
                                                        <SelectTrigger id="command_id">
                                                            <SelectValue placeholder="Command" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="BusinessPayment">
                                                                BusinessPayment
                                                            </SelectItem>
                                                            <SelectItem value="SalaryPayment">
                                                                SalaryPayment
                                                            </SelectItem>
                                                            <SelectItem value="PromotionPayment">
                                                                PromotionPayment
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            errors.command_id
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2 md:col-span-1">
                                                    <Label htmlFor="originator_conversation_id">
                                                        Custom ID
                                                    </Label>
                                                    <Input
                                                        id="originator_conversation_id"
                                                        name="originator_conversation_id"
                                                        placeholder="Optional"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.originator_conversation_id
                                                        }
                                                    />
                                                </div>

                                                <div className="md:col-span-5">
                                                    <Button
                                                        disabled={processing}
                                                        className="inline-flex items-center gap-2"
                                                    >
                                                        {processing && (
                                                            <Spinner className="size-4" />
                                                        )}
                                                        Submit B2C Request
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                ) : (
                                    <Form
                                        {...b2bStore.form()}
                                        onSuccess={() => setIsCreateOpen(false)}
                                        className="mt-4 grid gap-4 md:grid-cols-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="CommandID"
                                                    value={
                                                        transactionType ===
                                                        'paybill'
                                                            ? 'BusinessPayBill'
                                                            : 'BusinessBuyGoods'
                                                    }
                                                />
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="PartyB">
                                                        {transactionType ===
                                                        'paybill'
                                                            ? 'Paybill Number'
                                                            : 'Till Number'}
                                                    </Label>
                                                    <Input
                                                        id="PartyB"
                                                        name="PartyB"
                                                        placeholder="000000"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.PartyB}
                                                    />
                                                </div>
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="Amount">
                                                        Amount (KES)
                                                    </Label>
                                                    <Input
                                                        id="Amount"
                                                        name="Amount"
                                                        type="number"
                                                        min="1"
                                                        step="0.01"
                                                        placeholder="1500"
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.Amount}
                                                    />
                                                </div>
                                                {transactionType ===
                                                'paybill' ? (
                                                    <div className="grid gap-2 md:col-span-2">
                                                        <Label htmlFor="AccountReference">
                                                            Account Reference
                                                        </Label>
                                                        <Input
                                                            id="AccountReference"
                                                            name="AccountReference"
                                                            placeholder="INV-2026-001"
                                                            maxLength={13}
                                                            required
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.AccountReference
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 md:col-span-2">
                                                        <Label>
                                                            Account Reference
                                                        </Label>
                                                        <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                                                            Auto-filled for till
                                                            payments (
                                                            <span className="font-medium">
                                                                TILLPAY
                                                            </span>
                                                            ).
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="Requester">
                                                        Requester (optional)
                                                    </Label>
                                                    <Input
                                                        id="Requester"
                                                        name="Requester"
                                                        placeholder="254700000000"
                                                    />
                                                    <InputError
                                                        message={errors.Requester}
                                                    />
                                                </div>
                                                <div className="grid gap-2 md:col-span-4">
                                                    <Label htmlFor="Remarks">
                                                        Remarks
                                                    </Label>
                                                    <Input
                                                        id="Remarks"
                                                        name="Remarks"
                                                        placeholder={
                                                            transactionType ===
                                                            'paybill'
                                                                ? 'Monthly subscription payment'
                                                                : 'Store purchase payment'
                                                        }
                                                        maxLength={100}
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.Remarks}
                                                    />
                                                </div>
                                                <div className="grid gap-2 md:col-span-4">
                                                    <Label htmlFor="Occasion">
                                                        Occasion (optional)
                                                    </Label>
                                                    <Input
                                                        id="Occasion"
                                                        name="Occasion"
                                                        placeholder="Optional"
                                                        maxLength={100}
                                                    />
                                                    <InputError
                                                        message={errors.Occasion}
                                                    />
                                                </div>

                                                <div className="md:col-span-4">
                                                    <Button
                                                        disabled={processing}
                                                        className="inline-flex items-center gap-2"
                                                    >
                                                        {processing && (
                                                            <Spinner className="size-4" />
                                                        )}
                                                        Submit B2B Request
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Click <span className="font-medium">Send Money</span>{' '}
                            to choose between Send Money, Pay Bill, and Send to
                            Till before filling the form.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-col gap-4">
                        <div>
                            <CardTitle>Recent B2C Transactions</CardTitle>
                            <CardDescription>
                                Monitor pending, success, failed, and timeout
                                outcomes from Daraja callbacks.
                            </CardDescription>
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
                                    placeholder="Search phone, conversation, message"
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
                                        <SelectItem value="pending">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="success">
                                            Success
                                        </SelectItem>
                                        <SelectItem value="failed">
                                            Failed
                                        </SelectItem>
                                        <SelectItem value="timeout">
                                            Timeout
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowDownUp className="size-4 text-muted-foreground" />
                                <Select value={sortBy} onValueChange={setSortBy}>
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
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Phone className="size-4" /> Phone
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Coins className="size-4" /> Amount
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Signal className="size-4" /> Status
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">Originator ID</th>
                                        <th className="px-4 py-3">Conversation ID</th>
                                        <th className="px-4 py-3">Transaction ID</th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <MessageSquareText className="size-4" />
                                                Result
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Calendar className="size-4" /> Created
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleTransactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="border-t border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {transaction.phone_number}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                KES {transaction.amount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={statusVariant(
                                                        transaction.status,
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {transaction.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transaction.originator_conversation_id}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transaction.conversation_id ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transaction.transaction_id ?? '-'}
                                            </td>
                                            <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                                                <span className="block truncate">
                                                    {transaction.result_desc ??
                                                        transaction.result_code ??
                                                        '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transaction.created_at ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {visibleTransactions.length === 0 && (
                                <p className="px-4 py-8 text-sm text-muted-foreground">
                                    No B2C transactions match your current
                                    filters.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
