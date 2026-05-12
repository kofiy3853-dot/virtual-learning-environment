'use client';
import { motion } from 'framer-motion';
import Sidebar from '@/components/shared/Sidebar';
import { LifeBuoy, Mail, MessageSquare, Book, ChevronLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <header className="text-center sm:text-left">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm mx-auto sm:mx-0">
                <LifeBuoy className="text-blue-600" size={32} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Support Center</h1>
              <p className="text-slate-500 font-medium text-lg max-w-xl">We're here to help you make the most of your intelligent workspace. Get in touch with our team or explore our documentation.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Email Support', desc: 'Direct assistance for complex issues.', icon: Mail, contact: 'support@unilearn.edu', color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Live Chat', desc: 'Instant help from our support team.', icon: MessageSquare, contact: 'Open Chat', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { title: 'Documentation', desc: 'Detailed guides on every feature.', icon: Book, contact: 'View Docs', color: 'text-indigo-600', bg: 'bg-indigo-50' }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                  className="p-8 bg-white border border-slate-200 rounded-[32px] hover:shadow-xl transition-all group hover:border-blue-200"
                >
                  <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className={item.color} size={28} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 font-medium mb-8">{item.desc}</p>
                  <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    {item.contact} <ArrowRight size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            <section className="bg-slate-900 rounded-[40px] p-10 sm:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10 text-center sm:text-left">
                <h2 className="text-3xl font-black text-white mb-4">Need immediate help?</h2>
                <p className="text-slate-400 font-medium text-lg mb-10 max-w-lg">Our AI-powered assistant is available 24/7 to help you troubleshoot common issues and navigate the platform.</p>
                <button className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-95 shadow-lg">
                  Launch AI Support
                </button>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
