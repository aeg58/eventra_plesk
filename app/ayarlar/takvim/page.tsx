'use client';

import { useState, useEffect } from 'react';
import { Save, Calendar, Clock, Eye } from 'lucide-react';

interface CalendarSettings {
  defaultView: string;
  weekStartDay: string;
  showWeekends: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  slotDuration: number;
  slotLabelInterval: number;
  firstDayOfWeek: number;
  showTimeSlots: boolean;
  defaultDateRange: number;
}

export default function TakvimAyarlari() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState<CalendarSettings>({
    defaultView: 'month',
    weekStartDay: 'monday',
    showWeekends: true,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    slotDuration: 30,
    slotLabelInterval: 60,
    firstDayOfWeek: 1,
    showTimeSlots: true,
    defaultDateRange: 30,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/ayarlar/takvim', {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setFormData({
            defaultView: data.settings.defaultView || 'month',
            weekStartDay: data.settings.weekStartDay || 'monday',
            showWeekends: data.settings.showWeekends !== undefined ? data.settings.showWeekends : true,
            businessHoursStart: data.settings.businessHoursStart || '09:00',
            businessHoursEnd: data.settings.businessHoursEnd || '18:00',
            slotDuration: data.settings.slotDuration || 30,
            slotLabelInterval: data.settings.slotLabelInterval || 60,
            firstDayOfWeek: data.settings.firstDayOfWeek || 1,
            showTimeSlots: data.settings.showTimeSlots !== undefined ? data.settings.showTimeSlots : true,
            defaultDateRange: data.settings.defaultDateRange || 30,
          });
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
      
      const res = await fetch('/eventra/api/ayarlar/takvim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage('Takvim ayarları başarıyla kaydedildi ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        // Sayfayı yenile ki değişiklikler uygulanabilsin
        window.location.reload();
      } else {
        setToastMessage(data.error || 'Ayarlar kaydedilemedi ❌');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error: any) {
      setToastMessage('Bir hata oluştu ❌');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
          Takvim Ayarları
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Takvim görünümü ve davranış ayarlarını yapılandırın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Görünüm Ayarları */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Görünüm Ayarları
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Varsayılan Görünüm
              </label>
              <select
                value={formData.defaultView}
                onChange={(e) => setFormData({ ...formData, defaultView: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="month">Ay</option>
                <option value="week">Hafta</option>
                <option value="day">Gün</option>
                <option value="agenda">Ajanda</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hafta Başlangıç Günü
              </label>
              <select
                value={formData.weekStartDay}
                onChange={(e) => setFormData({ ...formData, weekStartDay: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="monday">Pazartesi</option>
                <option value="sunday">Pazar</option>
                <option value="saturday">Cumartesi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Varsayılan Tarih Aralığı (Gün)
              </label>
              <input
                type="number"
                value={formData.defaultDateRange}
                onChange={(e) => setFormData({ ...formData, defaultDateRange: parseInt(e.target.value) || 30 })}
                min={7}
                max={365}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="showWeekends"
                checked={formData.showWeekends}
                onChange={(e) => setFormData({ ...formData, showWeekends: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="showWeekends" className="cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">Hafta Sonlarını Göster</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Cumartesi ve Pazar günlerini takvimde göster
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Zaman Ayarları */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Zaman Ayarları
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                İş Saatleri Başlangıç
              </label>
              <input
                type="time"
                value={formData.businessHoursStart}
                onChange={(e) => setFormData({ ...formData, businessHoursStart: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                İş Saatleri Bitiş
              </label>
              <input
                type="time"
                value={formData.businessHoursEnd}
                onChange={(e) => setFormData({ ...formData, businessHoursEnd: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Slot Süresi (Dakika)
              </label>
              <select
                value={formData.slotDuration}
                onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="15">15 dakika</option>
                <option value="30">30 dakika</option>
                <option value="60">1 saat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Etiket Aralığı (Dakika)
              </label>
              <select
                value={formData.slotLabelInterval}
                onChange={(e) => setFormData({ ...formData, slotLabelInterval: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="30">30 dakika</option>
                <option value="60">1 saat</option>
                <option value="120">2 saat</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="showTimeSlots"
                checked={formData.showTimeSlots}
                onChange={(e) => setFormData({ ...formData, showTimeSlots: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="showTimeSlots" className="cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">Zaman Dilimlerini Göster</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Takvimde zaman dilimlerini göster
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
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

