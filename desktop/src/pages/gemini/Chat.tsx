import { MessageSquare } from 'lucide-react';

export function GeminiChat() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <MessageSquare className="w-16 h-16 text-blue-400/50 mb-4" />
      <h1 className="text-2xl font-bold mb-2">New Chat</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Start a new conversation with Gemini CLI.
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Coming soon - Terminal integration in v2
      </p>
    </div>
  );
}
