'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import PageTransition from '@/components/shared/PageTransition';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-primary-500 rounded-full" 
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-b-2 border-indigo-500/30 rounded-full" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap size={32} className="text-white opacity-20" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] mb-1">Intelligence OS</p>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">Synchronizing Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900 mesh-bg relative transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Component */}
      <div className={`
        fixed inset-y-0 left-0 z-[50] lg:static lg:block transform transition-transform duration-500 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto scrollbar-premium relative flex flex-col h-full bg-transparent">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-[35]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tighter text-slate-900 dark:text-white">UniLearn</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            title={isSidebarOpen ? "Close menu" : "Open menu"}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm active:scale-95 transition-all"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
          <div className="flex-1 p-6 md:p-10 lg:p-12">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
          
          <footer className="px-6 md:px-12 py-8 border-t border-slate-100/50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
              © 2026 UniLearn Intelligence Platform. All Rights Reserved.
            </p>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-primary-500 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-primary-500 transition-colors">Terms</Link>
              <Link href="/support" className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-primary-500 transition-colors">Support</Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
