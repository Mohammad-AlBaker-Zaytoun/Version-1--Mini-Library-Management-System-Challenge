'use client';

import Image, { type ImageLoader } from 'next/image';
import { useEffect, useState, type ReactEventHandler } from 'react';

import { DEFAULT_BOOK_COVER_URL, getBookCoverUrl } from '@/lib/books/cover';
import { cn } from '@/lib/utils';

interface BookCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onError?: ReactEventHandler<HTMLImageElement>;
}

const passthroughLoader: ImageLoader = ({ src }) => src;

export function BookCoverImage({
  src,
  alt,
  className,
  width = 320,
  height = 480,
  sizes,
  priority = false,
  onError,
}: BookCoverImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(() => getBookCoverUrl(src));

  useEffect(() => {
    setResolvedSrc(getBookCoverUrl(src));
  }, [src]);

  return (
    <Image
      loader={passthroughLoader}
      unoptimized
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={cn('bg-[var(--surface-muted)] object-cover', className)}
      onError={(event) => {
        if (resolvedSrc !== DEFAULT_BOOK_COVER_URL) {
          setResolvedSrc(DEFAULT_BOOK_COVER_URL);
        }
        onError?.(event);
      }}
    />
  );
}
