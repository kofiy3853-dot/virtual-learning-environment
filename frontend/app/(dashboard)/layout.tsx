'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import SentinelFeed from '@/components/shared/SentinelFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSentinelOpen, setIsSentinelOpen] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    const handleToggle = () => setIsSentinelOpen(p => !p);
    window.addEventListener('toggle-sentinel', handleToggle);
    return () => window.removeEventListener('toggle-sentinel', handleToggle);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 items-center justify-center font-sans">
        <div className="text-center flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" aria-hidden />
          <p className="text-sm font-medium text-slate-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Permanent Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Hub */}
      <main className="flex-1 relative h-screen overflow-y-auto scrollbar-premium flex flex-col">
        {/* Mobile Header Trigger */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center px-6 shrink-0 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open mobile menu"
            title="Open mobile menu"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="flex-1 text-center font-display font-black text-slate-900 tracking-tighter uppercase text-sm italic">
            UniLearn <span className="text-primary-500">Intelligence</span>
          </div>
        </div>

        <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>

      {/* Global Components */}
      <SentinelFeed isOpen={isSentinelOpen} onClose={() => setIsSentinelOpen(false)} />
    </div>
  );
}
