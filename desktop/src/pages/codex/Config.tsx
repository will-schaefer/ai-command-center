import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ConfigEditor } from '@/components/editors/ConfigEditor';

export function CodexConfig() {
  const [configRaw, setConfigRaw] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.codex.getConfig()
      .then(data => {
        setConfigRaw(data.raw);
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
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Codex Config</h1>

      <p className="text-sm text-muted-foreground mb-3">
        TOML configuration: model, reasoning effort, project trust levels
      </p>

      <ConfigEditor
        value={configRaw}
        language="toml"
        onSave={handleSave}
        height="500px"
      />
    </div>
  );
}
