'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface SearchableSelectProps {
  options: Array<{ id: string; name: string; description?: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz',
  required = false,
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Türkçe karakterleri normalize eden fonksiyon
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/Ğ/g, 'g')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'u')
      .replace(/ü/g, 'u')
      .replace(/Ş/g, 's')
      .replace(/ş/g, 's')
      .replace(/Ö/g, 'o')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'c')
      .replace(/ç/g, 'c')
      .toLowerCase();
  };

  const selectedOption = options?.find((opt) => opt.id === value) || null;

  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options) || options.length === 0) {
      return [];
    }
    
    if (!searchQuery.trim()) {
      return options;
    }
    
    const normalizedQuery = normalizeText(searchQuery.trim());
    
    if (!normalizedQuery) {
      return options;
    }
    
    const filtered = options.filter((option) => {
      if (!option || !option.name) return false;
      
      const normalizedName = normalizeText(option.name);
      const normalizedDescription = option.description ? normalizeText(option.description) : '';
      
      const matches = normalizedName.includes(normalizedQuery) || normalizedDescription.includes(normalizedQuery);
      return matches;
    });
    
    return filtered;
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 text-left bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all flex items-center justify-between ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'
          } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        >
          <span className={`flex-1 ${selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {selectedOption ? (
              <div>
                <div className="font-medium">{selectedOption.name}</div>
                {selectedOption.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedOption.description}
                  </div>
                )}
              </div>
            ) : (
              placeholder
            )}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[9999] w-full mt-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.id)}
                  disabled={option.disabled}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between ${
                    option.disabled 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' 
                      : `hover:bg-blue-50 dark:hover:bg-blue-900/20 ${value === option.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`
                  }`}
                >
                  <div className="flex-1">
                    <div className={`font-medium ${
                      option.disabled 
                        ? 'text-gray-400 dark:text-gray-500' 
                        : value === option.id 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {option.name}
                      {option.disabled && (
                        <span className="ml-2 text-xs text-red-500">(Dolu)</span>
                      )}
                    </div>
                    {option.description && (
                      <div className={`text-sm mt-0.5 ${
                        option.disabled 
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {option.description}
                      </div>
                    )}
                  </div>
                  {value === option.id && !option.disabled && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-2" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

