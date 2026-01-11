
import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false 
}) => {
  const baseStyles = "px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-amber-600 text-white hover:bg-amber-700 shadow-md active:scale-95 disabled:bg-amber-300",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 active:scale-95 disabled:bg-slate-100",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-md active:scale-95 disabled:bg-rose-300",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:scale-95",
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
