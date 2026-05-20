'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '@/utils/api/authApi';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';
import { 
  GraduationCap, User, BookOpen, Building2, Mail, Lock, 
  Check, Loader2, ArrowRight, ShieldCheck, Zap, 
  BarChart3, Users, Sparkles, Star, Globe, Shield
} from 'lucide-react';

const ROLES = [
  { 
    value: 'student', 
    label: 'Student', 
    icon: User, 
    desc: 'Track assignments, collaborate with classmates, and monitor academic progress.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'hover:border-indigo-300'
  },
  { 
    value: 'teacher', 
    label: 'Teacher', 
    icon: BookOpen, 
    desc: 'Create courses, manage grading, and monitor student performance with ease.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'hover:border-emerald-300'
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });
  const [loading, setLoading] = useState(false);
  const passChecks = useMemo(() => ({
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
  }), [form.password]);

  const { login, loginWithGoogle } = useAuth();
  
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      const currentForm = formRef.current;
      const loggedInUser = await loginWithGoogle(response.credential, currentForm.role, currentForm.department);
      toast.success('Account created! Welcome to UniLearn.');
      router.push(`/dashboard/${loggedInUser.role}`);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const msg = axiosErr.response?.data?.message || 'Google Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const initGoogleAuth = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "862517578566686-yourdefaultid.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse,
      });

      (window as any).google.accounts.id.renderButton(
        document.getElementById("google-signup-btn"),
        { 
          theme: "outline", 
          size: "large",
          shape: "rectangular",
          text: "signup_with",
          width: 250
        }
      );
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      initGoogleAuth();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passChecks.length || !passChecks.upper || !passChecks.number) {
      toast.error('Please meet all password requirements');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success('Account created! Welcome to UniLearn.');
      const loggedInUser = await login(form.email, form.password);
      router.push(`/dashboard/${loggedInUser.role}`);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const msg = axiosErr.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passStrength = Object.values(passChecks).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Left Side: Premium Storytelling & Branding */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-white items-center justify-center p-16 lg:p-24 overflow-hidden border-r border-slate-200">
        
        {/* Advanced Ambient Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-30%] left-[-20%] w-[1200px] h-[1200px] bg-blue-100/30 rounded-full blur-[160px]" 
          />
          <div className="absolute bottom-[-15%] right-[-10%] w-[1000px] h-[1000px] bg-indigo-50/50 rounded-full blur-[140px]" />
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-purple-50/30 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Link href="/" className="flex items-center gap-4 mb-16 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <GraduationCap size={26} className="text-white" />
              </div>
              <span className="font-black text-3xl tracking-tighter text-slate-900 uppercase">UniLearn</span>
            </Link>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-10 shadow-sm"
            >
              Next-Gen Academic Engine
            </motion.div>

            <h2 className="text-6xl lg:text-[5.5rem] font-black text-slate-900 mb-10 leading-[0.9] tracking-tighter">
              Start your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">evolution.</span>
            </h2>
            
            <p className="text-xl text-slate-500 mb-16 leading-relaxed font-medium max-w-lg">
              Join 50,000+ students and educators using our intelligent workspace to redefine the future of education.
            </p>

            {/* Visual Feature Card */}
            <div className="relative mb-20 group">
              <div className="relative rounded-[48px] border border-slate-200 overflow-hidden shadow-[0_40px_100px_rgba(15,23,42,0.1)] bg-white p-5 group-hover:scale-[1.02] transition-transform duration-1000">
                <div className="rounded-[32px] overflow-hidden bg-slate-50 relative">
                  <Image 
                    src="/images/registration_visual.png" 
                    alt="UniLearn Platform Core" 
                    width={1000} 
                    height={800}
                    className="opacity-95"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                </div>
              </div>
              
              {/* Animated Floating Metric */}
              <motion.div 
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-white/95 backdrop-blur-2xl p-8 rounded-[32px] border border-slate-100 shadow-2xl group-hover:translate-x-2 transition-transform duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-600/30">
                    <BarChart3 className="text-white" size={32} />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">99.9%</p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] leading-none">Global Uptime</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4 text-sm font-black text-slate-900 uppercase tracking-widest">
                <Shield className="text-blue-600" size={24} />
                <span>Enterprise Privacy</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-black text-slate-900 uppercase tracking-widest">
                <Zap className="text-amber-500" size={24} />
                <span>Live Sync Core</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Right Side: High-Conversion Enrollment Form */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 relative bg-slate-50/30">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[580px] relative z-10"
        >
          <div className="mb-14 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-5 tracking-tighter leading-none">Create your account.</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">
              Unlock courses, research tools, and deep analytics with a unified workspace.
            </p>
          </div>

          <div className="bg-white rounded-[56px] p-10 lg:p-14 shadow-[0_40px_120px_rgba(15,23,42,0.1)] border border-slate-100 relative overflow-hidden transition-all duration-500 hover:shadow-[0_40px_140px_rgba(15,23,42,0.12)]">
            
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              
              {/* Advanced Role Selection */}
              <div className="space-y-5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Choose your Identity</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {ROLES.map(r => {
                    const isSelected = form.role === r.value;
                    return (
                      <button 
                        type="button" 
                        key={r.value}
                        onClick={() => setForm(p => ({ ...p, role: r.value }))}
                        className={`group relative p-8 rounded-[32px] border-2 transition-all duration-500 text-left active:scale-95 ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-900/5' 
                            : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                          isSelected ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40 scale-110' : 'bg-white border border-slate-200 text-slate-400'
                        }`}>
                          <r.icon size={28} />
                        </div>
                        <h4 className={`text-xl font-black mb-2 transition-colors uppercase tracking-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {r.label}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {r.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Precise Field Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3 group/field">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Legal Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-600 transition-colors" size={22} />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-6 h-16 rounded-[24px] hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold text-lg tracking-tight"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 group/field">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Primary Department</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-600 transition-colors" size={22} />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-6 h-16 rounded-[24px] hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold text-lg tracking-tight"
                        placeholder="e.g. CS"
                        value={form.department}
                        onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 group/field">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">University Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-600 transition-colors" size={22} />
                    <input 
                      type="email" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-6 h-16 rounded-[24px] hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold text-lg tracking-tight"
                      placeholder="name@university.edu"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4 group/field">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-blue-600 transition-colors" size={22} />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-6 h-16 rounded-[24px] hover:bg-white focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold text-lg tracking-tight"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                  
                  {/* Premium Strength Analysis */}
                  <div className="space-y-4 pt-2 px-2">
                    <div className="flex gap-3">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className={`h-2 flex-1 rounded-full transition-all duration-700 ${
                            passStrength >= i 
                              ? passStrength === 3 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-amber-400' 
                              : 'bg-slate-100'
                          }`} 
                        />
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      {[
                        { key: 'length', label: '8+ Symbols' },
                        { key: 'upper', label: 'Upper Case' },
                        { key: 'number', label: 'Numerical' },
                      ].map(check => (
                        <div key={check.key} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${
                            passChecks[check.key as keyof typeof passChecks] 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-200 bg-slate-50 text-transparent'
                          }`}>
                            <Check size={12} strokeWidth={4} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            passChecks[check.key as keyof typeof passChecks] ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-20 rounded-[32px] bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-2xl shadow-blue-600/30 group relative overflow-hidden transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 uppercase tracking-widest"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? <Loader2 className="animate-spin mx-auto" size={28} /> : (
                  <span className="flex items-center justify-center gap-4">
                    Create Workspace <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]"><span className="bg-white px-6 text-slate-300">Social Registration</span></div>
            </div>

            <div className="flex justify-center w-full">
              <div id="google-signup-btn" className="flex items-center justify-center h-14 w-full" />
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-base font-bold text-slate-500">
                Already registered?{' '}
                <Link href="/auth/login" className="text-blue-600 font-black hover:text-blue-800 transition-colors uppercase tracking-widest border-b-2 border-blue-100 hover:border-blue-600 pb-0.5">
                  Sign in
                </Link>
              </p>
              <div className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100">
                <ShieldCheck size={16} />
                <span>Encrypted Flow</span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-10 opacity-30 pointer-events-none grayscale">
             <span className="font-black text-2xl tracking-tighter text-slate-900"><Globe size={24} className="inline mr-2"/> GlobalEdu</span>
             <span className="font-black text-2xl tracking-tighter text-slate-900"><Building2 size={24} className="inline mr-2"/> Ivy Institute</span>
          </div>
        </motion.div>
      </main>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="lazyOnload" 
        onLoad={initGoogleAuth} 
      />
    </div>
  );
}
