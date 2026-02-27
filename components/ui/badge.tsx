import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'muted' | 'accent';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClassName: Record<BadgeVariant, string> = {
  default: 'bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]',
  muted: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
  accent: 'bg-[#d9f4ea] text-[#117151]',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        variantClassName[variant],
        className,
      )}
      {...props}
    />
  );
}
