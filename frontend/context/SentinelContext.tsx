'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SentinelContextType {
  isSentinelOpen: boolean;
  toggleSentinel: () => void;
  closeSentinel: () => void;
}

const SentinelContext = createContext<SentinelContextType | undefined>(undefined);

export const SentinelProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSentinelOpen, setIsSentinelOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsSentinelOpen(prev => !prev);
    window.addEventListener('toggle-sentinel', handleToggle);
    return () => window.removeEventListener('toggle-sentinel', handleToggle);
  }, []);

  const toggleSentinel = () => setIsSentinelOpen(prev => !prev);
  const closeSentinel = () => setIsSentinelOpen(false);

  return (
    <SentinelContext.Provider value={{ isSentinelOpen, toggleSentinel, closeSentinel }}>
      {children}
    </SentinelContext.Provider>
  );
};

export const useSentinel = () => {
  const context = useContext(SentinelContext);
  if (!context) throw new Error('useSentinel must be used within a SentinelProvider');
  return context;
};
