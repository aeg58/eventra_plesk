'use client';

import { useState } from 'react';
import { Send, Users, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

export default function TopluSMSPage() {
  const [sending, setSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    recipients: '',
    message: '',
    senderName: '',
    sendNow: true,
    scheduledDate: '',
    scheduledTime: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      
      // TODO: API endpoint'e gönder
      // const res = await fetch('/eventra/api/iletisim/toplu-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // Simüle edilmiş başarı
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setToastMessage('Toplu SMS başarıyla gönderildi ✅');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Formu temizle
      setFormData({
        recipients: '',
        message: '',
        senderName: '',
        sendNow: true,
        scheduledDate: '',
        scheduledTime: '',
      });
    } catch (error: any) {
      setToastMessage('SMS gönderilirken bir hata oluştu ❌');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSending(false);
    }
  };

  const recipientCount = formData.recipients.split('\n').filter(r => r.trim()).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Toplu SMS Gönder
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Birden fazla numaraya aynı anda SMS gönderin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Alıcı Numaralar *
          </label>
          <textarea
            value={formData.recipients}
            onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
            rows={8}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
            placeholder="Her satıra bir numara yazın:&#10;905551234567&#10;905559876543&#10;905551112233"
            required
          />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {recipientCount} alıcı seçildi • Format: 905551234567 (ülke kodu ile)
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Mesaj İçeriği *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={6}
            maxLength={160}
            className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="SMS mesajınızı buraya yazın..."
            required
          />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {formData.message.length}/160 karakter
          </p>
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

        {/* Schedule */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <input
            type="checkbox"
            id="sendNow"
            checked={formData.sendNow}
            onChange={(e) => setFormData({ ...formData, sendNow: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="sendNow" className="flex-1 cursor-pointer">
            <div className="font-medium text-slate-900 dark:text-slate-100">Hemen Gönder</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mesajı hemen gönder, zamanlama yapma
            </div>
          </label>
        </div>

        {!formData.sendNow && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Planlanan Tarih
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required={!formData.sendNow}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Planlanan Saat
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required={!formData.sendNow}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={sending || recipientCount === 0}
            className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Gönderiliyor...' : formData.sendNow ? 'SMS Gönder' : 'Zamanla'}
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          ⚠️ Dikkat
        </h3>
        <ul className="space-y-2 text-yellow-800 dark:text-yellow-200 text-sm">
          <li>• Toplu SMS gönderimi ücretlidir</li>
          <li>• Mesaj içeriği maksimum 160 karakter olmalıdır</li>
          <li>• Numara formatı: 905551234567 (ülke kodu ile başlamalı)</li>
          <li>• Gönderim öncesi numaraları kontrol edin</li>
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

