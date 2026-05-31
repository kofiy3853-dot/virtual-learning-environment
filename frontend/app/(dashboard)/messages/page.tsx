'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { communicationApi } from '@/utils/api/communicationApi';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import { 
  Search, Plus, Phone, Video, MoreVertical, Send, 
  MessageSquare, Users, Star, Info, Loader2, Sparkles, Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  _id: string;
  lastMessage: string;
  createdAt: string;
  unreadCount: number;
  user: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  body: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'direct' | 'courses'>('direct');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Fetch conversations and courses on mount
  useEffect(() => {
    Promise.all([
      communicationApi.getConversations().then(res => setConversations(res.data.data)),
      user?.role === 'student' ? courseApi.getMyCourses().then(res => setCourses(res.data.data)) : courseApi.getAll().then(res => setCourses(res.data.data))
    ]).finally(() => setLoading(false));
  }, [user?.role]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (activeChat) {
      if (activeTab === 'direct') {
        communicationApi.getMessages(activeChat)
          .then(res => setMessages(res.data.data));
      } else {
        communicationApi.getCourseMessages(activeChat)
          .then(res => setMessages(res.data.data));
      }
    }
  }, [activeChat, activeTab]);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    interface IncomingMessage {
      senderId: string;
      body: string;
      createdAt: string;
    }

    socket.on('new_message', (msg: IncomingMessage) => {
      // If message is from the active chat, add it
      if (activeChat === msg.senderId || (activeTab === 'courses' && activeChat === (msg as any).courseId)) {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          sender: msg.senderId || (msg as any).sender?._id,
          receiver: user?._id || '',
          body: msg.body,
          createdAt: msg.createdAt
        }]);
      }
      
      // Update conversations list
      if (activeTab === 'direct') {
        communicationApi.getConversations().then(res => setConversations(res.data.data));
      }
    });

    socket.on('new_course_message', (msg: any) => {
      if (activeTab === 'courses' && activeChat === msg.course) {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          sender: msg.sender, // Backend populates this or we just use it
          receiver: '',
          body: msg.body,
          createdAt: msg.createdAt
        }]);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('new_course_message');
    };
  }, [socket, activeChat, activeTab, user?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || !socket) return;

    if (activeTab === 'direct') {
      socket.emit('send_message', {
        receiverId: activeChat,
        body: messageText.trim()
      });

      // Optimistically add to UI
      const newMsg: Message = {
        _id: Date.now().toString(),
        sender: user?._id || '',
        receiver: activeChat,
        body: messageText.trim(),
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);

      // Update conversations last message optimistically
      setConversations(prev => {
        const updated = prev.map(c => 
          c.user._id === activeChat 
            ? { ...c, lastMessage: messageText.trim(), createdAt: new Date().toISOString() } 
            : c
        );
        return updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    } else {
      socket.emit('send_course_message', {
        courseId: activeChat,
        body: messageText.trim()
      });

      // Optimistically add to UI
      const newMsg: Message = {
        _id: Date.now().toString(),
        sender: user?._id || '', // we are the sender
        receiver: '',
        body: messageText.trim(),
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
    }

    setMessageText('');
  };

  const activeConv = conversations.find(c => c.user._id === activeChat);
  const activeCourseConv = courses.find(c => c._id === activeChat);
  
  const filteredConversations = conversations.filter(c => 
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex w-full h-[calc(100vh-8rem)] bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden">
          
          {/* Chat List Sidebar */}
          <div className="w-80 border-r border-slate-100 flex flex-col bg-[#FDFDFD] shrink-0">
            {/* Header */}
            <div className="p-8 pb-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Messages.</h1>
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Social Pulse Active</p>
                </div>
                <button 
                  title="New Conversation"
                  aria-label="Start a new conversation"
                  className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-90"
                >
                  <Plus size={24} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => { setActiveTab('direct'); setActiveChat(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'direct' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => { setActiveTab('courses'); setActiveChat(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'courses' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Channels
                </button>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'direct' ? 'interactions' : 'channels'}...`}
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 pl-12 pr-4 h-14 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all font-bold text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="space-y-4 p-4">
                   {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                </div>
              ) : activeTab === 'direct' ? (
                filteredConversations.length > 0 ? (
                  filteredConversations.map(conv => {
                  const isOnline = onlineUsers.includes(conv.user._id);
                  const isActive = activeChat === conv.user._id;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveChat(conv.user._id)}
                      className={`w-full text-left p-4 rounded-3xl flex gap-4 items-center transition-all group relative overflow-hidden ${
                        isActive 
                          ? 'bg-blue-600 shadow-xl shadow-blue-600/20' 
                          : 'hover:bg-white border-2 border-transparent hover:border-slate-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                        }`}>
                          {conv.user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {isOnline && (
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 ${
                            isActive ? 'border-blue-600 bg-emerald-400' : 'border-white bg-emerald-500 shadow-sm'
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-black text-sm truncate ${
                            isActive ? 'text-white' : 'text-slate-900'
                          }`}>
                            {conv.user.name}
                          </span>
                          <span className={`text-[9px] font-black tracking-widest shrink-0 ${
                            isActive ? 'text-blue-200' : 'text-slate-400'
                          }`}>
                            {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: false })}
                          </span>
                        </div>
                        <p className={`text-xs truncate font-medium ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {conv.lastMessage}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && !isActive && (
                        <span className="w-6 h-6 flex items-center justify-center rounded-xl bg-blue-600 text-white text-[10px] font-black shadow-lg shadow-blue-600/20 border-2 border-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-20 text-center px-8">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <MessageSquare size={32} />
                   </div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Interactions Found</p>
                </div>
              )
              ) : (
                filteredCourses.length > 0 ? (
                  filteredCourses.map(course => {
                    const isActive = activeChat === course._id;
                    return (
                      <button
                        key={course._id}
                        onClick={() => setActiveChat(course._id)}
                        className={`w-full text-left p-4 rounded-3xl flex gap-4 items-center transition-all group relative overflow-hidden ${
                          isActive 
                            ? 'bg-blue-600 shadow-xl shadow-blue-600/20' 
                            : 'hover:bg-white border-2 border-transparent hover:border-slate-100 hover:shadow-sm'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                          }`}>
                            <Hash size={24} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-black text-sm truncate ${
                              isActive ? 'text-white' : 'text-slate-900'
                            }`}>
                              {course.title}
                            </span>
                          </div>
                          <p className={`text-xs truncate font-medium ${
                            isActive ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {course.code} Channel
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-20 text-center px-8">
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <Hash size={32} />
                     </div>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Channels Found</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            {activeChat && (activeConv || activeCourseConv) ? (
              <>
                {/* Chat Header */}
                <div className="h-24 px-10 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0 z-10 relative">
                  <div className="flex items-center gap-5">
                    {activeTab === 'direct' && activeConv ? (
                      <>
                        <div className="relative">
                          <div className="w-14 h-14 rounded-[20px] bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-sm border border-blue-100">
                            {activeConv.user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {onlineUsers.includes(activeConv.user._id) && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                          )}
                        </div>
                        <div>
                          <h2 className="font-black text-slate-900 text-xl flex items-center gap-3">
                            {activeConv.user.name}
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                              {activeConv.user.role}
                            </span>
                          </h2>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${onlineUsers.includes(activeConv.user._id) ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {onlineUsers.includes(activeConv.user._id) ? 'Live Intelligence' : 'Offline'}
                          </p>
                        </div>
                      </>
                    ) : activeTab === 'courses' && activeCourseConv ? (
                      <>
                        <div className="relative">
                          <div className="w-14 h-14 rounded-[20px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shadow-sm border border-indigo-100">
                            <Hash size={24} />
                          </div>
                        </div>
                        <div>
                          <h2 className="font-black text-slate-900 text-xl flex items-center gap-3">
                            {activeCourseConv.title}
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                              {activeCourseConv.code}
                            </span>
                          </h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Group Channel</p>
                        </div>
                      </>
                    ) : null}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      title="Voice Call"
                      aria-label="Start voice call"
                      className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
                    >
                      <Phone size={20} />
                    </button>
                    <button 
                      title="Video Call"
                      aria-label="Start video call"
                      className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
                    >
                      <Video size={20} />
                    </button>
                    <button 
                      title="More Options"
                      aria-label="More conversation options"
                      className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-10 bg-[#FDFDFD] flex flex-col gap-8 custom-scrollbar">
                  <div className="flex flex-col items-center mb-4">
                     <div className="px-4 py-2 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        End-to-End Encryption Active
                     </div>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                      // Depending on activeTab, sender could be a string or an object populated by backend
                      const senderObj = typeof msg.sender === 'object' ? (msg.sender as any) : null;
                      const senderId = senderObj ? senderObj._id : msg.sender;
                      
                      const isMe = senderId === user?._id;
                      const showTime = idx === messages.length - 1 || (
                        typeof messages[idx+1]?.sender === 'object' 
                          ? (messages[idx+1].sender as any)._id !== senderId 
                          : messages[idx+1]?.sender !== msg.sender
                      );

                      return (
                        <motion.div 
                          key={msg._id}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-2`}>
                            {/* For group messages, show sender name if not me */}
                            {activeTab === 'courses' && !isMe && senderObj && (
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                                 {senderObj.name}
                               </span>
                            )}
                            <div className={`px-6 py-4 text-sm leading-relaxed shadow-xl shadow-slate-900/5 ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-[32px] rounded-br-[8px]' 
                                : 'bg-white text-slate-700 rounded-[32px] rounded-bl-[8px] border border-slate-100'
                            }`}>
                              {msg.body}
                            </div>
                            {showTime && (
                              <span className="text-[9px] font-black text-slate-400 px-4 tracking-[0.2em] uppercase">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={endRef} />
                </div>

                {/* Chat Input */}
                <div className="p-8 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSend} className="flex gap-4 relative">
                    <button 
                      type="button" 
                      title="Attach File"
                      aria-label="Attach academic material"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all shrink-0"
                    >
                      <Plus size={24} />
                    </button>
                    <input
                      type="text"
                      placeholder="Enter a strategic message..."
                      className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 pl-20 pr-4 h-16 rounded-[24px] focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 outline-none transition-all font-bold shadow-sm"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      title="Send Message"
                      aria-label="Transmit message"
                      disabled={!messageText.trim()} 
                      className="w-16 h-16 rounded-[24px] bg-blue-600 text-white cursor-pointer flex items-center justify-center shadow-2xl shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all active:scale-90 shrink-0"
                    >
                      <Send size={24} className="ml-1" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFDFD]">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                   <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center border border-slate-100 shadow-2xl mb-10 relative">
                      <div className="absolute inset-0 bg-blue-600/5 rounded-[40px] blur-2xl" />
                      <Sparkles size={56} className="text-blue-200 relative z-10" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Initialize Pulse.</h3>
                   <p className="text-slate-400 font-medium text-lg max-w-xs text-center leading-relaxed">
                     Select an academic interaction from the sidebar to engage in real-time collaboration.
                   </p>
                </motion.div>
              </div>
            )}
          </div>
      </div>
  );
}
