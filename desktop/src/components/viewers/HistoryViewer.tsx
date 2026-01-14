import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface HistoryEntry {
  id: number;
  text: string;
  timestamp: number;
  sessionId: string;
  project?: string;
}

interface HistoryViewerProps {
  fetchHistory: (params: {
    limit: number;
    offset: number;
    search: string;
    sessionId: string;
  }) => Promise<{
    entries: HistoryEntry[];
    total: number;
    sessions: string[];
  }>;
  displayField?: 'text' | 'display';
  showProject?: boolean;
}

export function HistoryViewer({
  fetchHistory,
  displayField = 'text',
  showProject = false,
}: HistoryViewerProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchHistory({
        limit,
        offset,
        search,
        sessionId: sessionFilter,
      });
      setEntries(data.entries);
      setTotal(data.total);
      setSessions(data.sessions);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, offset, search, sessionFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [search, sessionFilter]);

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 min-w-[200px] px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {sessions.length > 0 && (
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s} value={s}>
                {s.slice(0, 8)}...
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Showing {entries.length} of {total} entries
        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No history entries found
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const text = displayField === 'display'
              ? (entry as unknown as { display: string }).display
              : entry.text;

            return (
              <div
                key={entry.id}
                className="bg-muted p-3 rounded-lg border border-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="flex-1 font-mono text-sm whitespace-pre-wrap break-words">
                    {text}
                  </p>
                  <div className="text-xs text-muted-foreground shrink-0 text-right">
                    <div>{formatTime(entry.timestamp)}</div>
                    {showProject && entry.project && (
                      <div className="mt-1 truncate max-w-[200px]" title={entry.project}>
                        {entry.project.replace(/^\/home\/[^/]+\//, '~/')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              offset === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            Previous
          </button>

          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              offset + limit >= total
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
