import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as airtimeTransfersIndex } from '@/routes/airtime/transfers';
import { index } from '@/routes/billing';
import { store as storeTopUp } from '@/routes/billing/top-ups';
import { dashboard } from '@/routes';
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

export default function BillingPage({
    company,
    canTopUp,
    transactions,
    status,
}: {
    company: Company;
    canTopUp: boolean;
    transactions: PaginatedTransactions;
    status?: string;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Billing"
                    description="Top up your company airtime wallet and view billing ledger entries."
                />

                {status && (
                    <p className="text-sm font-medium text-green-600">{status}</p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">KES {company.airtime_balance}</div>
                            <p className="mt-2 text-sm text-muted-foreground">{company.name}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-x-4">
                            <Link className="text-sm underline underline-offset-2" href={airtimeTransfersIndex()}>
                                Go to airtime transfers
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {canTopUp && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Up Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...storeTopUp.form()} className="grid gap-4 md:grid-cols-3">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount">Amount (KES)</Label>
                                            <Input
                                                id="amount"
                                                name="amount"
                                                type="number"
                                                min="10"
                                                step="0.01"
                                                placeholder="5000"
                                                required
                                            />
                                            <InputError message={errors.amount} />
                                        </div>

                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="note">Note (optional)</Label>
                                            <Input
                                                id="note"
                                                name="note"
                                                placeholder="Mpesa top-up ref"
                                            />
                                            <InputError message={errors.note} />
                                        </div>

                                        <div className="md:col-span-3">
                                            <Button disabled={processing}>Top Up Balance</Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Billing Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground">
                                    <tr>
                                        <th className="py-2">Type</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Balance After</th>
                                        <th className="py-2">Note</th>
                                        <th className="py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.data.map((transaction) => (
                                        <tr key={transaction.id} className="border-t">
                                            <td className="py-2">
                                                <Badge variant="secondary">{transaction.type}</Badge>
                                            </td>
                                            <td className="py-2">KES {transaction.amount}</td>
                                            <td className="py-2">KES {transaction.balance_after}</td>
                                            <td className="py-2">{transaction.note ?? '-'}</td>
                                            <td className="py-2">{transaction.created_at ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {transactions.data.length === 0 && (
                                <p className="py-6 text-sm text-muted-foreground">No billing records yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
