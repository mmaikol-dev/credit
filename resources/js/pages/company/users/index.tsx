import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index, store } from '@/routes/company/users';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type CompanyUser = {
    id: number;
    name: string;
    email: string;
    is_company_admin: boolean;
    created_at: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Team',
        href: index(),
    },
];

export default function CompanyUsersPage({
    company,
    canManageUsers,
    users,
    status,
}: {
    company: { id: number; name: string };
    canManageUsers: boolean;
    users: CompanyUser[];
    status?: string;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Team" />

            <div className="space-y-6 p-4">
                <Heading
                    title="Team Management"
                    description={`Users in ${company.name} only see company-scoped data.`}
                />

                {status && (
                    <p className="text-sm font-medium text-green-600">{status}</p>
                )}

                {canManageUsers && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Company User</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...store.form()} className="grid gap-4 md:grid-cols-2">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" name="name" required placeholder="Jane Doe" />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" required placeholder="jane@company.com" />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input id="password" name="password" type="password" required />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                                            <Input id="password_confirmation" name="password_confirmation" type="password" required />
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        <div className="flex items-center gap-2 md:col-span-2">
                                            <Checkbox id="is_company_admin" name="is_company_admin" />
                                            <Label htmlFor="is_company_admin">Grant company admin access</Label>
                                            <InputError message={errors.is_company_admin} />
                                        </div>

                                        <div className="md:col-span-2">
                                            <Button disabled={processing}>Create User</Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Company Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground">
                                    <tr>
                                        <th className="py-2">Name</th>
                                        <th className="py-2">Email</th>
                                        <th className="py-2">Role</th>
                                        <th className="py-2">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t">
                                            <td className="py-2">{user.name}</td>
                                            <td className="py-2">{user.email}</td>
                                            <td className="py-2">
                                                <Badge variant={user.is_company_admin ? 'default' : 'secondary'}>
                                                    {user.is_company_admin ? 'Admin' : 'Member'}
                                                </Badge>
                                            </td>
                                            <td className="py-2">{user.created_at ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {users.length === 0 && (
                                <p className="py-6 text-sm text-muted-foreground">No users in this company yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
