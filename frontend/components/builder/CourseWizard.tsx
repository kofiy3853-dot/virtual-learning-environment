'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Calendar, Layout, Users, Settings, Clock, Plus, Trash2, 
  CheckCircle2, ArrowLeft, ArrowRight, Save, X,
  AlertCircle, Sparkle, FileText, Video, HelpCircle, Search,
  RefreshCw, Loader2 as SpinnerIcon
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { courseApi } from '@/utils/api/courseApi';
import { adminApi } from '@/utils/api/adminApi';
import toast from 'react-hot-toast';

interface StudentOption {
  _id: string;
  id?: string;
  name: string;
  email: string;
}

interface Session {
  id: string;
  day: string;
  time: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseFormState {
  title: string;
  code: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  startDate: string;
  endDate: string;
  schedule: Session[];
  modules: Module[];
  enrollmentType: 'open' | 'invite';
  students: string[];
  maxStudents: number;
  gradingSystem: 'percentage' | 'passfail';
  assignmentsEnabled: boolean;
  certificateEnabled: boolean;
  visibility: 'draft' | 'published';
}

function getUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: Sparkles, desc: 'Title, code, description & category' },
  { id: 'schedule', title: 'Structure & Schedule', icon: Calendar, desc: 'Dates and recurring class sessions' },
  { id: 'content', title: 'Course Content', icon: Layout, desc: 'Modules, lessons, and quiz structures' },
  { id: 'students', title: 'Students & Access', icon: Users, desc: 'Access controls and user enrollments' },
  { id: 'publish', title: 'Settings & Publish', icon: Settings, desc: 'Grading options and catalog launch' },
];

