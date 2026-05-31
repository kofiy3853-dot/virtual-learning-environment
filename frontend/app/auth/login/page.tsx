/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';

function LoginContent() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const redirect = searchParams.get('redirect') || '';

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: any) => {
          setLoading(true);
          try {
            const user = await loginWithGoogle(response.credential, 'student');
            toast.success('Welcome back!');
            router.push(redirect || `/dashboard/${user.role}`);
          } catch (e) {
            const msg = (e as AxiosError<{ message: string }>).response?.data?.message || 'Google sign-in failed';
            setError(msg);
            toast.error(msg);
          } finally {
            setLoading(false);
          }
        },
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', shape: 'rectangular', text: 'signin_with', width: 200 }
      );
    }
  }, [loginWithGoogle, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login(form.email, form.password, require2FA ? mfaToken : undefined);
      
      if (response.require2FA) {
        setRequire2FA(true);
        setLoading(false);
        return;
      }
      
      if (response.user) {
        toast.success('Welcome back!');
        router.push(redirect || `/dashboard/${response.user.role}`);
      }
    } catch (e) {
      const msg = (e as AxiosError<{ message: string }>).response?.data?.message || 'Invalid credentials';
      setError(msg);
      toast.error(msg);
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
            <h1 className="text-2xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-slate-300">Sign in to your account to continue</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {require2FA ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-400 mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-300 text-center mt-2">Enter the 6-digit code from your authenticator app.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2" htmlFor="mfaToken">Authentication Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      id="mfaToken"
                      type="text"
                      required
                      maxLength={6}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all tracking-widest font-mono"
                      placeholder="123456"
                      value={mfaToken}
                      onChange={e => setMfaToken(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequire2FA(false)}
                  className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <>
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
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider" htmlFor="password">Password</label>
                    <Link href="/auth/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (!require2FA && (!form.email || !form.password)) || (require2FA && !mfaToken)}
              className="w-full btn btn-primary gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
              {loading ? 'Signing in...' : require2FA ? 'Verify Code' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          <div id="google-signin-btn" className="flex justify-center" />

          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary-400 font-semibold hover:text-primary-300 transition">Create one</Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm">
          <p className="text-xs text-slate-400 mb-2 font-semibold">Demo Credentials:</p>
          <p className="text-xs text-slate-500">Email: demo@example.com</p>
          <p className="text-xs text-slate-500">Password: demo123</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
