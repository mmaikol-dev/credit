import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CalendarClock,
    CreditCard,
    ShieldCheck,
    Smartphone,
    Users,
    Wallet,
    Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard, login, register } from '@/routes';

const features = [
    {
        title: 'Bulk Disbursements',
        description:
            'Send value to many recipients at once with clear status visibility.',
        icon: Smartphone,
    },
    {
        title: 'Smart Scheduling',
        description:
            'Set one-time or recurring payouts and let the queue run automatically.',
        icon: CalendarClock,
    },
    {
        title: 'Wallet Billing',
        description:
            'Track top-ups, debits, and balances in one company wallet with audit-friendly records.',
        icon: Wallet,
    },
    {
        title: 'Company Isolation',
        description:
            'Each company has isolated data, users, and billing operations by default.',
        icon: ShieldCheck,
    },
];

const situations = [
    {
        title: 'Payroll Support & Staff Benefits',
        challenge:
            'Your team needs periodic employee support without manual spreadsheets and back-and-forth approvals.',
        outcome:
            'Buzzpay lets HR and finance schedule recurring batches, approve once, and deliver on time with a full audit trail.',
    },
    {
        title: 'Sales Incentives & Agent Motivation',
        challenge:
            'You run weekly incentives for agents but payouts are delayed, inconsistent, and hard to reconcile.',
        outcome:
            'Use segmented bulk sends and role-based approvals to reward fast while keeping spend visibility per campaign.',
    },
    {
        title: 'Customer Compensation & Recovery',
        challenge:
            'Support teams need to issue quick credits after service incidents, often under pressure.',
        outcome:
            'Create controlled payout workflows so support can trigger approved credits instantly with traceable references.',
    },
    {
        title: 'Field Teams & Branch Operations',
        challenge:
            'Distributed teams need regional allocations and central oversight at the same time.',
        outcome:
            'Assign scoped access by company/team and monitor all wallet activity centrally from one dashboard.',
    },
];

