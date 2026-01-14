import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Terminal,
  Package,
  Sparkles,
  FileText,
  Puzzle,
  MessageSquare,
  Zap,
  Activity,
  ChevronRight,
  Circle,
} from 'lucide-react';

interface ToolStats {
  claude: { commands: number; plugins: number; skills: number; historyCount: number };
  codex: { skills: number; prompts: number; historyCount: number };
  gemini: { extensions: number; sessions: number };
}

export function Dashboard() {
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [
        commands,
        plugins,
        claudeSkills,
        claudeHistory,
        skills,
        prompts,
        codexHistory,
        extensions,
        sessions,
      ] = await Promise.all([
        api.claude.getCommands().catch(() => []),
        api.claude.getPlugins().catch(() => ({ plugins: [] })),
        api.claude.getSkills().catch(() => []),
        api.claude.getHistory({ limit: 1 }).catch(() => ({ total: 0 })),
        api.codex.getSkills().catch(() => []),
        api.codex.getPrompts().catch(() => []),
        api.codex.getHistory({ limit: 1 }).catch(() => ({ total: 0 })),
        api.gemini.getExtensions().catch(() => []),
        api.gemini.getSessions().catch(() => []),
      ]);

      setStats({
        claude: {
          commands: commands.length,
          plugins: plugins.plugins?.length || 0,
          skills: claudeSkills.length,
          historyCount: claudeHistory.total || 0,
        },
        codex: {
          skills: skills.length,
          prompts: prompts.length,
          historyCount: codexHistory.total || 0,
        },
        gemini: {
          extensions: extensions.length,
          sessions: sessions.length,
        },
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = stats
    ? stats.claude.commands + stats.claude.plugins + stats.claude.skills +
      stats.codex.skills + stats.codex.prompts + stats.gemini.extensions
    : 0;

  return (
    <div className="min-h-full noise">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-[#5AF78E] pulse-glow" />
          <span className="text-[#5AF78E] text-xs uppercase tracking-widest">System Online</span>
          <span className="text-[#4C566A] text-xs ml-auto font-mono">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-[#9AEDFE]">agent</span>
          <span className="text-[#4C566A]">@</span>
          <span className="text-[#726F9F]">interface</span>
          <span className="text-[#D4A04A] cursor-blink ml-1">_</span>
        </h1>

        <p className="text-[#4C566A] mt-2 text-sm">
          <span className="text-[#F3F99D]">$</span> unified control for your AI development environment
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-6 mb-8 pb-6 border-b border-[#3B4252]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#5AF78E]" />
          <span className="text-xs text-[#4C566A] uppercase">Models</span>
          <span className="text-sm font-bold text-[#5AF78E]">3</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F3F99D]" />
          <span className="text-xs text-[#4C566A] uppercase">Assets</span>
          <span className="text-sm font-bold text-[#F3F99D]">{loading ? '...' : totalAssets}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#9AEDFE]" />
          <span className="text-xs text-[#4C566A] uppercase">History</span>
          <span className="text-sm font-bold text-[#9AEDFE]">
            {loading ? '...' : ((stats?.claude.historyCount || 0) + (stats?.codex.historyCount || 0)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Claude */}
        <div className="group relative rounded-lg overflow-hidden card-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E07B39]/10 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#E07B39] via-[#E07B39]/50 to-transparent" />

          <div className="relative p-5 bg-[#3B4252]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#E07B39] glow-claude" />
                <h2 className="font-bold text-lg text-[#E07B39] text-glow-claude">Claude</h2>
              </div>
              <Link
                to="/claude/chat"
                className="text-xs text-[#4C566A] hover:text-[#E07B39] flex items-center gap-1 transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">open</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-2">
              <StatRow
                to="/claude/commands"
                icon={Terminal}
                label="commands"
                value={stats?.claude.commands}
                color="#E07B39"
              />
              <StatRow
                to="/claude/skills"
                icon={Sparkles}
                label="skills"
                value={stats?.claude.skills}
                color="#E07B39"
              />
              <StatRow
                to="/claude/plugins"
                icon={Package}
                label="plugins"
                value={stats?.claude.plugins}
                color="#E07B39"
              />
              <StatRow
                to="/claude/history"
                icon={MessageSquare}
                label="history"
                value={stats?.claude.historyCount}
                color="#E07B39"
              />
            </div>
          </div>
        </div>

        {/* Codex */}
        <div className="group relative rounded-lg overflow-hidden card-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F1F1F0]/10 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#F1F1F0] via-[#F1F1F0]/50 to-transparent" />

          <div className="relative p-5 bg-[#3B4252]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F1F1F0] glow-codex" />
                <h2 className="font-bold text-lg text-[#F1F1F0] text-glow-codex">Codex</h2>
              </div>
              <Link
                to="/codex/chat"
                className="text-xs text-[#4C566A] hover:text-[#F1F1F0] flex items-center gap-1 transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">open</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-2">
              <StatRow
                to="/codex/skills"
                icon={Sparkles}
                label="skills"
                value={stats?.codex.skills}
                color="#F1F1F0"
              />
              <StatRow
                to="/codex/prompts"
                icon={FileText}
                label="prompts"
                value={stats?.codex.prompts}
                color="#F1F1F0"
              />
              <StatRow
                to="/codex/history"
                icon={MessageSquare}
                label="history"
                value={stats?.codex.historyCount}
                color="#F1F1F0"
              />
            </div>
          </div>
        </div>

        {/* Gemini */}
        <div className="group relative rounded-lg overflow-hidden card-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-[#726F9F]/10 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#726F9F] via-[#726F9F]/50 to-transparent" />

          <div className="relative p-5 bg-[#3B4252]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#726F9F] glow-gemini" />
                <h2 className="font-bold text-lg text-[#726F9F] text-glow-gemini">Gemini</h2>
              </div>
              <Link
                to="/gemini/chat"
                className="text-xs text-[#4C566A] hover:text-[#726F9F] flex items-center gap-1 transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">open</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-2">
              <StatRow
                to="/gemini/extensions"
                icon={Puzzle}
                label="extensions"
                value={stats?.gemini.extensions}
                color="#726F9F"
              />
              <StatRow
                to="/gemini/sessions"
                icon={MessageSquare}
                label="sessions"
                value={stats?.gemini.sessions}
                color="#726F9F"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="border-t border-[#3B4252] pt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#F3F99D]">$</span>
          <span className="text-xs text-[#4C566A] uppercase tracking-wider">Quick Actions</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <QuickAction to="/claude/commands" color="#E07B39" label="new command" prefix="claude" />
          <QuickAction to="/claude/skills" color="#E07B39" label="new skill" prefix="claude" />
          <QuickAction to="/codex/skills" color="#F1F1F0" label="new skill" prefix="codex" />
          <QuickAction to="/codex/prompts" color="#F1F1F0" label="new prompt" prefix="codex" />
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="mt-12 pt-4 border-t border-[#3B4252]">
        <div className="flex items-center gap-2 text-xs text-[#4C566A]">
          <Circle className="w-2 h-2 fill-[#5AF78E] text-[#5AF78E]" />
          <span>ready</span>
          <span className="mx-2">|</span>
          <span>Electric Nord Theme</span>
          <span className="mx-2">|</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  to,
  icon: Icon,
  label,
  value,
  color,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  value?: number;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-[#4C566A]/30 transition-colors group/row"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#4C566A] group-hover/row:text-current transition-colors" style={{ color }} />
        <span className="text-sm text-[#D8DEE9] group-hover/row:text-white transition-colors">{label}</span>
      </div>
      <span className="text-sm font-mono tabular-nums" style={{ color }}>
        {value !== undefined ? value.toString().padStart(3, ' ') : '---'}
      </span>
    </Link>
  );
}

function QuickAction({
  to,
  color,
  label,
  prefix,
}: {
  to: string;
  color: string;
  label: string;
  prefix: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded border border-[#3B4252] hover:border-current transition-colors group"
      style={{ '--hover-color': color } as React.CSSProperties}
    >
      <span className="text-xs text-[#4C566A]" style={{ color }}>{prefix}</span>
      <span className="text-xs text-[#4C566A]">/</span>
      <span className="text-sm text-[#D8DEE9] group-hover:text-white transition-colors">{label}</span>
      <span style={{ color }} className="text-xs">+</span>
    </Link>
  );
}
