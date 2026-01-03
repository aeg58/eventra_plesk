'use client';

import { useState } from 'react';

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
}

interface Message {
  id: string;
  message: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read';
  automated: boolean;
}

export default function WhatsAppAIPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Mock conversations - Supabase'den çekilecek
  const conversations: Conversation[] = [
    {
      id: '1',
      customerName: 'Ayşe Yılmaz',
      customerPhone: '+90 532 123 4567',
      lastMessage: 'Merhaba, düğün rezervasyonu için bilgi almak istiyorum.',
      timestamp: '14:30',
      unreadCount: 2
    },
    {
      id: '2',
      customerName: 'Mehmet Demir',
      customerPhone: '+90 535 987 6543',
      lastMessage: 'Fiyat listesi alabilir miyim?',
      timestamp: '15:15',
      unreadCount: 0
    },
    {
      id: '3',
      customerName: 'Zeynep Kaya',
      customerPhone: '+90 538 456 7890',
      lastMessage: 'Rezervasyonumu iptal etmek istiyorum.',
      timestamp: '16:45',
      unreadCount: 1
    },
    {
      id: '4',
      customerName: 'Ali Veli',
      customerPhone: '+90 542 111 2222',
      lastMessage: 'Teşekkür ederim, bilgi için.',
      timestamp: 'Dün',
      unreadCount: 0
    }
  ];

  // Mock messages - Seçili konuşmaya ait mesajlar
  const messagesData: { [key: string]: Message[] } = {
    '1': [
      {
        id: '1',
        message: 'Merhaba, düğün rezervasyonu için bilgi almak istiyorum.',
        timestamp: '14:30',
        direction: 'incoming',
        status: 'read',
        automated: false
      },
      {
        id: '2',
        message: 'Merhaba! Düğün rezervasyonu için size yardımcı olabilirim. Hangi tarih için düşünüyorsunuz?',
        timestamp: '14:31',
        direction: 'outgoing',
        status: 'read',
        automated: true
      },
      {
        id: '3',
        message: 'Haziran ayında düşünüyoruz. Salon kapasitesi ne kadar?',
        timestamp: '14:35',
        direction: 'incoming',
        status: 'read',
        automated: false
      },
      {
        id: '4',
        message: 'Ana salonumuz 150-200 kişilik, küçük salonumuz ise 80-100 kişiliktir. Detaylı bilgi için: https://eventra.com/salonlar',
        timestamp: '14:36',
        direction: 'outgoing',
        status: 'delivered',
        automated: true
      }
    ],
    '2': [
      {
        id: '1',
        message: 'Fiyat listesi alabilir miyim?',
        timestamp: '15:15',
        direction: 'incoming',
        status: 'delivered',
        automated: false
      },
      {
        id: '2',
        message: 'Tabii! Salonlarımızın güncel fiyat listesi: https://eventra.com/fiyatlar',
        timestamp: '15:16',
        direction: 'outgoing',
        status: 'delivered',
        automated: true
      }
    ],
    '3': [
      {
        id: '1',
        message: 'Rezervasyonumu iptal etmek istiyorum.',
        timestamp: '16:45',
        direction: 'incoming',
        status: 'sent',
        automated: false
      }
    ]
  };

  const filteredConversations = conversations.filter(conv =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerPhone.includes(searchQuery) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const messages = selectedConversation ? messagesData[selectedConversation] || [] : [];

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)]">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          WhatsApp Mesaj Takibi
        </h2>
      </div>

      {/* Two Panel Layout - WhatsApp Style */}
      <div className="flex gap-1 h-[calc(100%-60px)] bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden shadow-lg">
        {/* Left Panel - Conversations List */}
        <div className={`w-full md:w-[380px] bg-white dark:bg-slate-900 md:border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Ara veya yeni sohbet başlat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">Konuşma bulunamadı</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${
                    selectedConversation === conv.id ? 'bg-slate-100 dark:bg-slate-800' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 dark:text-green-400 font-semibold text-lg">
                      {conv.customerName.charAt(0)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {conv.customerName}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-500 flex-shrink-0 ml-2">
                        {conv.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className={`flex-1 bg-[#e5ddd5] dark:bg-slate-950 bg-opacity-40 flex flex-col ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                {/* Geri Butonu - Sadece Mobil */}
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors -ml-2"
                  aria-label="Geri"
                >
                  <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <span className="text-green-700 dark:text-green-400 font-semibold">
                    {selectedConv.customerName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedConv.customerName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedConv.customerPhone}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-500">Henüz mesaj yok</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[65%] rounded-lg px-3 py-2 ${
                          msg.direction === 'outgoing'
                            ? 'bg-[#d9fdd3] dark:bg-green-900/30'
                            : 'bg-white dark:bg-slate-800'
                        }`}
                      >
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          {msg.message}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {msg.automated && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 mr-1">
                              AI
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 dark:text-slate-500">
                            {msg.timestamp}
                          </span>
                          {msg.direction === 'outgoing' && (
                            <span className="text-slate-500 dark:text-slate-500">
                              {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info Banner */}
              <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 px-4 py-2">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    Bu konuşmalar gerçek zamanlı otomatik olarak çekilmektedir
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-20 h-20 text-slate-300 dark:text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400">Bir konuşma seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
