import { api } from '@/lib/api';
import { HistoryViewer } from '@/components/viewers/HistoryViewer';

export function CodexHistory() {
  const fetchHistory = async (params: {
    limit: number;
    offset: number;
    search: string;
    sessionId: string;
  }) => {
    const data = await api.codex.getHistory({
      limit: params.limit,
      offset: params.offset,
      search: params.search || undefined,
      sessionId: params.sessionId || undefined,
    });

    return {
      entries: data.entries.map((e) => ({
        id: e.id,
        text: e.text,
        timestamp: e.timestamp,
        sessionId: e.sessionId,
      })),
      total: data.total,
      sessions: data.sessions,
    };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Codex History</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Command history from Codex sessions
      </p>

      <HistoryViewer fetchHistory={fetchHistory} />
    </div>
  );
}
