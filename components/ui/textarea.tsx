import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-28 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-[border-color,box-shadow,background-color] duration-300 ease-[var(--motion-smooth)] placeholder:text-[var(--text-muted)] hover:border-[#b9c7ff] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
