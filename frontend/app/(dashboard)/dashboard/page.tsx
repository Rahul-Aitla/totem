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

import { 
  uploadVoice, 
  extractIntent, 
  confirmIntent as apiConfirmIntent, 
  optimizePrompt as apiOptimizePrompt 
} from '@/lib/api';

// --- Types ---
type WorkflowState = 'idle' | 'recording' | 'recorded' | 'processing' | 'confirming' | 'optimizing' | 'completed';

interface PipelineStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  data?: any;
}

export default function Dashboard() {
  const [state, setState] = useState<WorkflowState>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [voiceLogId, setVoiceLogId] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  useEffect(() => {
    let sid = localStorage.getItem('totem_session_id');
    if (!sid) {
      sid = `session-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('totem_session_id', sid);
    }
    setSessionId(sid);
  }, []);
  
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'transcript', title: 'Raw Transcript', status: 'pending' },
    { id: 'language', title: 'Language Detection', status: 'pending' },
    { id: 'intent', title: 'Intent Extraction', status: 'pending' },
    { id: 'confirm', title: 'Confirmation Layer', status: 'pending' },
    { id: 'optimize', title: 'Prompt Optimization', status: 'pending' },
    { id: 'final', title: 'Final MVP Prompt', status: 'pending' },
  ]);

  const [metrics, setMetrics] = useState({
    confidence: 0,
    language: 'None',
    reduction: 0,
    originalTokens: 0,
    optimizedTokens: 0
  });

  const updateStep = (id: string, status: PipelineStep['status'], data?: any) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, data } : s));
    
    // Update metrics based on step data
    if (status === 'completed') {
      if (id === 'language') {
        setMetrics(prev => ({ ...prev, language: data.lang, confidence: data.confidence * 100 }));
      }
      if (id === 'optimize') {
        const reductionNum = parseFloat(data.reduction.replace('%', ''));
        setMetrics(prev => ({ ...prev, reduction: reductionNum, optimizedTokens: data.tokens }));
      }
    }
  };

  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';
        
      const recorder = new MediaRecorder(stream, { mimeType });
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        setLastAudioBlob(audioBlob);
        setState('recorded');
      };
      
      recorder.start(100);
      setState('recording');
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const uploadAndProcess = async () => {
    if (!lastAudioBlob) return;
    setState('processing');
    await handleVoiceUpload(lastAudioBlob);
  };

  const reRecord = () => {
    setLastAudioBlob(null);
    setState('idle');
    startRecording();
  };

  const handleVoiceUpload = async (audioBlob: Blob) => {
    try {
      updateStep('transcript', 'active');
      const result = await uploadVoice(audioBlob, sessionId);
      setVoiceLogId(result.id);
      
      updateStep('transcript', 'completed', result.text);
      updateStep('language', 'completed', { lang: result.language, confidence: result.confidence });
      
      // Auto-start intent extraction
      await handleIntentExtraction(result.id);
    } catch (err) {
      updateStep('transcript', 'failed', err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleIntentExtraction = async (vLogId: string) => {
    try {
      updateStep('intent', 'active');
      const result = await extractIntent(vLogId);
      setIntentId(result.intent_id);
      
      const confidence = result.intent.confidence || 0;
      updateStep('intent', 'completed', {
        task: result.intent.task,
        domain: result.intent.domain,
        format: result.intent.format,
        confidence: `${(confidence * 100).toFixed(1)}%`,
        constraints: JSON.stringify(result.intent.constraints)
      });

      if (confidence < 0.6) {
        // High ambiguity - show warning but allow proceeding
        updateStep('confirm', 'active', { 
          warning: "The system is not very confident about this intent. Please review carefully before proceeding." 
        });
      } else {
        updateStep('confirm', 'active');
      }
      
      setState('confirming');
    } catch (err) {
      updateStep('intent', 'failed', err instanceof Error ? err.message : 'Extraction failed');
    }
  };

  const confirmIntent = async () => {
    if (!intentId) return;
    try {
      setState('optimizing');
      updateStep('confirm', 'completed');
      
      // Real confirmation call
      await apiConfirmIntent(intentId, { confirmed: true, action: 'confirm' });
      
      updateStep('optimize', 'active');
      const result = await apiOptimizePrompt(intentId);
      
      updateStep('optimize', 'completed', { 
        reduction: `${result.reduction_percentage.toFixed(0)}%`, 
        tokens: result.optimized_tokens 
      });

      updateStep('final', 'active');
      updateStep('final', 'completed', result.optimized_prompt);
      
      setState('completed');
    } catch (err) {
      updateStep('optimize', 'failed', err instanceof Error ? err.message : 'Optimization failed');
    }
  };

  const reset = () => {
    setState('idle');
    setSteps(steps.map(s => ({ ...s, status: 'pending', data: undefined })));
    setVoiceLogId(null);
    setIntentId(null);
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
          {state === 'idle' || state === 'recording' || state === 'recorded' ? (
            <div className="h-full flex flex-col items-center justify-center gap-12 py-20">
              <VoiceOrb 
                state={state} 
                onStart={startRecording} 
                onStop={stopRecording} 
              />
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <h3 className="text-3xl font-display font-bold">
                    {state === 'idle' ? 'Ready to optimize' : state === 'recording' ? 'Listening to intent...' : 'Voice Captured'}
                  </h3>
                  <p className="text-white/40 max-w-md mx-auto">
                    {state === 'idle' 
                      ? 'Click the engine core to start recording your voice input. We will transform your messy thoughts into deterministic prompts.'
                      : state === 'recording'
                      ? 'System is capturing your voice. Speak clearly about your task, domain, and specific constraints.'
                      : 'Your voice input has been recorded and is ready for processing.'}
                  </p>
                </div>

                {state === 'recorded' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 justify-center"
                  >
                    <Button 
                      onClick={uploadAndProcess} 
                      className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold px-8 h-12 rounded-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Process Voice
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={reRecord}
                      className="border-white/10 hover:bg-white/5 h-12 px-8 rounded-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-record
                    </Button>
                  </motion.div>
                )}
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
            <InsightCard 
              label="Confidence Score" 
              value={`${metrics.confidence.toFixed(1)}%`} 
              subValue={metrics.confidence > 80 ? "High Signal" : metrics.confidence > 50 ? "Medium Signal" : "Low Signal"} 
              icon={ShieldCheck} 
              color={metrics.confidence > 80 ? "text-primary-accent" : metrics.confidence > 50 ? "text-warning" : "text-red-400"} 
            />
            <InsightCard label="Detected Language" value={metrics.language} subValue="Auto-detected" icon={Languages} color="text-secondary-accent" />
            <InsightCard label="Latency" value="240ms" subValue="Optimized Path" icon={Zap} color="text-warning" />
            
            <div className="p-4 rounded-xl bg-elevated/40 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white/60">Token Reduction</span>
                <span className="text-xs font-bold text-primary-accent">-{metrics.reduction.toFixed(0)}%</span>
              </div>
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.reduction}%` }}
                  className="absolute h-full bg-primary-accent" 
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-white/30">
                <span>{Math.round(metrics.optimizedTokens / (1 - metrics.reduction/100) || 0)} Tokens</span>
                <span>{metrics.optimizedTokens} Tokens</span>
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

function VoiceOrb({ state, onStart, onStop }: { state: WorkflowState, onStart: () => void, onStop: () => void }) {
  const handleClick = () => {
    if (state === 'idle') onStart();
    else if (state === 'recording') onStop();
  };

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
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
          "w-48 h-48 rounded-full flex items-center justify-center relative z-10 overflow-hidden transition-colors duration-500",
          state === 'recording' ? "bg-primary-accent/20" : 
          state === 'recorded' ? "bg-secondary-accent/20" : "bg-primary-accent/10"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary-accent)_0%,_transparent_70%)] opacity-20" />
        
        <AnimatePresence mode="wait">
          {state === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Mic2 className="w-16 h-16 text-primary-accent" />
            </motion.div>
          ) : state === 'recording' ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 h-16"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary-accent rounded-full"
                  animate={{ 
                    height: [10, Math.random() * 40 + 20, 10],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 0.5 + Math.random() * 0.5, 
                    repeat: Infinity, 
                    delay: i * 0.05,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="recorded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <CheckCircle2 className="w-16 h-16 text-secondary-accent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse effect */}
        {state === 'recording' && (
          <motion.div 
            className="absolute inset-0 bg-primary-accent/30 rounded-full"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Labels */}
      <AnimatePresence>
        {state === 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-primary-accent text-[11px] font-bold uppercase tracking-[0.3em] whitespace-nowrap"
          >
            Click to start engine
          </motion.div>
        )}
        
        {state === 'recording' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-secondary-accent text-[11px] font-bold uppercase tracking-[0.3em] whitespace-nowrap"
          >
            Click to stop engine
          </motion.div>
        )}
      </AnimatePresence>
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
        {step.status === 'active' && step.id !== 'confirm' ? (
          <div className="h-20 flex items-center justify-center">
            <motion.div 
              className="w-12 h-12 rounded-full border-2 border-primary-accent border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : step.status === 'failed' ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">Error: {step.data}</p>
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
            {(step.id === 'confirm' && (step.status === 'active' || step.status === 'completed')) && (
              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-white/60">
                    {step.status === 'completed' 
                      ? "Intent confirmed. Generating optimized prompt..." 
                      : "Please confirm the extracted intent before we begin deterministic optimization."}
                  </p>
                  {step.data?.warning && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <Info className="w-4 h-4 text-warning" />
                      <p className="text-xs text-warning">{step.data.warning}</p>
                    </div>
                  )}
                </div>
                {step.status === 'active' && (
                  <div className="flex gap-3">
                    <Button onClick={onConfirm} className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold px-8">
                      Confirm & Optimize
                    </Button>
                    <Button variant="outline" className="border-white/10 hover:bg-white/5">
                      Edit Intent
                    </Button>
                  </div>
                )}
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
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                  {step.data}
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(step.data);
                    }}
                    className="bg-secondary-accent text-background hover:bg-secondary-accent/90 font-bold"
                  >
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5">
                    Save as Template
                  </Button>
                </div>
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
