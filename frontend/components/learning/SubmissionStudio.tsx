'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Clock, ChevronRight, Upload, 
  CheckCircle2, AlertCircle, Send, Loader2, 
  Paperclip, Trash2, Info, Sparkles, BookOpen,
  Download, MessageSquare, Star, BarChart3,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  title: string;
  description?: string;
  totalMarks: number;
}

interface Submission {
  status: string;
  feedback?: string;
  grade?: number;
  textContent?: string;
  files?: string[];
}

interface SubmissionStudioProps {
  assignment: Assignment;
  submission: Submission | null;
  onSubmit: (textContent: string, files: File[]) => Promise<void>;
}

export default function SubmissionStudio({ assignment, submission, onSubmit }: SubmissionStudioProps) {
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const submitFinal = async () => {
    setIsSubmitting(true);
    await onSubmit(textContent, files);
    setIsSubmitting(false);
  };

  const isGraded = submission?.status === 'graded';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      {/* Left: Strategy Panel */}
      <div className="lg:col-span-5 space-y-8">
         <section className="bg-white rounded-[48px] border border-slate-100 p-12 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
               <div className="flex items-center gap-3 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                 <BookOpen size={14} /> Assignment Strategy
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-6">{assignment.title}</h1>
               <div className="space-y-6 mb-10">
                  <p className="text-lg text-slate-500 font-medium leading-relaxed">
                     {assignment.description || 'This assignment requires a comprehensive academic response. Please review all instructions carefully before submitting.'}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Potential</p>
                     <p className="text-xl font-black text-slate-900">{assignment.totalMarks} Points</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                     <p className="text-xl font-black text-slate-900 capitalize">{submission?.status || 'Pending'}</p>
                  </div>
               </div>
            </div>
         </section>

         {/* Feedback Loop (if graded) */}
         <AnimatePresence>
            {isGraded && (
               <motion.section 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-slate-900 rounded-[48px] p-12 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl" />
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-900/40">
                           <BarChart3 size={24} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black tracking-tight mb-1">Performance Review</h3>
                           <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Teacher Feedback Received</p>
                        </div>
                     </div>

                     <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 mb-8">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Instructor Comments</p>
                        <p className="text-slate-300 font-medium leading-relaxed italic">
                           &quot;{submission.feedback || 'Excellent work on this assignment. Your core arguments were well-structured and evidenced.'}&quot;
                        </p>
                     </div>

                     <div className="flex items-center justify-between px-4">
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Score</p>
                           <p className="text-4xl font-black tracking-tighter">
                              {submission.grade}
                              <span className="text-lg text-slate-600 ml-1">/{assignment.totalMarks}</span>
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grade</p>
                           <p className="text-4xl font-black text-indigo-400">
                              {Math.round(((submission.grade ?? 0) / assignment.totalMarks) * 100)}%
                           </p>
                        </div>
                     </div>
                  </div>
               </motion.section>
            )}
         </AnimatePresence>
      </div>

      {/* Right: Submission Studio */}
      <div className="lg:col-span-7">
         {!submission ? (
            <section className="bg-white rounded-[48px] border border-slate-100 p-12 shadow-sm space-y-10">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Composition</label>
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={12} /> Rich Text Active
                     </span>
                  </div>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-10 text-xl font-medium text-slate-900 focus:border-indigo-600 outline-none transition-all resize-none shadow-inner min-h-[350px]"
                    placeholder="Begin drafting your professional response..."
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                  />
               </div>

               <div className="space-y-4">
                <div className="space-y-4">
                   <label htmlFor="file-upload" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Vault</label>
                   <div 
                     onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                     onDragLeave={() => setDragActive(false)}
                     onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                     className={`relative rounded-[32px] border-2 border-dashed p-12 text-center transition-all cursor-pointer group ${
                       dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
                     }`}
                     onClick={() => document.getElementById('file-upload')?.click()}
                   >
                      <div className="w-16 h-16 rounded-[24px] bg-white shadow-xl shadow-slate-900/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                         <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">Attach Academic Resources</h4>
                      <p className="text-sm font-medium text-slate-500">Drag & drop files here, or click to browse vault</p>
                      <input 
                        id="file-upload" 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={handleFileChange} 
                        title="Upload assignment files"
                        aria-label="Select files to upload for this assignment"
                      />
                   </div>
                </div>

                  <AnimatePresence>
                    {files.length > 0 && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                          {files.map((f, i) => (
                             <motion.div 
                               key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                               className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between group"
                             >
                                <div className="flex items-center gap-3 min-w-0">
                                   <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                      <Paperclip size={16} />
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-900 truncate">{f.name}</p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => removeFile(i)} 
                                  title="Remove File"
                                  aria-label={`Remove the file named ${f.name}`}
                                  className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </motion.div>
                          ))}
                       </div>
                    )}
                  </AnimatePresence>
               </div>

               <button
                 onClick={submitFinal}
                 disabled={isSubmitting || (!textContent && files.length === 0)}
                 className="w-full h-20 bg-indigo-600 text-white rounded-[28px] font-black text-xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
               >
                 {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                 {isSubmitting ? 'Finalizing Submission...' : 'Transmit Submission'}
               </button>
            </section>
         ) : (
            <section className="bg-white rounded-[48px] border border-slate-100 p-12 shadow-sm space-y-12">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tight">Submission Archive.</h3>
                     <p className="text-slate-500 font-medium">Successfully received and indexed in the portal.</p>
                  </div>
                  <div className="px-6 py-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 size={14} /> Submission Confirmed
                  </div>
               </div>

               {submission.textContent && (
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Archived Composition</label>
                     <div className="bg-slate-50 rounded-[40px] p-12 border border-slate-100 text-lg text-slate-700 leading-relaxed font-medium">
                        {submission.textContent}
                     </div>
                  </div>
               )}

               {submission.files && submission.files.length > 0 && (
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Vault</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {submission.files.map((url: string, i: number) => (
                           <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center justify-between group hover:border-indigo-200 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <FileText size={20} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-900">Resource Attachment {i + 1}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                       <Download size={10} /> Ready for Audit
                                    </p>
                                 </div>
                              </div>
                              <a href={url} target="_blank" className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                 <ExternalLink size={16} />
                              </a>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </section>
         )}
      </div>

    </div>
  );
}
