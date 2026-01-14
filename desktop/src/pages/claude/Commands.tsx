import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ItemCard } from '@/components/cards/ItemCard';
import { ConfigEditor } from '@/components/editors/ConfigEditor';

interface Command {
  path: string;
  name: string;
  description?: string;
}

export function ClaudeCommands() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const selectedPath = searchParams.get('file');

  useEffect(() => {
    loadCommands();
  }, []);

  useEffect(() => {
    if (selectedPath) {
      api.claude.getCommand(selectedPath)
        .then(data => setSelectedContent(data.content))
        .catch(e => setError(e.message));
    }
  }, [selectedPath]);

  const loadCommands = async () => {
    try {
      const data = await api.claude.getCommands();
      // Parse descriptions from frontmatter
      const commandsWithDesc = await Promise.all(
        data.map(async (cmd) => {
          try {
            const detail = await api.claude.getCommand(cmd.path);
            const descMatch = detail.content.match(/^---\s*\ndescription:\s*(.+?)\s*\n---/);
            return { ...cmd, description: descMatch?.[1] };
          } catch {
            return cmd;
          }
        })
      );
      setCommands(commandsWithDesc);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    }
  };

  const handleSelect = (path: string) => {
    setSearchParams({ file: path });
  };

  const handleSave = async (content: string) => {
    if (!selectedPath) return;
    await api.claude.saveCommand(selectedPath, content);
    loadCommands(); // Refresh descriptions
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete command "${path}"?`)) return;
    await api.claude.deleteCommand(path);
    if (selectedPath === path) {
      setSearchParams({});
      setSelectedContent('');
    }
    loadCommands();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const fileName = newName.endsWith('.md') ? newName : `${newName}.md`;
    const template = `---
description: New command description
---

Your command instructions here.

$ARGUMENTS
`;
    await api.claude.createCommand(fileName, template);
    setIsCreating(false);
    setNewName('');
    loadCommands();
    setSearchParams({ file: fileName });
  };

  const handleBack = () => {
    setSearchParams({});
    setSelectedContent('');
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div>Loading...</div>;

  // Detail view
  if (selectedPath) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">{selectedPath}</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Markdown with YAML frontmatter. Use $ARGUMENTS for user input.
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
        <h1 className="text-2xl font-bold">Claude Commands</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + New Command
        </button>
      </div>

      {isCreating && (
        <div className="bg-muted p-4 rounded-lg border border-border mb-4">
          <h3 className="font-medium mb-2">Create New Command</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="command-name.md"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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

      <div className="grid gap-3">
        {commands.map((cmd) => (
          <ItemCard
            key={cmd.path}
            name={cmd.name}
            description={cmd.description}
            onClick={() => handleSelect(cmd.path)}
            onDelete={() => handleDelete(cmd.path)}
          />
        ))}

        {commands.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No commands found. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
