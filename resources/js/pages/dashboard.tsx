import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    Coins,
    CreditCard,
    ListChecks,
    Phone,
    Signal,
    Smartphone,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as airtimeSchedules } from '@/routes/airtime/schedules';
import { index as airtimeTransfers } from '@/routes/airtime/transfers';
import { index as billing } from '@/routes/billing';
import { index as companyUsers } from '@/routes/company/users';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

type DashboardSummary = {
    airtimeBalance: string;
    totalTransfers: number;
    pendingTransfers: number;
    completedTransfers: number;
    failedTransfers: number;
    retryPendingTransfers: number;
    escalatedTransfers: number;
    successRate: number;
    totalWebhookCharges: number | string;
    latestProviderBalance: string | null;
};

type FailureReason = {
    reason: string;
    count: number;
};

type RecentTransfer = {
    id: number;
    recipient: string;
    amount: string;
    status: string;
    created_at: string | null;
};

const transferStatusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalized = status.toLowerCase();

    if (normalized === 'completed' || normalized === 'accepted') {
        return 'default';
    }

    if (normalized === 'queued' || normalized === 'pending') {
        return 'secondary';
    }

    if (normalized === 'failed') {
        return 'destructive';
    }

    return 'outline';
};

export default function Dashboard({
    summary,
    recentTransfers,
    failureReasons,
}: {
    summary: DashboardSummary;
    recentTransfers: RecentTransfer[];
    failureReasons: FailureReason[];
}) {
    const successRate = Number(summary.successRate ?? 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Operations Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Monitor airtime performance, balances, risk signals,
                            and recent activity.
                        </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card px-4 py-3 text-right shadow-sm">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            <Wallet className="size-4" />
                            Wallet Balance
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                            KES {summary.airtimeBalance}
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Link href={airtimeTransfers()} className="group">
                        <Card className="h-full border-border/70 shadow-sm transition group-hover:border-primary/40 group-hover:shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="inline-flex items-center gap-2 text-base">
                                    <Smartphone className="size-4" /> Transfer
                                    Airtime
                                </CardTitle>
                                <CardDescription>
                                    Send airtime and review transfer states.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Open transfers{' '}
                                <ArrowUpRight className="ml-1 inline size-4" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={airtimeSchedules()} className="group">
                        <Card className="h-full border-border/70 shadow-sm transition group-hover:border-primary/40 group-hover:shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="inline-flex items-center gap-2 text-base">
                                    <CalendarClock className="size-4" /> Airtime
                                    Schedules
                                </CardTitle>
                                <CardDescription>
                                    Manage one-time and recurring sends.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Open schedules{' '}
                                <ArrowUpRight className="ml-1 inline size-4" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={billing()} className="group">
                        <Card className="h-full border-border/70 shadow-sm transition group-hover:border-primary/40 group-hover:shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="inline-flex items-center gap-2 text-base">
                                    <CreditCard className="size-4" /> Billing
                                </CardTitle>
                                <CardDescription>
                                    Top up wallet and review transactions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Open billing{' '}
                                <ArrowUpRight className="ml-1 inline size-4" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={companyUsers()} className="group">
                        <Card className="h-full border-border/70 shadow-sm transition group-hover:border-primary/40 group-hover:shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="inline-flex items-center gap-2 text-base">
                                    <Users className="size-4" /> Team
                                </CardTitle>
                                <CardDescription>
                                    Manage members and admin access.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Open team{' '}
                                <ArrowUpRight className="ml-1 inline size-4" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wide uppercase">
                                <ListChecks className="mr-2 inline size-4" />
                                Total Transfers
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {summary.totalTransfers}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wide uppercase">
                                <Clock3 className="mr-2 inline size-4" />
                                Pending
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {summary.pendingTransfers}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wide uppercase">
                                <CheckCircle2 className="mr-2 inline size-4" />
                                Completed
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {summary.completedTransfers}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wide uppercase">
                                <XCircle className="mr-2 inline size-4" />
                                Failed
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {summary.failedTransfers}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wide uppercase">
                                <Signal className="mr-2 inline size-4" />
                                Success Rate
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {successRate}%
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="border-border/70 shadow-sm xl:col-span-2">
                        <CardHeader>
                            <CardTitle className="inline-flex items-center gap-2">
                                <Signal className="size-4" /> System Health
                            </CardTitle>
                            <CardDescription>
                                Realtime operational signals based on webhook
                                and transfer outcomes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Success Rate
                                    </span>
                                    <span className="font-medium">
                                        {successRate}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{
                                            width: `${Math.min(Math.max(successRate, 0), 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        <Clock3 className="mr-2 inline size-4" />
                                        Retry Pending
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        {summary.retryPendingTransfers}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        <AlertTriangle className="mr-2 inline size-4" />
                                        Escalated Transfers
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        {summary.escalatedTransfers}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        <CircleDollarSign className="mr-2 inline size-4" />
                                        Webhook Charges
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        KES {summary.totalWebhookCharges}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        <Wallet className="mr-2 inline size-4" />
                                        Provider Balance
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        {summary.latestProviderBalance ?? '-'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-sm">
                        <CardHeader>
                            <CardTitle className="inline-flex items-center gap-2">
                                <AlertTriangle className="size-4" /> Failure
                                Reasons
                            </CardTitle>
                            <CardDescription>
                                Top failed response descriptions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {failureReasons.map((item, index) => (
                                <div
                                    key={`${item.reason}-${index}`}
                                    className="rounded-lg border border-border/60 p-3"
                                >
                                    <p className="line-clamp-2 text-sm font-medium">
                                        {item.reason}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Count: {item.count}
                                    </p>
                                </div>
                            ))}

                            {failureReasons.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No failure reasons recorded.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Airtime Transfers</CardTitle>
                            <CardDescription>
                                Latest transfer activity across your company
                                wallet.
                            </CardDescription>
                        </div>
                        <Link
                            className="text-sm text-muted-foreground underline underline-offset-2"
                            href={airtimeTransfers()}
                        >
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full min-w-[680px] text-left text-sm">
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
                                                Status
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Calendar className="size-4" />{' '}
                                                Created
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransfers.map((transfer) => (
                                        <tr
                                            key={transfer.id}
                                            className="border-t border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {transfer.recipient}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                KES {transfer.amount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={transferStatusVariant(
                                                        transfer.status,
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {transfer.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {transfer.created_at ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {recentTransfers.length === 0 && (
                                <p className="px-4 py-6 text-sm text-muted-foreground">
                                    No airtime transfers yet.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
