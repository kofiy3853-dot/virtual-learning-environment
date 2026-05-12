'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, Search, Bell, Mail } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-100 rounded-full" />
            <div className="absolute top-0 w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[40] lg:hidden"
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

      <main className="flex-1 overflow-y-auto scrollbar-premium relative flex flex-col h-full">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 px-10 items-center justify-between sticky top-0 bg-[#F8F9FB]/80 backdrop-blur-md z-[35]">
           <div className="relative w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search your course..." 
                aria-label="Search courses"
                className="w-full h-11 pl-12 pr-4 bg-white border-none rounded-full text-sm font-medium shadow-soft focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
              />
           </div>

           <div className="flex items-center gap-6">
              <button 
                title="Messages"
                aria-label="View Messages"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-soft text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Mail size={18} />
              </button>
              <button 
                title="Notifications"
                aria-label="View Notifications"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-soft text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Bell size={18} />
              </button>
              <div className="h-10 w-[1px] bg-gray-200 mx-2" />
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 leading-none">{user?.name || 'Jason Ranti'}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{user?.role || 'Student'}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                    <img 
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=6366f1&color=fff`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                 </div>
              </div>
           </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden h-20 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[35]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tighter text-slate-900">Coursue</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Close Menu" : "Open Menu"}
            aria-label={isSidebarOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-900 shadow-sm transition-all"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <div className="max-w-[1600px] w-full flex-1 flex flex-col px-6 md:px-10 pb-10">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

