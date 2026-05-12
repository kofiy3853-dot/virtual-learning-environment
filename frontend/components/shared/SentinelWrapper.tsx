'use client';

import React from 'react';
import SentinelFeed from './SentinelFeed';
import { useSentinel } from '@/context/SentinelContext';

export default function SentinelWrapper() {
  const { isSentinelOpen, closeSentinel } = useSentinel();
  
  return (
    <SentinelFeed isOpen={isSentinelOpen} onClose={closeSentinel} />
  );
}
