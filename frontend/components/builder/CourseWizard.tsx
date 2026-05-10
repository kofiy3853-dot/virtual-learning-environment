'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Shield, Layout, Palette, CheckCircle2, 
  ArrowRight, ArrowLeft, Save, Loader2, Info
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import StructureBuilder from './StructureBuilder';
import AccessSettings from './AccessSettings';
import AppearanceSettings from './AppearanceSettings';
import ReviewLaunch from './ReviewLaunch';

// --- WIZARD SCHEMA ---
const courseSchema = z.object({
  title: z.string().min(5, "Course title must be at least 5 characters"),
  code: z.string().min(3, "Course code is required"),
  description: z.string().min(20, "Please provide a more detailed description"),
  department: z.string().min(2, "Department is required"),
  semester: z.string().default('Semester 1'),
  level: z.string().default('Level 100'),
  accentColor: z.string().default('#2563EB'),
});

type CourseFormData = z.infer<typeof courseSchema>;

const STEPS = [
  { id: 'identity',   title: 'Identity',    icon: Sparkles, desc: 'Core academic metadata and identity' },
  { id: 'structure',  title: 'Architect',   icon: Layout,   desc: 'Design your curriculum skeleton' },
  { id: 'access',     title: 'Gatekeeper',  icon: Shield,   desc: 'Protocols and enrollment controls' },
  { id: 'appearance', title: 'Stylist',     icon: Palette,  desc: 'Visual personality and branding' },
  { id: 'review',     title: 'Launchpad',   icon: CheckCircle2, desc: 'Final audit and publication' },
];

