import { Hono } from 'hono';
import { readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createBackup } from '../services/backup';

const GEMINI_DIR = join(homedir(), '.gemini');

export const gemini = new Hono();

// Get settings
gemini.get('/settings', async (c) => {
  try {
    const settingsPath = join(GEMINI_DIR, 'settings.json');
    const content = await readFile(settingsPath, 'utf-8');
    return c.json({ settings: JSON.parse(content), raw: content });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Update settings
gemini.put('/settings', async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body as { content: string };
    const settingsPath = join(GEMINI_DIR, 'settings.json');

    // Validate JSON
    JSON.parse(content);

    // Create backup before writing
    await createBackup(settingsPath);

    // Write new content
    await writeFile(settingsPath, content, 'utf-8');

    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// List extensions
gemini.get('/extensions', async (c) => {
  try {
    const extDir = join(GEMINI_DIR, 'extensions');
    const enablementPath = join(extDir, 'extension-enablement.json');

    let enablement: Record<string, unknown> = {};
    try {
      enablement = JSON.parse(await readFile(enablementPath, 'utf-8'));
    } catch {}

    const entries = await readdir(extDir, { withFileTypes: true });
    const extensions = entries
      .filter(e => e.isDirectory())
      .map(e => ({
        name: e.name,
        enabled: !!enablement[e.name],
      }));

    return c.json(extensions);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// List sessions with metadata
gemini.get('/sessions', async (c) => {
  try {
    const tmpDir = join(GEMINI_DIR, 'tmp');
    const projects = await readdir(tmpDir, { withFileTypes: true });

    const sessions = [];
    for (const project of projects) {
      if (project.isDirectory()) {
        const chatsDir = join(tmpDir, project.name, 'chats');
        try {
          const chatFiles = await readdir(chatsDir);
          for (const file of chatFiles) {
            if (file.endsWith('.json')) {
              const sessionId = file.replace('.json', '');
              // Parse date from filename: session-2026-01-08T20-46-3ba7254a.json
              const dateMatch = sessionId.match(/session-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})/);
              let timestamp = 0;
              if (dateMatch) {
                const [, date, hour, minute] = dateMatch;
                timestamp = new Date(`${date}T${hour}:${minute}:00`).getTime();
              }
              sessions.push({
                projectHash: project.name,
                sessionId,
                timestamp,
              });
            }
          }
        } catch {}
      }
    }

    // Sort by timestamp, newest first
    sessions.sort((a, b) => b.timestamp - a.timestamp);

    return c.json(sessions);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get session detail
gemini.get('/sessions/:projectHash/:sessionId', async (c) => {
  try {
    const { projectHash, sessionId } = c.req.param();
    const sessionPath = join(GEMINI_DIR, 'tmp', projectHash, 'chats', `${sessionId}.json`);
    const content = await readFile(sessionPath, 'utf-8');
    const session = JSON.parse(content);
    return c.json({ projectHash, sessionId, session });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
