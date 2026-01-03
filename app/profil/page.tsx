'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/app/context/SettingsContext';

export default function Profil() {
  const { generalSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    isletmeAdi: '',
    sozlesmedeCikacakIsim: '',
    kategori: '',
    faturaUnvan: '',
    vergiDairesi: '',
    vergiNo: '',
    faturaAdresi: '',
    yetkiliAdSoyad: '',
    sehir: '',
    ilce: '',
    mahalle: '',
    cadde: '',
    sokak: '',
    no: '',
    telefon: '',
    cepTelefonu: '',
    cepTelefonuTumSms: '',
    cepTelefonuYeniSms: '',
    fotoCepTelefonu: '',
    website: '',
    facebook: '',
    instagram: '',
    iban: '',
    ibanUnvan: '',
    salonKapasitesi: '',
    isletmeHakkinda: '',
    email: '',
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Genel ayarları çek
        const settingsRes = await fetch('/eventra/api/ayarlar/genel', {
          credentials: 'include',
        });
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const settings = settingsData.settings || {};
          
          // Form verilerini doldur
          setFormData(prev => ({
            ...prev,
            isletmeAdi: settings.companyName || '',
            sozlesmedeCikacakIsim: settings.companyName || '',
            faturaUnvan: settings.companyName || '',
            vergiDairesi: settings.taxOffice || '',
            vergiNo: settings.taxNumber || '',
            faturaAdresi: settings.companyAddress || '',
            telefon: settings.companyPhone || '',
            email: settings.companyEmail || '',
          }));
          
          // Logo varsa göster
          if (settings.companyLogo) {
            setLogoPreview(settings.companyLogo);
          }
        }
        
        // Kullanıcı bilgilerini çek (ilk kullanıcıyı al - admin)
        const usersRes = await fetch('/eventra/api/users', {
          credentials: 'include',
        });
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const users = usersData.users || [];
          if (users.length > 0) {
            const firstUser = users[0];
            setFormData(prev => ({
              ...prev,
              email: prev.email || firstUser.email || '',
              yetkiliAdSoyad: firstUser.name || '',
            }));
          }
        }
      } catch (error) {
        console.error('Profil verileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
      // Dosyayı state'te sakla
      setLogoFile(file);
      setLogoRemoved(false); // Yeni logo seçildi, kaldırılmış işaretini kaldır
      // Önizleme için base64'e çevir
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.isletmeAdi.trim()) {
      newErrors.isletmeAdi = 'İşletme adı zorunludur';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email adresi zorunludur';
    }
    if (formData.yeniSifre && formData.yeniSifre !== formData.yeniSifreTekrar) {
      newErrors.yeniSifreTekrar = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Logo'yu base64'e çevir (eğer yeni logo seçildiyse)
      let logoBase64 = null;
      if (logoRemoved) {
        // Logo kaldırıldı, null gönder
        logoBase64 = null;
      } else if (logoFile) {
        // Yeni logo seçildi, base64 formatında gönder
        logoBase64 = logoPreview;
      } else if (logoPreview && !logoFile && !logoRemoved) {
        // Mevcut logo'yu koru (değiştirilmediyse)
        logoBase64 = logoPreview;
      }
      
      // Genel ayarları güncelle
      const settingsPayload = {
        companyName: formData.isletmeAdi,
        companyEmail: formData.email,
        companyPhone: formData.telefon || null,
        companyAddress: formData.faturaAdresi || null,
        taxNumber: formData.vergiNo || null,
        taxOffice: formData.vergiDairesi || null,
        companyLogo: logoBase64 || null,
        // Varsayılan değerler (API bunları bekliyor)
        defaultLanguage: 'tr',
        defaultTimezone: 'Europe/Istanbul',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        currency: 'TRY',
        currencySymbol: '₺',
      };

      const settingsRes = await fetch('/eventra/api/ayarlar/genel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsPayload),
      });

      if (!settingsRes.ok) {
        // API'den dönen hata mesajını al
        const errorData = await settingsRes.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Ayarlar kaydedilemedi';
        throw new Error(errorMessage);
      }

      // Şifre değiştirme varsa
      if (formData.yeniSifre && formData.yeniSifre.trim()) {
        // Kullanıcı bilgilerini çek
        const usersRes = await fetch('/eventra/api/users', {
          credentials: 'include',
        });
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const users = usersData.users || [];
          if (users.length > 0) {
            const firstUser = users[0];
            
            // Şifre değiştirme isteği gönder
            const updateRes = await fetch('/eventra/api/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                id: firstUser.id,
                email: formData.email,
                name: formData.yetkiliAdSoyad || firstUser.name,
                newPassword: formData.yeniSifre,
              }),
            });

            if (!updateRes.ok) {
              throw new Error('Şifre güncellenemedi');
            }
          }
        }
      }

      setToastMessage('Bilgileriniz başarıyla güncellendi ✅');
      setShowToast(true);
      // Logo kaydedildiyse file state'ini temizle (artık preview'da tutuluyor)
      if (logoFile) {
        setLogoFile(null);
      }
      // Logo kaldırıldıysa state'i sıfırla
      if (logoRemoved) {
        setLogoRemoved(false);
      }
      setTimeout(() => {
        setShowToast(false);
        setToastMessage('');
        // Şifre alanlarını temizle
        setFormData(prev => ({
          ...prev,
          mevcutSifre: '',
          yeniSifre: '',
          yeniSifreTekrar: '',
        }));
      }, 3000);
    } catch (error: any) {
      console.error('Profil güncelleme hatası:', error);
      // Hata mesajını daha anlaşılır hale getir
      let errorMessage = 'Bir hata oluştu';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setToastMessage(errorMessage);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setToastMessage('');
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Profil
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Üyelik bilgilerinizi görüntüleyin ve güncelleyin
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-20 right-6 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transition-all duration-300 animate-[slideIn_0.3s_ease-out] ${
          toastMessage.includes('hata') || toastMessage.includes('Hata') 
            ? 'bg-red-600 text-white' 
            : 'bg-green-600 text-white'
        }`}>
          {toastMessage.includes('hata') || toastMessage.includes('Hata') ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Toast Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {!loading && (
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-4">
            {/* İşletme Adı */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="isletmeAdi" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                İşletme Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="isletmeAdi"
                value={formData.isletmeAdi}
                onChange={(e) => handleChange('isletmeAdi', e.target.value)}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.isletmeAdi ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                required
              />
              {errors.isletmeAdi && (
                <p className="text-red-500 text-xs mt-1">{errors.isletmeAdi}</p>
              )}
            </div>

            {/* Sözleşmede Çıkacak İsim */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="sozlesmedeCikacakIsim" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Sözleşmede Çıkacak İsim
              </label>
              <input
                type="text"
                id="sozlesmedeCikacakIsim"
                value={formData.sozlesmedeCikacakIsim}
                onChange={(e) => handleChange('sozlesmedeCikacakIsim', e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Kategori */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="kategori" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Kategori
              </label>
              <select
                id="kategori"
                value={formData.kategori}
                onChange={(e) => handleChange('kategori', e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Seçiniz</option>
                <option value="dugun-salonu">Düğün Salonu</option>
                <option value="etkinlik-mekani">Etkinlik Mekanı</option>
                <option value="konferans-salonu">Konferans Salonu</option>
              </select>
            </div>

            {/* Fatura Ünvanı / Ad Soyad */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="faturaUnvan" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Fatura Ünvanı / Ad Soyad
              </label>
              <input
                type="text"
                id="faturaUnvan"
                value={formData.faturaUnvan}
                onChange={(e) => handleChange('faturaUnvan', e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Vergi Dairesi */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="vergiDairesi" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Vergi Dairesi
              </label>
              <input
                type="text"
                id="vergiDairesi"
                value={formData.vergiDairesi}
                onChange={(e) => handleChange('vergiDairesi', e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Vergi No / TC No */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="vergiNo" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Vergi No / TC No
              </label>
              <input
                type="text"
                id="vergiNo"
                value={formData.vergiNo}
                onChange={(e) => handleChange('vergiNo', e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Fatura Adresi */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="faturaAdresi" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Fatura Adresi
              </label>
              <textarea
                id="faturaAdresi"
                value={formData.faturaAdresi}
                onChange={(e) => handleChange('faturaAdresi', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Yetkili Ad Soyad */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="yetkiliAdSoyad" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Yetkili Ad Soyad
              </label>
              <input
                type="text"
                id="yetkiliAdSoyad"
                value={formData.yetkiliAdSoyad}
                onChange={(e) => handleChange('yetkiliAdSoyad', e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Adres Bilgileri */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Adres Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sehir" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Şehir
                  </label>
                  <input
                    type="text"
                    id="sehir"
                    value={formData.sehir}
                    onChange={(e) => handleChange('sehir', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="ilce" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    İlçe
                  </label>
                  <input
                    type="text"
                    id="ilce"
                    value={formData.ilce}
                    onChange={(e) => handleChange('ilce', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="mahalle" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Mahalle
                  </label>
                  <input
                    type="text"
                    id="mahalle"
                    value={formData.mahalle}
                    onChange={(e) => handleChange('mahalle', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="cadde" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Cadde
                  </label>
                  <input
                    type="text"
                    id="cadde"
                    value={formData.cadde}
                    onChange={(e) => handleChange('cadde', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="sokak" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Sokak
                  </label>
                  <input
                    type="text"
                    id="sokak"
                    value={formData.sokak}
                    onChange={(e) => handleChange('sokak', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="no" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    No
                  </label>
                  <input
                    type="text"
                    id="no"
                    value={formData.no}
                    onChange={(e) => handleChange('no', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Telefon (Readonly) */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="telefon" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Telefon
              </label>
              <input
                type="text"
                id="telefon"
                value={formData.telefon}
                readOnly
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Tel değiştirmek için lütfen bizimle irtibata geçiniz.
              </p>
            </div>

            {/* Cep Telefonu (Readonly) */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <label htmlFor="cepTelefonu" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Cep Telefonu
              </label>
              <input
                type="text"
                id="cepTelefonu"
                value={formData.cepTelefonu}
                readOnly
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Tel değiştirmek için lütfen bizimle irtibata geçiniz.
              </p>
            </div>

            {/* SMS Bildirim Telefonları */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">SMS Bildirim Telefonları</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cepTelefonuTumSms" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Cep Telefonu (Tüm rezervasyon SMS bildirimleri)
                  </label>
                  <input
                    type="tel"
                    id="cepTelefonuTumSms"
                    value={formData.cepTelefonuTumSms}
                    onChange={(e) => handleChange('cepTelefonuTumSms', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="cepTelefonuYeniSms" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Cep Telefonu (Sadece Yeni rezervasyon SMS bildirimleri)
                  </label>
                  <input
                    type="tel"
                    id="cepTelefonuYeniSms"
                    value={formData.cepTelefonuYeniSms}
                    onChange={(e) => handleChange('cepTelefonuYeniSms', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="fotoCepTelefonu" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Foto Cep Telefonu (Foto seçimleri SMS bildirimi)
                  </label>
                  <input
                    type="tel"
                    id="fotoCepTelefonu"
                    value={formData.fotoCepTelefonu}
                    onChange={(e) => handleChange('fotoCepTelefonu', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Sosyal Medya */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Sosyal Medya</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Websiteniz
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Ödeme Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="iban" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => handleChange('iban', e.target.value)}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="ibanUnvan" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    IBAN Ünvan/Adsoyad
                  </label>
                  <input
                    type="text"
                    id="ibanUnvan"
                    value={formData.ibanUnvan}
                    onChange={(e) => handleChange('ibanUnvan', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Salon Bilgileri */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Salon Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="salonKapasitesi" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Salon Kapasitesi
                  </label>
                  <input
                    type="number"
                    id="salonKapasitesi"
                    value={formData.salonKapasitesi}
                    onChange={(e) => handleChange('salonKapasitesi', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="isletmeHakkinda" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    İşletme Hakkında Detaylı Bilgi
                  </label>
                  <textarea
                    id="isletmeHakkinda"
                    value={formData.isletmeHakkinda}
                    onChange={(e) => handleChange('isletmeHakkinda', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Şifre Değiştirme */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Şifre Değiştirme</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Email Adresiniz <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-2 rounded-md border ${
                      errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                    required
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="mevcutSifre" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Mevcut Şifreniz
                  </label>
                  <input
                    type="password"
                    id="mevcutSifre"
                    value={formData.mevcutSifre}
                    onChange={(e) => handleChange('mevcutSifre', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="yeniSifre" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    id="yeniSifre"
                    value={formData.yeniSifre}
                    onChange={(e) => handleChange('yeniSifre', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="yeniSifreTekrar" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Yeni Şifre (Tekrar)
                  </label>
                  <input
                    type="password"
                    id="yeniSifreTekrar"
                    value={formData.yeniSifreTekrar}
                    onChange={(e) => handleChange('yeniSifreTekrar', e.target.value)}
                    className={`w-full px-4 py-2 rounded-md border ${
                      errors.yeniSifreTekrar ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                  />
                  {errors.yeniSifreTekrar && (
                    <p className="text-red-500 text-xs mt-1">{errors.yeniSifreTekrar}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Logo Upload Card */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                İşletme Logosu
              </h3>
              
              {/* Logo Preview */}
              <div className="w-full aspect-square max-w-[150px] mx-auto mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative">
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
                        // File input'u da temizle
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                Lütfen JPG veya PNG formatındaki logonuzu seçiniz.
                <br />
                Maksimum boyut: 2000 kb.
              </p>
            </div>
          </div>
        </div>

        {/* Save Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            disabled={saving}
            className="px-6 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

