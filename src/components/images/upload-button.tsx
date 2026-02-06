"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadButton({ onFileSelect, disabled, className }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input so the same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ""}`}
      >
        <Upload className="h-4 w-4" />
        Upload Image
      </button>
    </>
  );
}
