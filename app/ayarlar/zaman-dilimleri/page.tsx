'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchableSelect from '@/app/components/SearchableSelect';

interface TimeSlot {
  id: string;
  name: string;
  slug: string;
  description?: string;
  startTime: string;
  endTime: string;
  officeId?: string;
  officeIds?: string[]; // Çoklu şube desteği
  salonId?: string;
  salonIds?: string[]; // Çoklu salon desteği
  capacity?: number;
  sortOrder: number;
  isActive: boolean;
  Ofisler?: {
    id: string;
    name: string;
    code?: string;
  };
  Subeler?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Office {
  id: string;
  name: string;
  code?: string;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  officeId?: string;
}

export default function ZamanDilimleri() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '11:00',
    endTime: '16:00',
    officeIds: [] as string[], // Çoklu şube desteği
    salonIds: [] as string[], // Çoklu salon desteği
    capacity: '',
  });

  const [filterOfficeId, setFilterOfficeId] = useState<string>('');
  const [filterSalonId, setFilterSalonId] = useState<string>('');

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (filterOfficeId) {
      fetchSalons(filterOfficeId);
      fetchTimeSlots(filterOfficeId, null);
    } else {
      setSalons([]);
      setFilterSalonId('');
      fetchTimeSlots();
    }
  }, [filterOfficeId]);

  useEffect(() => {
    if (filterSalonId && filterOfficeId) {
      fetchTimeSlots(filterOfficeId, filterSalonId);
    } else if (filterOfficeId) {
      fetchTimeSlots(filterOfficeId, null);
    }
  }, [filterSalonId]);

  const fetchOffices = async () => {
    try {
      const res = await fetch('/eventra/api/offices');
      if (res.ok) {
        const data = await res.json();
        setOffices(data.filter((office: Office & { isActive: boolean }) => office.isActive) || []);
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const fetchSalons = async (officeId: string) => {
    try {
      const res = await fetch(`/eventra/api/salons?officeId=${officeId}`);
      if (res.ok) {
        const data = await res.json();
        const newSalons = data.filter((salon: Salon & { isActive: boolean }) => salon.isActive) || [];
        // Mevcut salonları koru, yeni salonları ekle (çoklu şube için)
        setSalons(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const uniqueNewSalons = newSalons.filter((s: Salon) => !existingIds.has(s.id));
          return [...prev, ...uniqueNewSalons];
        });
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
    }
  };

  const fetchTimeSlots = async (officeId?: string, salonId?: string | null) => {
    try {
      setLoading(true);
      let url = '/eventra/api/time-slots';
      if (salonId) {
        url += `?salonId=${salonId}`;
      } else if (officeId) {
        url += `?officeId=${officeId}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTimeSlots(data || []);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (slot?: TimeSlot) => {
    if (slot) {
      setEditingSlot(slot);
      const slotOfficeIds = slot.officeIds || (slot.officeId ? [slot.officeId] : []);
      const slotSalonIds = slot.salonIds || (slot.salonId ? [slot.salonId] : []);
      setFormData({
        name: slot.name,
        description: slot.description || '',
        startTime: slot.startTime || '11:00',
        endTime: slot.endTime || '16:00',
        officeIds: slotOfficeIds,
        salonIds: slotSalonIds,
        capacity: slot.capacity?.toString() || '',
      });
      // Seçili şubelerin salonlarını yükle
      if (slotOfficeIds.length > 0) {
        Promise.all(slotOfficeIds.map(id => fetchSalons(id))).then(() => {
          // Salonlar yüklendi
        });
      }
    } else {
      setEditingSlot(null);
      setFormData({
        name: '',
        description: '',
        startTime: '11:00',
        endTime: '16:00',
        officeIds: filterOfficeId ? [filterOfficeId] : [],
        salonIds: filterSalonId ? [filterSalonId] : [],
        capacity: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert('Ad, başlangıç saati ve bitiş saati zorunludur');
      return;
    }

    try {
      const slotData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        officeIds: formData.officeIds, // Çoklu şube desteği
        salonIds: formData.salonIds, // Çoklu salon desteği
        officeId: formData.officeIds.length > 0 ? formData.officeIds[0] : null, // Backward compatibility
        salonId: formData.salonIds.length > 0 ? formData.salonIds[0] : null, // Backward compatibility
      };

      const res = editingSlot
        ? await fetch('/eventra/api/time-slots', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingSlot.id, ...slotData }),
          })
        : await fetch('/eventra/api/time-slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slotData),
          });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'İşlem başarısız');
      }

      setShowToast(true);
      setToastMessage(editingSlot ? 'Zaman dilimi başarıyla güncellendi ✅' : 'Zaman dilimi başarıyla oluşturuldu ✅');
      setTimeout(() => setShowToast(false), 3000);

      setShowModal(false);
      resetForm();
      if (filterSalonId && filterOfficeId) {
        fetchTimeSlots(filterOfficeId, filterSalonId);
      } else if (filterOfficeId) {
        fetchTimeSlots(filterOfficeId, null);
      } else {
        fetchTimeSlots();
      }
    } catch (error: any) {
      console.error('Error saving time slot:', error);
      setShowToast(true);
      setToastMessage(error.message || 'Zaman dilimi kaydedilemedi ❌');
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/eventra/api/time-slots?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      setShowDeleteModal(false);
      setSlotToDelete(null);
      if (filterSalonId && filterOfficeId) {
        fetchTimeSlots(filterOfficeId, filterSalonId);
      } else if (filterOfficeId) {
        fetchTimeSlots(filterOfficeId, null);
      } else {
        fetchTimeSlots();
      }
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('Zaman dilimi silinemedi');
    }
  };

  const handleToggleActive = async (slot: TimeSlot) => {
    try {
      const res = await fetch('/eventra/api/time-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slot.id, isActive: !slot.isActive }),
      });

      if (!res.ok) {
        throw new Error('Güncelleme başarısız');
      }

      if (filterSalonId && filterOfficeId) {
        fetchTimeSlots(filterOfficeId, filterSalonId);
      } else if (filterOfficeId) {
        fetchTimeSlots(filterOfficeId, null);
      } else {
        fetchTimeSlots();
      }
    } catch (error) {
      console.error('Error toggling time slot:', error);
      alert('Durum güncellenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startTime: '11:00',
      endTime: '16:00',
      officeIds: [],
      salonIds: [],
      capacity: '',
    });
    setEditingSlot(null);
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${start} – ${end}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Zaman Dilimleri
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Rezervasyon formunda kullanılacak zaman aralıklarını ofis ve şube bazlı tanımlayın.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Şube Filtrele
            </label>
            <SearchableSelect
              options={offices.map((office) => ({
                id: office.id,
                name: office.name,
                description: office.code || '',
              }))}
              value={filterOfficeId}
              onChange={(value) => {
                setFilterOfficeId(value);
                setFilterSalonId('');
              }}
              placeholder="Tüm şubeler"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Salon Filtrele
            </label>
            <SearchableSelect
              options={salons.map((salon) => ({
                id: salon.id,
                name: salon.name,
                description: salon.slug,
              }))}
              value={filterSalonId}
              onChange={(value) => setFilterSalonId(value)}
              placeholder="Tüm salonlar"
              disabled={!filterOfficeId}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleOpenModal()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Yeni Zaman Dilimi Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Time Slots Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Zaman Aralığı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Şube / Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kapasite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Henüz zaman dilimi tanımlanmamış.
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatTimeRange(slot.startTime, slot.endTime)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-900 dark:text-slate-100">
                          {slot.name}
                        </span>
                        {slot.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {slot.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          {(() => {
                            const slotOfficeIds = slot.officeIds || (slot.officeId ? [slot.officeId] : []);
                            const slotSalonIds = slot.salonIds || (slot.salonId ? [slot.salonId] : []);
                            
                            if (slotOfficeIds.length === 0 && slotSalonIds.length === 0) {
                              return <span className="text-slate-400">Genel</span>;
                            }
                            
                            return (
                              <>
                                {slotOfficeIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {slotOfficeIds.map((oId, idx) => {
                                      const office = offices.find(o => o.id === oId) || slot.Ofisler;
                                      return office ? (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                                          Şube: {office.name}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                                {slotSalonIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {slotSalonIds.map((sId, idx) => {
                                      const salon = salons.find(s => s.id === sId) || slot.Subeler;
                                      return salon ? (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-medium">
                                          Salon: {salon.name}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {slot.capacity ? `${slot.capacity} kişi` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(slot)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            slot.isActive ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              slot.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(slot)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => {
                              setSlotToDelete(slot.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingSlot ? 'Zaman Dilimini Düzenle' : 'Yeni Zaman Dilimi Ekle'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Ad *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Başlangıç Saati *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Bitiş Saati *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Şubeler (Birden fazla seçebilirsiniz)
                  </label>
                  <div className="space-y-2">
                    {formData.officeIds.map((officeId, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <SearchableSelect
                          options={offices.map((office) => ({
                            id: office.id,
                            name: office.name,
                            description: office.code || '',
                          }))}
                          value={officeId}
                          onChange={(value) => {
                            const newOfficeIds = [...formData.officeIds];
                            newOfficeIds[index] = value;
                            setFormData({ ...formData, officeIds: newOfficeIds });
                            if (value) {
                              fetchSalons(value);
                            }
                          }}
                          placeholder="Şube seçiniz"
                        />
                        {formData.officeIds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOfficeIds = formData.officeIds.filter((_, i) => i !== index);
                              setFormData({ ...formData, officeIds: newOfficeIds });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, officeIds: [...formData.officeIds, ''] })}
                      className="w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      + Şube Ekle
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Salonlar (Birden fazla seçebilirsiniz)
                  </label>
                  <div className="space-y-2">
                    {formData.salonIds.map((salonId, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <SearchableSelect
                          options={salons.map((salon) => ({
                            id: salon.id,
                            name: salon.name,
                            description: salon.slug,
                          }))}
                          value={salonId}
                          onChange={(value) => {
                            const newSalonIds = [...formData.salonIds];
                            newSalonIds[index] = value;
                            setFormData({ ...formData, salonIds: newSalonIds });
                          }}
                          placeholder="Salon seçiniz"
                        />
                        {formData.salonIds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSalonIds = formData.salonIds.filter((_, i) => i !== index);
                              setFormData({ ...formData, salonIds: newSalonIds });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, salonIds: [...formData.salonIds, ''] })}
                      className="w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      disabled={formData.officeIds.length === 0}
                    >
                      + Salon Ekle
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Kapasite
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="Kişi sayısı"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSlot ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Zaman Dilimini Sil
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bu zaman dilimini silmek istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSlotToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => slotToDelete && handleDelete(slotToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil
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
