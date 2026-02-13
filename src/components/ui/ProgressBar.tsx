import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  className?: string;
}

export default function ProgressBar({ progress, label, className = "" }: ProgressBarProps) {
  return (
    <div className={className}>
      {label && (
        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
