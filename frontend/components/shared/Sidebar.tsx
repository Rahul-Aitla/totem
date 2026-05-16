'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  GitBranch, 
  BrainCircuit, 
  Activity, 
  Settings, 
  Mic2,
  ChevronRight,
  Database,
  RotateCcw,
  Clock,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { listSessions } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflow', href: '/workflow', icon: GitBranch },
  { name: 'Memory', href: '/memory', icon: BrainCircuit },
  { name: 'Decision Logs', href: '/logs', icon: Activity },
];

function formatRelativeTime(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await listSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };

    fetchSessions();
    // Refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchSession = (sid: string) => {
    localStorage.setItem('totem_session_id', sid);
    // If we are on a page that might have a sessionId query param (like workflow),
    // we should navigate to the base pathname to clear it and use the new session.
    router.push(pathname);
    setTimeout(() => window.location.reload(), 100);
  };

  const handleResetSession = () => {
    const newSid = `session-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('totem_session_id', newSid);
    router.push(pathname);
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="flex flex-col h-full w-[260px] bg-secondary border-r border-border p-6 gap-8 overflow-y-auto">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary-accent flex items-center justify-center shadow-[0_0_20px_rgba(124,255,107,0.3)]">
          <Mic2 className="text-background w-6 h-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tighter leading-none">VOICE ENGINE</h1>
          <p className="text-[10px] text-primary-accent font-medium tracking-[0.2em] uppercase mt-1">Deterministic AI</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 shrink-0">
        <p className="text-[11px] text-white/40 font-semibold uppercase tracking-widest mb-2 px-2">Navigation</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 relative overflow-hidden",
                isActive 
                  ? "bg-white/5 text-primary-accent" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-5 bg-primary-accent rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-accent" : "text-white/40 group-hover:text-white/80")} />
              <span className="text-[14px] font-medium">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary-accent/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-6 shrink-0">
        <div>
          <p className="text-[11px] text-white/40 font-semibold uppercase tracking-widest mb-4 px-2">Recent Sessions</p>
          <div className="space-y-1">
            {sessions.map((session) => (
              <button 
                key={session.id} 
                onClick={() => handleSwitchSession(session.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-colors text-left group",
                  localStorage.getItem('totem_session_id') === session.id 
                    ? "bg-white/5 text-white" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <History className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                <span className="truncate flex-1">{session.title}</span>
                <span className="text-[10px] opacity-40 group-hover:opacity-60">{formatRelativeTime(session.last_activity_at)}</span>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-white/20 italic">No recent sessions</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-elevated/50 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-secondary-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-white/40">Engine</span>
              <span className="text-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-white/40">Latency</span>
              <span className="text-white/80">24ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 shrink-0">
        <Button 
          variant="ghost" 
          onClick={handleResetSession}
          className="justify-start gap-3 px-3 text-white/40 hover:text-white hover:bg-white/5"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[14px] font-medium">Reset Session</span>
        </Button>
        <button className="flex items-center gap-3 px-3 py-2 text-white/40 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-[14px] font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
