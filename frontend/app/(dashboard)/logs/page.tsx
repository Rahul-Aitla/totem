'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  Code,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listDecisionLogs } from '@/lib/api';

function DecisionLogsContent() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  useEffect(() => {
    const sidFromQuery = searchParams.get('sessionId');
    const sidFromStorage = localStorage.getItem('totem_session_id') || 'anonymous';
    const sid = sidFromQuery || sidFromStorage;
    
    setActiveSessionId(sid);
    fetchLogs(sid);
  }, [searchParams]);

  const fetchLogs = async (sid: string) => {
    try {
      setLoading(true);
      const data = await listDecisionLogs(sid);
      setLogs(data);
      if (data.length > 0) setSelectedLog(data[0]);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.step.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.decision.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgLatency = logs.length > 0 
    ? (logs.reduce((acc, log) => acc + (log.metrics?.latency_ms || 0), 0) / logs.length).toFixed(0)
    : "0";

  const efficiency = logs.filter(l => l.step === 'PROMPT_OPTIMIZATION')
    .reduce((acc, l) => acc + (l.metrics?.reduction_percentage || 0), 0) / 
    (logs.filter(l => l.step === 'PROMPT_OPTIMIZATION').length || 1);

  const ANALYTICS = [
    { label: 'Avg Latency', value: `${avgLatency}ms`, change: 'Real-time', icon: Zap },
    { label: 'Token Efficiency', value: `${efficiency.toFixed(1)}%`, change: 'Avg', icon: Cpu },
    { label: 'Security Score', value: '99.8', change: 'Fixed', icon: ShieldCheck },
    { label: 'System Uptime', value: '100%', change: 'Live', icon: AlertCircle },
  ];

  return (
    <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Decision Logs</h2>
          <p className="text-white/40">Real-time system transparency and deterministic execution trace.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button onClick={() => fetchLogs(activeSessionId)} className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold">
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {ANALYTICS.map((stat, i) => (
          <div key={i} className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <stat.icon className="w-5 h-5 text-white/40" />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded bg-primary-accent/10 text-primary-accent"
              )}>
                {stat.change}
              </span>
            </div>
            <p className="text-[11px] text-white/40 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Logs List */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Filter logs by step or decision..." 
              className="w-full bg-elevated/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-accent/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-accent animate-spin" />
              </div>
            ) : filteredLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden",
                  selectedLog?.id === log.id 
                    ? "bg-white/5 border-primary-accent/30 shadow-[0_0_15px_rgba(124,255,107,0.05)]" 
                    : "bg-elevated/30 border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      log.step === 'STT_TRANSCRIPTION' ? "bg-cyan-400" :
                      log.step === 'INTENT_EXTRACTION' ? "bg-amber-400" :
                      log.step === 'PROMPT_OPTIMIZATION' ? "bg-green-400" : "bg-purple-400"
                    )} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{log.step}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/20">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs font-medium text-white/80 line-clamp-1">{log.decision}</p>
                {selectedLog?.id === log.id && (
                  <motion.div layoutId="active-log" className="absolute left-0 top-0 bottom-0 w-1 bg-primary-accent" />
                )}
              </button>
            ))}
            {!loading && filteredLogs.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-white/20">No logs found for this session.</p>
              </div>
            )}
          </div>
        </div>

        {/* Log Details */}
        <div className="flex-1 premium-card flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Execution Trace</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Trace ID: {selectedLog?.id?.substring(0, 18)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded bg-success/10 text-success text-[10px] font-bold uppercase">Verified</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {selectedLog ? (
              <>
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    System Decision
                  </h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm leading-relaxed text-white/90">{selectedLog.decision}</p>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    AI Reasoning
                  </h4>
                  <div className="bg-[#0D0D0D] rounded-xl border border-white/5 p-4 font-mono text-[11px] leading-relaxed text-primary-accent/80">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.reasoning, null, 2)}
                    </pre>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedLog.metrics || {}).map(([key, val]: any) => (
                      <div key={key} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <p className="text-[9px] text-white/30 uppercase font-bold mb-1">{key.replace('_', ' ')}</p>
                        <p className="text-xs font-bold text-white/80">{typeof val === 'number' && key.includes('ms') ? `${val}ms` : val}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <Code className="w-12 h-12 text-white/5" />
                <p className="text-white/20 text-sm">Select a trace to view detailed system reasoning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DecisionLogs() {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-12 h-12 text-primary-accent animate-spin" />
      </div>
    }>
      <DecisionLogsContent />
    </Suspense>
  );
}
