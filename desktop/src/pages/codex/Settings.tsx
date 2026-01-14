import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ConfigEditor } from '@/components/editors/ConfigEditor';
import { Settings } from 'lucide-react';

export function CodexSettings() {
  const [config, setConfig] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.codex.getConfig()
      .then(data => {
        setConfig(data.raw);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleSave = async (content: string) => {
    await api.codex.saveConfig(content);
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div className="text-muted-foreground">Loading config...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-green-400" />
        <h1 className="text-2xl font-bold">Codex Settings</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Edit your Codex configuration (config.toml). Changes are backed up automatically.
      </p>

      <ConfigEditor
        value={config}
        language="toml"
        onSave={handleSave}
        height="500px"
      />
    </div>
  );
}
