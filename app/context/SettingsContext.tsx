'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface GeneralSettings {
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  taxNumber?: string;
  taxOffice?: string;
  companyLogo?: string;
  defaultLanguage: string;
  defaultTimezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  currencySymbol: string;
}

interface CalendarSettings {
  defaultView: string;
  weekStartDay: string;
  showWeekends: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  slotDuration: number;
  slotLabelInterval: number;
  firstDayOfWeek: number;
  showTimeSlots: boolean;
  defaultDateRange: number;
}

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  darkMode: boolean;
  fontFamily: string;
  fontSize: string;
}

interface SettingsContextType {
  generalSettings: GeneralSettings | null;
  calendarSettings: CalendarSettings | null;
  themeSettings: ThemeSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const applyThemeSettings = (settings: ThemeSettings) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // CSS değişkenlerini ayarla
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    
    // Font ailesi
    if (settings.fontFamily) {
      root.style.setProperty('--font-family', settings.fontFamily);
      document.body.style.fontFamily = settings.fontFamily;
    }

    // Font boyutu
    if (settings.fontSize === 'small') {
      root.style.setProperty('--font-size-base', '14px');
    } else if (settings.fontSize === 'large') {
      root.style.setProperty('--font-size-base', '18px');
    } else {
      root.style.setProperty('--font-size-base', '16px');
    }

    // Dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Logo
    if (settings.logoUrl) {
      const logoElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (logoElement) {
        logoElement.href = settings.logoUrl;
      }
    }

    // Favicon
    if (settings.faviconUrl) {
      let favicon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        document.head.appendChild(favicon);
      }
      favicon.href = settings.faviconUrl;
    }
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      // Genel ayarlar
      try {
        const generalRes = await fetch('/eventra/api/ayarlar/genel', { 
          cache: 'no-store',
          credentials: 'include',
        });
        if (generalRes.ok) {
          const generalData = await generalRes.json();
          if (generalData.settings) {
            setGeneralSettings(generalData.settings);
          }
        }
      } catch (error) {
        console.error('Error fetching general settings:', error);
        // Hata olsa bile varsayılan değerleri ayarla
        setGeneralSettings({
          companyName: 'Eventra',
          companyEmail: 'info@eventra.com',
          defaultLanguage: 'tr',
          defaultTimezone: 'Europe/Istanbul',
          dateFormat: 'DD.MM.YYYY',
          timeFormat: 'HH:mm',
          currency: 'TRY',
          currencySymbol: '₺',
        });
      }

      // Takvim ayarları
      try {
        const calendarRes = await fetch('/eventra/api/ayarlar/takvim', { 
          cache: 'no-store',
          credentials: 'include',
        });
        if (calendarRes.ok) {
          const calendarData = await calendarRes.json();
          if (calendarData.settings) {
            setCalendarSettings(calendarData.settings);
          }
        }
      } catch (error) {
        console.error('Error fetching calendar settings:', error);
        // Hata olsa bile varsayılan değerleri ayarla
        setCalendarSettings({
          defaultView: 'month',
          weekStartDay: 'monday',
          showWeekends: true,
          businessHoursStart: '09:00',
          businessHoursEnd: '18:00',
          slotDuration: 30,
          slotLabelInterval: 60,
          firstDayOfWeek: 1,
          showTimeSlots: true,
          defaultDateRange: 30,
        });
      }

      // Tema ayarları
      try {
        const themeRes = await fetch('/eventra/api/ayarlar/tema', { 
          cache: 'no-store',
          credentials: 'include',
        });
        if (themeRes.ok) {
          const themeData = await themeRes.json();
          if (themeData.settings) {
            setThemeSettings(themeData.settings);
            // Tema ayarlarını uygula
            applyThemeSettings(themeData.settings);
          }
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
        // Hata olsa bile varsayılan değerleri ayarla
        const defaultTheme = {
          primaryColor: '#2563eb',
          secondaryColor: '#6366f1',
          darkMode: false,
          fontFamily: 'Inter',
          fontSize: 'medium',
        };
        setThemeSettings(defaultTheme);
        applyThemeSettings(defaultTheme);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{
        generalSettings,
        calendarSettings,
        themeSettings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

