import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ToastType = 'success' | 'error' | 'info';

export default function ToastNotification({
    message,
    type = 'success',
    durationMs = 4200,
}: {
    message?: string;
    type?: ToastType;
    durationMs?: number;
}) {
    const [open, setOpen] = useState(Boolean(message));

    useEffect(() => {
        setOpen(Boolean(message));
    }, [message]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = setTimeout(() => setOpen(false), durationMs);

        return () => clearTimeout(timer);
    }, [open, durationMs]);

    if (!open || !message) {
        return null;
    }

    const isError = type === 'error';
    const isSuccess = type === 'success';

    return (
        <div className="fixed right-4 bottom-4 z-50 w-full max-w-md">
            <Alert variant={isError ? 'destructive' : 'default'}>
                {isSuccess && <CheckCircle2 />}
                {isError && <AlertCircle />}
                {!isSuccess && !isError && <Info />}
                <AlertTitle>
                    {isSuccess && 'Success'}
                    {isError && 'Action Required'}
                    {!isSuccess && !isError && 'Notice'}
                </AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Alert>
        </div>
    );
}
