import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ConfigEditor } from '@/components/editors/ConfigEditor';

export function ClaudeSettings() {
  const [settingsRaw, setSettingsRaw] = useState<string>('');
  const [localRaw, setLocalRaw] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'local'>('settings');

  useEffect(() => {
    api.claude.getSettings()
      .then(data => {
        setSettingsRaw(JSON.stringify(data.settings, null, 2));
        setLocalRaw(JSON.stringify(data.local, null, 2));
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleSaveSettings = async (content: string) => {
    await api.claude.saveSettings('settings', content);
  };

  const handleSaveLocal = async (content: string) => {
    await api.claude.saveSettings('local', content);
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Claude Code Settings</h1>

      <div className="mb-4">
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 -mb-px transition-colors ${
              activeTab === 'settings'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            settings.json
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 -mb-px transition-colors ${
              activeTab === 'local'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            settings.local.json
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Global settings: model, status line, enabled plugins
          </p>
          <ConfigEditor
            value={settingsRaw}
            language="json"
            onSave={handleSaveSettings}
            height="500px"
          />
        </div>
      )}

      {activeTab === 'local' && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Local permissions and overrides
          </p>
          <ConfigEditor
            value={localRaw}
            language="json"
            onSave={handleSaveLocal}
            height="500px"
          />
        </div>
      )}
    </div>
  );
}
