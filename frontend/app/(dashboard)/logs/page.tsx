'use client';

import React from 'react';
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
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Mock Data ---
const LOGS = [
  { id: '1', timestamp: '15:24:12', event: 'Voice Capture', status: 'Success', latency: '12ms', type: 'Input' },
  { id: '2', timestamp: '15:24:13', event: 'Intent Extraction', status: 'Success', latency: '245ms', type: 'Processing' },
  { id: '3', timestamp: '15:24:14', event: 'Security Validation', status: 'Success', latency: '42ms', type: 'Security' },
  { id: '4', timestamp: '15:24:15', event: 'Prompt Compression', status: 'Success', latency: '180ms', type: 'Optimization' },
  { id: '5', timestamp: '15:24:16', event: 'Deterministic Mapping', status: 'Success', latency: '65ms', type: 'Core' },
  { id: '6', timestamp: '15:25:01', event: 'Engine Warm-up', status: 'Warning', latency: '1.2s', type: 'System' },
  { id: '7', timestamp: '15:25:05', event: 'Memory Retrieval', status: 'Success', latency: '8ms', type: 'Database' },
];

const ANALYTICS = [
  { label: 'Avg Latency', value: '184ms', change: '-12%', icon: Zap },
  { label: 'Token Efficiency', value: '68.4%', change: '+5.2%', icon: Cpu },
  { label: 'Security Score', value: '99.8', change: '+0.1%', icon: ShieldCheck },
  { label: 'Error Rate', value: '0.02%', change: '-0.01%', icon: AlertCircle },
];

export default function DecisionLogs() {
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
          <Button className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold">
            Live Monitoring
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
                "text-[10px] font-bold px-2 py-1 rounded",
                stat.change.startsWith('+') ? "bg-success/10 text-success" : "bg-primary-accent/10 text-primary-accent"
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
              />
            </div>
          </div>
          
          <div className="premium-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Event</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Latency</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-white/40">{log.timestamp}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white/80">{log.event}</td>
                    <td className="px-6 py-4 text-[10px] text-white/40 uppercase font-medium">{log.type}</td>
                    <td className="px-6 py-4 text-xs text-white/60">{log.latency}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        log.status === 'Success' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      )}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-white/20 hover:text-white" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Execution Trace Sidebar */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-secondary-accent" />
            Execution Trace
          </h3>
          <div className="premium-card p-6 flex-1 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="space-y-8 relative">
              {/* Timeline Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-border" />
              
              {[
                { title: 'STT Conversion', desc: 'Audio packet 829-X processed via Whisper-v3.', time: '0ms' },
                { title: 'NLP Extraction', desc: 'Entities identified: [Marketing, Fitness, Pro].', time: '+124ms' },
                { title: 'Pattern Match', desc: 'Matching existing memory: MEM-824.', time: '+182ms' },
                { title: 'Synthesis', desc: 'Deterministic prompt mapping complete.', time: '+240ms' },
              ].map((step, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center z-10 group-hover:border-secondary-accent transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-secondary-accent" />
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-white/90">{step.title}</h4>
                    <span className="text-[10px] font-mono text-white/30">{step.time}</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-white/40">
              <div className="flex items-center gap-2 mb-2 text-primary-accent">
                <Code className="w-3 h-3" />
                <span>TRACE_DEBUG_ID: 8824-AX-99</span>
              </div>
              <p>{"{"}</p>
              <p className="pl-4">"engine": "deterministic_v2",</p>
              <p className="pl-4">"optimizer": "compression_8bit",</p>
              <p className="pl-4">"status": 200</p>
              <p>{"}"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
