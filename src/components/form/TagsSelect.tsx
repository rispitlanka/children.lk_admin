"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import LoadingLottie from "@/components/common/LoadingLottie";
import Label from "@/components/form/Label";

export interface TagsSelectProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function TagsSelect({
  value,
  onChange,
  label = "Tags",
  placeholder = "Select or type to add tags",
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: TagsSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchTags = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const url = search ? `/api/tags?q=${encodeURIComponent(search)}` : "/api/tags";
      const res = await fetch(url);
      const data = await res.json();
      setOptions(Array.isArray(data) ? data : []);
    } catch {
      setOptions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    if (open && inputValue.trim()) fetchTags(inputValue.trim());
    else if (open && !inputValue.trim()) fetchTags();
  }, [open, inputValue, fetchTags]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((v) => v !== tag));
  };

  const filteredOptions = inputValue.trim()
    ? options.filter((o) => o.toLowerCase().includes(inputValue.trim().toLowerCase()))
    : options;
  const exactMatch = inputValue.trim() && filteredOptions.some((o) => o.toLowerCase() === inputValue.trim().toLowerCase());
  const showAddOption = inputValue.trim() && !exactMatch && !value.includes(inputValue.trim());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showAddOption) addTag(inputValue.trim());
      else if (filteredOptions[0]) addTag(filteredOptions[0]);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <Label>{label}</Label>}
      <div className="mt-1 flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-theme-xs focus-within:border-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-500">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 py-1 pl-2.5 pr-1.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                aria-label={`Remove ${tag}`}
              >
                <svg className="size-3.5" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.41 4.47C3.11 4.18 3.11 3.7 3.41 3.41C3.7 3.11 4.18 3.11 4.47 3.41L7 5.94L9.53 3.41C9.82 3.11 10.3 3.11 10.59 3.41C10.89 3.7 10.89 4.18 10.59 4.47L8.06 7L10.59 9.53C10.89 9.82 10.89 10.3 10.59 10.59C10.3 10.89 9.82 10.89 9.53 10.59L7 8.06L4.47 10.59C4.18 10.89 3.7 10.89 3.41 10.59C3.11 10.3 3.11 9.82 3.41 9.53L5.94 7L3.41 4.47Z" />
                </svg>
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-200 dark:placeholder:text-gray-500"
          aria-label={ariaLabel ?? label}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
      </div>
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
        >
          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingLottie variant="inline" size={40} />
            </div>
          ) : (
            <>
              {showAddOption && (
                <button
                  type="button"
                  role="option"
                  className="w-full px-3 py-2 text-left text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  onClick={() => addTag(inputValue.trim())}
                >
                  Add &quot;{inputValue.trim()}&quot;
                </button>
              )}
              {filteredOptions
                .filter((o) => !value.includes(o))
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => addTag(name)}
                  >
                    {name}
                  </button>
                ))}
              {!showAddOption && filteredOptions.every((o) => value.includes(o)) && filteredOptions.length > 0 && (
                <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">All selected</div>
              )}
              {!showAddOption && filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No tags found. Type to add a new one above.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
