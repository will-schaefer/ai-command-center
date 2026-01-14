import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ItemCard } from '@/components/cards/ItemCard';
import { ConfigEditor } from '@/components/editors/ConfigEditor';

interface Skill {
  name: string;
  isSystem: boolean;
  description?: string;
}

export function CodexSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const selectedSkill = searchParams.get('skill');

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      api.codex.getSkill(selectedSkill)
        .then(data => setSelectedContent(data.content))
        .catch(e => setError(e.message));
    }
  }, [selectedSkill]);

  const loadSkills = async () => {
    try {
      const data = await api.codex.getSkills();
      // Parse descriptions from frontmatter
      const skillsWithDesc = await Promise.all(
        data.map(async (skill) => {
          if (skill.isSystem) return skill;
          try {
            const detail = await api.codex.getSkill(skill.name);
            const descMatch = detail.content.match(/^---\s*\n[\s\S]*?description:\s*(.+?)\s*\n[\s\S]*?---/);
            return { ...skill, description: descMatch?.[1] };
          } catch {
            return skill;
          }
        })
      );
      setSkills(skillsWithDesc);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    }
  };

  const handleSelect = (name: string) => {
    setSearchParams({ skill: name });
  };

  const handleSave = async (content: string) => {
    if (!selectedSkill) return;
    await api.codex.saveSkill(selectedSkill, content);
    loadSkills();
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete skill "${name}"?`)) return;
    await api.codex.deleteSkill(name);
    if (selectedSkill === name) {
      setSearchParams({});
      setSelectedContent('');
    }
    loadSkills();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const template = `---
name: ${newName}
description: New skill description
---

# ${newName}

Your skill instructions here.

## Quick Start

1. Step one
2. Step two

## Inputs

- input1 (required): Description

## Workflow

Describe the workflow here.
`;
    await api.codex.createSkill(newName, template);
    setIsCreating(false);
    setNewName('');
    loadSkills();
    setSearchParams({ skill: newName });
  };

  const handleBack = () => {
    setSearchParams({});
    setSelectedContent('');
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (loading) return <div>Loading...</div>;

  // Detail view
  if (selectedSkill) {
    const skill = skills.find(s => s.name === selectedSkill);
    const isSystem = skill?.isSystem ?? false;

    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">{selectedSkill}</h1>
          {isSystem && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
              System
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Skill definition with YAML frontmatter (name, description) and markdown body.
        </p>

        <ConfigEditor
          value={selectedContent}
          language="markdown"
          onSave={isSystem ? undefined : handleSave}
          readOnly={isSystem}
          height="600px"
        />
      </div>
    );
  }

  // List view
  const userSkills = skills.filter(s => !s.isSystem);
  const systemSkills = skills.filter(s => s.isSystem);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Codex Skills</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + New Skill
        </button>
      </div>

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

      {userSkills.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            User Skills
          </h2>
          <div className="grid gap-3 mb-6">
            {userSkills.map((skill) => (
              <ItemCard
                key={skill.name}
                name={skill.name}
                description={skill.description}
                onClick={() => handleSelect(skill.name)}
                onDelete={() => handleDelete(skill.name)}
              />
            ))}
          </div>
        </>
      )}

      {systemSkills.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System Skills
          </h2>
          <div className="grid gap-3">
            {systemSkills.map((skill) => (
              <ItemCard
                key={skill.name}
                name={skill.name}
                badge="System"
                badgeColor="bg-yellow-500/20 text-yellow-400"
                onClick={() => handleSelect(skill.name)}
              />
            ))}
          </div>
        </>
      )}

      {skills.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No skills found. Create one to get started.
        </p>
      )}
    </div>
  );
}
