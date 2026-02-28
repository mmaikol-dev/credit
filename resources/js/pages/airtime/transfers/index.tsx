import { Form, Head, Link } from '@inertiajs/react';
import { Coins, Phone, UserRound } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ToastNotification from '@/components/ui/toast-notification';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index, store } from '@/routes/airtime/transfers';
import type { BreadcrumbItem } from '@/types';

type Transfer = {
    id: number;
    recipient: string;
    sender: string | null;
    amount: string;
    status: string;
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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer Airtime" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4">
                <Heading
                    title="Transfer Airtime"
                    description="Send airtime to employees and track all company transfers."
                />

                <p className="text-sm text-muted-foreground">
                    Wallet balance: <span className="font-medium text-foreground">KES {company.airtime_balance}</span>
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>New Transfer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...store.form()} className="grid gap-4 md:grid-cols-3">
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="recipient" className="inline-flex items-center gap-2">
                                            <Phone className="size-4" /> Recipient
                                        </Label>
                                        <Input id="recipient" name="recipient" placeholder="254712345678" required />
                                        <InputError message={errors.recipient} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="amount" className="inline-flex items-center gap-2">
                                            <Coins className="size-4" /> Amount (KES)
                                        </Label>
                                        <Input id="amount" name="amount" type="number" min="10" step="0.01" placeholder="100" required />
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="sender" className="inline-flex items-center gap-2">
                                            <UserRound className="size-4" /> Sender (optional)
                                        </Label>
                                        <Input id="sender" name="sender" placeholder="COMPANY" />
                                        <InputError message={errors.sender} />
                                    </div>

                                    <div className="md:col-span-3">
                                        <Button disabled={processing}>Send Airtime</Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Transfers</CardTitle>
                        <Link href={dashboard()} className="text-sm underline underline-offset-2">
                            Back to dashboard
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground">
                                    <tr>
                                        <th className="py-2">Recipient</th>
                                        <th className="py-2">Sender</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transfers.data.map((transfer) => (
                                        <tr key={transfer.id} className="border-t">
                                            <td className="py-2">{transfer.recipient}</td>
                                            <td className="py-2">{transfer.sender ?? '-'}</td>
                                            <td className="py-2">KES {transfer.amount}</td>
                                            <td className="py-2">
                                                <Badge variant="secondary">{transfer.status}</Badge>
                                            </td>
                                            <td className="py-2">{transfer.created_at ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {transfers.data.length === 0 && (
                                <p className="py-6 text-sm text-muted-foreground">
                                    No transfers yet for your company.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
