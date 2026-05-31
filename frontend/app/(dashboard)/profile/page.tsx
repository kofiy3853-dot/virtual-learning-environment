'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/utils/api/authApi';
import { AxiosError } from 'axios';
import { User } from '@/types';
import { 
  User as UserIcon, Lock, Bell, Mail, Building2, 
  Globe, ShieldCheck, CheckCircle2, AlertTriangle, Trash2, Smartphone, Loader2
} from 'lucide-react';

interface UserForm {
  name: string;
  email: string;
  department: string;
}

interface PersonalInfoProps {
  user: User;
  updateUser: (data: Partial<User>) => void;
  showToast: (msg: string, type?: string) => void;
}

function PersonalInfoTab({ user, updateUser, showToast }: PersonalInfoProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UserForm>({
    name: user.name || '',
    email: user.email || '',
    department: user.department || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.updateMe(form);
      updateUser(res.data.data);
      showToast('Profile updated successfully!');
    } catch (e) {
      const err = e as AxiosError<{message: string}>;
      showToast(err.response?.data?.message || err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Personal Information</h3>
        <p className="text-slate-500 font-medium">Update your details and how others see you on the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="p-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                id="p-name"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 h-14 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold shadow-sm"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="p-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                id="p-email"
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 pl-12 pr-4 h-14 rounded-2xl cursor-not-allowed outline-none font-bold"
                value={form.email}
                disabled
                readOnly
              />
            </div>
          </div>
          <div>
            <label htmlFor="p-dept" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department / School</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                id="p-dept"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 h-14 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold shadow-sm"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={e => setForm({...form, department: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label htmlFor="p-lang" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Language</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select id="p-lang" className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-10 h-14 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold shadow-sm cursor-pointer">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button type="button" className="flex items-center gap-2 px-4 py-2 text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition-colors">
            <Trash2 size={16} /> Delete Account
          </button>
          <button type="submit" disabled={loading} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none">
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function SecurityTab({ user, showToast, updateUser }: PersonalInfoProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await authApi.generate2FA();
      setQrCode(res.data.qrCodeUrl);
      setSecret(res.data.secret);
    } catch (e) {
      showToast('Failed to generate 2FA setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verify2FA(mfaToken);
      showToast('Two-Factor Authentication enabled successfully!');
      updateUser({ ...user, isTwoFactorEnabled: true } as any);
      setQrCode(null);
      setSecret(null);
    } catch (e) {
      showToast('Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Security Settings</h3>
        <p className="text-slate-500 font-medium">Protect your account with Two-Factor Authentication.</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${(user as any).isTwoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
            <Smartphone size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
            <p className="text-sm font-medium text-slate-500">
              {(user as any).isTwoFactorEnabled ? '2FA is currently enabled for your account.' : 'Add an extra layer of security to your account.'}
            </p>
          </div>
        </div>

        {!(user as any).isTwoFactorEnabled && !qrCode && (
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin inline mr-2" size={18} /> : null}
            Enable 2FA
          </button>
        )}

        {qrCode && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h5 className="font-bold text-slate-900 mb-4">Setup Instructions</h5>
            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 mb-6">
              <li>Download an authenticator app like Google Authenticator or Authy.</li>
              <li>Scan the QR code below with the app.</li>
              <li>Enter the 6-digit code generated by the app to verify.</li>
            </ol>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <div className="flex-1 w-full">
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="mfaToken" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verification Code</label>
                    <input 
                      id="mfaToken"
                      type="text"
                      maxLength={6}
                      required
                      value={mfaToken}
                      onChange={e => setMfaToken(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono tracking-widest text-lg"
                      placeholder="123456"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || mfaToken.length < 6}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50 w-full"
                  >
                    {loading ? <Loader2 className="animate-spin inline mr-2" size={18} /> : null}
                    Verify and Enable
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);
  
  const showToast = (msg: string, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const roleStyles = {
    admin: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    teacher: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    student: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  }[user?.role || 'student'] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <div className="relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-20">
          
          {/* Header Cover */}
          <div className="h-40 rounded-[32px] bg-gradient-to-r from-blue-600 to-indigo-900 relative mb-8 overflow-hidden shadow-lg">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-20 relative z-10">
            
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              
              {/* Profile Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] border border-slate-200 p-8 text-center shadow-sm">
                <div className={`w-32 h-32 rounded-full mx-auto -mt-20 mb-6 flex items-center justify-center text-5xl font-black border-4 border-white shadow-lg ${roleStyles.bg} ${roleStyles.text}`}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{user?.name}</h2>
                <p className="text-slate-500 font-medium mb-6">{user?.email}</p>
                <div className="flex justify-center gap-2">
                  <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${roleStyles.bg} ${roleStyles.text} ${roleStyles.border}`}>
                    {user?.role}
                  </span>
                  <span className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    Active
                  </span>
                </div>
              </motion.div>

              {/* Security Status */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} /> Security Status
                </h3>
                <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-900 text-sm mb-0.5">Email Verified</p>
                    <p className="text-xs font-medium text-emerald-700">Your account is secured.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200 px-2">
                {(['profile', 'security', 'notifications'] as const).map(id => {
                  const labels = { profile: 'Personal Info', security: 'Security', notifications: 'Notifications' };
                  const icons = { profile: UserIcon, security: Lock, notifications: Bell };
                  const Icon = icons[id];
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-6 py-4 font-bold transition-all relative ${
                        isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon size={18} /> {labels[id]}
                      {isActive && (
                        <motion.div layoutId="profileTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content Area */}
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {activeTab === 'profile' && user && (
                  <PersonalInfoTab user={user} updateUser={updateUser} showToast={showToast} key={user._id} />
                )}

                {activeTab === 'security' && user && (
                  <SecurityTab user={user} updateUser={updateUser} showToast={showToast} key={user._id} />
                )}

                {activeTab === 'notifications' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                      <Bell size={32} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Notification Preferences</h3>
                    <p className="text-slate-500 font-medium max-w-sm">Fine-tune how you receive course updates, grades, and direct messages.</p>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
      </div>
    </div>
  );
}
