'use client';
import { motion } from 'framer-motion';
import { Construction, Sparkles } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[40px] border border-slate-200 p-12 lg:p-20 text-center max-w-2xl w-full shadow-sm relative overflow-hidden"
      >
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm relative group">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-10px] border-2 border-dashed border-blue-200 rounded-[30px] opacity-50"
            />
            <Construction size={40} className="text-blue-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
            <Sparkles size={16} className="text-amber-400 absolute -top-2 -right-2 animate-pulse" />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Section Under Construction</h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
            We are currently synchronizing the content and preparing this module. Check back shortly to access these tools!
          </p>

          <div className="mt-10 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
