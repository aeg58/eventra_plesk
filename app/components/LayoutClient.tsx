'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import AdminSidebar from './AdminSidebar';
import { FilterProvider } from '@/app/context/FilterContext';
import { SettingsProvider } from '@/app/context/SettingsContext';
import { MenuProvider } from '@/app/context/MenuContext';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // localStorage'dan sidebar durumunu yükle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan durumu yükle
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      
      if (isMobile) {
        // Mobilde sidebar kapalı başlasın ve collapsed her zaman false
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        // Desktop'ta sidebar her zaman açık, sadece collapsed durumunu yükle
        const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedSidebarCollapsed !== null) {
          setIsSidebarCollapsed(savedSidebarCollapsed === 'true');
        }
      }
    }
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        // Mobilde aç/kapat
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', String(newState));
        // Mobilde sidebar açıldığında her zaman tam genişlikte olsun (collapsed = false)
        if (newState) {
          setIsSidebarCollapsed(false);
        }
      } else {
        // Desktop'ta daralt/genişlet
        toggleCollapse();
      }
    }
  };

  const toggleCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(newState));
    }
  };

  const handleClose = () => {
    // Sadece mobilde kapat
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setIsSidebarOpen(false);
        // Mobilde sidebar kapatıldığında collapsed durumunu da sıfırla
        setIsSidebarCollapsed(false);
      }
    }
  };

  // Desktop'ta collapsed durumunda margin hesaplama
  const sidebarWidth = isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72';

  // Login, demo-talep, forgot-password ve reset-password sayfaları için layout'u bypass et
  if (
    pathname === '/eventra/login' || 
    pathname === '/login' ||
    pathname === '/eventra/demo-talep' ||
    pathname === '/demo-talep' ||
    pathname === '/eventra/forgot-password' ||
    pathname === '/forgot-password' ||
    pathname === '/eventra/reset-password' ||
    pathname === '/reset-password'
  ) {
    return <>{children}</>;
  }

  return (
    <SettingsProvider>
      <FilterProvider>
        <MenuProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        {/* Fixed Sidebar */}
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          isCollapsed={isSidebarCollapsed}
          onClose={handleClose}
          onToggle={toggleSidebar}
          onCollapse={toggleCollapse}
        />
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarWidth}`}>
          {/* Sticky Header */}
          <Header onMenuClick={toggleSidebar} />
          
          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
        </MenuProvider>
      </FilterProvider>
    </SettingsProvider>
  );
}

