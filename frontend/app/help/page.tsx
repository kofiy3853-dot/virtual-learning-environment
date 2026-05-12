'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, Book, MessageCircle, FileText, 
  Video, Mail, ExternalLink, ChevronRight,
  Shield, Zap, Users, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/layouts/DashboardLayout';

export default function HelpPage() {
  const categories = [
    {
      title: 'Getting Started',
      icon: <Zap className="text-amber-500" size={24} />,
      links: [
        'Platform Overview',
        'Setting up your profile',
        'Navigating the dashboard',
        'Course enrollment guide'
      ]
    },
    {
      title: 'Academic Support',
      icon: <Book className="text-blue-500" size={24} />,
      links: [
        'Submitting assignments',
        'Taking quizzes & exams',
        'Viewing grades & feedback',
        'Accessing module content'
      ]
    },
    {
      title: 'Communication',
      icon: <MessageCircle className="text-indigo-500" size={24} />,
      links: [
        'Using direct messages',
        'Discussion forum rules',
        'Joining live sessions',
        'Notification settings'
      ]
    },
    {
      title: 'Technical Support',
      icon: <Shield className="text-emerald-500" size={24} />,
      links: [
        'System requirements',
        'Resetting your password',
        'Reporting a platform bug',
        'API & Integration help'
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        
        {/* Header Section */}
        <section className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-primary-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-primary-100 text-primary-600 shadow-xl shadow-primary-500/10"
          >
            <HelpCircle size={40} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight">How can we help?</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
            Search our knowledge base or browse categories below to find answers to your questions about the UniLearn platform.
          </p>
          
          <div className="max-w-2xl mx-auto pt-8">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search for articles, guides, or troubleshooting..."
                className="w-full h-16 pl-14 pr-6 bg-white border border-slate-200 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/20 transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                <HelpCircle size={24} />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{cat.title}</h3>
              </div>
              <ul className="space-y-3">
                {cat.links.map(link => (
                  <li key={link}>
                    <button className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-primary-600 transition-all group/link">
                      <span className="text-sm font-bold tracking-tight">{link}</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover/link:translate-x-1 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Direct Contact Section */}
        <section className="bg-slate-900 rounded-[40px] p-10 lg:p-14 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
           
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center lg:text-left space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">
                    <Sparkles size={12} /> Still need assistance?
                 </div>
                 <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight leading-tight">Can&apos;t find what you&apos;re looking for?</h2>
                 <p className="text-slate-400 font-medium leading-relaxed">
                    Our technical support team is available 24/7 to help you with any platform issues or academic questions.
                 </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                 <button className="btn bg-primary-500 hover:bg-primary-600 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95">
                    Contact Support
                 </button>
                 <button className="btn bg-white/10 hover:bg-white/20 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all active:scale-95">
                    View FAQ
                 </button>
              </div>
           </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
