import { Form, Head, Link } from '@inertiajs/react';
import { Building2, ShieldCheck, TrendingUp, UserPlus } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Register" />
            <div className="min-h-svh bg-background text-foreground">
                <div className="grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]">
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
                                Team Onboarding
                            </p>
                            <h1 className="max-w-xl text-4xl leading-tight font-bold tracking-tight">
                                Create your Buzzpay workspace and launch company
                                payouts in minutes.
                            </h1>
                            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                                Set up your organization, invite teammates, and
                                configure controlled finance operations from day
                                one.
                            </p>

                            <div className="grid max-w-xl grid-cols-2 gap-4">
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Setup Completion
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        6 min
                                    </p>
                                    <p className="text-primary mt-1 inline-flex items-center gap-1 text-xs">
                                        <TrendingUp className="size-3.5" />
                                        Average first-time onboarding
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Teams Activated
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        500+
                                    </p>
                                    <p className="text-primary mt-1 inline-flex items-center gap-1 text-xs">
                                        <Building2 className="size-3.5" />
                                        Active company workspaces
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-card p-3 text-center">
                                <UserPlus className="text-primary mx-auto size-4" />
                                <p className="text-muted-foreground mt-2 text-xs">
                                    New Setup
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-3 text-center">
                                <ShieldCheck className="text-primary mx-auto size-4" />
                                <p className="text-muted-foreground mt-2 text-xs">
                                    Secure Access
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-3 text-center">
                                <Building2 className="text-primary mx-auto size-4" />
                                <p className="text-muted-foreground mt-2 text-xs">
                                    Multi-team
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center justify-center p-6 md:p-10">
                        <Card className="w-full max-w-md border-border bg-card shadow-lg">
                            <CardContent className="space-y-6 p-7 md:p-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight">
                                        Create your account
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Open your Buzzpay workspace and start
                                        managing team disbursements.
                                    </p>
                                </div>

                                <Form
                                    {...store.form()}
                                    resetOnSuccess={[
                                        'password',
                                        'password_confirmation',
                                    ]}
                                    disableWhileProcessing
                                    className="flex flex-col gap-5"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-5">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">
                                                        Company name
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="name"
                                                        name="name"
                                                        placeholder="Acme Limited"
                                                        className="h-11"
                                                    />
                                                    <InputError
                                                        message={errors.name}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">
                                                        Work email
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="email"
                                                        name="email"
                                                        placeholder="finance@company.com"
                                                        className="h-11"
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="password">
                                                        Password
                                                    </Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        required
                                                        tabIndex={3}
                                                        autoComplete="new-password"
                                                        name="password"
                                                        placeholder="Create a strong password"
                                                        className="h-11"
                                                    />
                                                    <InputError message={errors.password} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="password_confirmation">
                                                        Confirm password
                                                    </Label>
                                                    <Input
                                                        id="password_confirmation"
                                                        type="password"
                                                        required
                                                        tabIndex={4}
                                                        autoComplete="new-password"
                                                        name="password_confirmation"
                                                        placeholder="Re-enter password"
                                                        className="h-11"
                                                    />
                                                    <InputError
                                                        message={errors.password_confirmation}
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="h-11 w-full"
                                                    tabIndex={5}
                                                    data-test="register-user-button"
                                                >
                                                    {processing && <Spinner />}
                                                    Create Buzzpay account
                                                </Button>
                                            </div>

                                            <div className="text-center text-sm text-muted-foreground">
                                                Already onboarded?{' '}
                                                <TextLink
                                                    href={login()}
                                                    tabIndex={6}
                                                >
                                                    Log in
                                                </TextLink>
                                            </div>
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
