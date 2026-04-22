"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import type { Instance } from "flatpickr/dist/types/instance";
import Label from "./Label";
import { CalenderIcon } from "../../icons";

type DatePickerProps = {
  id: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  enableTime?: boolean;
  minDate?: string;
  required?: boolean;
  className?: string;
};

export default function DatePicker({
  id,
  value = "",
  onChange,
  label,
  placeholder,
  enableTime = false,
  minDate,
  required = false,
  className = "mt-1",
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    pickerRef.current = flatpickr(inputRef.current, {
      static: true,
      monthSelectorType: "static",
      enableTime,
      time_24hr: true,
      dateFormat: enableTime ? "Y-m-d\\TH:i" : "Y-m-d",
      defaultDate: value || undefined,
      minDate: minDate || undefined,
      onChange: (dates) => {
        if (!onChange) return;
        const selected = dates[0];
        onChange(selected ? pickerRef.current?.formatDate(selected, enableTime ? "Y-m-d\\TH:i" : "Y-m-d") ?? "" : "");
      },
    });

    return () => {
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, [enableTime, minDate, onChange, value]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const currentValue = inputRef.current?.value ?? "";
    picker.set("minDate", minDate || undefined);
    if ((value || "") !== currentValue) {
      picker.setDate(value || "", false, enableTime ? "Y-m-d\\TH:i" : "Y-m-d");
    }
  }, [value, enableTime, minDate]);

  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          required={required}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <CalenderIcon className="size-5" />
        </span>
      </div>
    </div>
  );
}
