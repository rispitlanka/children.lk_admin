import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  type?: "button" | "submit" | "reset"; // Button type
  className?: string; // Additional classes
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 dark:bg-gray-dark dark:text-gray-300 dark:border-gray-800 dark:hover:bg-white/5",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-[10px] transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && (
        <span className="inline-flex shrink-0 items-center justify-center leading-none [&_svg]:block">
          {startIcon}
        </span>
      )}
      {children != null && children !== false && (
        <span className="inline-flex items-center leading-none">{children}</span>
      )}
      {endIcon && (
        <span className="inline-flex shrink-0 items-center justify-center leading-none [&_svg]:block">
          {endIcon}
        </span>
      )}
    </button>
  );
};

export default Button;
