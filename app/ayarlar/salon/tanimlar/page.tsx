'use client';

import { useState, useMemo } from 'react';

interface ZamanDilimi {
  id: string;
  baslangic: string;
  bitis: string;
}

interface Salon {
  id: string;
  salonAdi: string;
  salonKodu: string;
  kategori: string;
  salonDurumu: boolean;
  sorumluKisi: string;
  kapasite: string;
  masaDuzeni: string;
  alan: string;
  katKonum: string;
  klimali: boolean;
  sahneVar: boolean;
  otoparkKapasitesi: string;
  engelliErisimi: boolean;
  sesSistemi: boolean;
  fotografAlani: boolean;
  zamanDilimleri: ZamanDilimi[];
  maksimumGunlukEtkinlik: string;
  temizlikArasi: string;
  rezervasyonAcik: boolean;
  kullanimNotlari: string;
  kisiBasiFiyat: string;
  salonKiraBedeli: string;
  ekstraUcretler: string;
  kdvOrani: string;
  haftaIciHaftaSonuFarkli: boolean;
  paraBirimi: string;
  adres: string;
  enlem: string;
  boylam: string;
  ulasimNotlari: string;
  aciklama: string;
  etkinlikTurleri: string[];
  etiketler: string;
  ozelHizmetler: string;
  varsayilanSalon: boolean;
  takvimdeGoster: boolean;
  webSitesindeYayinla: boolean;
}

const emptyFormData = {
  salonAdi: '',
  salonKodu: '',
  kategori: '',
  salonDurumu: true,
  sorumluKisi: '',
  kapasite: '',
  masaDuzeni: '',
  alan: '',
  katKonum: '',
  klimali: false,
  sahneVar: false,
  otoparkKapasitesi: '',
  engelliErisimi: false,
  sesSistemi: false,
  fotografAlani: false,
  zamanDilimleri: [] as ZamanDilimi[],
  maksimumGunlukEtkinlik: '',
  temizlikArasi: '',
  rezervasyonAcik: true,
  kullanimNotlari: '',
  kisiBasiFiyat: '',
  salonKiraBedeli: '',
  ekstraUcretler: '',
  kdvOrani: '18',
  haftaIciHaftaSonuFarkli: false,
  paraBirimi: 'TL',
  adres: '',
  enlem: '',
  boylam: '',
  ulasimNotlari: '',
  aciklama: '',
  etkinlikTurleri: [] as string[],
  etiketler: '',
  ozelHizmetler: '',
  varsayilanSalon: false,
  takvimdeGoster: true,
  webSitesindeYayinla: false,
  kapakGorseli: null as File | null,
  ekGorseller: [] as File[],
};

