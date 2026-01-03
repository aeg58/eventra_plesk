'use client';

import { useState, useEffect } from 'react';
import { Save, Palette, Image, Upload, RotateCcw } from 'lucide-react';
import { useSettings } from '@/app/context/SettingsContext';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  darkMode: boolean;
  fontFamily: string;
  fontSize: string;
}

export default function TemaGorseller() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Logo state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  
  // Favicon state
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconRemoved, setFaviconRemoved] = useState(false);

  const [formData, setFormData] = useState<ThemeSettings>({
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    logoUrl: '',
    faviconUrl: '',
    darkMode: false,
    fontFamily: 'Inter',
    fontSize: 'medium',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/ayarlar/tema', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setFormData({
            primaryColor: data.settings.primaryColor || '#2563eb',
            secondaryColor: data.settings.secondaryColor || '#64748b',
            logoUrl: data.settings.logoUrl || '',
            faviconUrl: data.settings.faviconUrl || '',
            darkMode: data.settings.darkMode !== undefined ? data.settings.darkMode : false,
            fontFamily: data.settings.fontFamily || 'Inter',
            fontSize: data.settings.fontSize || 'medium',
          });
          
          // Logo önizleme
          if (data.settings.logoUrl) {
            setLogoPreview(data.settings.logoUrl);
          }
          
          // Favicon önizleme
          if (data.settings.faviconUrl) {
            setFaviconPreview(data.settings.faviconUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Logo'yu base64'e çevir (eğer yeni logo seçildiyse)
      let logoBase64 = null;
      if (logoRemoved) {
        logoBase64 = null;
      } else if (logoFile) {
        logoBase64 = logoPreview;
      } else if (logoPreview && !logoFile && !logoRemoved) {
        logoBase64 = logoPreview;
      } else {
        logoBase64 = formData.logoUrl || null;
      }

      // Favicon'u base64'e çevir (eğer yeni favicon seçildiyse)
      let faviconBase64 = null;
      if (faviconRemoved) {
        faviconBase64 = null;
      } else if (faviconFile) {
        faviconBase64 = faviconPreview;
      } else if (faviconPreview && !faviconFile && !faviconRemoved) {
        faviconBase64 = faviconPreview;
      } else {
        faviconBase64 = formData.faviconUrl || null;
      }
      
      const payload = {
        ...formData,
        logoUrl: logoBase64,
        faviconUrl: faviconBase64,
      };

      const res = await fetch('/eventra/api/ayarlar/tema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage('Tema ayarları başarıyla kaydedildi ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Logo kaydedildiyse file state'ini temizle
        if (logoFile) {
          setLogoFile(null);
        }
        if (logoRemoved) {
          setLogoRemoved(false);
          setLogoPreview(null);
        }
        
        // Favicon kaydedildiyse file state'ini temizle
        if (faviconFile) {
          setFaviconFile(null);
        }
        if (faviconRemoved) {
          setFaviconRemoved(false);
          setFaviconPreview(null);
        }
        
        // SettingsContext'i yenile ki tema ayarları uygulanabilsin
        await refreshSettings();
        
        // Kısa bir gecikme sonrası sayfayı yenile (tema uygulanması için)
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const errorMsg = data.error || data.message || 'Ayarlar kaydedilemedi';
        setToastMessage(`${errorMsg} ❌`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        console.error('Save error:', data);
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      const errorMsg = error.message || 'Bir hata oluştu';
      setToastMessage(`${errorMsg} ❌`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000 * 1024) {
        alert('Dosya boyutu 2000 KB\'dan büyük olamaz.');
        return;
      }
      if (!file.type.match('image/(jpeg|jpg|png)')) {
        alert('Lütfen JPG veya PNG formatında bir dosya seçiniz.');
        return;
      }
      setLogoFile(file);
      setLogoRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000 * 1024) {
        alert('Dosya boyutu 2000 KB\'dan büyük olamaz.');
        return;
      }
      if (!file.type.match('image/(jpeg|jpg|png|ico)')) {
        alert('Lütfen JPG, PNG veya ICO formatında bir dosya seçiniz.');
        return;
      }
      setFaviconFile(file);
      setFaviconRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Tema ayarlarını varsayılan değerlere döndürmek istediğinize emin misiniz? (Logo ve favicon korunacak)')) {
      return;
    }

    try {
      setSaving(true);
      
      // Sadece tema ayarlarını varsayılan değerlere döndür (logo ve favicon korunur)
      const defaultData = {
        ...formData,
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        darkMode: false,
        fontFamily: 'Inter',
        fontSize: 'medium',
        // Logo ve favicon korunur
        logoUrl: formData.logoUrl,
        faviconUrl: formData.faviconUrl,
      };

      const res = await fetch('/eventra/api/ayarlar/tema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(defaultData),
      });

      const data = await res.json();

      if (res.ok) {
        setFormData(defaultData);
        setToastMessage('Tema ayarları varsayılan değerlere döndürüldü ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // SettingsContext'i yenile
        await refreshSettings();
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const errorMsg = data.error || data.message || 'Ayarlar sıfırlanamadı';
        setToastMessage(`${errorMsg} ❌`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMsg = error.message || 'Bir hata oluştu';
      setToastMessage(`${errorMsg} ❌`);
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
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Tema & Görseller
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistem teması, renkler ve görselleri yapılandırın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Renk Ayarları */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Renk Ayarları
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ana Renk
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-16 h-12 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                İkincil Renk
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-16 h-12 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="#64748b"
                />
              </div>
            </div>
          </div>

          {/* Renk Önizleme */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Önizleme:</p>
            <div className="flex gap-3">
              <div
                className="px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Ana Renk
              </div>
              <div
                className="px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                İkincil Renk
              </div>
            </div>
          </div>
        </div>

        {/* Görsel Ayarları */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Image className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Görsel Ayarları
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Logo
              </label>
              
              {/* Logo Preview */}
              <div className="w-full aspect-square max-w-[150px] mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative">
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Logo önizleme"
                      className="w-full h-full object-contain"
                    />
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                        setLogoRemoved(true);
                        const fileInput = document.getElementById('logo-upload-input') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
                      title="Logoyu kaldır"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* File Input */}
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload-input"
                />
                <span className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md cursor-pointer transition-colors font-medium">
                  {logoPreview ? 'Logoyu Değiştir' : 'Dosya Seç'}
                </span>
              </label>

              {/* Info Text */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                Lütfen JPG veya PNG formatındaki logonuzu seçiniz.
                <br />
                Maksimum boyut: 2000 kb.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Favicon
              </label>
              
              {/* Favicon Preview */}
              <div className="w-full aspect-square max-w-[80px] mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative">
                {faviconPreview ? (
                  <>
                    <img
                      src={faviconPreview}
                      alt="Favicon önizleme"
                      className="w-full h-full object-contain"
                    />
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setFaviconPreview(null);
                        setFaviconFile(null);
                        setFaviconRemoved(true);
                        const fileInput = document.getElementById('favicon-upload-input') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = '';
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors z-10"
                      title="Favicon'u kaldır"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* File Input */}
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/x-icon"
                  onChange={handleFaviconChange}
                  className="hidden"
                  id="favicon-upload-input"
                />
                <span className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md cursor-pointer transition-colors font-medium">
                  {faviconPreview ? 'Favicon\'u Değiştir' : 'Dosya Seç'}
                </span>
              </label>

              {/* Info Text */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                Lütfen JPG, PNG veya ICO formatındaki favicon'unuzu seçiniz.
                <br />
                Maksimum boyut: 2000 kb.
              </p>
            </div>
          </div>
        </div>

        {/* Görünüm Ayarları */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Görünüm Ayarları
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Font Ailesi
              </label>
              <select
                value={formData.fontFamily}
                onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Font Boyutu
              </label>
              <select
                value={formData.fontSize}
                onChange={(e) => setFormData({ ...formData, fontSize: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="small">Küçük</option>
                <option value="medium">Orta</option>
                <option value="large">Büyük</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="darkMode"
                checked={formData.darkMode}
                onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="darkMode" className="cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">Karanlık Mod</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Sistem genelinde karanlık tema kullan
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5" />
            Varsayılanlara Dön
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

