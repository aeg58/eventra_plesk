// Helper functions for Eventra

export const eventColors = {
  düğün: 'bg-blue-500',
  kına: 'bg-pink-500',
  nişan: 'bg-purple-500',
  sünnet: 'bg-teal-500',
  iptal: 'bg-gray-400',
};

export const eventTypes = ['Düğün', 'Kına', 'Nişan', 'Sünnet'];

export const eventStatuses = ['Hepsi', 'Açık', 'Kesin', 'İptal'];

export const formatDate = (date: Date): string => {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const dayName = days[date.getDay()];
  
  return `${day} ${month} ${dayName}`;
};

export const generate2WeekDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export const generateMonthDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  
  return dates;
};

export const generate3MonthDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  const startMonth = today.getMonth();
  const startYear = today.getFullYear();
  
  // 3 ay için tarihler oluştur
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const year = startYear + Math.floor((startMonth + monthOffset) / 12);
    const month = (startMonth + monthOffset) % 12;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i));
    }
  }
  
  return dates;
};

export const generateYearDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  const year = today.getFullYear();
  
  // Tüm yıl için tarihler oluştur
  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i));
    }
  }
  
  return dates;
};

export type ViewMode = 'monthly' | '3month' | 'yearly';

// Tarihi YYYY-MM-DD formatında string'e çevir (timezone sorununu önlemek için local timezone kullan)
export const formatDateKey = (date: Date | string): string => {
  let year: number, month: number, day: number;
  
  if (typeof date === 'string') {
    // String'den parse et - timezone sorununu önlemek için
    // ISO string ise (2025-12-06T00:00:00.000Z gibi), sadece tarih kısmını al
    // YYYY-MM-DD formatındaysa direkt kullan
    const dateStr = date.split('T')[0]; // Zaman kısmını atla
    const parts = dateStr.split('-').map(Number);
    
    // Eğer ISO string'den geliyorsa (UTC), local timezone'a çevir
    if (date.includes('T') && date.includes('Z')) {
      // UTC tarihini local timezone'a çevir
      const utcDate = new Date(date);
      year = utcDate.getFullYear();
      month = utcDate.getMonth() + 1;
      day = utcDate.getDate();
    } else {
      // Zaten YYYY-MM-DD formatında
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }
  } else {
    // Date objesinden local timezone'da al
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};





