import React, { FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string; // Optional hint text
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  defaultValue,
  value,
  onChange,
  onBlur,
  className = "",
  min,
  max,
  step,
  disabled = false,
  required = false,
  success = false,
  error = false,
  hint,
}) => {
  // Determine input styles based on state (disabled, success, error)
  let inputClasses = `h-10 w-full rounded-[10px] border shadow-none appearance-none px-3.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  // Add styles for the different states
  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-200 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-800`;
  } else if (error) {
    inputClasses += ` text-gray-900 border-gray-200 border-b-2 border-b-rose-500 focus:border-brand-500 focus:ring-rose-500/10 dark:text-white/90 dark:border-gray-800 dark:border-b-rose-500`;
  } else if (success) {
    inputClasses += ` text-gray-900 border-gray-200 border-b-2 border-b-emerald-500 focus:border-brand-500 focus:ring-emerald-500/10 dark:text-white/90 dark:border-gray-800 dark:border-b-emerald-500`;
  } else {
    inputClasses += ` bg-white text-gray-900 border-gray-200 focus:border-brand-500 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:focus:border-brand-500`;
  }

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />

      {/* Optional Hint Text */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
