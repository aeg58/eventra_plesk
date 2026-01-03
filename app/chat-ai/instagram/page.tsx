'use client';

import { useState } from 'react';

interface Conversation {
  id: string;
  username: string;
  fullName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  type: 'dm' | 'story_reply';
}

interface Message {
  id: string;
  message: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  type: 'dm' | 'story_reply' | 'comment';
  automated: boolean;
}

export default function InstagramAIPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'general'>('primary');

  // Mock conversations - Supabase'den çekilecek
  const conversations: Conversation[] = [
    {
      id: '1',
      username: 'ayse.yilmaz',
      fullName: 'Ayşe Yılmaz',
      lastMessage: 'Merhaba, düğün organizasyonu için bilgi alabilir miyim?',
      timestamp: '14:30',
      unreadCount: 2,
      type: 'dm'
    },
    {
      id: '2',
      username: 'mehmet_demir',
      fullName: 'Mehmet Demir',
      lastMessage: 'Çok güzel bir mekan! 😍',
      timestamp: '15:15',
      unreadCount: 0,
      type: 'story_reply'
    },
    {
      id: '3',
      username: 'zeynep.kaya',
      fullName: 'Zeynep Kaya',
      lastMessage: 'Harika bir etkinlikti! 🎉',
      timestamp: '16:45',
      unreadCount: 1,
      type: 'dm'
    },
    {
      id: '4',
      username: 'ali_veli',
      fullName: 'Ali Veli',
      lastMessage: 'Fiyatlar ne kadar?',
      timestamp: 'Dün',
      unreadCount: 0,
      type: 'dm'
    }
  ];

  // Mock messages - Seçili konuşmaya ait mesajlar
  const messagesData: { [key: string]: Message[] } = {
    '1': [
      {
        id: '1',
        message: 'Merhaba, düğün organizasyonu için bilgi alabilir miyim?',
        timestamp: '14:30',
        direction: 'incoming',
        type: 'dm',
        automated: false
      },
      {
        id: '2',
        message: 'Merhaba! 👋 Tabii ki! Düğün organizasyonlarımız hakkında detaylı bilgi için: https://eventra.com/dugun',
        timestamp: '14:31',
        direction: 'outgoing',
        type: 'dm',
        automated: true
      },
      {
        id: '3',
        message: 'Teşekkür ederim, web sitenize bakacağım ✨',
        timestamp: '14:35',
        direction: 'incoming',
        type: 'dm',
        automated: false
      }
    ],
    '2': [
      {
        id: '1',
        message: 'Çok güzel bir mekan! 😍',
        timestamp: '15:15',
        direction: 'incoming',
        type: 'story_reply',
        automated: false
      },
      {
        id: '2',
        message: 'Teşekkür ederiz! ✨ Siz de yakından görmek isterseniz randevu alabilirsiniz: https://eventra.com/randevu',
        timestamp: '15:16',
        direction: 'outgoing',
        type: 'story_reply',
        automated: true
      }
    ],
    '3': [
      {
        id: '1',
        message: 'Harika bir etkinlikti! 🎉',
        timestamp: '16:45',
        direction: 'incoming',
        type: 'dm',
        automated: false
      }
    ]
  };

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const messages = selectedConversation ? messagesData[selectedConversation] || [] : [];

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)]">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Instagram Mesaj Takibi
        </h2>
      </div>

      {/* Two Panel Layout - Instagram Style */}
      <div className="flex gap-0 h-[calc(100%-60px)] bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        {/* Left Panel - Conversations List */}
        <div className={`w-full md:w-[380px] md:border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mesajlar</h3>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex gap-4">
            <button
              onClick={() => setActiveTab('primary')}
              className={`text-sm font-medium pb-2 ${
                activeTab === 'primary'
                  ? 'text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100'
                  : 'text-slate-500 dark:text-slate-500'
              }`}
            >
              Primary
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`text-sm font-medium pb-2 ${
                activeTab === 'general'
                  ? 'text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100'
                  : 'text-slate-500 dark:text-slate-500'
              }`}
            >
              General
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Ara"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-pink-500 outline-none"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">Mesaj bulunamadı</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    selectedConversation === conv.id ? 'bg-slate-50 dark:bg-slate-800' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {conv.username.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {conv.username}
                      </h4>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {conv.lastMessage}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-500 flex-shrink-0 ml-2">
                        {conv.timestamp}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className={`flex-1 flex flex-col ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
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
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {selectedConv.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedConv.username}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedConv.fullName}
                  </p>
                </div>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm text-slate-500">Henüz mesaj yok</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[65%] rounded-2xl px-4 py-2 ${
                          msg.direction === 'outgoing'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <p className="text-sm break-words">
                          {msg.message}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {msg.automated && (
                            <span className={`text-[10px] mr-1 ${
                              msg.direction === 'outgoing' ? 'text-white/80' : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              AI
                            </span>
                          )}
                          <span className={`text-[10px] ${
                            msg.direction === 'outgoing' ? 'text-white/80' : 'text-slate-500 dark:text-slate-500'
                          }`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info Banner */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-t border-pink-200 dark:border-pink-800 px-4 py-2">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-xs text-pink-800 dark:text-pink-200">
                    Bu konuşmalar gerçek zamanlı otomatik olarak çekilmektedir
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Mesajların
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Bir sohbet başlatmak için bir konuşma seçin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
