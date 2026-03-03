import { Form, Head, Link } from '@inertiajs/react';
import { Activity, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            <div className="min-h-svh bg-background text-foreground">

                <div className="relative grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="relative hidden h-full flex-col justify-between overflow-hidden border-r border-border bg-muted/30 p-10 lg:flex">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
                            <div className="absolute bottom-16 right-0 h-64 w-64 rounded-full bg-green-400/10 blur-3xl" />
                        </div>
                        <Link href={home()} prefetch className="inline-flex w-fit items-center">
                            <AppLogo />
                        </Link>

                        <div className="space-y-7">
                            <p className="inline-flex items-center rounded-full border border-border bg-background px-4 py-1 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                Finance Operations
                            </p>
                            <h1 className="max-w-xl text-4xl leading-tight font-bold tracking-tight">
                                Real-time control for your payouts, wallets, and
                                settlement workflow.
                            </h1>
                            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                                Manage airtime and money disbursements from one
                                secure command center designed for finance teams.
                            </p>

                            <div className="grid max-w-xl grid-cols-2 gap-4">
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Settlement Success
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        99.98%
                                    </p>
                                    <p className="text-primary mt-1 inline-flex items-center gap-1 text-xs">
                                        <TrendingUp className="size-3.5" />
                                        +0.32% this month
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Avg. Processing Time
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        2.4s
                                    </p>
                                    <p className="text-primary mt-1 inline-flex items-center gap-1 text-xs">
                                        <Activity className="size-3.5" />
                                        Across 1,482 daily runs
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-card p-3 text-center">
                                <ShieldCheck className="text-primary mx-auto size-4" />
                                <p className="text-muted-foreground mt-2 text-xs">
                                    Compliance
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-3 text-center">
                                <Wallet className="text-primary mx-auto size-4" />
                                <p className="text-muted-foreground mt-2 text-xs">
                                    Wallets
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-3 text-center">
                                <Activity className="text-primary mx-auto size-4" />
                                <p className="text-muted-foreground mt-2 text-xs">
                                    Live Ops
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center justify-center p-6 md:p-10">
                        <Card className="w-full max-w-md border-border bg-card shadow-lg">
                            <CardContent className="space-y-6 p-7 md:p-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight">
                                        Welcome back
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Sign in to access your Buzzpay finance
                                        workspace.
                                    </p>
                                </div>

                                {status && (
                                    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground">
                                        {status}
                                    </div>
                                )}

                                <Form
                                    {...store.form()}
                                    resetOnSuccess={['password']}
                                    className="flex flex-col gap-5"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">
                                                        Email address
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="finance@company.com"
                                                        className="h-11"
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <div className="flex items-center">
                                                        <Label htmlFor="password">
                                                            Password
                                                        </Label>
                                                        {canResetPassword && (
                                                            <TextLink
                                                                href={request()}
                                                                className="ml-auto text-sm"
                                                                tabIndex={5}
                                                            >
                                                                Forgot password?
                                                            </TextLink>
                                                        )}
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="Enter your password"
                                                        className="h-11"
                                                    />
                                                    <InputError message={errors.password} />
                                                </div>

                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id="remember"
                                                        name="remember"
                                                        tabIndex={3}
                                                    />
                                                    <Label htmlFor="remember">
                                                        Keep me signed in
                                                    </Label>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="h-11 w-full"
                                                    tabIndex={4}
                                                    disabled={processing}
                                                    data-test="login-button"
                                                >
                                                    {processing && <Spinner />}
                                                    Log in to Buzzpay
                                                </Button>
                                            </div>

                                            {canRegister && (
                                                <div className="text-center text-sm text-muted-foreground">
                                                    Need an account?{' '}
                                                    <TextLink
                                                        href={register()}
                                                        tabIndex={6}
                                                    >
                                                        Create one
                                                    </TextLink>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </>
    );
}
