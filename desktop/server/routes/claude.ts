import { Hono } from 'hono';
import { readFile, readdir, writeFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { createBackup, listBackups } from '../services/backup';

const CLAUDE_DIR = join(homedir(), '.claude');

export const claude = new Hono();

// Get settings
claude.get('/settings', async (c) => {
  try {
    const settingsPath = join(CLAUDE_DIR, 'settings.json');
    const localPath = join(CLAUDE_DIR, 'settings.local.json');

    let settings = {};
    let local = {};

    try {
      settings = JSON.parse(await readFile(settingsPath, 'utf-8'));
    } catch {}

    try {
      local = JSON.parse(await readFile(localPath, 'utf-8'));
    } catch {}

    return c.json({ settings, local });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Update settings
claude.put('/settings', async (c) => {
  try {
    const body = await c.req.json();
    const { type, content } = body as { type: 'settings' | 'local'; content: string };

    const filePath = type === 'local'
      ? join(CLAUDE_DIR, 'settings.local.json')
      : join(CLAUDE_DIR, 'settings.json');

    // Validate JSON
    JSON.parse(content);

    // Create backup before writing
    await createBackup(filePath);

    // Write new content
    await writeFile(filePath, content, 'utf-8');

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get backups for a settings file
claude.get('/settings/backups', async (c) => {
  try {
    const type = c.req.query('type') || 'settings';
    const filePath = type === 'local'
      ? join(CLAUDE_DIR, 'settings.local.json')
      : join(CLAUDE_DIR, 'settings.json');

    const backups = await listBackups(filePath);
    return c.json(backups);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// List commands
claude.get('/commands', async (c) => {
  try {
    const commandsDir = join(CLAUDE_DIR, 'commands');
    const commands = await listMarkdownFiles(commandsDir);
    return c.json(commands);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get single command
claude.get('/commands/*', async (c) => {
  try {
    const path = c.req.path.replace('/commands/', '');
    const filePath = join(CLAUDE_DIR, 'commands', path);
    const content = await readFile(filePath, 'utf-8');
    return c.json({ path, content });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Create command
claude.post('/commands', async (c) => {
  try {
    const body = await c.req.json();
    const { path, content } = body as { path: string; content: string };
    const filePath = join(CLAUDE_DIR, 'commands', path);

    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });

    // Write file
    await writeFile(filePath, content, 'utf-8');

    return c.json({ success: true, path });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Update command
claude.put('/commands/*', async (c) => {
  try {
    const path = c.req.path.replace('/commands/', '');
    const body = await c.req.json();
    const { content } = body as { content: string };
    const filePath = join(CLAUDE_DIR, 'commands', path);

    // Create backup
    await createBackup(filePath);

    // Write new content
    await writeFile(filePath, content, 'utf-8');

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Delete command
claude.delete('/commands/*', async (c) => {
  try {
    const path = c.req.path.replace('/commands/', '');
    const filePath = join(CLAUDE_DIR, 'commands', path);

    // Create backup before deleting
    await createBackup(filePath);

    // Delete file
    await unlink(filePath);

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// List plugins
claude.get('/plugins', async (c) => {
  try {
    const settingsPath = join(CLAUDE_DIR, 'settings.json');
    const settings = JSON.parse(await readFile(settingsPath, 'utf-8'));
    return c.json({ enabledPlugins: settings.enabledPlugins || {} });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get history with pagination and search
claude.get('/history', async (c) => {
  try {
    const historyPath = join(CLAUDE_DIR, 'history.jsonl');
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
          display: parsed.display || '',
          timestamp: parsed.timestamp,
          project: parsed.project || '',
          sessionId: parsed.sessionId || '',
        };
      } catch {
        return null;
      }
    }).filter(Boolean).reverse(); // Newest first

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      entries = entries.filter(e =>
        e!.display.toLowerCase().includes(searchLower) ||
        e!.project.toLowerCase().includes(searchLower)
      );
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
        return JSON.parse(line).sessionId;
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

// Helper function to list markdown files recursively
async function listMarkdownFiles(dir: string, base = ''): Promise<Array<{ path: string; name: string }>> {
  const results: Array<{ path: string; name: string }> = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = base ? `${base}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const nested = await listMarkdownFiles(join(dir, entry.name), relativePath);
        results.push(...nested);
      } else if (entry.name.endsWith('.md')) {
        results.push({ path: relativePath, name: entry.name.replace('.md', '') });
      }
    }
  } catch {}

  return results;
}
