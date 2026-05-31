'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, Bot, User as UserIcon, Loader2, ArrowRight, 
  HelpCircle, Compass, Terminal, FileText, CheckCircle2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import tutoringApi from '@/utils/api/tutoringApi';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export default function AiTutorPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Hydrate welcome message after initial client mount to prevent SSR mismatch
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: `Hello ${user?.name?.split(' ')[0] || 'Scholar'}! I am your UniLearn AI intelligence tutor and academic co-pilot. How can I assist you with your studies, research, or course preparation today?`,
            timestamp: new Date()
          }
        ]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user?.name, messages.length]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const level = user?.role === 'teacher' ? 'advanced' : 'intermediate';
      const courseTitle = searchParams.get('course') || 'General Academic Guidance';
      const topic = searchParams.get('topic') || 'General Study';

      const response = await tutoringApi.getTutoringResponse(
        textToSend,
        courseTitle,
        topic,
        level
      );

      let aiText = '';
      if (response && response.success && response.data) {
        const data = response.data;
        if (data.explanation) {
          aiText += `${data.explanation}\n\n`;
        }
        if (data.keyPoints && data.keyPoints.length > 0) {
          aiText += `### Key Points 🎯\n\n${data.keyPoints.map((point: string) => `• ${point}`).join('\n')}\n\n`;
        }
        if (data.examples && data.examples.length > 0) {
          aiText += `### Practical Examples 💡\n\n${data.examples.map((ex: string) => `• ${ex}`).join('\n')}\n\n`;
        }
        if (data.practiceProblems && data.practiceProblems.length > 0) {
          aiText += `### Practice Problems 📝\n\n${data.practiceProblems.map((prob: string) => `• ${prob}`).join('\n')}\n\n`;
        }
        if (data.tips) {
          aiText += `### Study Tip 💡\n\n_${data.tips}_\n\n`;
        }
        if (data.relatedConcepts && data.relatedConcepts.length > 0) {
          aiText += `### Related Concepts 🔗\n\n${data.relatedConcepts.join(', ')}`;
        }
      } else if (response && typeof response.data === 'string') {
        aiText = response.data;
      } else if (response && response.explanation) {
        aiText = response.explanation;
      } else {
        throw new Error('Invalid response structure');
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: aiText.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Error fetching tutoring response:', err);
      const errorMsg = err.response?.data?.message || 'AI Tutor is temporarily offline. Please try again later.';
      toast.error(errorMsg);
      
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: `⚠️ **Connection Error**: ${errorMsg}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle incoming prompt from redirect
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      const timer = setTimeout(() => {
        handleSendPrompt(initialPrompt);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, messages.length]);

  const suggestions = [
    { text: 'Explain Programming loops with visuals', icon: Compass },
    { text: 'Generate practice questions on databases', icon: HelpCircle },
    { text: 'Help me outline a Next.js 19 curriculum skeleton', icon: Terminal },
    { text: 'Explain recursion with visual analogies', icon: FileText }
  ];

  return (
    <div className="pb-16 max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* 🧭 HEADER */}
      <header className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mb-1.5">
            <Sparkles size={14} className="animate-pulse" /> Cognitive Studio
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            {user?.role === 'teacher' ? 'AI Syllabus Advisor' : 'AI Study Co-Pilot'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {user?.role === 'teacher' 
              ? 'Architect high-converting lesson structures and generate evaluation resources instantly.'
              : 'Interactive academic companion with instant insights and adaptive study guides.'}
          </p>
        </div>
      </header>

      {/* 🖥️ MAIN CONSOLE */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[32px] shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-premium">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 max-w-3xl ${isAi ? '' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                    isAi ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-900 border-slate-900 text-white'
                  }`}>
                    {isAi ? <Bot size={18} /> : <UserIcon size={18} />}
                  </div>

                  <div className={`p-5 rounded-[24px] text-sm leading-relaxed ${
                    isAi 
                      ? 'bg-slate-50 border border-slate-100 text-slate-800' 
                      : 'bg-primary-600 text-white shadow-md'
                  }`}>
                    {/* Basic Markdown Rendering */}
                    <div className="space-y-3 whitespace-pre-line">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('### ')) {
                          return <h3 key={pIdx} className="font-extrabold text-base tracking-tight text-slate-900 mt-2 first:mt-0">{paragraph.replace('### ', '')}</h3>;
                        }
                        if (paragraph.startsWith('`') || paragraph.includes('```')) {
                          return (
                            <pre key={pIdx} className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto my-2">
                              <code>{paragraph.replace(/```[a-z]*/g, '').replace(/`/g, '')}</code>
                            </pre>
                          );
                        }
                        return <p key={pIdx} className="font-medium">{paragraph}</p>;
                      })}
                    </div>
                    <span className={`block text-[10px] mt-3 uppercase tracking-wider font-bold ${
                      isAi ? 'text-slate-400' : 'text-primary-200'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <Bot size={18} />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-[24px] flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-xs text-slate-400 uppercase tracking-widest font-black">AI is composing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Suggestions (Shown when stream is new/empty) */}
        {messages.length === 1 && !isTyping && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Prompts Suggestions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(s.text)}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/20 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors flex items-center justify-center shrink-0">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-900">{s.text}</span>
                    <ArrowRight size={12} className="ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputText);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for programming help, syllabus concepts, lesson planning rules..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`absolute right-2.5 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-md ${
                inputText.trim() && !isTyping 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
              aria-label="Send query"
              title="Send query"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
