'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarIcon, PlusIcon, BuildingIcon, UsersIcon, SettingsIcon, ChartIcon, CalculatorIcon, ChatIcon } from './Icons';

interface SettingsGroup {
  title: string;
  items: {
    label: string;
    href: string;
  }[];
}

interface MainMenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isSettings?: boolean;
}

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
  onToggle?: () => void;
  onCollapse?: () => void;
}

export default function AdminSidebar({ isOpen, isCollapsed = false, onClose, onToggle, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isChatAIOpen, setIsChatAIOpen] = useState(false);
  const [isMusterilerOpen, setIsMusterilerOpen] = useState(false);
  const [isMuhasebeOpen, setIsMuhasebeOpen] = useState(false);

  // Ana menü öğeleri
  const mainMenuItems: MainMenuItem[] = [
    { icon: PlusIcon, label: 'Yeni Rezervasyon', href: '/rezervasyon/yeni' },
    { icon: CalendarIcon, label: 'Rezervasyon Takvimi', href: '/' },
    { icon: ChatIcon, label: 'Chat AI', href: '/chat-ai', isSettings: false },
    { icon: UsersIcon, label: 'Müşteriler', href: '/musteriler', isSettings: false },
    { icon: CalculatorIcon, label: 'Muhasebe', href: '/muhasebe', isSettings: false },
    { icon: SettingsIcon, label: 'Ayarlar', href: '/ayarlar', isSettings: true },
    { icon: ChartIcon, label: 'Raporlar', href: '/raporlar' },
  ];

  // Chat AI alt menüleri
  const chatAISubItems = [
    { label: 'WhatsApp AI', href: '/chat-ai/whatsapp' },
    { label: 'Instagram AI', href: '/chat-ai/instagram' },
    { label: 'TikTok AI', href: '/chat-ai/tiktok' },
  ];

  // Müşteriler alt menüleri
  const musterilerSubItems = [
    { label: 'Müşteriler', href: '/musteriler/aktif' },
    { label: 'Aday Müşteriler', href: '/musteriler/aday' },
  ];

  // Muhasebe alt menüleri
  const muhasebeSubItems = [
    { label: 'Finans Yönetimi', href: '/muhasebe/finans-yonetimi' },
    { label: 'Rezervasyon Finansı', href: '/muhasebe/rezervasyon-finansi' },
    { label: 'Kasa Yönetimi', href: '/muhasebe/kasa-yonetimi' },
    { label: 'Hesap Takibi', href: '/muhasebe/hesap-takibi' },
  ];

  // İlk grup (başlıksız) - Boş (tüm ayarlar alt gruplarda)
  const generalSettings: never[] = [];

  // Ayarlar alt grupları (accordion yapısı)
  const settingsGroups: SettingsGroup[] = [
    // 1️⃣ Genel Ayarlar
    {
      title: 'Genel Ayarlar',
      items: [
        { label: 'Temel Ayarlar', href: '/ayarlar/genel' },
        { label: 'Birim Ayarları', href: '/ayarlar/genel/birimler' },
        { label: 'Takvim Ayarları', href: '/ayarlar/takvim' },
        { label: 'Tema & Görseller', href: '/ayarlar/tema' },
      ],
    },
    // 2️⃣ Kullanıcı Yönetimi
    {
      title: 'Kullanıcı Yönetimi',
      items: [
        { label: 'Kullanıcılar', href: '/ayarlar/kullanici-yonetimi/kullanicilar' },
        { label: 'Roller', href: '/ayarlar/kullanici-yonetimi/roller' },
        { label: 'Erişim İzinleri', href: '/ayarlar/kullanici-yonetimi/erisim-izinleri' },
      ],
    },
    // 3️⃣ Rezervasyon Ayarları
    {
      title: 'Rezervasyon Ayarları',
      items: [
        { label: 'Form Alanları', href: '/ayarlar/rezervasyon/form-alanlari' },
      ],
    },
    // 4️⃣ Organizasyon
    {
      title: 'Organizasyon',
      items: [
        { label: 'Organizasyonlar', href: '/ayarlar/organizasyon/gruplar' },
        { label: 'Organizasyon Ürünleri', href: '/ayarlar/organizasyon/kalemler' },
        { label: 'Organizasyon Paketleri', href: '/ayarlar/organizasyon/paketler' },
      ],
    },
    // 5️⃣ Ofisler & Salonlar
    {
      title: 'Ofisler & Salonlar',
      items: [
        { label: 'Ofisler', href: '/ayarlar/ofisler' },
        { label: 'Salonlar', href: '/ayarlar/salonlar' },
        { label: 'Salon Görselleri', href: '/ayarlar/salon/gorseller' },
        { label: 'Kapasite & Zaman Aralıkları', href: '/ayarlar/zaman-dilimleri' },
      ],
    },
    // 6️⃣ İletişim & Bildirimler
    {
      title: 'İletişim & Bildirimler',
      items: [
        { label: 'E-posta Ayarları', href: '/ayarlar/iletisim/email' },
        { label: 'SMS Ayarları', href: '/ayarlar/iletisim/sms' },
        { label: 'Toplu SMS Gönder', href: '/ayarlar/iletisim/toplu-sms' },
        { label: 'Hazır Mesajlar', href: '/ayarlar/iletisim/hazir-mesajlar' },
      ],
    },
    // 7️⃣ Finans & Muhasebe
    {
      title: 'Finans & Muhasebe',
      items: [
        { label: 'Muhasebe Grupları', href: '/ayarlar/finans/muhasebe-gruplari' },
        { label: 'KDV & Fiyatlandırma', href: '/ayarlar/finans/kdv-fiyatlandirma' },
        { label: 'Ödeme Türleri', href: '/ayarlar/finans/odeme-turleri' },
        { label: 'Varsayılan Fiyatlar', href: '/ayarlar/finans/varsayilan-fiyatlar' },
      ],
    },
    // 8️⃣ Rezervasyon Çıktıları & Dökümanlar
    {
      title: 'Rezervasyon Çıktıları & Dökümanlar',
      items: [
        { label: 'Sözleşme Şablonları', href: '/ayarlar/rezervasyon/sozlesme-sablonlari' },
        { label: 'Tahsilat Fişi Şablonları', href: '/ayarlar/rezervasyon/tahsilat-fisi-sablonlari' },
      ],
    },
    // 9️⃣ Ek Modüller
    {
      title: 'Ek Modüller',
      items: [
        { label: 'Canlı Yayın Ayarları', href: '/ayarlar/moduller/canli-yayin' },
        { label: 'Verilen Hizmetler', href: '/ayarlar/moduller/verilen-hizmetler' },
        { label: 'Entegrasyonlar (CRM / WhatsApp / API)', href: '/ayarlar/moduller/api' },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Alt menüler açık kalmalı eğer o sayfadaysa
  useEffect(() => {
    if (pathname.startsWith('/ayarlar/kullanici-yonetimi')) {
      setOpenGroup('Kullanıcı Yönetimi');
      setIsSettingsOpen(true);
    }
    if (pathname.startsWith('/chat-ai')) {
      setIsChatAIOpen(true);
    }
    if (pathname.startsWith('/musteriler')) {
      setIsMusterilerOpen(true);
    }
    if (pathname.startsWith('/muhasebe')) {
      setIsMuhasebeOpen(true);
    }
  }, [pathname]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleChatAIClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsChatAIOpen(!isChatAIOpen);
  };

  const handleMusterilerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMusterilerOpen(!isMusterilerOpen);
  };

  const handleMuhasebeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMuhasebeOpen(!isMuhasebeOpen);
  };

  const toggleGroup = (groupTitle: string) => {
    setOpenGroup(openGroup === groupTitle ? null : groupTitle);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`bg-slate-900 text-slate-200 h-screen fixed left-0 top-0 z-50 transition-all duration-300 flex flex-col overflow-hidden ${
          isCollapsed 
            ? 'w-20 lg:translate-x-0' 
            : 'w-72 lg:translate-x-0'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Menu Toggle - Header yüksekliğinde */}
        <div className={`h-16 flex items-center border-b border-slate-700/50 bg-slate-900 transition-all duration-300 ${
          isCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'
        }`}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-blue-400 whitespace-nowrap">
              Eventra
            </h1>
          )}
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 lg:hidden"
            aria-label="Menüyü Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Desktop Toggle/Collapse Button */}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden lg:flex p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
              aria-label={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto space-y-1 transition-all duration-300 ${isCollapsed ? 'p-3' : 'p-6'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Ana Menü Öğeleri */}
          {mainMenuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isSettingsItem = item.isSettings;
            
            // Muhasebe dropdown
            if (item.label === 'Muhasebe' && !item.isSettings) {
              if (isCollapsed) {
                return (
                  <div key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`p-3 rounded-md transition-all duration-200 ${
                        active
                          ? 'bg-blue-500/10 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </div>
                );
              }
              
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    onClick={handleMuhasebeClick}
                    className={`w-full flex items-center gap-3 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 text-left ${
                      active || isMuhasebeOpen
                        ? 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isMuhasebeOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Muhasebe Alt Menüsü */}
                  {isMuhasebeOpen && !isCollapsed && (
                    <div className="pl-8 space-y-1">
                      {muhasebeSubItems.map((subItem) => {
                        const subActive = isActive(subItem.href);
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={`block py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                              subActive
                                ? 'bg-slate-900 text-blue-300 border-l-2 border-blue-500'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Chat AI dropdown
            if (item.label === 'Chat AI' && !item.isSettings) {
              if (isCollapsed) {
                return (
                  <div key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`p-3 rounded-md transition-all duration-200 ${
                        active
                          ? 'bg-blue-500/10 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </div>
                );
              }
              
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    onClick={handleChatAIClick}
                    className={`w-full flex items-center gap-3 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 text-left ${
                      active || isChatAIOpen
                        ? 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isChatAIOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Chat AI Alt Menüsü */}
                  {isChatAIOpen && !isCollapsed && (
                    <div className="pl-8 space-y-1">
                      {chatAISubItems.map((subItem) => {
                        const subActive = isActive(subItem.href);
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={`block py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                              subActive
                                ? 'bg-slate-900 text-blue-300 border-l-2 border-blue-500'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Müşteriler dropdown
            if (item.label === 'Müşteriler' && !item.isSettings) {
              if (isCollapsed) {
                // Collapsed durumunda sadece ikon (link olarak)
                return (
                  <div key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`p-3 rounded-md transition-all duration-200 ${
                        active
                          ? 'bg-blue-500/10 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </div>
                );
              }
              
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    onClick={handleMusterilerClick}
                    className={`w-full flex items-center gap-3 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 text-left ${
                      active || isMusterilerOpen
                        ? 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isMusterilerOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Müşteriler Alt Menüsü */}
                  {isMusterilerOpen && !isCollapsed && (
                    <div className="pl-8 space-y-1">
                      {musterilerSubItems.map((subItem) => {
                        const subActive = isActive(subItem.href);
                        
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={`block py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                              subActive
                                ? 'bg-slate-900 text-blue-300 border-l-2 border-blue-500'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (isSettingsItem) {
              if (isCollapsed) {
                // Collapsed durumunda sadece ikon (link olarak)
                return (
                  <div key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`p-3 rounded-md transition-all duration-200 ${
                        active
                          ? 'bg-blue-500/10 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                    </Link>
                  </div>
                );
              }
              
              return (
                <div key={item.href} className="space-y-1">
                  {/* Ayarlar Butonu - 1. Seviye Accordion */}
                  <button
                    onClick={handleSettingsClick}
                    className={`w-full flex items-center gap-3 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 text-left ${
                      active || isSettingsOpen
                        ? 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Ayarlar Alt Menüsü - Sadece açıkken görünür */}
                  {isSettingsOpen && !isCollapsed && (
                    <div className="pl-8 space-y-1">
                      {/* Alt Gruplar - 2. Seviye Accordion */}
                      {settingsGroups.map((group) => {
                        const isGroupOpen = openGroup === group.title;
                        
                        return (
                          <div key={group.title} className="space-y-1">
                            {/* Grup Başlığı - Tıklanabilir */}
                            <button
                              onClick={() => toggleGroup(group.title)}
                              className={`w-full flex items-center justify-between py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 text-left ${
                                isGroupOpen
                                  ? 'text-slate-100 bg-slate-800/50'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                              }`}
                            >
                              <span>{group.title}</span>
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Grup Öğeleri - Sadece açıkken görünür */}
                            {isGroupOpen && (
                              <div className="pl-4 space-y-1">
                                {group.items.map((subItem) => {
                                  const subActive = isActive(subItem.href);
                                  
                                  return (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      onClick={onClose}
                                      className={`block py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                        subActive
                                          ? 'bg-slate-900 text-blue-300 border-l-2 border-blue-500'
                                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                                      }`}
                                    >
                                      {subItem.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Diğer menü öğeleri (normal link)
            if (isCollapsed) {
              // Collapsed durumunda sadece ikon
              return (
                <div key={item.href} className="flex justify-center">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`p-3 rounded-md transition-all duration-200 ${
                      active
                        ? 'bg-blue-500/10 text-blue-300'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  active
                    ? 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

        </nav>

        {/* Destek Merkezi Footer */}
        <div className="border-t border-slate-700/50 bg-[#182033] mt-auto">
          <Link
            href="/destek"
            onClick={onClose}
            className={`block cursor-pointer transition-all duration-200 hover:bg-[#24314d] group ${
              isCollapsed ? 'px-3 py-3' : 'px-4 py-3'
            }`}
            title={isCollapsed ? 'Destek Merkezi' : ''}
          >
            {isCollapsed ? (
              <div className="flex justify-center">
                <svg 
                  className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" 
                  />
                </svg>
              </div>
            ) : (
              <>
                <div className="text-slate-300 text-sm font-medium tracking-wide mb-1 group-hover:text-blue-400 transition-colors">
                  Destek Merkezi
                </div>
                <div className="text-slate-400 text-xs tracking-wide group-hover:text-blue-300 transition-colors">
                  QR Menü • Dijital Reklam • Teknik Talep
                </div>
              </>
            )}
          </Link>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          nav::-webkit-scrollbar {
            width: 4px;
          }
          nav::-webkit-scrollbar-track {
            background: transparent;
          }
          nav::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 4px;
          }
          nav::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
          }
          @media (max-width: 1023px) {
            nav::-webkit-scrollbar {
              width: 6px;
            }
            nav::-webkit-scrollbar-thumb {
              background: rgba(148, 163, 184, 0.5);
            }
          }
        `}</style>
      </aside>
    </>
  );
}
