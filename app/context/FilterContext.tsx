'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import type { ViewMode } from '@/app/utils/helpers';

interface FilterContextType {
  status: string;
  type: string;
  salon: string;
  date: string;
  viewMode: ViewMode;
  setStatus: (status: string) => void;
  setType: (type: string) => void;
  setSalon: (salon: string) => void;
  setDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Mevcut ayı dinamik olarak oluştur
const getCurrentMonthYear = (): string => {
  const today = new Date();
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${months[today.getMonth()]} ${today.getFullYear()}`;
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState('Hepsi');
  const [type, setType] = useState('Hepsi');
  const [salon, setSalon] = useState('Tümü');
  const [date, setDate] = useState(() => {
    // localStorage'dan yükle veya varsayılan olarak mevcut ayı kullan
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('filterDate');
      if (savedDate) {
        return savedDate;
      }
    }
    return getCurrentMonthYear();
  });
  // ViewMode her zaman aylık olarak sabit
  const [viewMode] = useState<ViewMode>('monthly');
  const setViewMode = () => {
    // ViewMode değiştirilemez, her zaman aylık
  };

  // Tarih değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('filterDate', date);
    }
  }, [date]);

  return (
    <FilterContext.Provider
      value={{
        status,
        type,
        salon,
        date,
        viewMode,
        setStatus,
        setType,
        setSalon,
        setDate,
        setViewMode,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}







