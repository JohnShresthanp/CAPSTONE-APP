import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

const LABELS = {
  0.5: 'Worthless',
  1.0: 'Poor',
  1.5: 'Below average',
  2.0: 'Average',
  2.5: 'Decent',
  3.0: 'Good',
  3.5: 'Very good',
  4.0: 'Great',
  4.5: 'Excellent',
  5.0: 'Masterpiece'
};

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(null);

  const displayValue = hover ?? value ?? 0;
  const filled = Math.floor(displayValue);
  const half = displayValue % 1 !== 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= filled;
          const isHalf = star === filled + 1 && half;

          return (
            <span
              key={star}
              className="relative cursor-pointer px-0.5"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const val = x < rect.width / 2 ? star - 0.5 : star;
                onChange?.(val);
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setHover(x < rect.width / 2 ? star - 0.5 : star);
              }}
            >
              <Star
                size={size}
                className={isFull ? 'fill-accentGold text-accentGold' : 'text-white/20'}
              />
              {isHalf && (
                <StarHalf
                  size={size}
                  className="absolute inset-0 fill-accentGold text-accentGold"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              )}
            </span>
          );
        })}
      </div>
      {displayValue > 0 && (
        <span className="ml-1 text-xs text-muted">
          {displayValue.toFixed(1)} — {LABELS[displayValue]}
        </span>
      )}
    </div>
  );
}

export default StarRating;
