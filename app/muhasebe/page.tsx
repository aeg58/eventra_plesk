'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Muhasebe() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const muhasebeMenuItems = [
    { label: 'Finans Yönetimi', href: '/muhasebe/finans-yonetimi' },
    { label: 'Rezervasyon Finansı', href: '/muhasebe/rezervasyon-finansi' },
    { label: 'Hesap Takibi', href: '/muhasebe/hesap-takibi' },
    { label: 'Kasa Yönetimi', href: '/muhasebe/kasa-yonetimi' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Muhasebe
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Finansal işlemlerinizi yönetin
        </p>
      </div>

      {/* Menu */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            MUHASEBE
          </h3>
          <svg
            className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <nav className="mt-4 space-y-1">
            {muhasebeMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Default Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Lütfen yukarıdaki menüden bir bölüm seçin.
        </p>
      </div>
    </div>
  );
}



