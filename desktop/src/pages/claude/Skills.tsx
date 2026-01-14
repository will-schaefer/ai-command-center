import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ItemCard } from '@/components/cards/ItemCard';
import { ConfigEditor } from '@/components/editors/ConfigEditor';
import { Sparkles, ArrowLeft, Plus, Plug } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Skill {
  name: string;
  path: string;
  isPlugin: boolean;
}

export function ClaudeSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [pluginSkills, setPluginSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const { addToast } = useToast();

  const selectedSkill = searchParams.get('skill');

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      api.claude.getSkill(selectedSkill)
        .then(data => setSelectedContent(data.content))
        .catch(e => setError(e.message));
    }
  }, [selectedSkill]);

  const loadSkills = async () => {
    try {
      // Load user skills from ~/.claude/skills/
      const userSkills = await api.claude.getSkills();

      // Load settings to find plugin skills
      const settings = await api.claude.getSettings();
      const enabledPlugins = settings.settings?.enabledPlugins || {};

      // Extract plugin names that might have skills
      const pluginNames = Object.entries(enabledPlugins)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name.split('@')[0]);

      setSkills(userSkills);
      setPluginSkills(pluginNames);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    }
  };

  const handleSelect = (path: string) => {
    setSearchParams({ skill: path });
  };

  const handleSave = async (content: string) => {
    if (!selectedSkill) return;
    await api.claude.saveSkill(selectedSkill, content);
    addToast('success', 'Skill saved');
    loadSkills();
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Delete skill "${path}"?`)) return;
    await api.claude.deleteSkill(path);
    addToast('success', 'Skill deleted');
    if (selectedSkill === path) {
      setSearchParams({});
      setSelectedContent('');
    }
    loadSkills();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const skillName = newName.trim();
    const template = `# ${skillName}

A custom skill for Claude Code.

## Instructions

Add your skill instructions here. This markdown will be loaded when the skill is invoked.

## Usage

Describe how and when this skill should be used.
`;
    await api.claude.createSkill(skillName, template);
    addToast('success', 'Skill created');
    setIsCreating(false);
    setNewName('');
    loadSkills();
    setSearchParams({ skill: skillName });
  };

  const handleBack = () => {
    setSearchParams({});
    setSelectedContent('');
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div className="text-muted-foreground">Loading skills...</div>;

  // Detail view
  if (selectedSkill) {
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
          <h1 className="text-2xl font-bold">{selectedSkill}</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Edit your skill. Use markdown formatting.
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
          <Sparkles className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold">Claude Skills</h1>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Skill
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Custom skills extend Claude's capabilities. Skills are markdown files loaded via <code className="bg-muted px-1.5 py-0.5 rounded">userSettings</code>.
      </p>

      {isCreating && (
        <div className="bg-muted p-4 rounded-lg border border-border mb-4">
          <h3 className="font-medium mb-2">Create New Skill</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="skill-name"
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

      {/* Plugin Skills */}
      {pluginSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Plugin Skills
          </h2>
          <div className="grid gap-2">
            {pluginSkills.map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border"
              >
                <Plug className="w-4 h-4 text-orange-400" />
                <span className="text-sm">{name}</span>
                <span className="text-xs text-muted-foreground">(from plugin)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Skills */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        User Skills
      </h2>

      {skills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No user skills found.</p>
          <p className="text-sm mt-2">Create a skill to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {skills.map((skill) => (
            <ItemCard
              key={skill.path}
              name={skill.name}
              onClick={() => handleSelect(skill.path)}
              onDelete={() => handleDelete(skill.path)}
            />
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <h3 className="font-medium mb-2">Using Skills</h3>
        <p className="text-sm text-muted-foreground mb-2">
          To use a skill, add it to your <code className="bg-muted px-1.5 py-0.5 rounded">settings.local.json</code>:
        </p>
        <pre className="text-sm text-muted-foreground font-mono overflow-x-auto">
{`{
  "userSettings": {
    "my-skill": "~/.claude/skills/my-skill.md"
  }
}`}
        </pre>
      </div>
    </div>
  );
}
