'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  GraduationCap, Mail, Lock, ArrowRight, Loader2, 
  ShieldCheck, Search, Users, Sparkles, Star,
  CheckCircle2, Globe
} from 'lucide-react';

import { Suspense } from 'react';

function LoginContent() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      toast.success('Welcome back to UniLearn!');
      
      // Respect redirect parameter or use default
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push(`/dashboard/${loggedInUser.role}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Left Panel: Product Storytelling */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-surface-950 p-16 flex-col justify-between items-center overflow-hidden border-r border-white/5">
        {/* Animated Mesh Background */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary-900/30 rounded-full blur-[140px]" 
          />
          <div className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <GraduationCap className="text-white" size={22} />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">UniLearn</span>
          </div>
          <div className="flex gap-4 opacity-50">
            <Globe size={18} className="text-surface-400" />
            <Users size={18} className="text-surface-400" />
          </div>
        </div>

        <div className="relative z-10 max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
              The intelligent workspace <br />
              <span className="gradient-text-primary">for modern education.</span>
            </h2>
            <p className="text-surface-400 text-xl leading-relaxed mb-12">
              UniLearn helps students, educators, and institutions manage academic workflows, 
              analytics, and collaboration in one secure, enterprise-grade platform.
            </p>

            {/* Product Preview Mockup */}
            <div className="relative mb-12 group">
              <div className="relative rounded-[32px] border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-surface-900">
                <Image 
                  src="/images/login_visual.png" 
                  alt="UniLearn Dashboard" 
                  width={800} 
                  height={600}
                  className="opacity-90 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950/60 to-transparent" />
              </div>
              
              {/* Testimonial Floating Card */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute -bottom-6 -right-10 glass p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl max-w-[280px] text-left"
              >
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-xs font-medium text-white mb-3 leading-relaxed">
                  "UniLearn transformed how our university manages digital learning. Truly enterprise-grade."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-500" />
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">DR. Elena RODRIGUEZ</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 w-full flex justify-between items-center px-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-surface-600 uppercase tracking-[0.2em]">Trusted By</span>
            <span className="text-sm font-bold text-surface-300">150+ Global Institutions</span>
          </div>
          <div className="flex items-center gap-6 opacity-30">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <ShieldCheck size={24} className="text-primary-400" />
            <Sparkles size={24} className="text-amber-400" />
          </div>
        </div>
      </section>

      {/* Right Panel: Auth Form */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-20 relative">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px]"
        >
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Welcome back</h1>
            <p className="text-surface-400 font-medium">Enter your credentials to access your workspace</p>
          </div>

          <div className="glass-dark rounded-[40px] p-8 lg:p-10 shadow-2xl border border-white/5 relative">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-xs font-semibold text-surface-500 ml-1">University Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    className="input bg-white/[0.03] border-white/10 text-white pl-12 h-14 hover:bg-white/[0.05] focus:bg-white/[0.05] transition-all"
                    placeholder="you@university.edu"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-surface-500">Password</label>
                  <Link href="#" className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    className="input bg-white/[0.03] border-white/10 text-white pl-12 h-14 hover:bg-white/[0.05] focus:bg-white/[0.05] transition-all"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-600/20"
                  checked={form.rememberMe}
                  onChange={e => setForm(p => ({ ...p, rememberMe: e.target.checked }))}
                />
                <label htmlFor="remember" className="text-xs font-medium text-surface-500 cursor-pointer select-none">Remember this session</label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary w-full h-14 text-base font-bold shadow-2xl shadow-primary-600/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? <Loader2 className="animate-spin" size={22} /> : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In to Platform <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em]"><span className="bg-surface-950/20 px-4 text-surface-600">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 h-12 rounded-2xl bg-white/[0.03] border border-white/5 text-white text-sm font-semibold hover:bg-white/[0.08] transition-all">
                <Search size={18} /> Google
              </button>
              <button className="flex items-center justify-center gap-3 h-12 rounded-2xl bg-white/[0.03] border border-white/5 text-white text-sm font-semibold hover:bg-white/[0.08] transition-all">
                <Users size={18} /> Github
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm font-medium text-surface-500">
            New to UniLearn?{' '}
            <Link href="/auth/register" className="text-white font-bold hover:text-primary-400 transition-colors">
              Create an account
            </Link>
          </p>
        </motion.div>

        {/* Footer Links */}
        <div className="mt-auto pt-10 flex flex-wrap justify-center gap-8 text-[10px] font-bold text-surface-600 uppercase tracking-widest">
          <Link href="#" className="hover:text-surface-400 transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-surface-400 transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-surface-400 transition-colors">Support Center</Link>
          <div className="flex items-center gap-1.5 ml-2 text-emerald-600/50">
             <ShieldCheck size={14} /> <span>Secured by UniAuth</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-900 flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={32} /></div>}>
      <LoginContent />
    </Suspense>
  );
}
