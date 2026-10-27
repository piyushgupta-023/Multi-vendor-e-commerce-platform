import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 font-semibold">
        {rating.toFixed(1)}{count !== undefined && ` (${count.toLocaleString()})`}
      </span>
    </div>
  );
}
