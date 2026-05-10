import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, id, error, children, className }: FormFieldProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col gap-2 w-full", className)}
    >
      <label 
        htmlFor={id} 
        className="text-[15px] font-bold text-slate-200 mb-1"
      >
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[10px] text-red-500 mt-0.5 font-bold uppercase tracking-wider">
          {error}
        </span>
      )}
    </motion.div>
  );
}

interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<any>) => void;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-14 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-white placeholder:text-slate-600 focus-visible:outline-none focus:bg-white/10 transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

interface SelectProps extends React.ComponentPropsWithoutRef<'select'> {
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  value?: any;
  onChange?: (e: React.ChangeEvent<any>) => void;
  options: { value: string; label: string }[];
}

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-14 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-white focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 appearance-none",
          className
        )}
        {...props}
      >
        <option value="" disabled className="bg-slate-900">Selecione uma opção</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}

interface TextAreaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<any>) => void;
}

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border border-white/5 bg-white/5 px-4 py-4 text-white placeholder:text-slate-600 focus-visible:outline-none focus:bg-white/10 transition-all duration-200 resize-none",
        className
      )}
      {...props}
    />
  );
}
