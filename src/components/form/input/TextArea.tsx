import React from "react";

interface TextareaProps {
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  required?: boolean; // Required field
  error?: boolean; // Error state
  hint?: string; // Hint text to display
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  required = false, // Required field
  error = false, // Error state
  hint = "", // Default hint text
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `w-full rounded-[10px] border shadow-none px-3.5 py-2.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-dark dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-800`;
  } else if (error) {
    textareaClasses += ` bg-white text-gray-900 border-gray-200 border-b-2 border-b-rose-500 focus:border-brand-500 focus:ring-rose-500/10 dark:border-gray-800 dark:border-b-rose-500 dark:bg-gray-dark dark:text-white/90`;
  } else {
    textareaClasses += ` bg-white text-gray-900 border-gray-200 focus:border-brand-500 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-dark dark:text-white/90 dark:focus:border-brand-500`;
  }

  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