export default function CourseWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Auto-save status — initialized from localStorage to show restore message immediately
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('courseWizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.title || parsed?.code) return 'Draft restored from local save';
      }
    } catch { /* ignore */ }
    return 'Saved just now';
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI assist state
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // URL parameters for Quick Start initialization
  const searchParams = useSearchParams();
  const defaultTitle = searchParams.get('title') || '';
  const defaultCode = searchParams.get('code') || '';

  // Form core state — lazy initializer merges localStorage draft on first render
  const [form, setForm] = useState<CourseFormState>(() => {
    const defaults: CourseFormState = {
      title: defaultTitle,
      code: defaultCode,
      description: '',
      category: '',
      level: 'beginner',
      startDate: '',
      endDate: '',
      schedule: [],
      modules: [],
      enrollmentType: 'open',
      students: [],
      maxStudents: 50,
      gradingSystem: 'percentage',
      assignmentsEnabled: true,
      certificateEnabled: true,
      visibility: 'draft',
    };
    try {
      const saved = localStorage.getItem('courseWizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CourseFormState>;
        if (parsed.title || parsed.code) return { ...defaults, ...parsed };
      }
    } catch { /* ignore corrupt drafts */ }
    return defaults;
  });

  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Code uniqueness check
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const codeCheckTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch actual students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoadingStudents(true);
        const res = await adminApi.getAllUsers({ role: 'student', limit: 100 });
        if (res.data && res.data.success) {
          setAvailableStudents(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch students from API:", err);
        // Fallback to beautiful mock list if API fails or is loading
        setAvailableStudents([
          { _id: 's1', name: 'John Doe', email: 'john@unipartner.com' },
          { _id: 's2', name: 'Ama Mensah', email: 'ama@unipartner.com' },
          { _id: 's3', name: 'Kofi Owusu', email: 'kofi@unipartner.com' },
          { _id: 's4', name: 'Sarah Adams', email: 'sarah@unipartner.com' },
          { _id: 's5', name: 'Emmanuel Debrah', email: 'emmanuel@unipartner.com' },
        ]);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  // Auto-save: persist form draft to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('courseWizard_draft', JSON.stringify(form));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const id = setTimeout(() => setAutoSaveStatus(`Draft saved at ${now}`), 0);
      return () => clearTimeout(id);
    } catch {
      // localStorage unavailable
    }
  }, [form]);

  // Debounced course code uniqueness check
  useEffect(() => {
    if (!form.code || form.code.length < 2) {
      setCodeStatus('idle');
      return;
    }
    setCodeStatus('checking');
    if (codeCheckTimer.current) clearTimeout(codeCheckTimer.current);
    codeCheckTimer.current = setTimeout(async () => {
      try {
        const res = await courseApi.getAll();
        const courses: { code: string }[] = res.data?.data ?? [];
        const taken = courses.some(c => c.code.toLowerCase() === form.code.toLowerCase());
        setCodeStatus(taken ? 'taken' : 'available');
      } catch {
        setCodeStatus('idle');
      }
    }, 600);
    return () => { if (codeCheckTimer.current) clearTimeout(codeCheckTimer.current); };
  }, [form.code]);

  // Generate a unique code suggestion based on title
  const suggestCode = useCallback(async () => {
    const base = form.title
      ? form.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)
      : 'CRS';
    let candidate = `${base}${Math.floor(100 + Math.random() * 900)}`;
    try {
      const res = await courseApi.getAll();
      const codes = new Set((res.data?.data ?? []).map((c: { code: string }) => c.code.toLowerCase()));
      let attempts = 0;
      while (codes.has(candidate.toLowerCase()) && attempts < 10) {
        candidate = `${base}${Math.floor(100 + Math.random() * 900)}`;
        attempts++;
      }
    } catch { /* use candidate as-is */ }
    setForm(p => ({ ...p, code: candidate }));
  }, [form.title]);



  // Real-time validation system calculated dynamically during render
  const warnings: string[] = (() => {
    const activeWarnings: string[] = [];
    if (currentStep === 0) {
      if (!form.title) activeWarnings.push('Please enter a course title to continue');
      else if (form.title.length < 5) activeWarnings.push('Course title should be at least 5 characters');
      if (!form.code) activeWarnings.push('Please enter a unique catalog code');
      else if (codeStatus === 'taken') activeWarnings.push(`Course code "${form.code}" is already taken — use a different code or click Suggest`);
      else if (codeStatus === 'checking') activeWarnings.push('Checking code availability...');
      if (!form.description) activeWarnings.push('Please provide a short course summary');
      else if (form.description.length < 10) activeWarnings.push('Course summary must be at least 10 characters');
      if (!form.category) activeWarnings.push('Please select a course category');
    } else if (currentStep === 1) {
      if (!form.startDate) activeWarnings.push('Please configure a valid start date');
      if (!form.endDate) activeWarnings.push('Please configure a valid end date');
      if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
        activeWarnings.push('End date must be after the start date');
      }
      if (form.schedule.length === 0) activeWarnings.push('Recommend adding at least one weekly live class session');
    } else if (currentStep === 2) {
      if (form.modules.length === 0) activeWarnings.push('Add at least one module to architect your curriculum skeleton');
    }
    return activeWarnings;
  })();

  const handleNext = () => {
    if (warnings.length > 0) return;
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleAiGenerate = useCallback(() => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        title: 'Advanced React & Next.js Systems',
        code: 'CS-302',
        description: 'Dive deep into server components, routing architectures, state coordination, and performance engineering inside React 19.',
        category: 'Technology',
        level: 'advanced',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        schedule: [{ id: getUniqueId(), day: 'Monday', time: '10:00 AM - 12:00 PM' }],
        modules: [
          {
            id: getUniqueId(),
            title: 'Introduction to React Server Components',
            lessons: [
              { id: getUniqueId(), title: 'RSC vs SSR: Core paradigms', type: 'video' as const },
              { id: getUniqueId(), title: 'Designing interactive boundary layouts', type: 'document' as const },
            ]
          },
          {
            id: getUniqueId(),
            title: 'Next.js App Routing and Middleware Security',
            lessons: [
              { id: getUniqueId(), title: 'Route interception and virtual slots', type: 'video' as const },
              { id: getUniqueId(), title: 'Security audit quiz', type: 'quiz' as const },
            ]
          }
        ]
      }));
      setIsAiGenerating(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutoSaveStatus(`AI generation loaded & saved at ${now}`);
    }, 1500);
  }, []);

  useEffect(() => {
    if (searchParams.get('ai') === 'true') {
      // Defer to avoid synchronous setState inside effect body
      const id = setTimeout(() => handleAiGenerate(), 0);
      return () => clearTimeout(id);
    }
  }, [handleAiGenerate, searchParams]);

  // Schedule sub-sessions
  const addScheduleSession = () => {
    const newSession: Session = { id: getUniqueId(), day: 'Monday', time: '10:00 AM - 12:00 PM' };
    setForm(prev => ({ ...prev, schedule: [...prev.schedule, newSession] }));
  };

  const removeScheduleSession = (id: string) => {
    setForm(prev => ({ ...prev, schedule: prev.schedule.filter(s => s.id !== id) }));
  };

  const updateScheduleSession = (id: string, field: keyof Session, value: string) => {
    setForm(prev => ({
      ...prev,
      schedule: prev.schedule.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  // Content Modules / Lessons
  const addModule = () => {
    const newModule: Module = { id: getUniqueId(), title: 'Untitled Module', lessons: [] };
    setForm(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
  };

  const updateModuleTitle = (id: string, title: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, title } : m)
    }));
  };

  const removeModule = (id: string) => {
    setForm(prev => ({ ...prev, modules: prev.modules.filter(m => m.id !== id) }));
  };

  const addLesson = (moduleId: string, type: Lesson['type']) => {
    const newLesson: Lesson = { id: getUniqueId(), title: `New ${type.toUpperCase()}`, type };
    setForm(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m)
    }));
  };

  const updateLessonTitle = (moduleId: string, lessonId: string, title: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title } : l)
      } : m)
    }));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? {
        ...m,
        lessons: m.lessons.filter(l => l.id !== lessonId)
      } : m)
    }));
  };

  // Student list additions
  const toggleStudent = (id: string) => {
    setForm(prev => {
      const exists = prev.students.includes(id);
      return {
        ...prev,
        students: exists ? prev.students.filter(s => s !== id) : [...prev.students, id]
      };
    });
  };

  // Memoized filtered student list
  const filteredStudents = useMemo(
    () => availableStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())),
    [availableStudents, studentSearch]
  );

  // Submit complete course details
  const handleSubmit = async (visibility: 'draft' | 'published') => {
    // Block if code is taken or still being checked
    if (codeStatus === 'taken') {
      toast.error(`Course code "${form.code}" is already taken. Please use a different code.`);
      setCurrentStep(0);
      return;
    }
    if (codeStatus === 'checking') {
      toast.error('Please wait — checking code availability...');
      return;
    }

    const submitToast = toast.loading('Publishing course and persisting structure...');
    try {
      // 1. Derive semester & academic year from start date
      const currentYear = new Date().getFullYear();
      let academicYear = `${currentYear}/${currentYear + 1}`;
      let semester: 'Semester 1' | 'Semester 2' = 'Semester 1';
      if (form.startDate) {
        const dateObj = new Date(form.startDate);
        const startYear = dateObj.getFullYear();
        academicYear = `${startYear}/${startYear + 1}`;
        semester = dateObj.getMonth() >= 6 ? 'Semester 1' : 'Semester 2';
      }

      // 2. Build full course payload — all collected form fields
      const coursePayload = {
        title: form.title || 'Untitled Course',
        code: form.code || `CS-${Math.floor(Math.random() * 900 + 100)}`,
        description: form.description || 'No description provided for this course.',
        semester,
        academicYear,
        status: (visibility === 'published' ? 'active' : 'draft') as 'active' | 'draft',
        category: form.category,
        level: form.level,
        startDate: form.startDate,
        endDate: form.endDate,
        enrollmentType: form.enrollmentType,
        maxStudents: form.maxStudents,
        gradingSystem: form.gradingSystem,
        assignmentsEnabled: form.assignmentsEnabled,
        certificateEnabled: form.certificateEnabled,
        schedule: form.schedule.map(s => ({ day: s.day, time: s.time })),
      };

      // 3. Persist course core
      const res = await courseApi.create(coursePayload);
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.message || 'Failed to create course');
      }

      const courseId: string = res.data.data._id;

      // 4. Persist modules AND their lessons in order
      if (form.modules.length > 0) {
        for (let idx = 0; idx < form.modules.length; idx++) {
          const mod = form.modules[idx];
          const modRes = await courseApi.createModule(courseId, {
            title: mod.title,
            weekNumber: idx + 1,
            order: idx + 1,
          });

          // Persist lessons for this module
          const createdModuleId: string | undefined =
            modRes.data?.data?._id ?? modRes.data?._id;

          if (createdModuleId && mod.lessons.length > 0) {
            for (const lesson of mod.lessons) {
              const lessonFormData = new FormData();
              lessonFormData.append('title', lesson.title);
              lessonFormData.append('type', lesson.type);
              await courseApi.createLesson(courseId, createdModuleId, lessonFormData);
            }
          }
        }
      }

      // 5. Enroll selected students
      if (form.students.length > 0) {
        await courseApi.enrollStudents(courseId, form.students);
      }

      // 6. Clear draft from localStorage on success
      try { localStorage.removeItem('courseWizard_draft'); } catch { /* ignore */ }

      toast.success(`Course "${coursePayload.title}" created successfully!`, { id: submitToast });

      setTimeout(() => {
        router.push('/courses');
      }, 1000);

    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string; details?: string[] } }; message?: string };
      const details = error.response?.data?.details;
      const errMsg = details && details.length > 0
        ? details.join(', ')
        : (error.response?.data?.message || error.message || 'An error occurred');
      toast.error(`Failed to create course: ${errMsg}`, { id: submitToast });
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* 🧭 TOP NAVIGATION BAR */}
      <header className="sticky top-0 bg-white border-b border-slate-100 px-8 py-4 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/courses" className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors">
            <X size={20} />
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Create Course</h1>
            <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Wizard Builder</span>
              <span>•</span>
              <span className="text-primary-600 font-semibold">
                {autoSaveStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSubmit('draft')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
          >
            <Save size={14} /> Save Draft
          </button>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* 🧭 LEFT COLUMN: STEP NAVIGATION */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm space-y-1">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === idx;
                const isCompleted = idx < currentStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (idx < currentStep || warnings.length === 0) {
                        setCurrentStep(idx);
                      }
                    }}
                    disabled={idx > currentStep && warnings.length > 0}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' 
                        : isCompleted
                          ? 'text-emerald-600 hover:bg-slate-50' 
                          : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-md' 
                        : isCompleted
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    </div>
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider leading-none mb-1">
                        Step {idx + 1}
                      </span>
                      <span className={`block text-sm font-extrabold truncate ${
                        isActive ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Validation Panel */}
            <AnimatePresence>
              {warnings.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="bg-amber-50 border border-amber-200 rounded-[20px] p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
                    <AlertCircle size={16} /> Warnings & Errors
                  </div>
                  <ul className="space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700 font-medium leading-relaxed flex items-start gap-1">
                        <span>•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* 🖥️ MAIN PANEL: FORM STEP CONTENT */}
          <main className="lg:col-span-6 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-slate-200 rounded-[32px] p-8 sm:p-10 shadow-sm relative overflow-hidden"
              >
                
                {/* 1. BASIC INFORMATION VIEW */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Basic Information</h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">Define core identity details for your virtual catalog.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Course Title *</label>
                        <input 
                          type="text"
                          required
                          value={form.title}
                          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="Introduction to Programming"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Course Code *</label>
                          <button
                            type="button"
                            onClick={suggestCode}
                            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                          >
                            <RefreshCw size={11} /> Suggest
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            value={form.code}
                            onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                            placeholder="CS101"
                            className={`w-full bg-slate-50 border rounded-xl px-4 py-3 pr-10 text-slate-900 placeholder:text-slate-400 text-sm font-bold focus:bg-white transition-all outline-none ${
                              codeStatus === 'taken'      ? 'border-red-400 focus:border-red-500' :
                              codeStatus === 'available'  ? 'border-emerald-400 focus:border-emerald-500' :
                              'border-slate-200 focus:border-primary-500'
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {codeStatus === 'checking'  && <SpinnerIcon size={14} className="animate-spin text-slate-400" />}
                            {codeStatus === 'available' && <CheckCircle2 size={14} className="text-emerald-500" />}
                            {codeStatus === 'taken'     && <AlertCircle size={14} className="text-red-500" />}
                          </div>
                        </div>
                        {codeStatus === 'taken' && (
                          <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} /> This code is taken.{' '}
                            <button type="button" onClick={suggestCode} className="underline font-semibold">Suggest one</button>
                          </p>
                        )}
                        {codeStatus === 'available' && (
                          <p className="text-xs text-emerald-600 font-medium mt-1.5">✓ Code is available</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description *</label>
                        <textarea 
                          rows={4}
                          required
                          value={form.description}
                          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Write a short description of the course..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:border-primary-500 transition-all outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="course-category" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category *</label>
                          <select 
                            id="course-category"
                            title="Course Category"
                            value={form.category}
                            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                          >
                            <option value="">Select category ▼</option>
                            <option value="Science">Science</option>
                            <option value="Technology">Technology</option>
                            <option value="Business">Business</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Level *</label>
                          <div className="flex items-center gap-3 h-12">
                            {(['beginner', 'intermediate', 'advanced'] as const).map(l => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, level: l }))}
                                className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                                  form.level === l 
                                    ? 'bg-primary-600 text-white border-primary-600' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. STRUCTURE & SCHEDULE */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Schedule & Sessions</h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">Configure your semesters and recurring class times.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="start-date" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date *</label>
                          <input 
                            id="start-date"
                            type="date"
                            title="Start Date"
                            value={form.startDate}
                            onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="end-date" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">End Date *</label>
                          <input 
                            id="end-date"
                            type="date"
                            title="End Date"
                            value={form.endDate}
                            onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Class Schedule *</label>
                          <button 
                            type="button" 
                            onClick={addScheduleSession}
                            className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                          >
                            <Plus size={14} /> Add Session
                          </button>
                        </div>

                        {form.schedule.length === 0 ? (
                          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                            <Clock size={20} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-400">No scheduled sessions. Click &quot;Add Session&quot; to configure weekly hours.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {form.schedule.map((session, idx) => (
                              <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <select 
                                  title="Schedule Day"
                                  value={session.day} 
                                  onChange={e => updateScheduleSession(session.id, 'day', e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                                <input 
                                  type="text" 
                                  value={session.time} 
                                  onChange={e => updateScheduleSession(session.id, 'time', e.target.value)}
                                  placeholder="e.g. 10:00 AM - 12:00 PM"
                                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => removeScheduleSession(session.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                  title="Remove session"
                                  aria-label="Remove scheduled class session"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. COURSE CONTENT */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Modules & Lessons</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Design your structured virtual learning skeleton.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={addModule}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-bold hover:bg-primary-100 transition-colors"
                      >
                        <Plus size={14} /> Add Module
                      </button>
                    </div>

                    <div className="space-y-4">
                      {form.modules.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[20px]">
                          <Layout size={32} className="text-slate-200 mx-auto mb-4" />
                          <h4 className="font-extrabold text-slate-800 text-sm mb-1">No modules yet</h4>
                          <p className="text-xs text-slate-500 font-medium mb-4 max-w-xs mx-auto">Build curriculum layers with interactive modules and lessons.</p>
                          <button 
                            type="button" 
                            onClick={addModule}
                            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-600/10 hover:bg-primary-700 transition-colors"
                          >
                            + Add your first module
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {form.modules.map((m, mIdx) => (
                            <div key={m.id} className="p-5 border border-slate-200 rounded-[20px] bg-slate-50/50 space-y-4 relative">
                              <div className="flex items-center justify-between gap-3">
                                <input 
                                  type="text" 
                                  value={m.title}
                                  onChange={e => updateModuleTitle(m.id, e.target.value)}
                                  placeholder="Module Title (e.g. Module 1: Introduction)"
                                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-extrabold text-slate-800 outline-none focus:border-primary-500 transition-colors"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => removeModule(m.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 shrink-0"
                                  title="Delete Module"
                                  aria-label={`Delete module titled ${m.title}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {/* Lesson sub-tree */}
                              <div className="space-y-2 pl-4 border-l border-slate-200">
                                {m.lessons.map(lesson => (
                                  <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      lesson.type === 'video' 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : lesson.type === 'quiz' 
                                          ? 'bg-emerald-50 text-emerald-600' 
                                          : 'bg-rose-50 text-rose-600'
                                    }`}>
                                      {lesson.type === 'video' ? <Video size={14} /> : lesson.type === 'quiz' ? <HelpCircle size={14} /> : <FileText size={14} />}
                                    </div>
                                    <input 
                                      type="text" 
                                      value={lesson.title}
                                      onChange={e => updateLessonTitle(m.id, lesson.id, e.target.value)}
                                      placeholder="Lesson Title (e.g. What is Programming?)"
                                      className="flex-1 bg-transparent border-none text-xs font-bold text-slate-700 outline-none"
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => removeLesson(m.id, lesson.id)}
                                      className="text-slate-300 hover:text-rose-500 p-1 shrink-0"
                                      title="Remove lesson"
                                      aria-label={`Remove lesson titled ${lesson.title}`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}

                                {/* Add Lesson Toggles */}
                                <div className="flex items-center gap-2 pt-2">
                                  {(['video', 'document', 'quiz'] as const).map(type => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => addLesson(m.id, type)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 hover:border-primary-300 text-slate-500 hover:text-primary-600 text-[10px] font-bold uppercase tracking-wider transition-all"
                                    >
                                      + {type}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. STUDENTS & ACCESS */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access & Enrollment</h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">Determine gatekeeper controls and select eligible students.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Enrollment Type *</label>
                        <div className="flex items-center gap-4 h-12">
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, enrollmentType: 'open' }))}
                            className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                              form.enrollmentType === 'open' 
                                ? 'bg-primary-600 text-white border-primary-600' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Open Enrollment
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, enrollmentType: 'invite' }))}
                            className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                              form.enrollmentType === 'invite' 
                                ? 'bg-primary-600 text-white border-primary-600' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Invite Only
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Add Students</label>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 text-xs font-medium outline-none focus:bg-white focus:border-primary-500 transition-all"
                          />
                        </div>

                        {/* Search matches */}
                        <div className="space-y-1.5 max-h-44 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                          {isLoadingStudents ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">Loading roster...</div>
                          ) : filteredStudents.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">No students found</div>
                          ) : (
                            filteredStudents.map(student => {
                                const studentId = (student._id || student.id) as string;
                                const isChecked = form.students.includes(studentId);
                                return (
                                  <button
                                    key={studentId}
                                    type="button"
                                    onClick={() => toggleStudent(studentId)}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-primary-300 transition-colors text-left"
                                  >
                                    <div>
                                      <span className="block font-bold text-slate-900 text-xs">{student.name}</span>
                                      <span className="block text-[10px] text-slate-400 font-medium">{student.email}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                      isChecked ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'
                                    }`}>
                                      {isChecked && <CheckCircle2 size={10} />}
                                    </div>
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Max Students (Optional)</label>
                        <input 
                          type="number"
                          value={form.maxStudents}
                          onChange={e => setForm(p => ({ ...p, maxStudents: parseInt(e.target.value, 10) || 0 }))}
                          placeholder="50"
                          className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SETTINGS & PUBLISH */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Syllabus Launch Settings</h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">Configure grading preferences, credentialing rules, and launch course catalog.</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Grading System</label>
                        <div className="flex items-center gap-4 h-12">
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, gradingSystem: 'percentage' }))}
                            className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                              form.gradingSystem === 'percentage' 
                                ? 'bg-primary-600 text-white border-primary-600' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Percentage
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, gradingSystem: 'passfail' }))}
                            className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                              form.gradingSystem === 'passfail' 
                                ? 'bg-primary-600 text-white border-primary-600' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Pass / Fail
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Additional Rules</label>
                        
                        <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                          <div>
                            <span className="block font-bold text-slate-900 text-xs">Enable Assignments</span>
                            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Allow virtual tasks and auto-grade checks.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={form.assignmentsEnabled}
                            onChange={e => setForm(p => ({ ...p, assignmentsEnabled: e.target.checked }))}
                            className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                          <div>
                            <span className="block font-bold text-slate-900 text-xs">Issue Completion Certificate</span>
                            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Generate PDF credential on full modules completion.</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={form.certificateEnabled}
                            onChange={e => setForm(p => ({ ...p, certificateEnabled: e.target.checked }))}
                            className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                          />
                        </label>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Visibility State</label>
                        <div className="flex items-center gap-4 h-12">
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, visibility: 'draft' }))}
                            className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                              form.visibility === 'draft' 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, visibility: 'published' }))}
                            className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                              form.visibility === 'published' 
                                ? 'bg-primary-600 text-white border-primary-600' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Published
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Warnings */}
                {warnings.length > 0 && (
                  <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-xs mb-2 uppercase tracking-widest">
                      <AlertCircle size={14} /> Action Required
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {warnings.map((warn, i) => (
                        <li key={i} className="text-xs text-red-600 font-medium">{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-800 transition-colors ${
                      currentStep === 0 ? 'opacity-0 invisible' : 'opacity-100'
                    }`}
                  >
                    <ArrowLeft size={16} /> Previous
                  </button>

                  {currentStep < STEPS.length - 1 ? (
                    <button 
                      type="button"
                      onClick={handleNext}
                      disabled={warnings.length > 0}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs transition-colors shadow-md ${
                        warnings.length > 0 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/10'
                      }`}
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleSubmit(form.visibility)}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/10"
                    >
                      {form.visibility === 'published' ? 'Publish Course 🚀' : 'Save as Draft'}
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          </main>

          {/* 📊 RIGHT COLUMN: REAL-TIME INLINE PREVIEW & AI INSIGHTS */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="sticky top-28 space-y-6">
              
              {/* Dynamic Real-time Preview Card */}
              <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                <div className="h-32 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 z-10" />
                  <div className="absolute inset-0 bg-primary-500 opacity-20" />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                      {form.code || 'CODE101'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider text-slate-800">
                      Live Preview
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{form.category || 'CATEGORY'}</span>
                    <h3 className="text-lg font-extrabold text-slate-900 truncate mt-1">{form.title || 'Course Title'}</h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-3 mt-1.5 leading-relaxed">
                      {form.description || 'Describe what your students will learn in this course catalog...'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</span>
                      <span className="block text-base font-extrabold text-slate-900">{form.students.length} / {form.maxStudents || '50'}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modules</span>
                      <span className="block text-base font-extrabold text-slate-900">{form.modules.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Guidance box */}
              <div className="rounded-[24px] bg-slate-900 border border-slate-800 p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-500 rounded-full blur-[40px] opacity-10" />
                <div className="flex items-center gap-2 text-primary-400 text-xs font-black uppercase tracking-[0.15em] mb-3">
                  <Sparkle size={14} /> AI Advisor
                </div>
                <p className="text-xs font-medium leading-relaxed opacity-90">
                  {currentStep === 0 && "Including an academic department and detailed description helps search indexing catalog lookups."}
                  {currentStep === 1 && "Ensure recurring dates do not conflict with university term periods and schedule recurring sessions."}
                  {currentStep === 2 && "Splitting structures into logical, video-supported modules boosts curriculum completion rate by 40%."}
                  {currentStep === 3 && "Setting class maximum limits guarantees higher cohort focus streak scores."}
                  {currentStep === 4 && "Certificates act as powerful enrollment incentives. Highly recommended to keep enabled."}
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
