import { Hono } from 'hono';
import { readFile, readdir, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import TOML from '@iarna/toml';
import { createBackup } from '../services/backup';

const CODEX_DIR = join(homedir(), '.codex');

export const codex = new Hono();

// Get config
codex.get('/config', async (c) => {
  try {
    const configPath = join(CODEX_DIR, 'config.toml');
    const content = await readFile(configPath, 'utf-8');
    const config = TOML.parse(content);
    return c.json({ config, raw: content });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Update config
codex.put('/config', async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body as { content: string };
    const configPath = join(CODEX_DIR, 'config.toml');

    // Validate TOML
    TOML.parse(content);

    // Create backup before writing
    await createBackup(configPath);

    // Write new content
    await writeFile(configPath, content, 'utf-8');

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// List skills
codex.get('/skills', async (c) => {
  try {
    const skillsDir = join(CODEX_DIR, 'skills');
    const skills = await listSkills(skillsDir);
    return c.json(skills);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get single skill
codex.get('/skills/:name', async (c) => {
  try {
    const name = c.req.param('name');
    const skillPath = join(CODEX_DIR, 'skills', name, 'SKILL.md');
    const content = await readFile(skillPath, 'utf-8');
    return c.json({ name, content });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Create skill
codex.post('/skills', async (c) => {
  try {
    const body = await c.req.json();
    const { name, content } = body as { name: string; content: string };
    const skillDir = join(CODEX_DIR, 'skills', name);
    const skillPath = join(skillDir, 'SKILL.md');

    // Create skill directory
    await mkdir(skillDir, { recursive: true });

    // Write SKILL.md
    await writeFile(skillPath, content, 'utf-8');

    return c.json({ success: true, name });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Update skill
codex.put('/skills/:name', async (c) => {
  try {
    const name = c.req.param('name');
    const body = await c.req.json();
    const { content } = body as { content: string };
    const skillPath = join(CODEX_DIR, 'skills', name, 'SKILL.md');

    // Create backup
    await createBackup(skillPath);

    // Write new content
    await writeFile(skillPath, content, 'utf-8');

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Delete skill
codex.delete('/skills/:name', async (c) => {
  try {
    const name = c.req.param('name');
    const skillDir = join(CODEX_DIR, 'skills', name);

    // Backup SKILL.md before deleting
    const skillPath = join(skillDir, 'SKILL.md');
    await createBackup(skillPath);

    // Remove entire skill directory
    await rm(skillDir, { recursive: true });

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// List prompts
codex.get('/prompts', async (c) => {
  try {
    const promptsDir = join(CODEX_DIR, 'prompts');
    const entries = await readdir(promptsDir, { withFileTypes: true });
    const prompts = entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => ({ name: e.name.replace('.md', ''), path: e.name }));
    return c.json(prompts);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get history with pagination and search
codex.get('/history', async (c) => {
  try {
    const historyPath = join(CODEX_DIR, 'history.jsonl');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const search = c.req.query('search') || '';
    const sessionId = c.req.query('sessionId') || '';

    const content = await readFile(historyPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    // Parse all entries
    let entries = lines.map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        return {
          id: index,
          text: parsed.text || '',
          timestamp: parsed.ts ? parsed.ts * 1000 : 0, // Convert to ms
          sessionId: parsed.session_id || '',
        };
      } catch {
        return null;
      }
    }).filter(Boolean).reverse(); // Newest first

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      entries = entries.filter(e => e!.text.toLowerCase().includes(searchLower));
    }

    // Filter by session
    if (sessionId) {
      entries = entries.filter(e => e!.sessionId === sessionId);
    }

    const total = entries.length;
    const paginated = entries.slice(offset, offset + limit);

    // Get unique sessions for filter dropdown
    const sessions = [...new Set(lines.map(line => {
      try {
        return JSON.parse(line).session_id;
      } catch {
        return null;
      }
    }).filter(Boolean))];

    return c.json({
      entries: paginated,
      total,
      limit,
      offset,
      sessions,
    });
  } catch (e) {
    return c.json({ entries: [], total: 0, limit: 50, offset: 0, sessions: [] });
  }
});

// Helper to list skills
async function listSkills(dir: string): Promise<Array<{ name: string; isSystem: boolean }>> {
  const results: Array<{ name: string; isSystem: boolean }> = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const isSystem = entry.name === '.system';
        if (isSystem) {
          const systemEntries = await readdir(join(dir, entry.name), { withFileTypes: true });
          for (const sysEntry of systemEntries) {
            if (sysEntry.isDirectory()) {
              results.push({ name: `.system/${sysEntry.name}`, isSystem: true });
            }
          }
        } else {
          results.push({ name: entry.name, isSystem: false });
        }
      }
    }
  } catch {}

  return results;
}
