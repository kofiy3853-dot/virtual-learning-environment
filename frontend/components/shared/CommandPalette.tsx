'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Command, LayoutDashboard, BookOpen, 
  MessageSquare, Bell, User, LogOut, 
  Settings, HelpCircle, ChevronRight, X,
  PlusCircle, Zap, Activity, Sun, Moon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { courseApi } from '@/utils/api/courseApi';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  shortcut?: string[];
  role?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  // Close palette
  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      // Fetch courses for search
      courseApi.getMyCourses().then(res => setCourses(res.data.data || []));
    }
  }, [isOpen]);

  const staticCommands: CommandItem[] = [
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      subtitle: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      icon: theme === 'light' ? <Moon size={18} /> : <Sun size={18} />,
      category: 'System',
      action: toggleTheme,
      shortcut: ['T']
    },
    {
      id: 'open-sentinel',
      title: 'Open Activity Feed',
      subtitle: 'View recent academic transmissions',
      icon: <Zap size={18} className="text-primary-500" />,
      category: 'System',
      action: () => window.dispatchEvent(new CustomEvent('toggle-sentinel')),
      shortcut: ['S']
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'View your academic overview',
      icon: <LayoutDashboard size={18} />,
      category: 'Navigation',
      action: () => router.push(`/dashboard/${user?.role}`),
      shortcut: ['G', 'D']
    },
    {
      id: 'courses',
      title: 'My Courses',
      subtitle: 'Browse your enrolled modules',
      icon: <BookOpen size={18} />,
      category: 'Navigation',
      action: () => router.push('/courses')
    },
    {
      id: 'messages',
      title: 'Messages',
      subtitle: 'Open direct communications',
      icon: <MessageSquare size={18} />,
      category: 'Communication',
      action: () => router.push('/messages')
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Manage your account security',
      icon: <User size={18} />,
      category: 'Account',
      action: () => router.push('/profile')
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Find answers and documentation',
      icon: <HelpCircle size={18} />,
      category: 'System',
      action: () => router.push('/help')
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your session',
      icon: <LogOut size={18} className="text-red-500" />,
      category: 'Account',
      action: logout
    }
  ];

  // Admin/Teacher specific actions
  if (user?.role === 'admin' || user?.role === 'teacher') {
    staticCommands.unshift({
      id: 'create-course',
      title: 'Create New Course',
      subtitle: 'Launch a new academic module',
      icon: <PlusCircle size={18} className="text-primary-500" />,
      category: 'Actions',
      action: () => router.push('/admin/courses/new'),
      role: ['admin', 'teacher']
    });
  }

  // Filter commands and add courses
  const courseCommands: CommandItem[] = courses.map(c => ({
    id: `course-${c._id}`,
    title: c.title,
    subtitle: c.code,
    icon: <Zap size={18} className="text-amber-500" />,
    category: 'Courses',
    action: () => router.push(`/courses/${c._id}`)
  }));

  const allItems = [...staticCommands, ...courseCommands].filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
        close();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[101] overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <Search className="text-slate-400 mr-4" size={22} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search everything... (Courses, Actions, Navigation)"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <div className="flex items-center gap-2">
                 <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">ESC</div>
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto scrollbar-premium p-3">
              {allItems.length > 0 ? (
                <div className="space-y-1">
                  {/* Group items by category */}
                  {Array.from(new Set(allItems.map(i => i.category))).map(category => (
                    <div key={category}>
                      <h3 className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {category}
                      </h3>
                      {allItems
                        .filter(i => i.category === category)
                        .map((item, idx) => {
                          const globalIdx = allItems.indexOf(item);
                          const isSelected = globalIdx === selectedIndex;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => { item.action(); close(); }}
                              onMouseEnter={() => setSelectedIndex(globalIdx)}
                              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left ${
                                isSelected ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                                isSelected ? 'bg-white/10 border-white/20 text-white' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                              }`}>
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                    {item.title}
                                  </span>
                                </div>
                                {item.subtitle && (
                                  <span className={`text-[11px] font-medium block truncate ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                    {item.subtitle}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <motion.div layoutId="arrow" className="text-white/60">
                                  <ChevronRight size={16} />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-200 dark:text-slate-700">
                    <Activity size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No results found for &quot;{search}&quot;</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <div className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 shadow-sm">↵</div>
                     Select
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <div className="flex gap-0.5">
                        <div className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 shadow-sm">↑</div>
                        <div className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 shadow-sm">↓</div>
                     </div>
                     Navigate
                  </div>
               </div>
               <div className="flex items-center gap-2 text-[11px] font-bold text-primary-500 uppercase tracking-[0.1em]">
                  <Zap size={14} className="fill-primary-500" /> Powered by UniLearn AI
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