export default function Salonlar() {
  const [salonlar, setSalonlar] = useState<Salon[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salonToDelete, setSalonToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kategoriFilter, setKategoriFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState(emptyFormData);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Filtered salons
  const filteredSalonlar = useMemo(() => {
    return salonlar.filter(salon => {
      const matchesSearch = salon.salonAdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           salon.kategori.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'aktif' && salon.salonDurumu) ||
                           (statusFilter === 'pasif' && !salon.salonDurumu);
      const matchesKategori = kategoriFilter === 'all' || salon.kategori === kategoriFilter;
      
      return matchesSearch && matchesStatus && matchesKategori;
    });
  }, [salonlar, searchQuery, statusFilter, kategoriFilter]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('kapakGorseli', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...formData.ekGorseller, ...files];
      setFormData(prev => ({ ...prev, ekGorseller: newFiles }));
      
      const newPreviews: string[] = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setPreviewImages(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAdditionalImage = (index: number) => {
    const newFiles = formData.ekGorseller.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, ekGorseller: newFiles }));
    setPreviewImages(newPreviews);
  };

  const handleEtkinlikTuruToggle = (turu: string) => {
    const current = formData.etkinlikTurleri;
    if (current.includes(turu)) {
      setFormData(prev => ({
        ...prev,
        etkinlikTurleri: current.filter(t => t !== turu)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        etkinlikTurleri: [...current, turu]
      }));
    }
  };

  const resetForm = () => {
    setFormData(emptyFormData);
    setCoverPreview(null);
    setPreviewImages([]);
    setEditingSalonId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.salonAdi.trim()) {
      alert('Salon adı zorunludur');
      return;
    }
    
    if (editingSalonId) {
      // Update existing salon
      setSalonlar(prev => prev.map(salon => 
        salon.id === editingSalonId ? { ...formData, id: editingSalonId } : salon
      ));
      setToastMessage('Salon başarıyla güncellendi ✅');
    } else {
      // Create new salon
      const newSalon: Salon = {
        ...formData,
        id: Date.now().toString(),
      };
      setSalonlar(prev => [...prev, newSalon]);
      setToastMessage('Salon bilgileri başarıyla kaydedildi ✅');
    }
    
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setIsFormOpen(false);
      resetForm();
    }, 3000);
  };

  const handleEdit = (salon: Salon) => {
    setFormData({
      ...salon,
      kapakGorseli: null as File | null,
      ekGorseller: [] as File[],
    });
    setEditingSalonId(salon.id);
    setIsFormOpen(true);
  };

  const handleDeactivate = (salonId: string) => {
    setSalonlar(prev => prev.map(salon => 
      salon.id === salonId ? { ...salon, salonDurumu: false } : salon
    ));
    setToastMessage('Salon pasif hale getirildi');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeleteClick = (salonId: string) => {
    setSalonToDelete(salonId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (salonToDelete) {
      setSalonlar(prev => prev.filter(salon => salon.id !== salonToDelete));
      setToastMessage('Salon başarıyla silindi');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setShowDeleteModal(false);
    setSalonToDelete(null);
  };

  const handleNewSalon = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const kategoriOptions = [
    { value: 'dugun-salonu', label: 'Düğün Salonu' },
    { value: 'kir-bahcesi', label: 'Kır Bahçesi' },
    { value: 'teras', label: 'Teras' },
    { value: 'konferans-salonu', label: 'Konferans Salonu' },
    { value: 'toplanti-salonu', label: 'Toplantı Salonu' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
    <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Salon Tanımları
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
            Etkinlik salonlarınızı tanımlayın ve yönetin
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleNewSalon}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            + Yeni Salon Ekle
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transition-all duration-300 animate-[slideIn_0.3s_ease-out]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Salonu Sil
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bu salonu silmek istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSalonToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {!isFormOpen && salonlar.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Arama
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Salon adı veya kategori..."
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Durum
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">Tümü</option>
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Kategori
              </label>
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">Tümü</option>
                {kategoriOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isFormOpen && salonlar.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Henüz bir salon tanımlamadınız.
          </p>
          <button
            onClick={handleNewSalon}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Yeni Salon Ekle
          </button>
        </div>
      )}

      {/* Salon List */}
      {!isFormOpen && filteredSalonlar.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalonlar.map((salon) => (
            <div
              key={salon.id}
              onClick={() => handleEdit(salon)}
              className="bg-white dark:bg-gray-900 rounded-lg border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:ring-1 hover:ring-blue-200 transition-all cursor-pointer min-h-[200px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex-1">
                  {salon.salonAdi}
        </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    salon.salonDurumu
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {salon.salonDurumu ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2 mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Kategori:</span> {kategoriOptions.find(opt => opt.value === salon.kategori)?.label || salon.kategori}
                </p>
                {salon.kapasite && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Kapasite:</span> {salon.kapasite} Kişi
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Rezervasyon:</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    salon.rezervasyonAcik
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {salon.rezervasyonAcik ? 'Açık' : 'Kapalı'}
                  </span>
                </div>
                {salon.etkinlikTurleri.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {salon.etkinlikTurleri.slice(0, 3).map((turu, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                      >
                        {turu}
                      </span>
                    ))}
                    {salon.etkinlikTurleri.length > 3 && (
                      <span className="text-xs px-2 py-1 text-slate-500">+{salon.etkinlikTurleri.length - 3}</span>
                    )}
                  </div>
                )}
                {salon.aciklama && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                    {salon.aciklama}
                  </p>
                )}
              </div>

              {/* Footer - Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(salon);
                  }}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Düzenle
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate(salon.id);
                  }}
                  className="text-sm text-amber-600 hover:underline font-medium"
                >
                  Pasif Yap
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(salon.id);
                  }}
                  className="text-sm text-red-600 hover:underline font-medium"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isFormOpen && salonlar.length > 0 && filteredSalonlar.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Arama kriterlerinize uygun salon bulunamadı.
        </p>
      </div>
      )}

      {/* Salon Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingSalonId ? 'Salon Bilgilerini Güncelle' : 'Yeni Salon Ekle'}
            </h3>
          </div>

          <div className="space-y-8">
            {/* 1. Salon Kimlik Bilgileri */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                1. Salon Kimlik Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Salon Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.salonAdi}
                    onChange={(e) => handleChange('salonAdi', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Salon Kodu
                  </label>
                  <input
                    type="text"
                    value={formData.salonKodu}
                    onChange={(e) => handleChange('salonKodu', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => handleChange('kategori', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Seçiniz</option>
                    {kategoriOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Sorumlu Kişi
                  </label>
                  <input
                    type="text"
                    value={formData.sorumluKisi}
                    onChange={(e) => handleChange('sorumluKisi', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <ToggleSwitch
                    checked={formData.salonDurumu}
                    onChange={() => handleToggle('salonDurumu')}
                    label="Salon Durumu (Aktif/Pasif)"
                  />
                </div>
              </div>
            </section>

            {/* 2. Kapasite ve Özellikler */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                2. Kapasite ve Özellikler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kapasite (Kişi Sayısı)
                  </label>
                  <input
                    type="number"
                    value={formData.kapasite}
                    onChange={(e) => handleChange('kapasite', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Masa Düzeni
                  </label>
                  <select
                    value={formData.masaDuzeni}
                    onChange={(e) => handleChange('masaDuzeni', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Seçiniz</option>
                    <option value="yuvarlak">Yuvarlak</option>
                    <option value="dikdortgen">Dikdörtgen</option>
                    <option value="karisik">Karışık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Alan (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.alan}
                    onChange={(e) => handleChange('alan', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kat / Konum
                  </label>
                  <input
                    type="text"
                    value={formData.katKonum}
                    onChange={(e) => handleChange('katKonum', e.target.value)}
                    placeholder="örn: Zemin Kat, Bahçe"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Otopark Kapasitesi
                  </label>
                  <input
                    type="number"
                    value={formData.otoparkKapasitesi}
                    onChange={(e) => handleChange('otoparkKapasitesi', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="space-y-3">
                  <ToggleSwitch
                    checked={formData.klimali}
                    onChange={() => handleToggle('klimali')}
                    label="Klimalı mı?"
                  />
                  <ToggleSwitch
                    checked={formData.sahneVar}
                    onChange={() => handleToggle('sahneVar')}
                    label="Sahne Var mı?"
                  />
                  <ToggleSwitch
                    checked={formData.engelliErisimi}
                    onChange={() => handleToggle('engelliErisimi')}
                    label="Engelli Erişimi"
                  />
                  <ToggleSwitch
                    checked={formData.sesSistemi}
                    onChange={() => handleToggle('sesSistemi')}
                    label="Ses Sistemi"
                  />
                  <ToggleSwitch
                    checked={formData.fotografAlani}
                    onChange={() => handleToggle('fotografAlani')}
                    label="Fotoğraf Alanı"
                  />
                </div>
              </div>
            </section>

            {/* 3. Zaman Dilimleri */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                3. Zaman Dilimleri
              </h3>
              
              {/* Zaman Dilimleri Listesi */}
              {formData.zamanDilimleri.length === 0 && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
                  Henüz zaman dilimi eklenmedi. Lütfen &quot;+ Zaman Dilimi Ekle&quot; butonuna tıklayarak zaman dilimi ekleyin.
                </div>
              )}
              <div className="space-y-4 mb-4">
                {formData.zamanDilimleri.map((zamanDilimi, index) => (
                  <div key={zamanDilimi.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Başlangıç Saati
                        </label>
                        <input
                          type="time"
                          value={zamanDilimi.baslangic}
                          onChange={(e) => {
                            const updated = [...formData.zamanDilimleri];
                            updated[index] = { ...updated[index], baslangic: e.target.value };
                            handleChange('zamanDilimleri', updated);
                          }}
                          className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Bitiş Saati
                        </label>
                        <input
                          type="time"
                          value={zamanDilimi.bitis}
                          onChange={(e) => {
                            const updated = [...formData.zamanDilimleri];
                            updated[index] = { ...updated[index], bitis: e.target.value };
                            handleChange('zamanDilimleri', updated);
                          }}
                          className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.zamanDilimleri.filter((_, i) => i !== index);
                            handleChange('zamanDilimleri', updated);
                          }}
                          className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors font-medium"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zaman Dilimi Ekle Butonu */}
              <button
                type="button"
                onClick={() => {
                  const yeniZamanDilimi: ZamanDilimi = {
                    id: Date.now().toString(),
                    baslangic: '12:00',
                    bitis: '17:00',
                  };
                  handleChange('zamanDilimleri', [...formData.zamanDilimleri, yeniZamanDilimi]);
                }}
                className="w-full md:w-auto px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors font-medium mb-4"
              >
                + Zaman Dilimi Ekle
              </button>

              {/* Diğer Alanlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Maksimum Günlük Etkinlik Sayısı
                  </label>
                  <input
                    type="number"
                    value={formData.maksimumGunlukEtkinlik}
                    onChange={(e) => handleChange('maksimumGunlukEtkinlik', e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Temizlik Arası (dk)
                  </label>
                  <input
                    type="number"
                    value={formData.temizlikArasi}
                    onChange={(e) => handleChange('temizlikArasi', e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kullanım Notları
                  </label>
                  <textarea
                    value={formData.kullanimNotlari}
                    onChange={(e) => handleChange('kullanimNotlari', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <ToggleSwitch
                    checked={formData.rezervasyonAcik}
                    onChange={() => handleToggle('rezervasyonAcik')}
                    label="Rezervasyon Açık mı?"
                  />
                </div>
              </div>
            </section>

            {/* 4. Fiyatlandırma */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                4. Fiyatlandırma
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kişi Başı Fiyat (TL)
                  </label>
                  <input
                    type="number"
                    value={formData.kisiBasiFiyat}
                    onChange={(e) => handleChange('kisiBasiFiyat', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Salon Kira Bedeli (TL)
                  </label>
                  <input
                    type="number"
                    value={formData.salonKiraBedeli}
                    onChange={(e) => handleChange('salonKiraBedeli', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    KDV Oranı (%)
                  </label>
                  <select
                    value={formData.kdvOrani}
                    onChange={(e) => handleChange('kdvOrani', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="1">1%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Para Birimi
                  </label>
                  <select
                    value={formData.paraBirimi}
                    onChange={(e) => handleChange('paraBirimi', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="TL">TL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Ekstra Ücretler
                  </label>
                  <textarea
                    value={formData.ekstraUcretler}
                    onChange={(e) => handleChange('ekstraUcretler', e.target.value)}
                    rows={3}
                    placeholder="örn: süsleme, ses sistemi"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <ToggleSwitch
                    checked={formData.haftaIciHaftaSonuFarkli}
                    onChange={() => handleToggle('haftaIciHaftaSonuFarkli')}
                    label="Hafta İçi / Hafta Sonu Farklı Fiyat"
                  />
                </div>
              </div>
            </section>

            {/* 5. Görseller */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                5. Görseller
              </h3>
              <div className="space-y-6">
                {/* Kapak Görseli */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kapak Görseli
                  </label>
                  <div className="border-dashed border-2 border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                    {coverPreview ? (
                      <div className="space-y-3">
                        <img
                          src={coverPreview}
                          alt="Kapak önizleme"
                          className="max-w-full max-h-64 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, kapakGorseli: null }));
                            setCoverPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Kaldır
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="hidden"
                          id="cover-image"
                        />
                        <label
                          htmlFor="cover-image"
                          className="cursor-pointer text-sm text-slate-500 dark:text-slate-400"
                        >
                          Görsel seçmek için tıklayın veya sürükleyip bırakın
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ek Görseller */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Ek Görseller
                  </label>
                  <div className="border-dashed border-2 border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="hidden"
                      id="additional-images"
                    />
                    <label
                      htmlFor="additional-images"
                      className="cursor-pointer text-sm text-slate-500 dark:text-slate-400"
                    >
                      Görseller seçmek için tıklayın veya sürükleyip bırakın
                    </label>
                  </div>
                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {previewImages.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Ek görsel ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 6. Konum Bilgileri */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                6. Konum Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Adres
                  </label>
                  <input
                    type="text"
                    value={formData.adres}
                    onChange={(e) => handleChange('adres', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Enlem
                  </label>
                  <input
                    type="text"
                    value={formData.enlem}
                    onChange={(e) => handleChange('enlem', e.target.value)}
                    placeholder="örn: 41.0082"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Boylam
                  </label>
                  <input
                    type="text"
                    value={formData.boylam}
                    onChange={(e) => handleChange('boylam', e.target.value)}
                    placeholder="örn: 28.9784"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Ulaşım Notları
                  </label>
                  <textarea
                    value={formData.ulasimNotlari}
                    onChange={(e) => handleChange('ulasimNotlari', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            </section>

            {/* 7. Notlar ve Ek Bilgiler */}
            <section className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                7. Notlar ve Ek Bilgiler
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.aciklama}
                    onChange={(e) => handleChange('aciklama', e.target.value)}
                    rows={5}
                    placeholder="Profil sayfasında görüntülenecek açıklama"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Etkinlik Türleri
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['Düğün', 'Nişan', 'Kına', 'Doğum Günü', 'Toplantı', 'Konferans', 'Sergi'].map((turu) => (
                      <button
                        key={turu}
                        type="button"
                        onClick={() => handleEtkinlikTuruToggle(turu)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          formData.etkinlikTurleri.includes(turu)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {turu}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Etiketler
                  </label>
                  <input
                    type="text"
                    value={formData.etiketler}
                    onChange={(e) => handleChange('etiketler', e.target.value)}
                    placeholder="örn: Deniz Manzaralı, Kapalı Alan (virgülle ayırın)"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Özel Hizmetler
                  </label>
                  <input
                    type="text"
                    value={formData.ozelHizmetler}
                    onChange={(e) => handleChange('ozelHizmetler', e.target.value)}
                    placeholder="örn: canlı müzik, catering"
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </section>

            {/* 8. Sistem Ayarları */}
            <section>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                8. Sistem Ayarları
              </h3>
              <div className="space-y-3">
                <ToggleSwitch
                  checked={formData.varsayilanSalon}
                  onChange={() => handleToggle('varsayilanSalon')}
                  label="Varsayılan Salon"
                />
                <ToggleSwitch
                  checked={formData.takvimdeGoster}
                  onChange={() => handleToggle('takvimdeGoster')}
                  label="Takvimde Göster"
                />
                <ToggleSwitch
                  checked={formData.webSitesindeYayinla}
                  onChange={() => handleToggle('webSitesindeYayinla')}
                  label="Web Sitesinde Yayınla"
                />
              </div>
            </section>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="px-5 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
