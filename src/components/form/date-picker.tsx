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
  maxDate?: string;
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
  maxDate,
  required = false,
  className = "mt-1",
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

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
      maxDate: maxDate || undefined,
      onChange: (dates) => {
        if (!onChangeRef.current) return;
        const selected = dates[0];
        onChangeRef.current(selected ? pickerRef.current?.formatDate(selected, enableTime ? "Y-m-d\\TH:i" : "Y-m-d") ?? "" : "");
      },
    });

    return () => {
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- value intentionally omitted: only used as defaultDate on init; synced in the second effect
  }, [enableTime, minDate, maxDate]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const currentValue = inputRef.current?.value ?? "";
    picker.set("minDate", minDate || undefined);
    picker.set("maxDate", maxDate || undefined);
    if ((value || "") !== currentValue) {
      picker.setDate(value || "", false, enableTime ? "Y-m-d\\TH:i" : "Y-m-d");
    }
  }, [value, enableTime, minDate, maxDate]);

  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          required={required}
          placeholder={placeholder}
          className="h-11 w-full rounded-[10px] border border-gray-200 appearance-none bg-white px-4 py-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/15 dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-500"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <CalenderIcon className="size-5" />
        </span>
      </div>
    </div>
  );
}
