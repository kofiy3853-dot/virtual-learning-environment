'use client';
import { motion } from 'framer-motion';
import Sidebar from '@/components/shared/Sidebar';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <header>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Privacy Policy</h1>
              <p className="text-slate-500 font-medium text-lg">Last updated: May 12, 2026</p>
            </header>

            <section className="space-y-6">
              <div className="prose prose-slate max-w-none">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <Eye className="text-indigo-500" size={24} /> 1. Information Collection
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  We collect information to provide better services to all our students and educators. This includes basic details like your name and email, as well as academic performance data used to drive our intelligence features.
                </p>

                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mt-10">
                  <Lock className="text-emerald-500" size={24} /> 2. Data Security
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  UniLearn uses industry-standard encryption to protect your data. Your academic records are stored securely and only accessible by authorized personnel within your institution.
                </p>

                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mt-10">
                  <FileText className="text-amber-500" size={24} /> 3. Your Rights
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  You have the right to access, update, or delete your personal information at any time. If you wish to exercise these rights, please contact your institution's administrator.
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
