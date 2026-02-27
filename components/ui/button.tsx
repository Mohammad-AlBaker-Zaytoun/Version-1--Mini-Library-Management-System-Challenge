import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] shadow-[0_10px_28px_-16px_rgba(36,70,232,0.9)] hover:brightness-105',
  secondary:
    'bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)]',
  outline:
    'border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function buttonClassName({
  className,
  variant = 'primary',
  size = 'md',
}: {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return cn(
    'inline-flex min-h-9 items-center justify-center rounded-xl font-semibold transition-[transform,box-shadow,background-color,color,border-color,opacity] duration-300 ease-[var(--motion-smooth)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:pointer-events-none disabled:opacity-50',
    variantClassName[variant],
    sizeClassName[size],
    className,
  );
}
