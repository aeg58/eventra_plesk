'use client';

import { useState, useEffect } from 'react';
import { Mail, Save, TestTube, CheckCircle2, XCircle } from 'lucide-react';

interface EmailSettings {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  useSendmail: boolean;
  isActive: boolean;
}

export default function EmailAyarlariPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState<EmailSettings>({
    host: '',
    port: 25,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'Eventra',
    useSendmail: false,
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/iletisim/email', {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setFormData({
            ...data.settings,
            password: data.settings.password || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/eventra/api/iletisim/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage('E-posta ayarları başarıyla kaydedildi ✅');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        // Şifreyi gizle
        setFormData(prev => ({ ...prev, password: data.settings?.password || '' }));
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

  const handleTestEmail = async () => {
    try {
      setTesting(true);
      const res = await fetch('/eventra/api/iletisim/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.fromEmail, // Kendi e-postasına test gönder
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage('Test e-postası gönderildi ✅');
        setToastType('success');
      } else {
        setToastMessage(data.error || 'Test e-postası gönderilemedi ❌');
        setToastType('error');
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      setToastMessage('Test e-postası gönderilirken bir hata oluştu ❌');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setTesting(false);
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
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          E-posta Ayarları
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          SMTP ayarlarını yapılandırın ve test edin
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {/* Sendmail Option */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <input
            type="checkbox"
            id="useSendmail"
            checked={formData.useSendmail}
            onChange={(e) => setFormData({ ...formData, useSendmail: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="useSendmail" className="flex-1 cursor-pointer">
            <div className="font-medium text-slate-900 dark:text-slate-100">Sendmail Kullan</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Sunucunuzda sendmail yüklüyse bu seçeneği işaretleyin (Plesk için önerilir)
            </div>
          </label>
        </div>

        {!formData.useSendmail && (
          <>
            {/* SMTP Host */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                SMTP Sunucu (Host) *
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="smtp.example.com"
                required
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 25 })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Secure */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="secure"
                checked={formData.secure}
                onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="secure" className="cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">Güvenli Bağlantı (SSL/TLS)</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Genellikle port 465 veya 587 için kullanılır
                </div>
              </label>
            </div>

            {/* User */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kullanıcı Adı (E-posta) *
              </label>
              <input
                type="email"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="eventra@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Şifreyi değiştirmek istemiyorsanız boş bırakın"
              />
            </div>
          </>
        )}

        {/* From Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Gönderen E-posta Adresi *
          </label>
          <input
            type="email"
            value={formData.fromEmail}
            onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="eventra@example.com"
            required
          />
        </div>

        {/* From Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Gönderen İsim
          </label>
          <input
            type="text"
            value={formData.fromName}
            onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Eventra"
          />
        </div>

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
              E-posta gönderimlerini etkinleştir
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testing || !formData.fromEmail}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="w-5 h-5" />
            {testing ? 'Gönderiliyor...' : 'Test E-postası Gönder'}
          </button>
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
          <li>• Gmail için: smtp.gmail.com, port 587, SSL aktif</li>
          <li>• Outlook için: smtp-mail.outlook.com, port 587, SSL aktif</li>
          <li>• Plesk sunucularda genellikle sendmail kullanılır</li>
          <li>• Test e-postası göndererek ayarlarınızı doğrulayabilirsiniz</li>
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

