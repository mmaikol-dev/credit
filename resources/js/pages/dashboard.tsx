import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { index as airtimeTransfers } from '@/routes/airtime/transfers';
import { dashboard } from '@/routes';
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
};

type RecentTransfer = {
    id: number;
    recipient: string;
    amount: string;
    status: string;
    created_at: string | null;
};

export default function Dashboard({
    summary,
    recentTransfers,
}: {
    summary: DashboardSummary;
    recentTransfers: RecentTransfer[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">KES {summary.airtimeBalance}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{summary.totalTransfers}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{summary.pendingTransfers}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{summary.completedTransfers}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">{summary.failedTransfers}</CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Airtime Transfers</CardTitle>
                        <Link className="text-sm underline underline-offset-2" href={airtimeTransfers()}>
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground">
                                    <tr>
                                        <th className="py-2">Recipient</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransfers.map((transfer) => (
                                        <tr key={transfer.id} className="border-t">
                                            <td className="py-2">{transfer.recipient}</td>
                                            <td className="py-2">KES {transfer.amount}</td>
                                            <td className="py-2">
                                                <Badge variant="secondary">{transfer.status}</Badge>
                                            </td>
                                            <td className="py-2">{transfer.created_at ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {recentTransfers.length === 0 && (
                                <p className="py-6 text-sm text-muted-foreground">
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
