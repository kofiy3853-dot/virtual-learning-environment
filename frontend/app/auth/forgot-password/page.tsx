'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Loader2, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { authApi } from '@/utils/api/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(true);
      toast.success(response.data.message || 'Password reset link sent!');
    } catch (e) {
      const msg = (e as AxiosError<{ message: string }>).response?.data?.message || 'Failed to send recovery email';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-white leading-none">UniLearn</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Intelligence Platform</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-white mb-2">Forgot Password</h1>
            <p className="text-sm text-slate-300">Enter your email and we'll send you a password recovery link</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 text-center py-4"
            >
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-2">
                <Mail size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
              <p className="text-sm text-slate-300">
                If an account exists for <strong>{email}</strong>, we have sent a secure password recovery link.
              </p>
              <div className="pt-4">
                <Link href="/auth/login" className="btn btn-primary w-full">
                  Return to Login
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2" htmlFor="email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full btn btn-primary gap-2 mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                {loading ? 'Sending Request...' : 'Send Recovery Link'}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-slate-400">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-primary-400 font-semibold hover:text-primary-300 transition">Sign In</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
