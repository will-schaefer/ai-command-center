import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ItemCard } from '@/components/cards/ItemCard';
import { ConfigEditor } from '@/components/editors/ConfigEditor';
import { FileText, ArrowLeft, Plus } from 'lucide-react';

interface Prompt {
  name: string;
  path: string;
  description?: string;
}

export function CodexPrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const selectedPrompt = searchParams.get('prompt');

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (selectedPrompt) {
      api.codex.getPrompt(selectedPrompt)
        .then(data => setSelectedContent(data.content))
        .catch(e => setError(e.message));
    }
  }, [selectedPrompt]);

  const loadPrompts = async () => {
    try {
      const data = await api.codex.getPrompts();
      // Try to extract description from first line of each prompt
      const promptsWithDesc = await Promise.all(
        data.map(async (prompt) => {
          try {
            const detail = await api.codex.getPrompt(prompt.path);
            const firstLine = detail.content.split('\n')[0];
            const desc = firstLine.startsWith('#') ? firstLine.replace(/^#+\s*/, '') : undefined;
            return { ...prompt, description: desc };
          } catch {
            return prompt;
          }
        })
      );
      setPrompts(promptsWithDesc);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    }
  };

  const handleSelect = (path: string) => {
    setSearchParams({ prompt: path });
  };

  const handleSave = async (content: string) => {
    if (!selectedPrompt) return;
    await api.codex.savePrompt(selectedPrompt, content);
    loadPrompts();
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete prompt "${path}"?`)) return;
    await api.codex.deletePrompt(path);
    if (selectedPrompt === path) {
      setSearchParams({});
      setSelectedContent('');
    }
    loadPrompts();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const fileName = newName.endsWith('.md') ? newName : `${newName}.md`;
    const template = `# ${newName.replace('.md', '')}

Your prompt content here.

## Usage

Describe how to use this prompt.
`;
    await api.codex.createPrompt(fileName, template);
    setIsCreating(false);
    setNewName('');
    loadPrompts();
    setSearchParams({ prompt: fileName });
  };

  const handleBack = () => {
    setSearchParams({});
    setSelectedContent('');
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div className="text-muted-foreground">Loading prompts...</div>;

  // Detail view
  if (selectedPrompt) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold">{selectedPrompt}</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Custom prompt template. Use markdown formatting.
        </p>

        <ConfigEditor
          value={selectedContent}
          language="markdown"
          onSave={handleSave}
          height="600px"
        />
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl font-bold">Codex Prompts</h1>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Custom prompts for Codex. These are reusable markdown templates.
      </p>

      {isCreating && (
        <div className="bg-muted p-4 rounded-lg border border-border mb-4">
          <h3 className="font-medium mb-2">Create New Prompt</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="prompt-name.md"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewName('');
              }}
              className="px-4 py-2 bg-muted border border-border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No prompts found.</p>
          <p className="text-sm mt-2">Create a prompt to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {prompts.map((prompt) => (
            <ItemCard
              key={prompt.path}
              name={prompt.name}
              description={prompt.description}
              onClick={() => handleSelect(prompt.path)}
              onDelete={() => handleDelete(prompt.path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
