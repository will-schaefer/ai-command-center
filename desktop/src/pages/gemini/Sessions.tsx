import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ItemCard } from '@/components/cards/ItemCard';

interface Session {
  projectHash: string;
  sessionId: string;
  timestamp: number;
}

interface SessionDetail {
  projectHash: string;
  sessionId: string;
  session: unknown;
}

export function GeminiSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.gemini.getSessions();
      setSessions(data);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    }
  };

  const handleSelect = async (session: Session) => {
    try {
      const data = await api.gemini.getSession(session.projectHash, session.sessionId);
      setSelectedSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session');
    }
  };

  const handleBack = () => {
    setSelectedSession(null);
  };

  const formatTime = (ts: number) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString();
  };

  const formatSessionName = (sessionId: string) => {
    // session-2026-01-08T20-46-3ba7254a -> Jan 8, 2026 8:46 PM
    const match = sessionId.match(/session-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
      return date.toLocaleString();
    }
    return sessionId;
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div>Loading...</div>;

  // Detail view
  if (selectedSession) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">Session Detail</h1>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          <p>Project: {selectedSession.projectHash.slice(0, 16)}...</p>
          <p>Session: {formatSessionName(selectedSession.sessionId)}</p>
        </div>

        <div className="bg-muted p-4 rounded-lg border border-border overflow-auto max-h-[600px]">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(selectedSession.session, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Group sessions by project hash
  const groupedSessions = sessions.reduce((acc, session) => {
    if (!acc[session.projectHash]) {
      acc[session.projectHash] = [];
    }
    acc[session.projectHash].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gemini Sessions</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Chat sessions grouped by project
      </p>

      {Object.keys(groupedSessions).length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No sessions found
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([projectHash, projectSessions]) => (
            <div key={projectHash}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Project: {projectHash.slice(0, 12)}...
              </h2>
              <div className="grid gap-3">
                {projectSessions.map((session) => (
                  <ItemCard
                    key={session.sessionId}
                    name={formatSessionName(session.sessionId)}
                    description={`Session ID: ${session.sessionId.slice(-8)}`}
                    onClick={() => handleSelect(session)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
