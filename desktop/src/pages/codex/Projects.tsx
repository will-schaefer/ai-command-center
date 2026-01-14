import { FolderOpen } from 'lucide-react';

export function CodexProjects() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <FolderOpen className="w-16 h-16 text-green-400/50 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Projects</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Manage your Codex projects and workspaces.
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Coming soon
      </p>
    </div>
  );
}
