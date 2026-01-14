import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Package, ExternalLink, Calendar, FolderOpen } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  marketplace: string;
  version: string;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
  scope: string;
}

export function ClaudePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const data = await api.claude.getPlugins();
      setPlugins(data.plugins || []);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plugins');
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div className="text-muted-foreground">Loading plugins...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-orange-400" />
        <h1 className="text-2xl font-bold">Claude Plugins</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Installed plugins for Claude Code. Manage plugins via the CLI with <code className="bg-muted px-1.5 py-0.5 rounded">claude plugins</code>.
      </p>

      {plugins.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No plugins installed.</p>
          <p className="text-sm mt-2">
            Install plugins with <code className="bg-muted px-1.5 py-0.5 rounded">claude plugins install &lt;name&gt;</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-muted p-4 rounded-lg border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{plugin.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                      v{plugin.version}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted-foreground/20 text-muted-foreground">
                      {plugin.scope}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <ExternalLink className="w-3 h-3" />
                    <span>{plugin.marketplace}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Installed: {formatDate(plugin.installedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Updated: {formatDate(plugin.lastUpdated)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <FolderOpen className="w-3 h-3" />
                    <span className="truncate">{plugin.installPath}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="font-medium mb-2">Plugin Commands</h3>
        <div className="text-sm text-muted-foreground space-y-1 font-mono">
          <p>claude plugins list</p>
          <p>claude plugins install &lt;name&gt;</p>
          <p>claude plugins uninstall &lt;name&gt;</p>
          <p>claude plugins update &lt;name&gt;</p>
        </div>
      </div>
    </div>
  );
}
