'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Search, Plus, Phone, Video, MoreVertical, Send, 
  MessageSquare, Users, Star, Info
} from 'lucide-react';

const CHATS = [
  { id: '1', name: 'Prof. Alan Turing', avatar: 'AT', lastMessage: 'The assignment looks good!', time: '10:42 AM', unread: 2, online: true, role: 'teacher' },
  { id: '2', name: 'Physics Study Group', avatar: 'PG', lastMessage: 'When is the next lab session?', time: '9:15 AM', unread: 0, online: false, role: 'group' },
  { id: '3', name: 'Alice Smith', avatar: 'AS', lastMessage: 'Can you help me with the setup?', time: 'Yesterday', unread: 5, online: true, role: 'student' },
  { id: '4', name: 'Course Support', avatar: 'CS', lastMessage: 'Ticket #42 has been resolved.', time: 'Monday', unread: 0, online: false, role: 'admin' },
];

const MESSAGES: Record<string, { id: number; sender: 'me' | 'them'; text: string; time: string }[]> = {
  '1': [
    { id: 1, sender: 'them', text: 'Hi! Have you had a chance to look at the Physics assignment?', time: '10:30 AM' },
    { id: 2, sender: 'me',   text: 'Yes, I just finished reading through the requirements.', time: '10:35 AM' },
    { id: 3, sender: 'them', text: 'Great! The assignment looks good. Just make sure to include the diagrams for Chapter 4.', time: '10:42 AM' },
  ],
  '2': [
    { id: 1, sender: 'them', text: 'Hey team, when is the next lab session?', time: '9:10 AM' },
    { id: 2, sender: 'me',   text: 'I think it\'s on Thursday at 2 PM.', time: '9:15 AM' },
  ],
  '3': [
    { id: 1, sender: 'them', text: 'Hi! Can you help me with the environment setup for the project?', time: 'Yesterday' },
  ],
  '4': [
    { id: 1, sender: 'them', text: 'Your support ticket #42 regarding course access has been resolved.', time: 'Monday' },
    { id: 2, sender: 'me',   text: 'Thank you, I can access the course now!', time: 'Monday' },
  ],
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [activeChat, setActiveChat]     = useState<string | null>('1');
  const [message, setMessage]           = useState('');
  const [allMessages, setAllMessages]   = useState(MESSAGES);
  const [search, setSearch]             = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const activeContact = CHATS.find(c => c.id === activeChat);
  const currentMessages = activeChat ? (allMessages[activeChat] || []) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;
    const newMsg = { id: Date.now(), sender: 'me' as const, text: message.trim(), time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    setAllMessages(p => ({ ...p, [activeChat]: [...(p[activeChat] || []), newMsg] }));
    setMessage('');
  };

  const filteredChats = CHATS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex p-6 lg:p-8 h-full min-w-0">
        <div className="flex w-full h-full bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Chat List Sidebar */}
          <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Messages</h1>
                <button className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
                  <Plus size={20} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full bg-white border border-slate-200 text-slate-900 pl-11 pr-4 h-12 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-none">
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full text-left p-3 rounded-2xl flex gap-3 items-center transition-all group relative overflow-hidden ${
                    activeChat === chat.id 
                      ? 'bg-blue-600 shadow-md shadow-blue-600/20' 
                      : 'hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                      activeChat === chat.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100'
                    }`}>
                      {chat.avatar}
                    </div>
                    {chat.online && (
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${
                        activeChat === chat.id ? 'border-blue-600 bg-emerald-400' : 'border-white bg-emerald-500'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`font-bold text-sm truncate ${
                        activeChat === chat.id ? 'text-white' : 'text-slate-900'
                      }`}>
                        {chat.name}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider shrink-0 ${
                        activeChat === chat.id ? 'text-blue-200' : 'text-slate-400'
                      }`}>
                        {chat.time}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${
                      activeChat === chat.id ? 'text-blue-100' : 'text-slate-500 font-medium'
                    }`}>
                      {chat.lastMessage}
                    </p>
                  </div>

                  {chat.unread > 0 && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      activeChat === chat.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white shadow-sm shadow-red-500/20'
                    }`}>
                      {chat.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            {activeChat && activeContact ? (
              <>
                {/* Chat Header */}
                <div className="h-20 px-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10 relative">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shadow-sm border border-indigo-100">
                        {activeContact.avatar}
                      </div>
                      {activeContact.online && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        {activeContact.name}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                          {activeContact.role}
                        </span>
                      </h2>
                      <p className={`text-xs font-bold ${activeContact.online ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {activeContact.online ? 'Online now' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Phone size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Video size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors">
                      <Info size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 flex flex-col gap-6">
                  <AnimatePresence initial={false}>
                    {currentMessages.map(msg => {
                      const isMe = msg.sender === 'me';
                      return (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5`}>
                            <div className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-[24px] rounded-br-[8px]' 
                                : 'bg-white text-slate-700 rounded-[24px] rounded-bl-[8px] border border-slate-200'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 px-2 tracking-wide uppercase">
                              {msg.time}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={endRef} />
                </div>

                {/* Chat Input */}
                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSend} className="flex gap-3 relative">
                    <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
                      <Plus size={20} />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-16 pr-4 h-14 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium shadow-sm"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={!message.trim()} 
                      className="w-14 h-14 rounded-2xl bg-blue-600 text-white border-none cursor-pointer flex items-center justify-center shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all shrink-0"
                    >
                      <Send size={20} className="ml-1" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-sm mb-6">
                  <MessageSquare size={40} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Select a conversation</h3>
                <p className="text-slate-500 font-medium">Choose a contact from the sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
