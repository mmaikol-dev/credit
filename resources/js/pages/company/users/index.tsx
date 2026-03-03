import { Form, Head } from '@inertiajs/react';
import {
    ArrowDownUp,
    Calendar,
    ChevronDown,
    Mail,
    Filter,
    MoreHorizontal,
    Pencil,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    UserPlus,
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { destroy, index, store, update } from '@/routes/company/users';
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
    currentUserId,
    companyOwnerId,
    users,
    status,
    statusType = 'success',
}: {
    company: { id: number; name: string };
    canManageUsers: boolean;
    currentUserId: number;
    companyOwnerId: number;
    users: CompanyUser[];
    status?: string;
    statusType?: 'success' | 'error' | 'info';
}) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<CompanyUser | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const isUserProtected = (user: CompanyUser): boolean => {
        return user.id === currentUserId || user.id === companyOwnerId;
    };

    const visibleUsers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return [...users]
            .filter((user) => {
                const matchesSearch =
                    term === '' ||
                    user.name.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term);

                const role = user.is_company_admin ? 'admin' : 'member';
                const matchesRole = roleFilter === 'all' || roleFilter === role;

                return matchesSearch && matchesRole;
            })
            .sort((a, b) => {
                if (sortBy === 'name_asc') {
                    return a.name.localeCompare(b.name);
                }

                if (sortBy === 'name_desc') {
                    return b.name.localeCompare(a.name);
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
    }, [users, search, roleFilter, sortBy]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Team" />

            <ToastNotification message={status} type={statusType} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <Heading
                        title="Team Management"
                        description={`Manage users in ${company.name} with clear role and access control.`}
                    />
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                <ShieldCheck className="size-4" /> Team Overview
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {users.length} Members
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {
                                    users.filter(
                                        (user) => user.is_company_admin,
                                    ).length
                                }{' '}
                                admins,{' '}
                                {
                                    users.filter(
                                        (user) => !user.is_company_admin,
                                    ).length
                                }{' '}
                                members
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {canManageUsers && (
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div>
                                <CardTitle className="inline-flex items-center gap-2">
                                    <UserPlus className="size-4" />
                                    Add Company User
                                </CardTitle>
                                <CardDescription>
                                    Create new team accounts and assign role
                                    access.
                                </CardDescription>
                            </div>
                            <Dialog
                                open={isCreateOpen}
                                onOpenChange={setIsCreateOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        className="inline-flex items-center gap-2"
                                    >
                                        <UserPlus className="size-4" /> New User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add Company User
                                        </DialogTitle>
                                        <DialogDescription>
                                            Create a new team member and assign
                                            role access.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        {...store.form()}
                                        onSuccess={() => setIsCreateOpen(false)}
                                        className="grid gap-4 md:grid-cols-2"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        required
                                                        placeholder="Jane Doe"
                                                    />
                                                    <InputError
                                                        message={errors.name}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">
                                                        Email
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        placeholder="jane@company.com"
                                                    />
                                                    <InputError
                                                        message={errors.email}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="password">
                                                        Password
                                                    </Label>
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.password
                                                        }
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="password_confirmation">
                                                        Confirm Password
                                                    </Label>
                                                    <Input
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        type="password"
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.password_confirmation
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 md:col-span-2">
                                                    <input
                                                        type="hidden"
                                                        name="is_company_admin"
                                                        value="0"
                                                    />
                                                    <input
                                                        id="is_company_admin"
                                                        name="is_company_admin"
                                                        type="checkbox"
                                                        value="1"
                                                        className="size-4 rounded border border-input"
                                                    />
                                                    <Label htmlFor="is_company_admin">
                                                        Grant company admin
                                                        access
                                                    </Label>
                                                    <InputError
                                                        message={
                                                            errors.is_company_admin
                                                        }
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <Button
                                                        disabled={processing}
                                                        className="inline-flex items-center gap-2"
                                                    >
                                                        {processing && (
                                                            <Spinner className="size-4" />
                                                        )}
                                                        Create User
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
                    <CardHeader className="space-y-4">
                        <div>
                            <CardTitle>Company Users</CardTitle>
                            <CardDescription>
                                Search, filter, and manage team members with
                                grouped actions.
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
                                    placeholder="Search name or email"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-muted-foreground" />
                                <Select
                                    value={roleFilter}
                                    onValueChange={setRoleFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All roles
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admins
                                        </SelectItem>
                                        <SelectItem value="member">
                                            Members
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
                                        <SelectValue placeholder="Sort users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">
                                            Newest first
                                        </SelectItem>
                                        <SelectItem value="oldest">
                                            Oldest first
                                        </SelectItem>
                                        <SelectItem value="name_asc">
                                            Name A-Z
                                        </SelectItem>
                                        <SelectItem value="name_desc">
                                            Name Z-A
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-3 md:hidden">
                            {visibleUsers.map((user) => (
                                <Collapsible
                                    key={user.id}
                                    className="rounded-xl border border-border/60 bg-card"
                                >
                                    <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
                                        <div>
                                            <p className="font-medium">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    user.is_company_admin
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {user.is_company_admin
                                                    ? 'Admin'
                                                    : 'Member'}
                                            </Badge>
                                            <ChevronDown className="size-4 text-muted-foreground" />
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-3 border-t border-border/60 px-4 py-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                Joined
                                            </span>
                                            <span>{user.created_at ?? '-'}</span>
                                        </div>
                                        {canManageUsers && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setEditingUser(user)
                                                    }
                                                    className="flex-1"
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={isUserProtected(user)}
                                                    onClick={() =>
                                                        setDeletingUser(user)
                                                    }
                                                    className="flex-1"
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto rounded-xl border border-border/60 md:block">
                            <table className="w-full min-w-[860px] text-left text-sm">
                                <thead className="bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <UserRound className="size-4" />{' '}
                                                Name
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Mail className="size-4" />{' '}
                                                Email
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <ShieldCheck className="size-4" />{' '}
                                                Role
                                            </span>
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="inline-flex items-center gap-2">
                                                <Calendar className="size-4" />{' '}
                                                Joined
                                            </span>
                                        </th>
                                        {canManageUsers && (
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-t border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {user.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        user.is_company_admin
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {user.is_company_admin
                                                        ? 'Admin'
                                                        : 'Member'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.created_at ?? '-'}
                                            </td>
                                            {canManageUsers && (
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
                                                                        setEditingUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Edit user
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
                                                                        setEditingUser(
                                                                            user,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />{' '}
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    disabled={isUserProtected(
                                                                        user,
                                                                    )}
                                                                    onClick={() =>
                                                                        setDeletingUser(
                                                                            user,
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
                        </div>

                        {visibleUsers.length === 0 && (
                            <p className="rounded-xl border border-border/60 px-4 py-8 text-sm text-muted-foreground">
                                No users match your current filters.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={editingUser !== null}
                onOpenChange={(open) => !open && setEditingUser(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Company User</DialogTitle>
                        <DialogDescription>
                            Update profile details and role access.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <Form
                            {...update.form({ user: editingUser.id })}
                            onSuccess={() => setEditingUser(null)}
                            className="grid gap-4 md:grid-cols-2"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_name">Name</Label>
                                        <Input
                                            id="edit_name"
                                            name="name"
                                            defaultValue={editingUser.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_email">
                                            Email
                                        </Label>
                                        <Input
                                            id="edit_email"
                                            name="email"
                                            type="email"
                                            defaultValue={editingUser.email}
                                            required
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_password">
                                            New Password (optional)
                                        </Label>
                                        <Input
                                            id="edit_password"
                                            name="password"
                                            type="password"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_password_confirmation">
                                            Confirm New Password
                                        </Label>
                                        <Input
                                            id="edit_password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 md:col-span-2">
                                        <input
                                            type="hidden"
                                            name="is_company_admin"
                                            value="0"
                                        />
                                        <input
                                            id="edit_is_company_admin"
                                            name="is_company_admin"
                                            type="checkbox"
                                            value="1"
                                            defaultChecked={
                                                editingUser.is_company_admin
                                            }
                                            className="size-4 rounded border border-input"
                                        />
                                        <Label htmlFor="edit_is_company_admin">
                                            Grant company admin access
                                        </Label>
                                        <InputError
                                            message={errors.is_company_admin}
                                        />
                                    </div>

                                    <DialogFooter className="md:col-span-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingUser(null)}
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
                open={deletingUser !== null}
                onOpenChange={(open) => !open && setDeletingUser(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingUser && (
                        <Form
                            {...destroy.form({ user: deletingUser.id })}
                            onSuccess={() => setDeletingUser(null)}
                            className="space-y-4"
                        >
                            {({ processing }) => (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Delete {deletingUser.name} (
                                        {deletingUser.email})?
                                    </p>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setDeletingUser(null)
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
