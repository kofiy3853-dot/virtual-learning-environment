/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' as const });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: any) => {
          setLoading(true);
          try {
            const { authApi } = await import('@/utils/api/authApi');
            const { applySessionToken } = await import('@/utils/auth/session');
            
            const res = await authApi.googleLogin({ token: response.credential, role: form.role });
            const { data: user, token } = res.data;
            
            applySessionToken(token);
            
            toast.success('Welcome!');
            // Redirect to role-specific dashboard
            window.location.href = `/dashboard/${user.role}`;
          } catch (e) {
            const msg = (e as AxiosError<{ message: string }>).response?.data?.message || 'Google sign‑up failed';
            setError(msg);
            toast.error(msg);
          } finally {
            setLoading(false);
          }
        },
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-signup-btn'),
        { theme: 'outline', size: 'large', shape: 'rectangular', text: 'signup_with', width: 200 }
      );
    }
  }, [form.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Client-side validation
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    
    if (form.name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      // Use the proper auth API with axios instance
      const { authApi } = await import('@/utils/api/authApi');
      const { applySessionToken } = await import('@/utils/auth/session');
      
      const response = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        department: undefined,
        role: form.role  // Include the selected role
      });
      
      // Registration successful - token and user data in response
      const { token, data: user } = response.data;
      
      // Store token
      applySessionToken(token);
      
      toast.success('Account created successfully!');
      // Redirect to role-specific dashboard
      window.location.href = `/dashboard/${user.role}`;
    } catch (e: any) {
      console.error('Registration error:', e);
      const msg = e?.response?.data?.message || 
                  e?.response?.data?.details?.join(', ') ||
                  'Registration failed. Please try again.';
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
            <h1 className="text-2xl font-black text-white mb-2">Create Account</h1>
            <p className="text-sm text-slate-300">Join thousands of learners on UniLearn</p>
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
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2" htmlFor="name">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="name" type="text" required
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="email" type="email" required
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} required
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  minLength={6}
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
              <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2" htmlFor="role">Account Type</label>
              <select
                id="role"
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-white focus:border-primary-500 focus:outline-none transition-all"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as any })}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          <div id="google-signup-btn" className="flex justify-center" />

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-400 font-semibold hover:text-primary-300 transition">Sign In</Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '🎓', label: 'Learn' },
            { icon: '👥', label: 'Connect' },
            { icon: '📊', label: 'Track' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
