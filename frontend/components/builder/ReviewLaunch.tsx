'use client';

import React, { useState } from 'react';
import { 
  Rocket, CheckCircle2, AlertTriangle, ArrowRight, 
  Eye, FileText, Sparkles, Loader2, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewLaunch() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const checklist = [
    { id: 1, label: 'Course Identity Defined', status: 'complete', detail: 'Title, Code, and Description are set.' },
    { id: 2, label: 'Curriculum Architected', status: 'warning', detail: 'Only 1 module defined. Recommended: 4+ for full semester.' },
    { id: 3, label: 'Faculty Assigned', status: 'complete', detail: 'Primary instructor has been cataloged.' },
    { id: 4, label: 'Access Protocols Configured', status: 'complete', detail: 'Privacy and capacity rules established.' },
    { id: 5, label: 'Visual Brand Initialized', status: 'complete', detail: 'Banner and accent color selected.' },
  ];

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="py-20 text-center flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-600/10 border-4 border-emerald-100">
           <PartyPopper size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Course Published!</h2>
        <p className="text-slate-500 font-medium text-lg max-w-sm mb-12">
          Your academic workspace is now live and ready for student enrollment.
        </p>
        <div className="flex gap-4">
           <button className="px-10 py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
              Go to Workspace
           </button>
           <button className="px-10 py-5 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
              Copy Invite Link
           </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">The Launchpad.</h2>
        <p className="text-slate-500 font-medium">Finalize your readiness audit and initialize the program for enrollment.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Readiness Checklist */}
        <section className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="flex items-center gap-3 mb-10">
              <Rocket size={24} className="text-blue-600" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Readiness Audit</h3>
           </div>

           <div className="space-y-6">
              {checklist.map((item) => (
                 <div key={item.id} className="flex items-start gap-4 p-5 rounded-3xl border border-slate-50 hover:border-slate-100 transition-all group">
                    <div className={`mt-1 shrink-0 ${item.status === 'complete' ? 'text-emerald-500' : 'text-amber-500'}`}>
                       {item.status === 'complete' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-black text-slate-900 mb-1">{item.label}</h4>
                       <p className="text-xs font-medium text-slate-400 group-hover:text-slate-500 transition-colors">{item.detail}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all">
                       <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                          Review <ArrowRight size={12} />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Action Panel */}
        <div className="flex flex-col md:flex-row gap-6">
           <button 
             onClick={handlePublish}
             disabled={isPublishing}
             className="flex-1 h-20 rounded-3xl bg-blue-600 text-white font-black text-lg tracking-tight hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
           >
              {isPublishing ? (
                 <><Loader2 size={24} className="animate-spin" /> Verifying Protocols...</>
              ) : (
                 <><Rocket size={24} /> Initialize Publication</>
              )}
           </button>
           <button className="px-10 h-20 rounded-3xl bg-white border-2 border-slate-200 text-slate-600 font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
              <Eye size={20} /> Preview Workspace
           </button>
        </div>

        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-start gap-4">
           <Sparkles size={20} className="text-blue-600 mt-0.5" />
           <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
             "Once published, this course will be indexed in the UniLearn catalog. You can update the curriculum and settings at any time from your instructor dashboard."
           </p>
        </div>

      </div>
    </div>
  );
}
