import { invoke } from '@tauri-apps/api/core';

// Detect if running in Tauri (check for __TAURI_INTERNALS__ which is set in Tauri v2)
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ============================================================================
// Web API helpers (fallback for non-Tauri)
// ============================================================================

const API_BASE = '/api';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${res.statusText}`);
  }
  return res.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${res.statusText}`);
  }
  return res.json();
}

async function deleteJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${res.statusText}`);
  }
  return res.json();
}

// ============================================================================
// Unified API
// ============================================================================

export const api = {
  health: async () => {
    if (isTauri) {
      return { status: 'ok' };
    }
    return fetchJson<{ status: string }>('/health');
  },

  claude: {
    getSettings: async () => {
      if (isTauri) {
        return invoke<{ settings: Record<string, unknown>; local: Record<string, unknown> }>('claude_get_settings');
      }
      return fetchJson<{ settings: Record<string, unknown>; local: Record<string, unknown> }>('/claude/settings');
    },

    saveSettings: async (type: 'settings' | 'local', content: string) => {
      if (isTauri) {
        await invoke('claude_save_settings', { settingsType: type, content });
        return { success: true };
      }
      return putJson<{ success: boolean }>('/claude/settings', { type, content });
    },

    getCommands: async () => {
      if (isTauri) {
        return invoke<Array<{ path: string; name: string }>>('claude_get_commands');
      }
      return fetchJson<Array<{ path: string; name: string }>>('/claude/commands');
    },

    getCommand: async (path: string) => {
      if (isTauri) {
        return invoke<{ path: string; content: string }>('claude_get_command', { path });
      }
      return fetchJson<{ path: string; content: string }>(`/claude/commands/${encodeURIComponent(path)}`);
    },

    saveCommand: async (path: string, content: string) => {
      if (isTauri) {
        await invoke('claude_save_command', { path, content });
        return { success: true };
      }
      return putJson<{ success: boolean }>(`/claude/commands/${encodeURIComponent(path)}`, { content });
    },

    createCommand: async (path: string, content: string) => {
      if (isTauri) {
        await invoke('claude_create_command', { path, content });
        return { success: true };
      }
      return postJson<{ success: boolean }>('/claude/commands', { path, content });
    },

    deleteCommand: async (path: string) => {
      if (isTauri) {
        await invoke('claude_delete_command', { path });
        return { success: true };
      }
      return deleteJson<{ success: boolean }>(`/claude/commands/${encodeURIComponent(path)}`);
    },

    getPlugins: async () => {
      if (isTauri) {
        return invoke<{ plugins: Array<{ id: string; name: string; marketplace: string; version: string; installPath: string; installedAt: string; lastUpdated: string; scope: string }> }>('claude_get_plugins');
      }
      return fetchJson<{ plugins: Array<{ id: string; name: string; marketplace: string; version: string; installPath: string; installedAt: string; lastUpdated: string; scope: string }> }>('/claude/plugins');
    },

    getSkills: async () => {
      if (isTauri) {
        return invoke<Array<{ name: string; isSystem: boolean }>>('claude_get_skills');
      }
      return fetchJson<Array<{ name: string; isSystem: boolean }>>('/claude/skills');
    },

    getSkill: async (name: string) => {
      if (isTauri) {
        return invoke<{ name: string; content: string }>('claude_get_skill', { name });
      }
      return fetchJson<{ name: string; content: string }>(`/claude/skills/${encodeURIComponent(name)}`);
    },

    saveSkill: async (name: string, content: string) => {
      if (isTauri) {
        await invoke('claude_save_skill', { name, content });
        return { success: true };
      }
      return putJson<{ success: boolean }>(`/claude/skills/${encodeURIComponent(name)}`, { content });
    },

    createSkill: async (name: string, content: string) => {
      if (isTauri) {
        await invoke('claude_create_skill', { name, content });
        return { success: true };
      }
      return postJson<{ success: boolean }>('/claude/skills', { name, content });
    },

    deleteSkill: async (name: string) => {
      if (isTauri) {
        await invoke('claude_delete_skill', { name });
        return { success: true };
      }
      return deleteJson<{ success: boolean }>(`/claude/skills/${encodeURIComponent(name)}`);
    },

    getHistory: async (params?: { limit?: number; offset?: number; search?: string; sessionId?: string }) => {
      if (isTauri) {
        return invoke<{
          entries: Array<{ id: number; text: string; timestamp: number; sessionId: string; project?: string }>;
          total: number;
          limit: number;
          offset: number;
          sessions: string[];
        }>('claude_get_history', {
          limit: params?.limit,
          offset: params?.offset,
          search: params?.search,
          sessionId: params?.sessionId,
        });
      }
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));
      if (params?.search) query.set('search', params.search);
      if (params?.sessionId) query.set('sessionId', params.sessionId);
      return fetchJson<{
        entries: Array<{ id: number; display: string; timestamp: number; project: string; sessionId: string }>;
        total: number;
        limit: number;
        offset: number;
        sessions: string[];
      }>(`/claude/history?${query.toString()}`);
    },
  },

  codex: {
    getConfig: async () => {
      if (isTauri) {
        return invoke<{ config: Record<string, unknown>; raw: string }>('codex_get_config');
      }
      return fetchJson<{ config: Record<string, unknown>; raw: string }>('/codex/config');
    },

    saveConfig: async (content: string) => {
      if (isTauri) {
        await invoke('codex_save_config', { content });
        return { success: true };
      }
      return putJson<{ success: boolean }>('/codex/config', { content });
    },

    getSkills: async () => {
      if (isTauri) {
        return invoke<Array<{ name: string; isSystem: boolean }>>('codex_get_skills');
      }
      return fetchJson<Array<{ name: string; isSystem: boolean }>>('/codex/skills');
    },

    getSkill: async (name: string) => {
      if (isTauri) {
        return invoke<{ name: string; content: string }>('codex_get_skill', { name });
      }
      return fetchJson<{ name: string; content: string }>(`/codex/skills/${encodeURIComponent(name)}`);
    },

    saveSkill: async (name: string, content: string) => {
      if (isTauri) {
        await invoke('codex_save_skill', { name, content });
        return { success: true };
      }
      return putJson<{ success: boolean }>(`/codex/skills/${encodeURIComponent(name)}`, { content });
    },

    createSkill: async (name: string, content: string) => {
      if (isTauri) {
        await invoke('codex_create_skill', { name, content });
        return { success: true };
      }
      return postJson<{ success: boolean }>('/codex/skills', { name, content });
    },

    deleteSkill: async (name: string) => {
      if (isTauri) {
        await invoke('codex_delete_skill', { name });
        return { success: true };
      }
      return deleteJson<{ success: boolean }>(`/codex/skills/${encodeURIComponent(name)}`);
    },

    getPrompts: async () => {
      if (isTauri) {
        return invoke<Array<{ name: string; path: string }>>('codex_get_prompts');
      }
      return fetchJson<Array<{ name: string; path: string }>>('/codex/prompts');
    },

    getPrompt: async (path: string) => {
      if (isTauri) {
        return invoke<{ path: string; content: string }>('codex_get_prompt', { path });
      }
      return fetchJson<{ path: string; content: string }>(`/codex/prompts/${encodeURIComponent(path)}`);
    },

    savePrompt: async (path: string, content: string) => {
      if (isTauri) {
        await invoke('codex_save_prompt', { path, content });
        return { success: true };
      }
      return putJson<{ success: boolean }>(`/codex/prompts/${encodeURIComponent(path)}`, { content });
    },

    createPrompt: async (path: string, content: string) => {
      if (isTauri) {
        await invoke('codex_create_prompt', { path, content });
        return { success: true };
      }
      return postJson<{ success: boolean }>('/codex/prompts', { path, content });
    },

    deletePrompt: async (path: string) => {
      if (isTauri) {
        await invoke('codex_delete_prompt', { path });
        return { success: true };
      }
      return deleteJson<{ success: boolean }>(`/codex/prompts/${encodeURIComponent(path)}`);
    },

    getHistory: async (params?: { limit?: number; offset?: number; search?: string; sessionId?: string }) => {
      if (isTauri) {
        return invoke<{
          entries: Array<{ id: number; text: string; timestamp: number; sessionId: string }>;
          total: number;
          limit: number;
          offset: number;
          sessions: string[];
        }>('codex_get_history', {
          limit: params?.limit,
          offset: params?.offset,
          search: params?.search,
          sessionId: params?.sessionId,
        });
      }
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));
      if (params?.search) query.set('search', params.search);
      if (params?.sessionId) query.set('sessionId', params.sessionId);
      return fetchJson<{
        entries: Array<{ id: number; text: string; timestamp: number; sessionId: string }>;
        total: number;
        limit: number;
        offset: number;
        sessions: string[];
      }>(`/codex/history?${query.toString()}`);
    },
  },

  gemini: {
    getSettings: async () => {
      if (isTauri) {
        return invoke<{ settings: Record<string, unknown>; raw: string }>('gemini_get_settings');
      }
      return fetchJson<{ settings: Record<string, unknown>; raw: string }>('/gemini/settings');
    },

    saveSettings: async (content: string) => {
      if (isTauri) {
        await invoke('gemini_save_settings', { content });
        return { success: true };
      }
      return putJson<{ success: boolean }>('/gemini/settings', { content });
    },

    getExtensions: async () => {
      if (isTauri) {
        return invoke<Array<{ name: string; enabled: boolean; overrides?: string[] }>>('gemini_get_extensions');
      }
      return fetchJson<Array<{ name: string; enabled: boolean; overrides?: string[] }>>('/gemini/extensions');
    },

    toggleExtension: async (name: string, enabled: boolean) => {
      if (isTauri) {
        await invoke('gemini_toggle_extension', { name, enabled });
        return { success: true };
      }
      return putJson<{ success: boolean }>(`/gemini/extensions/${encodeURIComponent(name)}/toggle`, { enabled });
    },

    getSessions: async () => {
      if (isTauri) {
        return invoke<Array<{ projectHash: string; sessionId: string; timestamp: number }>>('gemini_get_sessions');
      }
      return fetchJson<Array<{ projectHash: string; sessionId: string; timestamp: number }>>('/gemini/sessions');
    },

    getSession: async (projectHash: string, sessionId: string) => {
      if (isTauri) {
        return invoke<{ projectHash: string; sessionId: string; session: unknown }>('gemini_get_session', { projectHash, sessionId });
      }
      return fetchJson<{ projectHash: string; sessionId: string; session: unknown }>(`/gemini/sessions/${projectHash}/${sessionId}`);
    },
  },
};
