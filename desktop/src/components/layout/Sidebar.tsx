import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  Terminal,
  Package,
  MessageSquare,
  Sparkles,
  FileText,
  Puzzle,
  Server,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

interface SubPage {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface Model {
  name: string;
  basePath: string;
  color: string;
  pages: SubPage[];
}

const models: Model[] = [
  {
    name: 'Claude',
    basePath: '/claude',
    color: 'bg-claude',
    pages: [
      { name: 'New Chat', path: '/claude/chat', icon: Plus },
      { name: 'Projects', path: '/claude/projects', icon: FolderOpen },
      { name: 'Commands', path: '/claude/commands', icon: Terminal },
      { name: 'Skills', path: '/claude/skills', icon: Sparkles },
      { name: 'Plugins', path: '/claude/plugins', icon: Package },
      { name: 'MCPs', path: '/claude/mcps', icon: Server },
      { name: 'Chat History', path: '/claude/history', icon: MessageSquare },
      { name: 'Settings', path: '/claude/settings', icon: Settings },
    ],
  },
  {
    name: 'Codex',
    basePath: '/codex',
    color: 'bg-codex',
    pages: [
      { name: 'New Chat', path: '/codex/chat', icon: Plus },
      { name: 'Projects', path: '/codex/projects', icon: FolderOpen },
      { name: 'Skills', path: '/codex/skills', icon: Sparkles },
      { name: 'Prompts', path: '/codex/prompts', icon: FileText },
      { name: 'Chat History', path: '/codex/history', icon: MessageSquare },
      { name: 'Settings', path: '/codex/settings', icon: Settings },
    ],
  },
  {
    name: 'Gemini',
    basePath: '/gemini',
    color: 'bg-gemini',
    pages: [
      { name: 'New Chat', path: '/gemini/chat', icon: Plus },
      { name: 'Projects', path: '/gemini/projects', icon: FolderOpen },
      { name: 'Extensions', path: '/gemini/extensions', icon: Puzzle },
      { name: 'Chat History', path: '/gemini/sessions', icon: MessageSquare },
      { name: 'Settings', path: '/gemini/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Auto-expand the model that matches the current path
    const initial: Record<string, boolean> = {};
    models.forEach((model) => {
      initial[model.name] = location.pathname.startsWith(model.basePath);
    });
    return initial;
  });

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-64 bg-muted border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">Agent Interface</h1>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md mb-2 transition-colors',
            location.pathname === '/' ? 'bg-accent' : 'hover:bg-accent/50'
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="mt-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Models
          </h2>

          {models.map((model) => {
            const isActive = location.pathname.startsWith(model.basePath);
            const isExpanded = expanded[model.name];

            return (
              <div key={model.name} className="mb-1">
                <button
                  onClick={() => toggleExpanded(model.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                    isActive ? 'bg-accent/50' : 'hover:bg-accent/30'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={cn('w-2 h-2 rounded-full', model.color)} />
                  <span className="font-medium">{model.name}</span>
                </button>

                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {model.pages.map((page) => {
                      const Icon = page.icon;
                      return (
                        <Link
                          key={page.path}
                          to={page.path}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                            location.pathname === page.path
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {page.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
