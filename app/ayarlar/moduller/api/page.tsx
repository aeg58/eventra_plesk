'use client';

import { useState, useEffect } from 'react';
import { Save, Link, Key, Webhook, CheckCircle2, XCircle } from 'lucide-react';

interface APISettings {
  apiEnabled: boolean;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  whatsappEnabled: boolean;
  whatsappApiKey?: string;
  crmEnabled: boolean;
  crmApiUrl?: string;
  crmApiKey?: string;
}

export default function EntegrasyonlarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState<APISettings>({
    apiEnabled: false,
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    whatsappEnabled: false,
    whatsappApiKey: '',
    crmEnabled: false,
    crmApiUrl: '',
    crmApiKey: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('apiSettings');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      localStorage.setItem('apiSettings', JSON.stringify(formData));
      
      setToastMessage('Entegrasyon ayarları başarıyla kaydedildi ✅');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastMessage('Bir hata oluştu ❌');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const generateAPIKey = () => {
    const key = 'evt_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData({ ...formData, apiKey: key });
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Entegrasyonlar
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          API, WhatsApp ve CRM entegrasyonlarını yapılandırın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Ayarları */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              API Ayarları
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <input
                type="checkbox"
                id="apiEnabled"
                checked={formData.apiEnabled}
                onChange={(e) => setFormData({ ...formData, apiEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="apiEnabled" className="flex-1 cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">API&apos;yi Etkinleştir</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Dış sistemlerden API erişimine izin ver
                </div>
              </label>
            </div>

            {formData.apiEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="evt_..."
                    />
                    <button
                      type="button"
                      onClick={generateAPIKey}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Oluştur
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="API secret key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* WhatsApp Entegrasyonu */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Link className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              WhatsApp Entegrasyonu
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <input
                type="checkbox"
                id="whatsappEnabled"
                checked={formData.whatsappEnabled}
                onChange={(e) => setFormData({ ...formData, whatsappEnabled: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="whatsappEnabled" className="flex-1 cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">WhatsApp Entegrasyonunu Etkinleştir</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  WhatsApp Business API entegrasyonu
                </div>
              </label>
            </div>

            {formData.whatsappEnabled && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  WhatsApp API Key
                </label>
                <input
                  type="text"
                  value={formData.whatsappApiKey}
                  onChange={(e) => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="WhatsApp Business API key"
                />
              </div>
            )}
          </div>
        </div>

        {/* CRM Entegrasyonu */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Webhook className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              CRM Entegrasyonu
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <input
                type="checkbox"
                id="crmEnabled"
                checked={formData.crmEnabled}
                onChange={(e) => setFormData({ ...formData, crmEnabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="crmEnabled" className="flex-1 cursor-pointer">
                <div className="font-medium text-slate-900 dark:text-slate-100">CRM Entegrasyonunu Etkinleştir</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Harici CRM sistemleri ile entegrasyon
                </div>
              </label>
            </div>

            {formData.crmEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CRM API URL
                  </label>
                  <input
                    type="url"
                    value={formData.crmApiUrl}
                    onChange={(e) => setFormData({ ...formData, crmApiUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://crm.example.com/api"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CRM API Key
                  </label>
                  <input
                    type="text"
                    value={formData.crmApiKey}
                    onChange={(e) => setFormData({ ...formData, crmApiKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="CRM API key"
                  />
                </div>
              </>
            )}
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
        <div className={`fixed bottom-6 right-6 ${
          toastType === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        } px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
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

