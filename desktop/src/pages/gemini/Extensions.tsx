import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Puzzle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Extension {
  name: string;
  enabled: boolean;
  overrides?: string[];
}

export function GeminiExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    try {
      const data = await api.gemini.getExtensions();
      setExtensions(data);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load extensions');
      setLoading(false);
    }
  };

  const handleToggle = async (name: string, currentState: boolean) => {
    setToggling(name);
    try {
      await api.gemini.toggleExtension(name, !currentState);
      setExtensions(prev =>
        prev.map(ext =>
          ext.name === name ? { ...ext, enabled: !currentState } : ext
        )
      );
      addToast('success', `${name} ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to toggle extension';
      setError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setToggling(null);
    }
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div className="text-muted-foreground">Loading extensions...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Puzzle className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold">Gemini Extensions</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Manage Gemini CLI extensions. Toggle extensions on/off for your projects.
      </p>

      {extensions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Puzzle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No extensions found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {extensions.map((ext) => (
            <div
              key={ext.name}
              className="bg-muted p-4 rounded-lg border border-border flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{ext.name}</h3>
                {ext.overrides && ext.overrides.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Overrides: {ext.overrides.join(', ')}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleToggle(ext.name, ext.enabled)}
                disabled={toggling === ext.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-accent disabled:opacity-50"
              >
                {ext.enabled ? (
                  <>
                    <ToggleRight className="w-6 h-6 text-green-400" />
                    <span className="text-sm text-green-400">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Disabled</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
