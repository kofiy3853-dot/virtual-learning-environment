'use client';

import React, { useState } from 'react';
import { 
  Palette, Image as ImageIcon, Layout, Sun, Moon, 
  Sparkles, Monitor, Smartphone, Check, Upload, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

const ACCENTS = [
  { name: 'UniLearn Blue', color: '#2563EB' },
  { name: 'Oxford Crimson', color: '#BE123C' },
  { name: 'Royal Emerald', color: '#047857' },
  { name: 'Deep Indigo', color: '#4338CA' },
  { name: 'Slate Onyx', color: '#0F172A' },
  { name: 'Amber Gold', color: '#B45309' },
];

export default function AppearanceSettings() {
  const [selectedAccent, setSelectedAccent] = useState(ACCENTS[0].color);
  const [isDark, setIsDark] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setBanner(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">The Stylist.</h2>
        <p className="text-slate-500 font-medium">Customize the visual identity and workspace aesthetic of your program.</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        
        {/* Banner Studio */}
        <section>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Course Banner & Imagery</label>
           <div className={`relative h-64 rounded-[40px] border-4 border-dashed transition-all duration-500 group overflow-hidden ${banner ? 'border-transparent shadow-2xl' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-blue-200'}`}>
              {banner ? (
                 <>
                    <img src={banner} className="w-full h-full object-cover" alt="Course Banner" />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                       <button onClick={() => setBanner(null)} className="p-4 rounded-full bg-white text-rose-600 shadow-xl hover:scale-110 transition-transform">
                          <Trash2 size={24} />
                       </button>
                    </div>
                 </>
              ) : (
                 <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 transition-transform">
                       <Upload size={32} />
                    </div>
                    <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Upload Banner Visual</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-2">Recommended: 1600 x 400px (JPG/PNG)</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                 </label>
              )}
           </div>
        </section>

        {/* Chomatic Studio */}
        <section>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Academic Accent Palette</label>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {ACCENTS.map((accent) => (
                 <button 
                   key={accent.color}
                   onClick={() => setSelectedAccent(accent.color)}
                   className={`h-20 rounded-3xl border-4 transition-all flex flex-col items-center justify-center relative group ${selectedAccent === accent.color ? 'border-blue-100 scale-105 shadow-xl shadow-blue-900/5' : 'border-transparent hover:border-slate-100'}`}
                 >
                    <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: accent.color }}>
                       {selectedAccent === accent.color && <Check size={16} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedAccent === accent.color ? 'text-slate-900' : 'text-slate-400'}`}>
                      {accent.name.split(' ')[1]}
                    </span>
                 </button>
              ))}
           </div>
        </section>

        {/* Display Environment */}
        <section className="bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div>
              <h3 className="font-black text-slate-900 text-lg mb-1">Display Environment</h3>
              <p className="text-slate-500 text-sm font-medium">Optimize the workspace for focus or comfort.</p>
           </div>
           
           <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shrink-0">
              <button 
                onClick={() => setIsDark(false)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isDark ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Sun size={14} /> Light
              </button>
              <button 
                onClick={() => setIsDark(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-slate-900 text-white shadow-xl shadow-black/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Moon size={14} /> Dark
              </button>
           </div>
        </section>

        {/* Layout Preview Simulator */}
        <section className="bg-slate-50/50 rounded-[40px] border-2 border-slate-100 p-10">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <Monitor size={18} className="text-slate-400" />
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Workspace Simulation</h3>
              </div>
              <div className="flex gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              </div>
           </div>

           <div className={`h-48 rounded-3xl transition-all duration-500 border-2 overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-white shadow-xl shadow-slate-900/5'}`}>
              <div className="h-4 border-b transition-colors" style={{ borderColor: isDark ? '#1E293B' : '#F1F5F9', backgroundColor: selectedAccent }} />
              <div className="flex-1 p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="space-y-2 flex-1">
                       <div className="h-3 w-1/3 bg-slate-100 rounded-full animate-pulse" />
                       <div className="h-2 w-1/4 bg-slate-100 rounded-full animate-pulse opacity-50" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-50 rounded-full" />
                    <div className="h-2 w-5/6 bg-slate-50 rounded-full" />
                    <div className="h-2 w-4/6 bg-slate-50 rounded-full" />
                 </div>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}
