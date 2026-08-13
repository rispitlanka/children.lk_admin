import React from "react";

interface DashedDropzoneProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
}

export default function DashedDropzone({
  onChange,
  accept,
  multiple = false,
  disabled = false,
  label = "Click or drag file to upload",
  sublabel = "SVG, PNG, JPG, or PDF (max 10MB)",
  className = "",
}: DashedDropzoneProps) {
  return (
    <label
      className={`group relative flex min-h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-gray-300 bg-transparent px-4 py-4 text-center transition-colors hover:border-brand-500 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-white/[0.02] ${
        disabled ? "pointer-events-none opacity-50" : ""
      } ${className}`}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex flex-col items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400">
        <svg
          className="h-6 w-6 transition-colors group-hover:text-brand-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {sublabel}
          </span>
        )}
      </div>
    </label>
  );
}
