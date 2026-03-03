import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { ConnectivityNotice } from '@/components/ui/connectivity-notice';
import { SidebarProvider } from '@/components/ui/sidebar';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <ConnectivityNotice />
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen}>
            <ConnectivityNotice />
            {children}
        </SidebarProvider>
    );
}
