'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

export default function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const starIndex = i + 1;
        const filled = starIndex <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starIndex)}
            className={cn(
              'focus:outline-none',
              interactive
                ? 'cursor-pointer hover:scale-110 transition-transform'
                : 'cursor-default',
            )}
            aria-label={`${starIndex} star${starIndex !== 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-gray-300',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
