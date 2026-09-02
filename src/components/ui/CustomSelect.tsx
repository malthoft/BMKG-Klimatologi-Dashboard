"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = "Pilih...", className = "", required = false, disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for HTML5 required validation */}
      {required && (
        <input 
          type="text" 
          required 
          value={value} 
          onChange={() => {}} 
          className="absolute opacity-0 pointer-events-none w-px h-px bottom-0" 
        />
      )}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'} text-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all flex items-center justify-between shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:border-slate-300'}`}
      >
        <span className={`block truncate min-w-0 text-left flex-1 pr-4 ${selectedOption ? "" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`material-symbols-outlined shrink-0 text-[18px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[99] top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-[210px] overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(String(option.value));
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-slate-50 ${
                  String(value) === String(option.value) ? "bg-primary/10 text-primary font-semibold" : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
