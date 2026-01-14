import { cn } from '@/lib/utils';

interface ItemCardProps {
  name: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ItemCard({
  name,
  description,
  badge,
  badgeColor = 'bg-muted-foreground',
  onClick,
  onDelete,
}: ItemCardProps) {
  return (
    <div
      className={cn(
        'bg-muted p-4 rounded-lg border border-border transition-colors group',
        onClick && 'cursor-pointer hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{name}</h3>
            {badge && (
              <span className={cn('text-xs px-2 py-0.5 rounded', badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity p-1"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
