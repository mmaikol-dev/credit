import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = 'dropdown',
    ...props
}: CalendarProps) {
    const usesDropdownCaption = captionLayout.startsWith('dropdown');

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            captionLayout={captionLayout}
            navLayout="after"
            className={cn('p-3', className)}
            classNames={{
                months: 'flex flex-col sm:flex-row gap-2',
                month: 'space-y-4',
                month_caption: 'relative flex h-9 items-center justify-center px-10 pt-1',
                caption_label: cn('text-sm font-medium', usesDropdownCaption && 'sr-only'),
                nav: 'absolute inset-x-0 top-1 flex h-7 items-center justify-between',
                button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                ),
                month_grid: 'w-full border-collapse space-y-1',
                weekdays: 'flex',
                weekday: 'text-muted-foreground w-9 rounded-md text-[0.8rem] font-normal',
                week: 'mt-2 flex w-full',
                day: 'relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
                day_button: cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-9 p-0 font-normal aria-selected:opacity-100'),
                selected:
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                today: 'bg-accent text-accent-foreground',
                outside: 'text-muted-foreground opacity-50',
                disabled: 'text-muted-foreground opacity-50',
                hidden: 'invisible',
                dropdowns: 'flex items-center gap-1.5 text-sm',
                dropdown_root: 'relative inline-flex items-center rounded-md border border-input px-2 py-1 text-sm',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: iconClassName, ...iconProps }) => {
                    if (orientation === 'left') {
                        return <ChevronLeft className={cn('h-4 w-4', iconClassName)} {...iconProps} />;
                    }

                    if (orientation === 'down') {
                        return <ChevronDown className={cn('h-4 w-4', iconClassName)} {...iconProps} />;
                    }

                    return <ChevronRight className={cn('h-4 w-4', iconClassName)} {...iconProps} />;
                },
            }}
            {...props}
        />
    );
}

export { Calendar };
