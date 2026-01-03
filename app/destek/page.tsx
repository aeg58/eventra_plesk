'use client';

import { useState } from 'react';

// Kategori tipleri
interface Category {
  id: string;
  name: string;
  icon: JSX.Element;
  subCategories: string[];
}

const categories: Category[] = [
  {
    id: 'web',
    name: 'Web Sitesi & Dijital Varlık',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    subCategories: [
      'Kurumsal Web Sitesi',
      'Tek Sayfa Landing',
      'Online Menü (QR Menü)',
      'Rezervasyon Formu Entegrasyonu'
    ]
  },
  {
    id: 'automation',
    name: 'Otomasyon & Yazılım',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    subCategories: [
      'Rezervasyon Otomasyonu',
      'CRM Entegrasyonu',
      'E-posta Otomasyonu',
      'WhatsApp AI Asistan'
    ]
  },
  {
    id: 'social',
    name: 'Sosyal Medya Yönetimi',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    subCategories: [
      'İçerik Üretimi',
      'Takvim Planlama',
      'Fotoğraf & Video Çekimi',
      'Hesap Optimizasyonu'
    ]
  },
  {
    id: 'ads',
    name: 'Reklam Yönetimi',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    subCategories: [
      'Meta Reklamları (Instagram & Facebook)',
      'Google Reklamları',
      'TikTok Reklamları',
      'YouTube Kampanyaları',
      'LinkedIn Ads'
    ]
  },
  {
    id: 'maps',
    name: 'Harita & Platform Kayıtları',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    subCategories: [
      'Google Maps',
      'Yandex Haritalar',
      'Apple Maps',
      'Instagram Konum Ekleme',
      'Trendyol/Hepsiburada Mağaza Entegrasyonu'
    ]
  },
  {
    id: 'technical',
    name: 'Teknik Destek & Bakım',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    subCategories: [
      'Mail Sunucusu',
      'Hosting / SSL',
      'Alan Adı (Domain)',
      'Güncelleme / Yedekleme',
      'Hata Bildirimi'
    ]
  },
  {
    id: 'suggestion',
    name: 'Öneri & Yeni Proje',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    subCategories: [
      'Yeni Modül Fikri',
      'Kampanya Önerisi',
      'Raporlama Desteği'
    ]
  }
];

export default function DestekPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategories([]);
  };

  const handleSubCategoryToggle = (subCategory: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCategory)
        ? prev.filter(item => item !== subCategory)
        : [...prev, subCategory]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || selectedSubCategories.length === 0 || !description.trim()) {
      setToastMessage('Lütfen tüm alanları doldurun');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // TODO: Backend entegrasyonu - account_id ile birlikte gönderilecek
    const supportRequest = {
      category: currentCategory?.name,
      subCategories: selectedSubCategories,
      description,
      files: attachedFiles.map(f => f.name),
      timestamp: new Date().toISOString()
    };

    console.log('Destek Talebi:', supportRequest);

    // Success
    setToastMessage('✅ Talebiniz başarıyla gönderildi. En kısa sürede dönüş yapacağız.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);

    // Reset form
    setSelectedCategory(null);
    setSelectedSubCategories([]);
    setDescription('');
    setAttachedFiles([]);
  };

  const canSubmit = selectedCategory && selectedSubCategories.length > 0 && description.trim();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Destek Merkezi
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Dijital ekibimizden destek almak istediğiniz konuyu seçin. Her talep size özel olarak loglanır.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              Web sitesi, reklam yönetimi, sosyal medya ve teknik destek için aşağıdaki formu kullanabilirsiniz.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              İletişim: <a href="mailto:support@blackwool.media" className="underline hover:no-underline">support@blackwool.media</a>
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Kategori Seçimi */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                1. Kategori Seçin
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${
                      selectedCategory === category.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {category.icon}
                    </div>
                    <span className={`text-sm font-medium ${
                      selectedCategory === category.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orta: Alt Başlıklar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                2. Hizmet Türü Seçin
              </h3>
              {!selectedCategory ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Önce bir kategori seçin
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentCategory?.subCategories.map((subCat) => (
                    <label
                      key={subCat}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubCategories.includes(subCat)}
                        onChange={() => handleSubCategoryToggle(subCat)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {subCat}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ: Açıklama ve Dosya */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                3. Detaylar
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Açıklama *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Talebinizi detaylı olarak açıklayın..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Dosya Ekle (İsteğe Bağlı)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer"
                  />
                  {attachedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Talebi Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Summary Section (if category selected) */}
      {selectedCategory && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Talep Özeti
            </h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 dark:text-slate-500">Kategori:</span>
              <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                  {currentCategory?.icon}
                </div>
                <span>{currentCategory?.name}</span>
              </div>
            </div>
            {selectedSubCategories.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 dark:text-slate-500">Seçilen Hizmetler:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedSubCategories.join(', ')}
                </span>
              </div>
            )}
            {attachedFiles.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-slate-500 dark:text-slate-500">Dosya:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {attachedFiles.length} dosya eklendi
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in max-w-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

