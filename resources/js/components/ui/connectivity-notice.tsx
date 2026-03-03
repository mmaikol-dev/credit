import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type NetworkInformationLike = {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener?: (type: 'change', listener: () => void) => void;
    removeEventListener?: (type: 'change', listener: () => void) => void;
};

type NavigatorWithConnection = Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
};

type ConnectivityStatus = 'online' | 'weak' | 'offline';

function getConnection(navigatorObject: NavigatorWithConnection): NetworkInformationLike | undefined {
    return (
        navigatorObject.connection ??
        navigatorObject.mozConnection ??
        navigatorObject.webkitConnection
    );
}

function getConnectivityStatus(): ConnectivityStatus {
    if (!navigator.onLine) {
        return 'offline';
    }

    const connection = getConnection(navigator as NavigatorWithConnection);
    if (!connection) {
        return 'online';
    }

    const effectiveType = connection.effectiveType?.toLowerCase();
    const isSlowType = effectiveType === 'slow-2g' || effectiveType === '2g';
    const isSlowDownlink = typeof connection.downlink === 'number' && connection.downlink < 1;
    const isHighRtt = typeof connection.rtt === 'number' && connection.rtt > 600;
    const hasSaveData = connection.saveData === true;

    if (isSlowType || isSlowDownlink || isHighRtt || hasSaveData) {
        return 'weak';
    }

    return 'online';
}

export function ConnectivityNotice() {
    const [status, setStatus] = useState<ConnectivityStatus>('online');

    useEffect(() => {
        const updateStatus = () => setStatus(getConnectivityStatus());
        const connection = getConnection(navigator as NavigatorWithConnection);

        updateStatus();

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        connection?.addEventListener?.('change', updateStatus);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            connection?.removeEventListener?.('change', updateStatus);
        };
    }, []);

    const content = useMemo(() => {
        if (status === 'offline') {
            return {
                icon: <WifiOff className="size-4" />,
                title: 'You are offline',
                message: 'Internet connection lost. Some features may be unavailable.',
                variant: 'destructive' as const,
            };
        }

        if (status === 'weak') {
            return {
                icon: <AlertTriangle className="size-4" />,
                title: 'Weak internet connection',
                message: 'Network quality is low. Requests may take longer than usual.',
                variant: 'default' as const,
            };
        }

        return null;
    }, [status]);

    if (!content) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed top-4 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4">
            <Alert variant={content.variant} className="pointer-events-auto shadow-lg">
                {content.icon}
                <AlertTitle>{content.title}</AlertTitle>
                <AlertDescription>{content.message}</AlertDescription>
            </Alert>
        </div>
    );
}
