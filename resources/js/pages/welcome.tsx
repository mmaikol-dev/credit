import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    BellRing,
    Building2,
    CalendarClock,
    CheckCircle2,
    CreditCard,
    Gauge,
    Layers3,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Users,
    Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { dashboard, login, register } from '@/routes';

type WelcomeProps = {
    canRegister?: boolean;
};

type Feature = {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
};

const features: Feature[] = [
    {
        title: 'Bulk Airtime Transfers',
        description: 'Push airtime to employees, agents, or customers in one operational flow.',
        icon: Smartphone,
    },
    {
        title: 'Smart Scheduling',
        description: 'Run one-time or recurring airtime campaigns by exact date and time.',
        icon: CalendarClock,
    },
    {
        title: 'Wallet Billing',
        description: 'Top up once and monitor usage with clean company-level spend visibility.',
        icon: Wallet,
    },
    {
        title: 'Company Isolation',
        description: 'Every company has scoped users, data, and transfer history by design.',
        icon: ShieldCheck,
    },
];

const trustPoints = [
    { label: 'Transfer Engine', value: 'Realtime' },
    { label: 'Scheduler', value: '24/7 Queue' },
    { label: 'Architecture', value: 'Multi-Tenant' },
];

export default function Welcome({ canRegister = true }: WelcomeProps) {
    const { auth } = usePage().props as { auth: { user: unknown | null } };

    return (
        <>
            <Head title="CreditSaaS | Airtime Platform">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_36%),radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.2),transparent_38%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.08]" />
                </div>

                <header className="flex w-full items-center justify-between px-6 py-6 lg:px-12">
                    <div className="inline-flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-400/15 p-2 ring-1 ring-cyan-300/30">
                            <CreditCard className="size-5 text-cyan-200" />
                        </div>
                        <div>
                            <p className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                CreditSaaS
                            </p>
                            <p className="text-xs text-slate-300">Company Airtime Infrastructure</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!auth.user && (
                            <Button asChild variant="ghost" className="text-slate-100 hover:bg-white/10 hover:text-cyan-200">
                                <Link href={login()}>Log In</Link>
                            </Button>
                        )}

                        {auth.user ? (
                            <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        ) : (
                            canRegister && (
                                <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                                    <Link href={register()}>Start Free</Link>
                                </Button>
                            )
                        )}
                    </div>
                </header>

                <main className="grid w-full gap-10 px-6 pb-14 pt-8 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:pt-12">
                    <section className="space-y-7">
                        <Badge variant="secondary" className="border-cyan-300/40 bg-cyan-300/15 px-3 py-1 text-cyan-100">
                            <Sparkles className="mr-1 size-3.5" /> Built for modern airtime workflows
                        </Badge>

                        <h1
                            className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl"
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                            Airtime Operations for Teams That Move Fast
                        </h1>

                        <p className="max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
                            Power payroll support, customer rewards, and recurring campaigns from one SaaS dashboard.
                            Your company gets billing control, scheduled transfers, and role-based access in a single workspace.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            {auth.user ? (
                                <Button asChild size="lg" className="bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">
                                    <Link href={dashboard()}>
                                        Open Dashboard <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild size="lg" className="bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">
                                        <Link href={login()}>
                                            Start Sending Airtime <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-slate-100 hover:bg-white/10">
                                            <Link href={register()}>
                                                Create Company Account <Building2 className="size-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {trustPoints.map((item) => (
                                <Card key={item.label} className="border-white/15 bg-white/[0.04] shadow-none">
                                    <CardContent className="space-y-1 px-4 py-4">
                                        <p className="text-lg font-bold text-cyan-200">{item.value}</p>
                                        <p className="text-xs text-slate-300">{item.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section>
                        <Card className="border-cyan-300/25 bg-slate-900/70 shadow-2xl shadow-cyan-950/20 backdrop-blur">
                            <CardHeader className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="inline-flex items-center gap-2 text-white">
                                        <Gauge className="size-4 text-cyan-200" /> Live Company Snapshot
                                    </CardTitle>
                                    <Badge className="bg-emerald-500/20 text-emerald-200">
                                        <CheckCircle2 className="mr-1 size-3" /> Healthy
                                    </Badge>
                                </div>
                                <CardDescription className="text-slate-300">
                                    Real-time visibility of transfers, schedule queue, and wallet status.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                        <p className="text-xs text-slate-400">Today Sent</p>
                                        <p className="text-xl font-bold text-white">KES 126,980</p>
                                    </div>
                                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                        <p className="text-xs text-slate-400">Available Wallet</p>
                                        <p className="text-xl font-bold text-cyan-200">KES 58,500</p>
                                    </div>
                                </div>

                                <Separator className="bg-white/10" />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                                        <p className="inline-flex items-center gap-2 text-sm text-slate-200">
                                            <BellRing className="size-4 text-cyan-200" /> Next recurring batch
                                        </p>
                                        <p className="text-sm font-semibold text-cyan-200">in 01:09:22</p>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                                        <p className="inline-flex items-center gap-2 text-sm text-slate-200">
                                            <Layers3 className="size-4 text-cyan-200" /> Scheduled jobs today
                                        </p>
                                        <p className="text-sm font-semibold text-white">42</p>
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                                        <p className="inline-flex items-center gap-2 text-sm text-slate-200">
                                            <Users className="size-4 text-cyan-200" /> Active team members
                                        </p>
                                        <p className="text-sm font-semibold text-white">7</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </main>

                <section className="w-full px-6 pb-16 lg:px-12">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <Card
                                    key={feature.title}
                                    className="border-white/15 bg-white/[0.03] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-white/[0.06]"
                                >
                                    <CardHeader className="space-y-3">
                                        <div className="inline-flex w-fit items-center rounded-lg bg-cyan-400/15 p-2 ring-1 ring-cyan-300/30">
                                            <Icon className="size-5 text-cyan-200" />
                                        </div>
                                        <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                            {feature.title}
                                        </CardTitle>
                                        <CardDescription className="text-slate-300">{feature.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                <section className="w-full px-6 pb-24 lg:px-12">
                    <Card className="border-cyan-300/30 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-emerald-500/20 shadow-none">
                        <CardContent className="flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-8 md:py-10">
                            <div className="space-y-2">
                                <Badge variant="outline" className="border-cyan-200/60 bg-cyan-300/10 text-cyan-100">
                                    <BadgeCheck className="mr-1 size-3.5" /> Production Ready
                                </Badge>
                                <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                    Launch Your Airtime Program This Week
                                </h2>
                                <p className="text-sm text-slate-200">
                                    Onboard your company, top up billing, invite your team, and automate airtime delivery.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {auth.user ? (
                                    <Button asChild size="lg" className="bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">
                                        <Link href={dashboard()}>Open Dashboard</Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button asChild size="lg" className="bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">
                                            <Link href={login()}>Sign In</Link>
                                        </Button>
                                        {canRegister && (
                                            <Button asChild size="lg" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                                                <Link href={register()}>Create Account</Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}