const benefits = [
    'Reduce manual payout operations and spreadsheet errors',
    'Improve payout speed during urgent or high-volume periods',
    'Protect company funds with clear approval and access controls',
    'Keep finance, HR, and ops aligned with shared visibility',
];

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage().props as { auth: { user: unknown | null } };
    const isLoggedIn = Boolean(auth.user);

    return (
        <div className="bg-background text-foreground relative min-h-screen overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="bg-emerald-500/18 absolute -top-24 -left-20 h-72 w-72 rounded-full blur-3xl" />
                <div className="bg-green-400/16 absolute top-32 right-[-7rem] h-64 w-64 rounded-full blur-3xl" />
                <div className="bg-lime-400/14 absolute bottom-0 left-1/3 h-72 w-72 rounded-full blur-3xl" />
                <div className="bg-emerald-500/14 absolute top-[42%] left-[8%] h-80 w-80 rounded-full blur-3xl" />
                <div className="bg-green-500/12 absolute top-[58%] right-[10%] h-72 w-72 rounded-full blur-3xl" />
                <div className="bg-lime-500/12 absolute top-[76%] left-[22%] h-80 w-80 rounded-full blur-3xl" />
                <div className="bg-emerald-400/10 absolute bottom-[6%] right-[16%] h-72 w-72 rounded-full blur-3xl" />
            </div>

            <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-lg">
                            <CreditCard className="size-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold sm:text-base">Buzzpay</p>
                            <p className="text-muted-foreground text-[11px] sm:text-xs">
                                Company Payout Infrastructure
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isLoggedIn && (
                            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                                <Link href={login()}>Log in</Link>
                            </Button>
                        )}
                        <Button asChild size="sm">
                            <Link href={isLoggedIn ? dashboard() : register()}>
                                {isLoggedIn ? 'Dashboard' : 'Get Started'}
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
                <section className="relative grid gap-6 lg:grid-cols-2 lg:gap-12">
                    <div className="space-y-5 sm:space-y-6">
                        <Badge variant="secondary" className="w-fit">
                            <Zap className="size-3.5" /> Built for modern finance teams
                        </Badge>
                        <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
                            Payment operations that feel like a{' '}
                            <span className="text-emerald-600 dark:text-emerald-400">
                                real company app.
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm leading-7 sm:text-base">
                            Manage payroll support, incentives, customer credits, and recurring campaigns in one workspace with clear controls for your team.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="w-full sm:w-auto">
                                <Link href={isLoggedIn ? dashboard() : login()}>
                                    {isLoggedIn ? 'Open Dashboard' : 'Start Sending'}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            {canRegister && !isLoggedIn && (
                                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                                    <Link href={register()}>Create Company Account</Link>
                                </Button>
                            )}
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="text-emerald-600 dark:text-emerald-400 size-4" />
                                Multi-tenant secure
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarClock className="text-emerald-600 dark:text-emerald-400 size-4" />
                                24/7 automation
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Users className="text-emerald-600 dark:text-emerald-400 size-4" />
                                Team-ready
                            </span>
                        </div>
                    </div>

                    <Card className="border-border/70 bg-card/95 shadow-lg [transform-style:preserve-3d] lg:hover:[transform:rotateX(2deg)_rotateY(-2deg)] lg:transition-transform lg:duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg">Live Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs">Today Sent</p>
                                    <p className="mt-1 text-base font-semibold sm:text-lg">KES 126,980</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground text-xs">Wallet Balance</p>
                                    <p className="mt-1 text-base font-semibold sm:text-lg">KES 58,500</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-muted-foreground">Batch completion</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">78%</span>
                                </div>
                                <div className="bg-muted h-2 rounded-full">
                                    <div className="bg-emerald-600 dark:bg-emerald-500 h-2 w-[78%] rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-muted-foreground">Wallet usage</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">41%</span>
                                </div>
                                <div className="bg-muted h-2 rounded-full">
                                    <div className="bg-emerald-600 dark:bg-emerald-500 h-2 w-[41%] rounded-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="pointer-events-none absolute top-6 right-[8%] z-20 hidden animate-float-slow items-center gap-2 rounded-lg border bg-card/95 px-3 py-2 shadow-md md:flex">
                        <Activity className="text-emerald-600 dark:text-emerald-400 size-4" />
                        <span className="text-xs font-medium">Realtime status</span>
                    </div>
                    <div className="pointer-events-none absolute bottom-10 right-[45%] z-20 hidden animate-float-medium items-center gap-2 rounded-lg border bg-card/95 px-3 py-2 shadow-md md:flex">
                        <Wallet className="text-emerald-600 dark:text-emerald-400 size-4" />
                        <span className="text-xs font-medium">Wallet synced</span>
                    </div>
                    <div className="pointer-events-none absolute top-20 left-[48%] z-20 hidden animate-float-long items-center gap-2 rounded-lg border bg-card/95 px-3 py-2 shadow-md lg:flex">
                        <ShieldCheck className="text-emerald-600 dark:text-emerald-400 size-4" />
                        <span className="text-xs font-medium">Secure approvals</span>
                    </div>
                </section>

                <section id="features" className="mt-10 sm:mt-14 lg:mt-16">
                    <div className="mb-5 sm:mb-7">
                        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Everything your payout program needs
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                            Built for scale while keeping daily operations simple.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                        {features.map((feature) => (
                            <Card key={feature.title} className="border-border/70 bg-card/95 h-full">
                                <CardContent className="space-y-3 p-4">
                                    <div className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 flex size-10 items-center justify-center rounded-lg">
                                        <feature.icon className="size-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold sm:text-base">{feature.title}</h3>
                                    <p className="text-muted-foreground text-xs leading-6 sm:text-sm">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="pricing" className="mt-10 sm:mt-14 lg:mt-16">
                    <Card className="border-border/70 bg-card/95">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl">Simple pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                                <div className="rounded-xl border p-4">
                                    <p className="text-muted-foreground text-xs uppercase">Per transaction</p>
                                    <p className="mt-2 text-3xl font-bold">KES 0.5</p>
                                </div>
                                <div className="rounded-xl border p-4">
                                    <p className="text-muted-foreground text-xs uppercase">Per user / month</p>
                                    <p className="mt-2 text-3xl font-bold">KES 300</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="use-cases" className="mt-10 sm:mt-14 lg:mt-16">
                    <div className="mb-5 sm:mb-7">
                        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            How Buzzpay helps in real company situations
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                            Different teams face different payout workflows. Buzzpay adapts to each one.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        {situations.map((item) => (
                            <Card key={item.title} className="border-border/70 bg-card/95 h-full">
                                <CardContent className="space-y-3 p-4 sm:p-5">
                                    <h3 className="text-base font-semibold sm:text-lg">{item.title}</h3>
                                    <p className="text-muted-foreground text-xs leading-6 sm:text-sm">
                                        <span className="text-foreground font-medium">Situation:</span>{' '}
                                        {item.challenge}
                                    </p>
                                    <p className="text-muted-foreground text-xs leading-6 sm:text-sm">
                                        <span className="text-foreground font-medium">How Buzzpay helps:</span>{' '}
                                        {item.outcome}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="relative mt-6 hidden h-20 overflow-hidden md:block">
                        <div className="animate-scroll-up-soft absolute inset-x-0 top-0 grid gap-3">
                            <div className="bg-card/90 mx-auto inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                                <Users className="text-emerald-600 dark:text-emerald-400 size-4" />
                                <span className="text-xs font-medium">Team payouts automated</span>
                            </div>
                            <div className="bg-card/90 mx-auto inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                                <CalendarClock className="text-emerald-600 dark:text-emerald-400 size-4" />
                                <span className="text-xs font-medium">Scheduled campaigns running</span>
                            </div>
                            <div className="bg-card/90 mx-auto inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                                <Wallet className="text-emerald-600 dark:text-emerald-400 size-4" />
                                <span className="text-xs font-medium">Wallet controls active</span>
                            </div>
                            <div className="bg-card/90 mx-auto inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                                <Users className="text-emerald-600 dark:text-emerald-400 size-4" />
                                <span className="text-xs font-medium">Team payouts automated</span>
                            </div>
                            <div className="bg-card/90 mx-auto inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                                <CalendarClock className="text-emerald-600 dark:text-emerald-400 size-4" />
                                <span className="text-xs font-medium">Scheduled campaigns running</span>
                            </div>
                            <div className="bg-card/90 mx-auto inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 shadow-sm">
                                <Wallet className="text-emerald-600 dark:text-emerald-400 size-4" />
                                <span className="text-xs font-medium">Wallet controls active</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="benefits" className="mt-10 sm:mt-14 lg:mt-16">
                    <Card className="border-border/70 bg-card/95">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl">Why companies choose Buzzpay</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {benefits.map((benefit) => (
                                    <div
                                        key={benefit}
                                        className="bg-muted/40 flex items-start gap-2 rounded-lg border p-3"
                                    >
                                        <ShieldCheck className="text-emerald-600 dark:text-emerald-400 mt-0.5 size-4 shrink-0" />
                                        <p className="text-sm">{benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>

            <footer className="relative z-10 border-t">
                <div className="text-muted-foreground mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-sm">
                    <p>© 2026 Buzzpay. Company Payout Infrastructure.</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-foreground transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-foreground transition-colors">
                            Terms
                        </a>
                        <a href="#" className="hover:text-foreground transition-colors">
                            Support
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
