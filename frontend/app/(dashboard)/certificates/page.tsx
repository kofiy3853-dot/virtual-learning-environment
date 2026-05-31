'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificateApi } from '@/utils/api/certificateApi';
import { useAuth } from '@/context/AuthContext';
import {
  Award, Download, Copy, CheckCircle2, Sparkles,
  Calendar, BookOpen, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Certificate } from '@/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const [copied, setCopied] = useState(false);
  const courseTitle = typeof cert.course === 'object' ? cert.course.title : 'Course';
  const courseCode = typeof cert.course === 'object' ? cert.course.code : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/certificates/verify/${cert.certificateId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all duration-300"
    >
      {/* Certificate gold band */}
      <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-amber-50 opacity-60" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-50 opacity-60" />
      </div>

      <div className="relative p-6">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg mb-4">
          <Award className="text-white" size={22} />
        </div>

        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">{courseTitle}</h3>
          {courseCode && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
              {courseCode}
            </span>
          )}
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span>Issued {formatDate(cert.issuedAt)}</span>
          </div>
          {cert.grade !== undefined && (
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <Sparkles size={12} className="text-amber-500 shrink-0" />
              <span>Grade: <strong className="text-slate-700">{cert.grade}%</strong></span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <span className="text-slate-300">ID:</span>
            <span className="font-mono text-[10px] text-slate-400 truncate">{cert.certificateId}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all text-xs font-semibold"
          >
            {copied ? (
              <><CheckCircle2 size={13} className="text-emerald-500" /> Copied!</>
            ) : (
              <><Copy size={13} /> Copy Link</>
            )}
          </button>
          <a
            href={`/certificates/verify/${cert.certificateId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all text-xs font-semibold shadow-sm"
          >
            <Download size={13} /> View
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: certs = [], isLoading, error } = useQuery({
    queryKey: ['certificates', 'me'],
    queryFn: () => certificateApi.getMyCertificates().then(r => r.data.data),
    enabled: Boolean(user),
  });

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: (courseId: string) => certificateApi.generateCertificate(courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['certificates', 'me'] }),
  });

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest mb-1">
              <Award size={13} /> My Certificates
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Achievements</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Your earned certificates from completed courses.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100">
            <Award size={16} className="text-amber-500" />
            <span className="font-bold text-amber-700 text-sm">{certs.length}</span>
            <span className="text-amber-600 text-xs">Certificate{certs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-red-200">
          <AlertCircle size={32} className="text-red-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Failed to load certificates.</p>
        </div>
      ) : certs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 text-center bg-white rounded-2xl border border-dashed border-amber-100"
        >
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 mx-auto flex items-center justify-center mb-5">
            <Award size={36} className="text-amber-200" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">No certificates yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Complete a course to earn your first certificate of achievement!
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              <BookOpen size={15} /> Browse Courses
            </a>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map(cert => (
            <CertificateCard key={cert._id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
