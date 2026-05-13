'use client';

import AssignmentBuilder from '@/components/builder/AssignmentBuilder';
import { motion } from 'framer-motion';

export default function NewAssignmentPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#F8FAFC]"
    >
      <AssignmentBuilder />
    </motion.div>
  );
}
