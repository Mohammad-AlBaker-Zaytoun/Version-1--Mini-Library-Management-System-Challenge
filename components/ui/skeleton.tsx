import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[linear-gradient(90deg,#e8ecfb_0%,#dfe6ff_50%,#e8ecfb_100%)]', className)}
    />
  );
}
