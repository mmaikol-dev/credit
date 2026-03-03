import { Link } from '@inertiajs/react';
import {
    BookOpen,
    CalendarClock,
    FolderGit2,
    HandCoins,
    LayoutGrid,
    Smartphone,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as airtimeSchedulesIndex } from '@/routes/airtime/schedules';
import { index as airtimeTransfersIndex } from '@/routes/airtime/transfers';
import { index as billingIndex } from '@/routes/billing';
import { index as companyUsersIndex } from '@/routes/company/users';
import { index as mpesaB2CIndex } from '@/routes/mpesa/b2c';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Transfer Airtime',
        href: airtimeTransfersIndex(),
        icon: Smartphone,
    },
    {
        title: 'Airtime Schedules',
        href: airtimeSchedulesIndex(),
        icon: CalendarClock,
    },
    {
        title: 'Billing',
        href: billingIndex(),
        icon: Wallet,
    },
    {
        title: 'Send Money',
        href: mpesaB2CIndex(),
        icon: HandCoins,
    },
    {
        title: 'Team',
        href: companyUsersIndex(),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={dashboard()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={mainNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
                <div className="bg-sidebar/95 border-sidebar-border/70 rounded-2xl border shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80">
                    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex min-w-max items-center gap-2 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
                        {mainNavItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors',
                                    isCurrentUrl(item.href) &&
                                        'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground',
                                )}
                            >
                                {item.icon && (
                                    <item.icon
                                        className={cn(
                                            'size-5',
                                            isCurrentUrl(item.href)
                                                ? 'text-sidebar-primary-foreground'
                                                : 'text-sidebar-foreground/80',
                                        )}
                                    />
                                )}
                                <span className="sr-only">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
                </div>
            </nav>
        </>
    );
}
