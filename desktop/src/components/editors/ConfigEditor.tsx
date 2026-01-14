import { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface ConfigEditorProps {
  value: string;
  language: 'json' | 'toml' | 'markdown';
  onChange?: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  readOnly?: boolean;
  height?: string;
}

export function ConfigEditor({
  value,
  language,
  onChange,
  onSave,
  readOnly = false,
  height = '400px',
}: ConfigEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalValue, setOriginalValue] = useState(value);
  const { addToast } = useToast();

  // Update original value when prop changes (e.g., switching between files)
  useEffect(() => {
    setOriginalValue(value);
    setIsDirty(false);
    setError(null);
  }, [value]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      setIsDirty(newValue !== originalValue);
      setError(null);
      onChange?.(newValue);
    }
  };

  const handleSave = async () => {
    if (!editorRef.current || !onSave) return;

    const currentValue = editorRef.current.getValue();

    // Validate JSON/TOML before saving
    if (language === 'json') {
      try {
        JSON.parse(currentValue);
      } catch (e) {
        const errorMsg = `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`;
        setError(errorMsg);
        addToast('error', errorMsg);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(currentValue);
      setIsDirty(false);
      setOriginalValue(currentValue);
      addToast('success', 'Changes saved successfully');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Save failed';
      setError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (editorRef.current) {
      editorRef.current.setValue(originalValue);
      setIsDirty(false);
      setError(null);
      addToast('info', 'Changes reverted');
    }
  };

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving && onSave) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, onSave]);

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-lg overflow-hidden">
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {!readOnly && onSave && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isDirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleRevert}
            disabled={!isDirty || isSaving}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isDirty
                ? 'bg-muted hover:bg-accent text-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            Revert
          </button>

          {isDirty && (
            <span className="text-sm text-muted-foreground ml-2">
              Unsaved changes
            </span>
          )}
        </div>
      )}
    </div>
  );
}
