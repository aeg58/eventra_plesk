'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, MenuIcon } from './Icons';
import { useSettings } from '@/app/context/SettingsContext';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  icon: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { generalSettings } = useSettings();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const companyName = generalSettings?.companyName || 'İLAYDA DAVET VE BALO SALONU';
  const companyLogo = generalSettings?.companyLogo || null;
  
  // Şirket adının ilk harfini al (varsayılan avatar için)
  const companyInitial = companyName?.charAt(0)?.toUpperCase() || 'İ';

  // Arama fonksiyonu
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/eventra/api/search?q=${encodeURIComponent(query)}&type=all`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        setIsSearchOpen(true);
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsSearchOpen(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Arama input değişikliği
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounce - 300ms bekle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  // Arama sonucuna tıklama
  const handleSearchResultClick = (url: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(url);
  };

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6 py-3 gap-6">
        {/* Left Section */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Menu Toggle Button - Only Mobile */}
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 lg:hidden"
            aria-label="Menüyü Aç/Kapat"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Center Section - Search */}
        <div className="flex items-center justify-center flex-1 max-w-2xl mx-auto">
          <div className="relative w-full max-w-96" ref={searchRef}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <SearchIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Ne aramıştınız?"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all"
            />
            
            {/* Arama Sonuçları */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Aranıyor...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleSearchResultClick(result.url)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {result.icon === 'calendar' && (
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                            {result.icon === 'user' && (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                            {result.icon === 'building' && (
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            )}
                            {result.icon === 'event' && (
                              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {result.title}
                            </div>
                            <div className="text-sm text-slate-500 truncate">
                              {result.subtitle}
                            </div>
                            {result.description && (
                              <div className="text-xs text-slate-400 mt-1 truncate">
                                {result.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Sonuç bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - User Info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* User Info */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">
                {companyName}
              </span>
              <span className="text-xs text-slate-500">
                Admin Paneli
              </span>
            </div>
          </div>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {/* Logo varsa sadece logo göster (yuvarlak arka plan yok), yoksa yuvarlak arka plan + baş harf göster */}
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName}
                  className="h-10 w-auto max-w-[120px] object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">{companyInitial}</span>
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 transition-all duration-200 opacity-100">
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-900">
                    {companyName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Admin Paneli
                  </p>
                </div>
                <div className="py-2">
                  <Link
                    href="/profil"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profil Ayarları
                  </Link>
                  <Link
                    href="/ayarlar"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Sistem Ayarları
                  </Link>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    try {
                      const res = await fetch('/eventra/api/logout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      });
                      
                      if (res.ok) {
                        // Cookie silindi, login sayfasına yönlendir
                        window.location.href = '/eventra/login';
                      } else {
                        // Hata olsa bile login sayfasına yönlendir
                        window.location.href = '/eventra/login';
                      }
                    } catch (error) {
                      // Hata olsa bile login sayfasına yönlendir
                      window.location.href = '/eventra/login';
                    }
                  }}
                >
                  Güvenli Çıkış
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
