'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const WEEKDAYS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
const WEEKDAYS_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function DatePicker({
  value,
  onChange,
  placeholder = 'gg.aa.yyyy',
  required = false,
  disabled = false,
  className = '',
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayValue, setDisplayValue] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Manuel giriş sırasında güncelleme yapma
    if (isManualInput) return;
    
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setDisplayValue(formatDateForDisplay(date));
        // Takvim ayını güncelle
        setCurrentMonth(date);
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value, isManualInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDateForDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return (firstDay.getDay() + 6) % 7; // Pazartesi = 0
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const formattedDate = formatDateForInput(selectedDate);
    
    if (minDate && formattedDate < minDate) return;
    if (maxDate && formattedDate > maxDate) return;
    
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setDisplayValue('');
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];

    // Önceki ayın son günleri
    const prevMonthDays = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(null);
    }

    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Sonraki ayın ilk günleri (takvimi tamamlamak için)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(null);
    }

    const selectedDate = value ? new Date(value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="grid grid-cols-7 gap-1 p-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="aspect-square" />;
          }

          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const dateString = formatDateForInput(date);
          const isSelected = selectedDate && formatDateForInput(selectedDate) === dateString;
          const isToday = formatDateForInput(today) === dateString;
          const isDisabled = Boolean((minDate && dateString < minDate) || (maxDate && dateString > maxDate));

          return (
            <button
              key={index}
              type="button"
              onClick={() => !isDisabled && handleDateSelect(day)}
              disabled={isDisabled}
              className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isToday
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                  : isDisabled
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const inputValue = e.target.value;
            setIsManualInput(true);
            
            // Sadece rakam ve nokta karakterlerine izin ver
            const cleaned = inputValue.replace(/[^\d.]/g, '');
            
            // Otomatik nokta ekleme (DD.MM.YYYY formatı için)
            let formatted = cleaned;
            if (cleaned.length > 2 && !cleaned.includes('.')) {
              formatted = cleaned.slice(0, 2) + '.' + cleaned.slice(2);
            }
            if (formatted.length > 5 && formatted.split('.').length === 2) {
              formatted = formatted.slice(0, 5) + '.' + formatted.slice(5, 9);
            }
            
            setDisplayValue(formatted);
            
            // Manuel giriş kontrolü: DD.MM.YYYY formatı
            const datePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
            const match = formatted.match(datePattern);
            
            if (match) {
              const day = parseInt(match[1], 10);
              const month = parseInt(match[2], 10) - 1; // Ay 0-indexed
              const year = parseInt(match[3], 10);
              
              if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                const date = new Date(year, month, day);
                // Geçerli tarih kontrolü
                if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                  const formattedDate = formatDateForInput(date);
                  
                  // Min/Max tarih kontrolü
                  if (minDate && formattedDate < minDate) {
                    const clampedDate = minDate;
                    setDisplayValue(formatDateForDisplay(new Date(clampedDate)));
                    onChange(clampedDate);
                    setCurrentMonth(new Date(clampedDate));
                    setIsManualInput(false);
                    return;
                  }
                  if (maxDate && formattedDate > maxDate) {
                    const clampedDate = maxDate;
                    setDisplayValue(formatDateForDisplay(new Date(clampedDate)));
                    onChange(clampedDate);
                    setCurrentMonth(new Date(clampedDate));
                    setIsManualInput(false);
                    return;
                  }
                  
                  onChange(formattedDate);
                  // Takvim ayını güncelle
                  setCurrentMonth(date);
                  setIsManualInput(false);
                } else {
                  // Geçersiz tarih - blur'da düzelt
                  setTimeout(() => {
                    if (value) {
                      const date = new Date(value);
                      if (!isNaN(date.getTime())) {
                        setDisplayValue(formatDateForDisplay(date));
                      }
                    }
                    setIsManualInput(false);
                  }, 0);
                }
              }
            }
          }}
          onBlur={() => {
            // Blur olduğunda geçerli değeri göster
            if (value) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                setDisplayValue(formatDateForDisplay(date));
              } else {
                setDisplayValue('');
              }
            } else {
              setDisplayValue('');
            }
            setIsManualInput(false);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 cursor-text'
          } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <Calendar className="w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl w-80">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 px-2 pt-2 pb-1">
            {WEEKDAYS.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {renderCalendar()}

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

