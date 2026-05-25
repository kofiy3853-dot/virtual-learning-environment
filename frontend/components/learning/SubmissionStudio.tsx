'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Send, Loader2, Paperclip, X, ExternalLink, Zap } from 'lucide-react';

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
  fileUrls?: string[];
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
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const submitFinal = async () => {
    setIsSubmitting(true);
    await onSubmit(textContent, files);
    setIsSubmitting(false);
  };

  const isGraded = submission?.status === 'graded';

  return (
    <div className="space-y-4">
      {/* Grade feedback banner */}
      <AnimatePresence>
        {isGraded && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Zap size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Score: {submission.grade}/{assignment.totalMarks} ({Math.round(((submission.grade ?? 0) / assignment.totalMarks) * 100)}%)
              </p>
              {submission.feedback && (
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">{submission.feedback}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!submission ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">Submit Your Work</h3>

          <div className="space-y-1.5">
            <label htmlFor="submission-text" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Response</label>
            <textarea
              id="submission-text"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none min-h-[200px] placeholder:text-slate-400"
              placeholder="Type your response here..."
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Attachments</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
              className={`rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
                dragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-slate-50 hover:border-primary-300'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={16} className="text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">Drag & drop or click to upload</p>
              <input id="file-upload" type="file" multiple title="Select files" className="hidden" onChange={handleFileChange} />
            </div>

            <AnimatePresence>
              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip size={12} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} aria-label={`Remove ${f.name}`} className="text-slate-400 hover:text-rose-500 transition-colors ml-2">
                        <X size={13} />
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
            className="btn btn-primary w-full py-2.5 text-sm font-semibold gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Your Submission</h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">Submitted</span>
          </div>

          {submission.textContent && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Response</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {submission.textContent}
              </div>
            </div>
          )}

          {((submission.files?.length ?? 0) > 0 || (submission.fileUrls?.length ?? 0) > 0) && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Files</p>
              <div className="space-y-1.5">
                {(submission.files || submission.fileUrls || []).map((url: string, i: number) => {
                  const name = url.split('/').pop()?.split('-').slice(1).join('-') || `File ${i + 1}`;
                  return (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={12} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
                      </div>
                      <a href={url.startsWith('http') ? url : `http://localhost:5000/${url}`} target="_blank" rel="noopener noreferrer" aria-label="View file" className="text-slate-400 hover:text-primary-600 transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
