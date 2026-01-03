'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, MapPin, Users, Phone, Mail } from 'lucide-react';
import SearchableSelect from '@/app/components/SearchableSelect';

interface Salon {
  id: string;
  name: string;
  slug: string;
  officeId?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  floor?: number;
  area?: number;
  location?: string;
  isActive: boolean;
  sortOrder: number;
  Ofisler?: {
    id: string;
    name: string;
    code?: string;
  };
}

export default function Salonlar() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [offices, setOffices] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [filterOfficeId, setFilterOfficeId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    officeId: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
    floor: '',
    area: '',
    location: '',
    isActive: true,
  });

  const fetchOffices = async () => {
    try {
      const res = await fetch('/eventra/api/offices');
      const data = await res.json();
      setOffices(data.filter((office: { isActive: boolean }) => office.isActive) || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const fetchSalons = async () => {
    try {
      setLoading(true);
      let url = '/eventra/api/salons';
      if (filterOfficeId) {
        url += `?officeId=${filterOfficeId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSalons(data.filter((salon: Salon) => salon.isActive) || []);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    fetchSalons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOfficeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const salonData = {
        ...formData,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        area: formData.area ? parseInt(formData.area) : null,
        officeId: formData.officeId || null,
      };

      const res = editingSalon
        ? await fetch('/eventra/api/salons', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingSalon.id, ...salonData }),
          })
        : await fetch('/eventra/api/salons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salonData),
          });

      if (!res.ok) {
        throw new Error('İşlem başarısız');
      }

      setShowModal(false);
      resetForm();
      fetchSalons();
    } catch (error) {
      console.error('Error saving salon:', error);
      alert('Salon kaydedilemedi');
    }
  };

  const handleEdit = (salon: Salon) => {
    setEditingSalon(salon);
    setFormData({
      name: salon.name,
      officeId: salon.officeId || '',
      description: salon.description || '',
      address: salon.address || '',
      phone: salon.phone || '',
      email: salon.email || '',
      capacity: salon.capacity?.toString() || '',
      floor: salon.floor?.toString() || '',
      area: salon.area?.toString() || '',
      location: salon.location || '',
      isActive: salon.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu salonu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`/eventra/api/salons?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      fetchSalons();
    } catch (error) {
      console.error('Error deleting salon:', error);
      alert('Salon silinemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      officeId: filterOfficeId || '',
      description: '',
      address: '',
      phone: '',
      email: '',
      capacity: '',
      floor: '',
      area: '',
      location: '',
      isActive: true,
    });
    setEditingSalon(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Şubeler & Salonlar</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Yeni Şube/Salon
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ofis Filtrele
            </label>
            <SearchableSelect
              options={offices.map((office) => ({
                id: office.id,
                name: office.name,
                description: office.code || '',
              }))}
              value={filterOfficeId}
              onChange={(value) => setFilterOfficeId(value)}
              placeholder="Tüm ofisler"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {salons.map((salon) => (
          <div
            key={salon.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{salon.name}</h3>
                  {salon.Ofisler && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {salon.Ofisler.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(salon)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(salon.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {salon.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {salon.description}
                </p>
              )}
              {salon.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span className="line-clamp-1">{salon.address}</span>
                </div>
              )}
              {salon.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  <span>{salon.phone}</span>
                </div>
              )}
              {salon.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={16} />
                  <span>{salon.email}</span>
                </div>
              )}
              {salon.capacity && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={16} />
                  <span>Kapasite: {salon.capacity} kişi</span>
                </div>
              )}
              {salon.area && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alan: {salon.area} m²
                </p>
              )}
              {salon.floor && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kat: {salon.floor}
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span
                className={`inline-block px-2 py-1 text-xs rounded-full ${
                  salon.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {salon.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {salons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Henüz şube/salon eklenmemiş</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingSalon ? 'Şube/Salon Düzenle' : 'Yeni Şube/Salon'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Şube/Salon Adı *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ofis
                    </label>
                    <SearchableSelect
                      options={offices.map((office) => ({
                        id: office.id,
                        name: office.name,
                        description: office.code || '',
                      }))}
                      value={formData.officeId}
                      onChange={(value) => setFormData({ ...formData, officeId: value })}
                      placeholder="Ofis seçin"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Adres
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kapasite
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alan (m²)
                    </label>
                    <input
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kat
                    </label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Konum
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Aktif
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingSalon ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

