'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    let sid = localStorage.getItem('totem_session_id');
    if (!sid) {
      sid = `session-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('totem_session_id', sid);
    }
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#050505] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
