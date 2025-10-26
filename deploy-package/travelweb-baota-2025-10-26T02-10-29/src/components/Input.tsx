import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  icon: Icon,
  iconPosition = 'left',
  error,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  size = 'md'
}: InputProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const baseInputClasses = `
    w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
    ${sizeClasses[size]}
  `;

  const iconClasses = `absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${iconSizeClasses[size]}`;
  const leftIconClasses = `${iconClasses} left-3`;
  const rightIconClasses = `${iconClasses} right-3`;

  const inputPaddingWithIcon = {
    sm: Icon && iconPosition === 'left' ? 'pl-10' : Icon && iconPosition === 'right' ? 'pr-10' : '',
    md: Icon && iconPosition === 'left' ? 'pl-12' : Icon && iconPosition === 'right' ? 'pr-12' : '',
    lg: Icon && iconPosition === 'left' ? 'pl-14' : Icon && iconPosition === 'right' ? 'pr-14' : ''
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          className={`${baseInputClasses} ${inputPaddingWithIcon[size]} ${inputClassName}`}
        />
        
        {Icon && iconPosition === 'left' && (
          <Icon className={leftIconClasses} />
        )}
        
        {Icon && iconPosition === 'right' && (
          <Icon className={rightIconClasses} />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}