'use client';

import { useCallback, useId, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  label?: string;
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export function FileUpload({
  label = 'Upload files',
  accept = 'image/*,.pdf,.ai,.eps',
  file,
  onFileChange,
  disabled,
}: Props) {
  const id = useId();
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0];
      if (f) onFileChange(f);
    },
    [disabled, onFileChange],
  );

  return (
    <div>
      {label ? <p className="mb-2 text-sm font-medium text-gray-700">{label}</p> : null}
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-teal-400 bg-teal-50/50' : 'border-gray-200 bg-gray-50/80',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
          <Upload className="size-5 text-gray-500" strokeWidth={1.5} />
        </span>
        <span className="text-sm text-gray-600">
          <span className="font-medium text-teal-700">Click to browse</span> or drag and drop
        </span>
        <span className="text-xs text-gray-400">PNG, JPG, PDF, AI, EPS up to 25MB</span>
        {file ? (
          <span className="mt-1 max-w-full truncate text-xs font-medium text-gray-800">
            {file.name}
          </span>
        ) : null}
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
