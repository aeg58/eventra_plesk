'use client';

import { useState, useEffect } from 'react';
import { Save, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

interface SMSSettings {
  id?: string;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  senderNumber?: string;
  senderName?: string;
  isActive: boolean;
}

export default function SMSAyarlariPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState<SMSSettings>({
    provider: 'manual',
    apiKey: '',
    apiSecret: '',
    senderNumber: '',
    senderName: '',
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/iletisim/sms', {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setFormData({
            ...data.settings,
            apiSecret: data.settings.apiSecret || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/eventra/api/iletisim/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage('SMS ayarları başarıyla kaydedildi ✅');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setFormData(prev => ({ ...prev, apiSecret: data.settings?.apiSecret || '' }));
      } else {
        setToastMessage(data.error || 'Ayarlar kaydedilemedi ❌');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error: any) {
      setToastMessage('Bir hata oluştu ❌');
      setToastType('error');
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
          SMS Ayarları
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          SMS gönderimi için sağlayıcı ayarlarını yapılandırın
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            SMS Sağlayıcı *
          </label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          >
            <option value="manual">Manuel (API Yok)</option>
            <option value="twilio">Twilio</option>
            <option value="netgsm">NetGSM</option>
            <option value="iletimerkezi">İleti Merkezi</option>
            <option value="mutlucell">MutluCell</option>
          </select>
        </div>

        {formData.provider !== 'manual' && (
          <>
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="API anahtarı"
              />
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Şifreyi değiştirmek istemiyorsanız boş bırakın"
              />
            </div>

            {/* Sender Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gönderen Numara
              </label>
              <input
                type="text"
                value={formData.senderNumber}
                onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="905551234567"
              />
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gönderen İsim
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Eventra"
                maxLength={11}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Maksimum 11 karakter (SMS başlığı)
              </p>
            </div>
          </>
        )}

        {/* Active */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="cursor-pointer">
            <div className="font-medium text-slate-900 dark:text-slate-100">Aktif</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              SMS gönderimlerini etkinleştir
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 İpuçları
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>• Manuel mod seçildiğinde SMS gönderimi yapılmaz</li>
          <li>• API bilgilerinizi güvenli tutun</li>
          <li>• Gönderen numara formatı: 905551234567 (ülke kodu ile)</li>
          <li>• Gönderen isim maksimum 11 karakter olmalıdır</li>
        </ul>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-6 right-6 ${
          toastType === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        } px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {toastMessage}
        </div>
      )}
    </div>
  );
}

