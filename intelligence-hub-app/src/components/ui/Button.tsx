import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-horse-black text-white hover:bg-black",
  outline: "bg-transparent border-[1.5px] border-horse-gray-300 text-horse-dark hover:border-horse-black hover:text-horse-black",
  ghost: "bg-transparent text-horse-gray-500 hover:bg-horse-gray-100 hover:text-horse-black",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-[18px] py-[9px] text-[13px]",
  lg: "px-6 py-3 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-lg font-medium transition-colors font-sans disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
