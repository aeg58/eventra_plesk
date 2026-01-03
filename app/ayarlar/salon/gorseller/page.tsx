'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Trash2, Edit2, Image as ImageIcon, Plus } from 'lucide-react';
import SearchableSelect from '@/app/components/SearchableSelect';

interface Salon {
  id: string;
  name: string;
  slug: string;
  officeId?: string;
  gallery?: string;
  Ofisler?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  alt?: string;
  order: number;
}

export default function SalonGorselleriPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState<string>('');
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    if (selectedSalonId) {
      fetchSalonDetails(selectedSalonId);
    } else {
      setSelectedSalon(null);
      setGalleryImages([]);
    }
  }, [selectedSalonId]);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/salons');
      if (res.ok) {
        const data = await res.json();
        setSalons(data || []);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalonDetails = async (salonId: string) => {
    try {
      const res = await fetch('/eventra/api/salons');
      if (res.ok) {
        const data = await res.json();
        const salon = data.find((s: Salon) => s.id === salonId);
        if (salon) {
          setSelectedSalon(salon);
          // Gallery'yi parse et
          if (salon.gallery) {
            try {
              const gallery = JSON.parse(salon.gallery);
              if (Array.isArray(gallery)) {
                setGalleryImages(gallery);
              } else {
                setGalleryImages([]);
              }
            } catch {
              setGalleryImages([]);
            }
          } else {
            setGalleryImages([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching salon details:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedSalonId) return;

    // Dosya validasyonu
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setToastMessage('Lütfen sadece görsel dosyası seçin');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setToastMessage('Dosya boyutu 5MB\'dan küçük olmalıdır');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const newImages: GalleryImage[] = [];

      // Dosyaları base64'e çevir
      for (const file of validFiles) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            newImages.push({
              id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url: base64String,
              title: file.name.replace(/\.[^/.]+$/, ''), // Dosya adından uzantıyı çıkar
              alt: '',
              order: galleryImages.length + newImages.length,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      // Yeni görselleri ekle ve kaydet
      const updatedImages = [...galleryImages, ...newImages];
      await saveGallery(updatedImages);

      setToastMessage(`${validFiles.length} görsel başarıyla yüklendi ✅`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error uploading images:', error);
      setToastMessage('Görseller yüklenirken bir hata oluştu ❌');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setUploading(false);
      // Input'u temizle
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const updatedImages = galleryImages.filter(img => img.id !== imageId);
      await saveGallery(updatedImages);
      setToastMessage('Görsel başarıyla silindi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error deleting image:', error);
      setToastMessage('Görsel silinirken bir hata oluştu ❌');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image);
    setImageTitle(image.title || '');
    setImageAlt(image.alt || '');
  };

  const handleSaveImageEdit = async () => {
    if (!editingImage) return;

    try {
      const updatedImages = galleryImages.map(img =>
        img.id === editingImage.id
          ? { ...img, title: imageTitle, alt: imageAlt }
          : img
      );
      await saveGallery(updatedImages);
      setEditingImage(null);
      setImageTitle('');
      setImageAlt('');
      setToastMessage('Görsel bilgileri güncellendi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error updating image:', error);
      setToastMessage('Görsel güncellenirken bir hata oluştu ❌');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleReorderImages = async (newImages: GalleryImage[]) => {
    try {
      // Sıralamayı güncelle
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        order: index,
      }));
      await saveGallery(reorderedImages);
    } catch (error) {
      console.error('Error reordering images:', error);
    }
  };

  const saveGallery = async (images: GalleryImage[]) => {
    if (!selectedSalonId) return;

    try {
      const galleryJson = JSON.stringify(images);
      
      // Mevcut salon bilgilerini al
      const res = await fetch('/eventra/api/salons');
      if (!res.ok) throw new Error('Salon bilgileri alınamadı');
      
      const salonsData = await res.json();
      const salon = salonsData.find((s: Salon) => s.id === selectedSalonId);
      if (!salon) throw new Error('Salon bulunamadı');

      // Salonu güncelle
      const updateRes = await fetch('/eventra/api/salons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSalonId,
          name: salon.name,
          slug: salon.slug,
          officeId: salon.officeId,
          description: salon.description,
          address: salon.address,
          phone: salon.phone,
          email: salon.email,
          capacity: salon.capacity,
          floor: salon.floor,
          area: salon.area,
          location: salon.location,
          features: salon.features,
          gallery: galleryJson,
          sortOrder: salon.sortOrder,
          isActive: salon.isActive,
        }),
      });

      if (!updateRes.ok) {
        throw new Error('Galeri kaydedilemedi');
      }

      setGalleryImages(images);
      // Salon bilgilerini de güncelle
      if (selectedSalon) {
        setSelectedSalon({ ...selectedSalon, gallery: galleryJson });
      }
    } catch (error) {
      console.error('Error saving gallery:', error);
      throw error;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('imageIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('imageIndex'));
    if (dragIndex === dropIndex) return;

    const newImages = [...galleryImages];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    handleReorderImages(newImages);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Salon Görselleri
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Salon fotoğraflarını ve görsellerini yönetin
        </p>
      </div>

      {/* Salon Seçimi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Salon Seçin
        </label>
        <SearchableSelect
          options={salons.map(salon => ({
            id: salon.id,
            name: salon.name,
            description: salon.Ofisler ? salon.Ofisler.name : '',
          }))}
          value={selectedSalonId}
          onChange={(value) => setSelectedSalonId(value)}
          placeholder="Salon seçiniz..."
        />
      </div>

      {selectedSalon && (
        <>
          {/* Upload Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {selectedSalon.name} - Galeri Yönetimi
              </h3>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                <span>Görsel Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            {uploading && (
              <div className="mb-4 text-sm text-blue-600 dark:text-blue-400">
                Görseller yükleniyor...
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              JPG, PNG veya GIF formatında görseller yükleyebilirsiniz. Maksimum dosya boyutu: 5MB
            </p>
          </div>

          {/* Gallery Grid */}
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="group relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all cursor-move"
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={image.url}
                      alt={image.alt || image.title || 'Salon görseli'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEditImage(image)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image Info */}
                  {(image.title || image.alt) && (
                    <div className="p-2 bg-white dark:bg-slate-900">
                      {image.title && (
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {image.title}
                        </p>
                      )}
                      {image.alt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {image.alt}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
              <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Bu salon için henüz görsel eklenmemiş
              </p>
            </div>
          )}
        </>
      )}

      {!selectedSalon && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            Lütfen bir salon seçin
          </p>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Görsel Düzenle
            </h3>

            {/* Image Preview */}
            <div className="mb-4">
              <img
                src={editingImage.url}
                alt={editingImage.alt || editingImage.title || 'Görsel'}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Görsel başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alt Metin (Açıklama)
                </label>
                <textarea
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Görsel açıklaması"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setEditingImage(null);
                  setImageTitle('');
                  setImageAlt('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveImageEdit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
