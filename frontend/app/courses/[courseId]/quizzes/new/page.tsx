'use client';

import QuizBuilder from '@/components/builder/QuizBuilder';
import { motion } from 'framer-motion';

export default function NewQuizPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-white"
    >
      <QuizBuilder />
    </motion.div>
  );
}
