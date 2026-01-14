import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Server, Plus, ExternalLink } from 'lucide-react';

interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export function ClaudeMCPs() {
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMCPs();
  }, []);

  const loadMCPs = async () => {
    try {
      const settings = await api.claude.getSettings();
      const mcpConfig = settings.settings?.mcpServers || settings.local?.mcpServers || {};
      const servers = Object.entries(mcpConfig).map(([name, config]) => ({
        name,
        ...(config as Omit<MCPServer, 'name'>),
      }));
      setMcpServers(servers);
    } catch (e) {
      console.error('Failed to load MCPs:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading MCP servers...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold">MCP Servers</h1>
        </div>
        <a
          href="https://modelcontextprotocol.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Learn about MCP <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Model Context Protocol servers extend Claude's capabilities. Configure them in your settings.
      </p>

      {mcpServers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No MCP servers configured.</p>
          <p className="text-sm mt-2">
            Add servers to <code className="bg-muted px-1.5 py-0.5 rounded">mcpServers</code> in your settings.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {mcpServers.map((server) => (
            <div
              key={server.name}
              className="bg-muted p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-orange-400" />
                <h3 className="font-semibold">{server.name}</h3>
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                {server.command} {server.args?.join(' ')}
              </div>
              {server.env && Object.keys(server.env).length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Environment: {Object.keys(server.env).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="font-medium mb-2">Configuration Example</h3>
        <pre className="text-sm text-muted-foreground font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
}
