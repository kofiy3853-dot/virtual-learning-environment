'use client';
import { motion } from 'framer-motion';
import Sidebar from '@/components/shared/Sidebar';
import { Scale, FileText, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
                <Scale className="text-blue-600" size={32} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Terms of Service</h1>
              <p className="text-slate-500 font-medium text-lg">Last updated: May 12, 2026</p>
            </header>

            <section className="space-y-10">
              <div className="prose prose-slate max-w-none">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mb-10">
                  <p className="text-blue-900 font-bold m-0 flex items-center gap-2">
                    <AlertCircle size={18} /> Please read these terms carefully before using UniLearn.
                  </p>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <FileText className="text-blue-500" size={24} /> 1. Acceptance of Terms
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  By accessing or using UniLearn, you agree to be bound by these Terms of Service. If you do not agree, you may not access the platform.
                </p>

                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mt-10">
                  <CheckCircle2 className="text-emerald-500" size={24} /> 2. Academic Integrity
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Users are expected to maintain the highest standards of academic integrity. Any form of cheating, plagiarism, or misuse of platform resources will result in immediate suspension.
                </p>

                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mt-10">
                  <AlertCircle className="text-amber-500" size={24} /> 3. Limitation of Liability
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  UniLearn provides educational tools "as is." While we strive for 100% uptime and accuracy, we are not liable for any data loss or service interruptions.
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
