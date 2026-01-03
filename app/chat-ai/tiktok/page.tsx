'use client';

export default function TikTokAIPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          TikTok Mesaj Takibi
        </h2>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {/* TikTok Brand Colors Gradient Header */}
        <div className="h-32 bg-gradient-to-r from-[#FF0050] via-[#00F2EA] to-[#000000]"></div>
        
        <div className="p-12 text-center">
          {/* TikTok Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-r from-[#FF0050] to-[#00F2EA] mb-6">
            <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </div>

          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Yakında Geliyor
          </h3>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            TikTok mesaj takibi özelliği üzerinde çalışıyoruz. 
            Çok yakında TikTok DM&apos;lerini, yorumları ve etkileşimlerini bu sayfadan takip edebileceksiniz.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#FF0050] to-[#00F2EA] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                DM Takibi
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                TikTok&apos;tan gelen tüm direkt mesajları takip edin
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#FF0050] to-[#00F2EA] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Yorum Yönetimi
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Videolarınıza yapılan yorumları görün ve yanıtlayın
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#FF0050] to-[#00F2EA] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Otomatik Yanıtlar
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI destekli otomatik yanıt sistemi ile zaman kazanın
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-[#FF0050]/10 to-[#00F2EA]/10 border border-[#FF0050]/20 rounded-xl p-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF0050] to-[#00F2EA] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-left flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  TikTok API Entegrasyonu
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  TikTok Business API entegrasyonu tamamlandığında, bu sayfa WhatsApp ve Instagram sayfalarına benzer bir arayüz ile hizmete girecektir. 
                  Mesajlar gerçek zamanlı otomatik olarak çekilecektir.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Planlanan Özellikler
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF0050] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Gerçek zamanlı DM takibi
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF0050] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Video yorumları yönetimi
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF0050] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  İki panelli mesajlaşma arayüzü
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF0050] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  AI destekli otomatik yanıtlar
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF0050] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  İstatistik dashboard&apos;u
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF0050] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Gerçek zamanlı veri senkronizasyonu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

