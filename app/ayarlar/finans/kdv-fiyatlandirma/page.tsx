'use client';

import { useState, useEffect } from 'react';
import { Save, Percent, DollarSign } from 'lucide-react';

interface TaxSettings {
  defaultKDV: number;
  kdvOranlari: { oran: number; aciklama: string }[];
  fiyatlandirmaYontemi: string;
  otomatikFiyatHesaplama: boolean;
  kaporaYuzdesi: number;
}

export default function KDVFiyatlandirmaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState<TaxSettings>({
    defaultKDV: 20,
    kdvOranlari: [
      { oran: 0, aciklama: 'KDV Muaf' },
      { oran: 1, aciklama: '%1 KDV' },
      { oran: 10, aciklama: '%10 KDV' },
      { oran: 20, aciklama: '%20 KDV' },
    ],
    fiyatlandirmaYontemi: 'kdvDahil',
    otomatikFiyatHesaplama: true,
    kaporaYuzdesi: 20,
  });

  useEffect(() => {
    const saved = localStorage.getItem('kdvFiyatlandirma');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
    
    // Kapora yüzdesini API'den çek
    fetch('/eventra/api/ayarlar/finans/kapora', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.kaporaYuzdesi !== undefined) {
          setFormData(prev => ({
            ...prev,
            kaporaYuzdesi: data.kaporaYuzdesi,
          }));
        }
      })
      .catch(err => console.error('Kapora yüzdesi yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // localStorage'a kaydet (mevcut mantık)
      localStorage.setItem('kdvFiyatlandirma', JSON.stringify(formData));
      
      // Kapora yüzdesini API'ye kaydet
      console.log('📤 Kapora yüzdesi kaydediliyor:', formData.kaporaYuzdesi);
      
      const kaporaResponse = await fetch('/eventra/api/ayarlar/finans/kapora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kaporaYuzdesi: formData.kaporaYuzdesi,
        }),
      });
      
      console.log('📥 Response status:', kaporaResponse.status);
      console.log('📥 Response ok:', kaporaResponse.ok);
      
      const responseData = await kaporaResponse.json();
      console.log('📦 Response data:', responseData);
      
      if (!kaporaResponse.ok) {
        console.error('❌ API hatası:', responseData);
        throw new Error(responseData.error || responseData.message || `HTTP ${kaporaResponse.status}: Kapora yüzdesi kaydedilemedi`);
      }
      
      console.log('✅ Kapora yüzdesi kaydedildi:', responseData);
      
      setToastMessage('Ayarlar başarıyla kaydedildi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      console.error('❌ Ayarlar kaydetme hatası:', error);
      console.error('📋 Hata detayı:', {
        message: error.message,
        stack: error.stack,
      });
      
      const errorMessage = error?.message || 'Bir hata oluştu ❌';
      setToastMessage(errorMessage);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">KDV & Fiyatlandırma</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          KDV oranları ve fiyatlandırma ayarlarını yapılandırın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">KDV Ayarları</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Varsayılan KDV Oranı (%)
              </label>
              <input
                type="number"
                value={formData.defaultKDV}
                onChange={(e) => setFormData({ ...formData, defaultKDV: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.01}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                KDV Oranları
              </label>
              <div className="space-y-2">
                {formData.kdvOranlari.map((kdv, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="number"
                      value={kdv.oran}
                      onChange={(e) => {
                        const updated = [...formData.kdvOranlari];
                        updated[index].oran = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, kdvOranlari: updated });
                      }}
                      className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={kdv.aciklama}
                      onChange={(e) => {
                        const updated = [...formData.kdvOranlari];
                        updated[index].aciklama = e.target.value;
                        setFormData({ ...formData, kdvOranlari: updated });
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fiyatlandırma Ayarları</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fiyatlandırma Yöntemi
              </label>
              <select
                value={formData.fiyatlandirmaYontemi}
                onChange={(e) => setFormData({ ...formData, fiyatlandirmaYontemi: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="kdvDahil">KDV Dahil</option>
                <option value="kdvHaric">KDV Hariç</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="otomatikHesaplama"
                checked={formData.otomatikFiyatHesaplama}
                onChange={(e) => setFormData({ ...formData, otomatikFiyatHesaplama: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="otomatikHesaplama" className="cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">Otomatik Fiyat Hesaplama</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  KDV oranına göre otomatik fiyat hesaplama
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kapora Ayarları</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kapora Yüzdesi (%)
              </label>
              <input
                type="number"
                value={formData.kaporaYuzdesi}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  kaporaYuzdesi: parseFloat(e.target.value) || 0 
                })}
                min={0}
                max={100}
                step={0.01}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Yeni rezervasyonlarda otomatik kapora hesaplama için kullanılacak yüzde (0-100)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

