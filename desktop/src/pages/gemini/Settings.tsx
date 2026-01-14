import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ConfigEditor } from '@/components/editors/ConfigEditor';

export function GeminiSettings() {
  const [settingsRaw, setSettingsRaw] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.gemini.getSettings()
      .then(data => {
        setSettingsRaw(data.raw);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleSave = async (content: string) => {
    await api.gemini.saveSettings(content);
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gemini CLI Settings</h1>

      <p className="text-sm text-muted-foreground mb-3">
        Authentication, preview features, preferred editor
      </p>

      <ConfigEditor
        value={settingsRaw}
        language="json"
        onSave={handleSave}
        height="500px"
      />
    </div>
  );
}
