'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic2, 
  Sparkles, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Zap, 
  BarChart3, 
  Languages, 
  Fingerprint,
  RotateCcw,
  Plus,
  Info,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Types ---
type WorkflowState = 'idle' | 'listening' | 'processing' | 'confirming' | 'optimizing' | 'completed';

interface PipelineStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  data?: any;
}

// --- Mock Data ---
const MOCK_TRANSCRIPT = "Hey, I need a marketing plan for my new fitness app. It should focus on high-intensity interval training and target busy professionals. Keep it under 100 words and use bullet points.";

const MOCK_INTENT = {
  task: "Marketing Plan",
  domain: "Fitness",
  output: "Bullet Points",
  constraint: "Under 100 words"
};

const MOCK_OPTIMIZED = `### Fitness App Marketing Strategy
- **Core Focus**: High-Intensity Interval Training (HIIT) for time-constrained professionals.
- **Value Prop**: Maximum results in minimum time via mobile-first coaching.
- **Channels**: LinkedIn (Targeting), Strava (Community), and Spotify (Audio Ads).
- **CTA**: "15 Minutes to Peak Performance. Start Free Today."`;

export default function Dashboard() {
  const [state, setState] = useState<WorkflowState>('idle');
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'transcript', title: 'Raw Transcript', status: 'pending' },
    { id: 'language', title: 'Language Detection', status: 'pending' },
    { id: 'intent', title: 'Intent Extraction', status: 'pending' },
    { id: 'confirm', title: 'Confirmation Layer', status: 'pending' },
    { id: 'optimize', title: 'Prompt Optimization', status: 'pending' },
    { id: 'final', title: 'Final MVP Prompt', status: 'pending' },
  ]);

  const startProcessing = () => {
    setState('listening');
    setTimeout(() => {
      setState('processing');
      runPipeline();
    }, 3000);
  };

  const runPipeline = async () => {
    const updateStep = (id: string, status: PipelineStep['status'], data?: any) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status, data } : s));
    };

    updateStep('transcript', 'active');
    await wait(1500);
    updateStep('transcript', 'completed', MOCK_TRANSCRIPT);
    
    updateStep('language', 'active');
    await wait(1000);
    updateStep('language', 'completed', { lang: 'English', confidence: 0.98 });

    updateStep('intent', 'active');
    await wait(1500);
    updateStep('intent', 'completed', MOCK_INTENT);
    
    setState('confirming');
  };

  const confirmIntent = async () => {
    setState('optimizing');
    const updateStep = (id: string, status: PipelineStep['status'], data?: any) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status, data } : s));
    };

    updateStep('confirm', 'completed');
    updateStep('optimize', 'active');
    await wait(2000);
    updateStep('optimize', 'completed', { reduction: '72%', tokens: 121 });

    updateStep('final', 'active');
    await wait(1000);
    updateStep('final', 'completed', MOCK_OPTIMIZED);
    
    setState('completed');
  };

  const reset = () => {
    setState('idle');
    setSteps(steps.map(s => ({ ...s, status: 'pending', data: undefined })));
  };

  return (
    <div className="flex h-full">
      {/* Center Content: Main AI Workflow */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505] border-r border-border/50">
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-display font-bold">Workspace</h2>
            <div className="h-4 w-[1px] bg-border" />
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Clock className="w-4 h-4" />
              <span>Session: Fitness-Marketing-01</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={reset} className="text-white/40 hover:text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Session
            </Button>
            <Button size="sm" className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold">
              Export Result
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto w-full">
          {state === 'idle' || state === 'listening' ? (
            <div className="h-full flex flex-col items-center justify-center gap-12 py-20">
              <VoiceOrb state={state} onClick={startProcessing} />
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-display font-bold">
                  {state === 'idle' ? 'Ready to optimize' : 'Listening to intent...'}
                </h3>
                <p className="text-white/40 max-w-md mx-auto">
                  {state === 'idle' 
                    ? 'Click the engine core to start recording your voice input. We will transform your messy thoughts into deterministic prompts.'
                    : 'System is capturing your voice. Speak clearly about your task, domain, and specific constraints.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {steps.map((step, index) => (
                <PipelineCard 
                  key={step.id} 
                  step={step} 
                  index={index}
                  onConfirm={step.id === 'confirm' && state === 'confirming' ? confirmIntent : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Insights & Analytics */}
      <div className="w-[320px] bg-secondary/30 backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">Real-time Insights</h3>
          
          <div className="space-y-6">
            <InsightCard label="Confidence Score" value="98.4%" subValue="High Signal" icon={ShieldCheck} color="text-primary-accent" />
            <InsightCard label="Detected Language" value="English" subValue="Region: US-East" icon={Languages} color="text-secondary-accent" />
            <InsightCard label="Latency" value="240ms" subValue="Optimized Path" icon={Zap} color="text-warning" />
            
            <div className="p-4 rounded-xl bg-elevated/40 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white/60">Token Reduction</span>
                <span className="text-xs font-bold text-primary-accent">-72%</span>
              </div>
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: state === 'completed' ? '72%' : '0%' }}
                  className="absolute h-full bg-primary-accent" 
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-white/30">
                <span>438 Tokens</span>
                <span>121 Tokens</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">Active Workflow Nodes</h3>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  step.status === 'completed' ? "bg-primary-accent" : 
                  step.status === 'active' ? "bg-secondary-accent animate-pulse" : "bg-white/10"
                )} />
                <span className={cn(
                  "text-[13px] font-medium",
                  step.status === 'pending' ? "text-white/20" : "text-white/80"
                )}>{step.title}</span>
                {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-primary-accent ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function VoiceOrb({ state, onClick }: { state: WorkflowState, onClick: () => void }) {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* Outer Glowing Rings */}
      <motion.div 
        className="absolute -inset-12 border border-primary-accent/10 rounded-full"
        animate={{ scale: [1, 1.1, 1], rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute -inset-8 border border-primary-accent/20 rounded-full"
        animate={{ scale: [1.1, 1, 1.1], rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Main Orb */}
      <motion.div 
        className={cn(
          "w-48 h-48 rounded-full flex items-center justify-center relative z-10 overflow-hidden",
          state === 'listening' ? "bg-primary-accent/20" : "bg-primary-accent/10"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary-accent)_0%,_transparent_70%)] opacity-20" />
        
        <AnimatePresence mode="wait">
          {state === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Mic2 className="w-16 h-16 text-primary-accent" />
            </motion.div>
          ) : (
            <motion.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary-accent rounded-full"
                  animate={{ 
                    height: [20, 60, 20],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse effect */}
        {state === 'listening' && (
          <motion.div 
            className="absolute inset-0 bg-primary-accent/30 rounded-full"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Click to start label */}
      {state === 'idle' && (
        <motion.div 
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-primary-accent text-[11px] font-bold uppercase tracking-[0.3em]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Click to start engine
        </motion.div>
      )}
    </div>
  );
}

function PipelineCard({ step, index, onConfirm }: { step: PipelineStep, index: number, onConfirm?: () => void }) {
  if (step.status === 'pending') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "premium-card overflow-hidden",
        step.status === 'active' && "border-primary-accent/30 bg-primary-accent/[0.02]"
      )}
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border",
            step.status === 'completed' ? "bg-primary-accent/10 border-primary-accent/20" : "bg-white/5 border-white/10"
          )}>
            {step.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-primary-accent" />
            ) : (
              <span className="text-sm font-bold text-white/40">{index + 1}</span>
            )}
          </div>
          <div>
            <h4 className="font-display font-bold">{step.title}</h4>
            <p className="text-[11px] text-white/40 uppercase tracking-widest">
              {step.status === 'active' ? 'Processing...' : 'Verification Complete'}
            </p>
          </div>
        </div>
        
        {step.status === 'active' && (
          <div className="flex gap-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-accent" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-accent" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-accent" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
          </div>
        )}
      </div>

      <div className="p-6 bg-white/[0.01]">
        {step.status === 'active' ? (
          <div className="h-20 flex items-center justify-center">
            <motion.div 
              className="w-12 h-12 rounded-full border-2 border-primary-accent border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            {step.id === 'transcript' && (
              <p className="text-white/80 leading-relaxed italic">"{step.data}"</p>
            )}
            {step.id === 'language' && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-secondary-accent" />
                  <span className="text-sm font-bold">{step.data.lang}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-purple" />
                  <span className="text-sm text-white/40">Confidence: {(step.data.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
            {step.id === 'intent' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(step.data).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="block text-[10px] text-white/30 uppercase tracking-widest mb-1">{key}</span>
                    <span className="text-sm font-bold text-white/80">{value}</span>
                  </div>
                ))}
              </div>
            )}
            {step.id === 'confirm' && (
              <div className="flex flex-col gap-6">
                <p className="text-sm text-white/60">Please confirm the extracted intent before we begin deterministic optimization.</p>
                <div className="flex gap-3">
                  <Button onClick={onConfirm} className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold px-8">
                    Confirm & Optimize
                  </Button>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5">
                    Edit Intent
                  </Button>
                </div>
              </div>
            )}
            {step.id === 'optimize' && (
              <div className="flex items-center gap-12">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-primary-accent">-{step.data.reduction}</span>
                  <span className="text-xs text-white/40 uppercase font-bold">Reduction</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold">{step.data.tokens}</span>
                  <span className="text-xs text-white/40 uppercase font-bold">Tokens</span>
                </div>
                <div className="flex-1 h-[1px] bg-border" />
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Validated</span>
                </div>
              </div>
            )}
            {step.id === 'final' && (
              <div className="bg-elevated/50 border border-white/5 rounded-xl p-6 font-mono text-sm text-primary-accent/90 leading-relaxed whitespace-pre-wrap">
                {step.data}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InsightCard({ label, value, subValue, icon: Icon, color }: any) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={cn("w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 transition-colors group-hover:border-white/20", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white/90">{value}</span>
          <span className="text-[10px] text-white/20 font-medium">— {subValue}</span>
        </div>
      </div>
    </div>
  );
}

// --- Utils ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
