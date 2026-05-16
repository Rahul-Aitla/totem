'use client';

import React, { useState, useEffect } from 'react';
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

export default function DecisionLogs() {
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
            <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content: Logs and Trace */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Logs Table */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-display font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary-accent" />
                System Event Logs
              </h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  className="w-full bg-elevated/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary-accent/50"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="premium-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Step</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className={cn(
                        "hover:bg-white/[0.01] transition-colors group cursor-pointer",
                        selectedLog?.id === log.id && "bg-white/[0.03]"
                      )}
                    >
                      <td className="px-6 py-4 text-xs font-mono text-white/40">{new Date(log.created_at).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white/80">{log.step}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded",
                          log.was_successful ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}>
                          {log.was_successful ? 'Success' : 'Error'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all" />
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-white/20">No logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Trace Sidebar */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-secondary-accent" />
              Trace Details
            </h3>
            {selectedLog ? (
              <div className="premium-card p-6 flex-1 bg-gradient-to-b from-white/[0.02] to-transparent space-y-6">
                <div>
                  <h4 className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-2">Decision</h4>
                  <p className="text-sm text-white/90 leading-relaxed">{selectedLog.decision}</p>
                </div>
                
                {selectedLog.metrics && (
                  <div>
                    <h4 className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-3">Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedLog.metrics).map(([key, val]: [string, any]) => (
                        <div key={key} className="p-2 rounded bg-white/5 border border-white/5">
                          <span className="block text-[8px] text-white/30 uppercase">{key.replace('_', ' ')}</span>
                          <span className="text-xs font-bold text-white/80">{typeof val === 'number' ? val.toFixed(1) : val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-3">Reasoning</h4>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-white/40">
                    <div className="flex items-center gap-2 mb-2 text-primary-accent">
                      <Code className="w-3 h-3" />
                      <span>LOG_ID: {selectedLog.id.substring(0, 8)}</span>
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.reasoning, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="premium-card p-6 flex-1 flex items-center justify-center text-white/20 italic">
                Select a log to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