export default function CourseWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    mode: 'onChange',
  });

  const formValues = watch();

  const nextStep = () => {
    setDirection(1);
    setCurrentStep(p => Math.min(p + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep(p => Math.max(p - 1, 0));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Wizard Header & Progress */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 text-balance">
                {STEPS[currentStep].title}. <span className="text-blue-600">Workspace</span>
              </h1>
              <p className="text-slate-500 font-medium italic">{STEPS[currentStep].desc}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 text-slate-600 font-black text-xs hover:bg-slate-100 transition-all uppercase tracking-widest">
                <Save size={14} /> Save Draft
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <div className="px-6 py-3">
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Step {currentStep + 1} of {STEPS.length}</span>
              </div>
            </div>
          </div>

          {/* Stepper Dots/Line */}
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
            <div 
              className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 z-0 transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 95}%` }}
            />
            
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <button 
                    onClick={() => {
                      if (i < currentStep) {
                        setDirection(i < currentStep ? -1 : 1);
                        setCurrentStep(i);
                      }
                    }}
                    disabled={i > currentStep}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                      isCurrent 
                        ? 'bg-blue-600 border-blue-100 text-white shadow-xl shadow-blue-600/20 scale-110' 
                        : isActive 
                          ? 'bg-blue-50 border-blue-50 text-blue-600' 
                          : 'bg-white border-slate-100 text-slate-300'
                    }`}
                  >
                    <Icon size={24} />
                  </button>
                  <div className="absolute top-18 flex flex-col items-center w-32">
                     <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                       {step.title}
                     </span>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-20">
          
          {/* Step Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -50 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-[48px] border border-slate-200 p-10 lg:p-16 shadow-xl shadow-slate-900/5 relative overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
                
                {renderStepContent(currentStep, register, errors, formValues)}

                {currentStep < STEPS.length - 1 && (
                  <div className="mt-16 pt-10 border-t border-slate-100 flex items-center justify-between">
                    <button 
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all ${currentStep === 0 ? 'opacity-0 invisible' : 'opacity-100'}`}
                    >
                      <ArrowLeft size={18} /> Previous Step
                    </button>
                    
                    <button 
                      onClick={nextStep}
                      className="flex items-center gap-4 px-10 py-5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-2xl shadow-blue-600/20 transition-all active:scale-95 group"
                    >
                      Continue Journey
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Intelligence Panel / Preview */}
          <div className="lg:col-span-4">
             <div className="sticky top-12 space-y-8">
                {/* Dynamic Preview Card */}
                <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl">
                   <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10" />
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 z-10">
                         <Layout size={32} />
                      </div>
                      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                         <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                            Real-time Preview
                         </div>
                      </div>
                      {/* Course Accent Color Visual */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-20 -translate-y-1/2 translate-x-1/2 rounded-full" style={{ backgroundColor: '#2563EB' }} />
                   </div>
                   <div className="p-8">
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">
                         <Sparkles size={12} /> {formValues.code || 'CATALOG-CODE'}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3 truncate">
                        {formValues.title || 'Course Title'}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm line-clamp-3 mb-8 text-balance">
                        {formValues.description || 'Define the learning objectives of your program...'}
                      </p>
                      <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Students</span>
                            <span className="text-lg font-black text-slate-900">0</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modules</span>
                            <span className="text-lg font-black text-slate-900">1</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* AI Insight Box */}
                <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                         <Info size={16} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-blue-100">Genesis Insights</span>
                   </div>
                   <p className="text-sm font-bold leading-relaxed opacity-90 italic">
                     {getInsight(currentStep)}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInsight(step: number) {
  const insights = [
    "Professional courses with high-quality thumbnails see 40% higher student engagement. Try using a clear, academic visual.",
    "A modular curriculum helps students retain 60% more information by providing clear learning milestones.",
    "Grading schemes with multiple assessment types (quizzes + assignments) provide a more holistic view of student progress.",
    "Your course appearance defines your academic brand. Choose an accent color that represents your faculty identity.",
    "Almost ready! Review your readiness checklist to ensure a perfect launch for your students."
  ];
  return insights[step] || insights[0];
}

function renderStepContent(step: number, register: any, errors: any, values: any) {
  switch(step) {
    case 0:
      return (
        <div className="space-y-10">
          <header>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 text-balance">Identity Portal.</h2>
            <p className="text-slate-500 font-medium">Define the academic persona and core metadata of your workspace.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
               <label htmlFor="title" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Course Title *</label>
               <input 
                 id="title"
                 {...register('title')}
                 placeholder="e.g. Advanced Quantum Mechanics"
                 className={`w-full bg-slate-50 border-2 rounded-[24px] px-8 py-6 text-xl text-slate-900 font-black focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all outline-none ${errors.title ? 'border-rose-200' : 'border-slate-100 focus:border-blue-600'}`}
               />
               {errors.title && <p className="mt-3 text-xs font-black text-rose-500 uppercase tracking-widest">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-1">
               <label htmlFor="code" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Catalog Code *</label>
               <input 
                 id="code"
                 {...register('code')}
                 placeholder="e.g. PHYS-402"
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
               />
            </div>

            <div className="md:col-span-1">
               <label htmlFor="dept" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Academic Dept *</label>
               <input 
                 id="dept"
                 {...register('department')}
                 placeholder="e.g. Faculty of Science"
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
               />
            </div>

            <div className="md:col-span-2">
               <label htmlFor="desc" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Description</label>
               <textarea 
                 id="desc"
                 {...register('description')}
                 rows={4}
                 placeholder="What will your students discover in this course?"
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-8 py-6 text-slate-900 font-medium focus:bg-white focus:border-blue-600 transition-all outline-none resize-none"
               />
            </div>
          </div>
        </div>
      );
    case 1:
      return <StructureBuilder />;
    case 2:
      return <AccessSettings />;
    case 3:
      return <AppearanceSettings />;
    case 4:
      return <ReviewLaunch />;
    default:
      return <div className="py-20 text-center flex flex-col items-center">
         <div className="w-20 h-20 bg-blue-50 text-blue-200 rounded-[32px] flex items-center justify-center mb-6">
            <Layout size={40} />
         </div>
         <h3 className="text-2xl font-black text-slate-900 mb-2">{STEPS[step].title} Hub</h3>
         <p className="text-slate-500 font-medium italic italic">"This intelligence unit is being calibrated. Please proceed with the syllabus."</p>
      </div>;
  }
}
