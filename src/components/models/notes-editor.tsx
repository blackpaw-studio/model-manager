"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Check, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface NotesEditorProps {
  modelId: number;
  initialNotes: string | null;
  onSave?: (notes: string) => void;
}

export function NotesEditor({ modelId, initialNotes, onSave }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef(initialNotes ?? "");

  const saveNotes = useCallback(
    async (content: string) => {
      if (content === lastSavedRef.current) return;

      setSaving(true);
      setError(null);
      setSaved(false);

      try {
        const res = await apiFetch(`/api/v1/models/${modelId}`, {
          method: "PATCH",
          body: JSON.stringify({ notes: content || null }),
        });

        if (!res.ok) {
          throw new Error("Failed to save notes");
        }

        lastSavedRef.current = content;
        setSaved(true);
        onSave?.(content);

        // Hide saved indicator after 2 seconds
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [modelId, onSave]
  );

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(notes);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notes, saveNotes]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (notes !== lastSavedRef.current) {
        saveNotes(notes);
      }
    };
  }, [notes, saveNotes]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <FileText className="h-4 w-4" />
          Notes
        </h2>
        <div className="flex items-center gap-2 text-xs">
          {saving && (
            <span className="flex items-center gap-1 text-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add personal notes about this model..."
        className="w-full min-h-[120px] rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted resize-y focus:border-accent focus:outline-none transition-colors"
      />
    </div>
  );
}
