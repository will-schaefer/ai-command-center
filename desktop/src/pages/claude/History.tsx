import { api } from '@/lib/api';
import { HistoryViewer } from '@/components/viewers/HistoryViewer';

export function ClaudeHistory() {
  const fetchHistory = async (params: {
    limit: number;
    offset: number;
    search: string;
    sessionId: string;
  }) => {
    const data = await api.claude.getHistory({
      limit: params.limit,
      offset: params.offset,
      search: params.search || undefined,
      sessionId: params.sessionId || undefined,
    });

    return {
      entries: data.entries.map((e) => ({
        id: e.id,
        text: e.display,
        timestamp: e.timestamp,
        sessionId: e.sessionId,
        project: e.project,
      })),
      total: data.total,
      sessions: data.sessions,
    };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Claude History</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Command history from Claude Code sessions
      </p>

      <HistoryViewer
        fetchHistory={fetchHistory}
        displayField="text"
        showProject
      />
    </div>
  );
}
