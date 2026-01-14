import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
// Claude
import { ClaudeChat } from './pages/claude/Chat';
import { ClaudeProjects } from './pages/claude/Projects';
import { ClaudeCommands } from './pages/claude/Commands';
import { ClaudeSkills } from './pages/claude/Skills';
import { ClaudePlugins } from './pages/claude/Plugins';
import { ClaudeMCPs } from './pages/claude/MCPs';
import { ClaudeHistory } from './pages/claude/History';
import { ClaudeSettings } from './pages/claude/Settings';
// Codex
import { CodexChat } from './pages/codex/Chat';
import { CodexProjects } from './pages/codex/Projects';
import { CodexSkills } from './pages/codex/Skills';
import { CodexPrompts } from './pages/codex/Prompts';
import { CodexHistory } from './pages/codex/History';
import { CodexSettings } from './pages/codex/Settings';
// Gemini
import { GeminiChat } from './pages/gemini/Chat';
import { GeminiProjects } from './pages/gemini/Projects';
import { GeminiExtensions } from './pages/gemini/Extensions';
import { GeminiSessions } from './pages/gemini/Sessions';
import { GeminiSettings } from './pages/gemini/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        {/* Claude */}
        <Route path="claude/chat" element={<ClaudeChat />} />
        <Route path="claude/projects" element={<ClaudeProjects />} />
        <Route path="claude/commands" element={<ClaudeCommands />} />
        <Route path="claude/skills" element={<ClaudeSkills />} />
        <Route path="claude/plugins" element={<ClaudePlugins />} />
        <Route path="claude/mcps" element={<ClaudeMCPs />} />
        <Route path="claude/history" element={<ClaudeHistory />} />
        <Route path="claude/settings" element={<ClaudeSettings />} />
        {/* Codex */}
        <Route path="codex/chat" element={<CodexChat />} />
        <Route path="codex/projects" element={<CodexProjects />} />
        <Route path="codex/skills" element={<CodexSkills />} />
        <Route path="codex/prompts" element={<CodexPrompts />} />
        <Route path="codex/history" element={<CodexHistory />} />
        <Route path="codex/settings" element={<CodexSettings />} />
        {/* Gemini */}
        <Route path="gemini/chat" element={<GeminiChat />} />
        <Route path="gemini/projects" element={<GeminiProjects />} />
        <Route path="gemini/extensions" element={<GeminiExtensions />} />
        <Route path="gemini/sessions" element={<GeminiSessions />} />
        <Route path="gemini/settings" element={<GeminiSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
