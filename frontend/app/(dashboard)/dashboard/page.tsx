'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Cpu,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { 
  uploadVoice, 
  extractIntent, 
  confirmIntent as apiConfirmIntent, 
  optimizePrompt as apiOptimizePrompt,
  updateIntent as apiUpdateIntent
} from '@/lib/api';

// --- Types ---
type WorkflowState = 'idle' | 'recording' | 'recorded' | 'processing' | 'confirming' | 'editing' | 'optimizing' | 'completed';

interface PipelineStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  data?: any;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: 'transcript', title: 'Raw Transcript', status: 'pending' },
  { id: 'language', title: 'Language Detection', status: 'pending' },
  { id: 'intent', title: 'Intent Extraction', status: 'pending' },
  { id: 'confirm', title: 'Confirmation Layer', status: 'pending' },
  { id: 'optimize', title: 'Prompt Optimization', status: 'pending' },
  { id: 'final', title: 'Final MVP Prompt', status: 'pending' },
];

const INITIAL_METRICS = {
  confidence: 0,
  language: 'None',
  reduction: 0,
  originalTokens: 0,
  optimizedTokens: 0,
  reasoning: '',
  contextUsed: false,
};

const INITIAL_PERFORMANCE = {
  stt: 0,
  intent: 0,
  optimize: 0,
  total: 0,
};

export default function Dashboard() {
  const [state, setState] = useState<WorkflowState>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [voiceLogId, setVoiceLogId] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const activeSessionIdRef = useRef<string>('');
  
  useEffect(() => {
    let sid = localStorage.getItem('totem_session_id');
    if (!sid) {
      sid = `session-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('totem_session_id', sid);
    }
    activeSessionIdRef.current = sid;
    setSessionId(sid);
  }, []);
  
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);

  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const [editingIntent, setEditingIntent] = useState<any>(null);

  const [performance, setPerformance] = useState(INITIAL_PERFORMANCE);

  const createFreshSession = () => {
    const sid = `session-${Math.random().toString(36).substring(7)}`;
    activeSessionIdRef.current = sid;
    localStorage.setItem('totem_session_id', sid);
    setSessionId(sid);
    return sid;
  };

  const resetWorkflowState = () => {
    setSteps(INITIAL_STEPS.map(step => ({ ...step })));
    setMetrics({ ...INITIAL_METRICS });
    setPerformance({ ...INITIAL_PERFORMANCE });
    setVoiceLogId(null);
    setIntentId(null);
    setEditingIntent(null);
    setLastAudioBlob(null);
  };

  const updateStep = (id: string, status: PipelineStep['status'], data?: any) => {
    const startTime = Date.now();
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, data } : s));
    
    // Update metrics based on step data
    if (status === 'completed') {
      const endTime = Date.now();
      const latency = endTime - startTime; // This is a rough estimate of client-side processing/waiting

      if (id === 'transcript') {
        setPerformance(prev => ({ ...prev, stt: latency }));
      }
      if (id === 'intent') {
        setPerformance(prev => ({ ...prev, intent: latency }));
        setMetrics(prev => ({ ...prev, confidence: (data.confidence_val || 0.95) * 100 }));
      }
      if (id === 'language') {
        setMetrics(prev => ({ ...prev, language: data.lang, confidence: data.confidence * 100 }));
      }
      if (id === 'optimize') {
        setPerformance(prev => ({ 
          ...prev, 
          optimize: data.latency || latency, 
          total: prev.stt + prev.intent + (data.latency || latency) 
        }));
        const reductionNum = typeof data.reduction === 'number' 
          ? data.reduction 
          : parseFloat(data.reduction?.replace('%', '') || '0');
          
        setMetrics(prev => ({ 
          ...prev, 
          reduction: reductionNum, 
          optimizedTokens: data.tokens,
          reasoning: data.reasoning,
          contextUsed: data.context_used
        }));
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
      createFreshSession();
      resetWorkflowState();
      
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
    await handleVoiceUpload(lastAudioBlob, activeSessionIdRef.current || sessionId);
  };

  const reRecord = () => {
    setLastAudioBlob(null);
    setState('idle');
    startRecording();
  };

  const handleVoiceUpload = async (audioBlob: Blob, workflowSessionId: string) => {
    try {
      updateStep('transcript', 'active');
      const result = await uploadVoice(audioBlob, workflowSessionId);
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
        confidence_val: confidence,
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

  const handleIntentUpdate = async (updatedData: any) => {
    if (!intentId) return;
    try {
      const result = await apiUpdateIntent(intentId, updatedData);
      updateStep('intent', 'completed', {
        ...result.intent,
        constraints: JSON.stringify(result.intent.constraints)
      });
      setEditingIntent(null);
      setState('confirming');
    } catch (err) {
      console.error("Failed to update intent:", err);
    }
  };

  const confirmIntent = async () => {
    if (!intentId) return;
    try {
      setState('optimizing');
      updateStep('confirm', 'completed');
      
      const confirmStartTime = Date.now();
      // Real confirmation call
      await apiConfirmIntent(intentId, { confirmed: true, action: 'confirm' });
      
      updateStep('optimize', 'active');
      const result = await apiOptimizePrompt(intentId);
      
      const optimizeEndTime = Date.now();
      const optimizeLatency = optimizeEndTime - confirmStartTime;
      
      updateStep('optimize', 'completed', { 
        reduction: result.reduction_percentage, 
        tokens: result.optimized_tokens,
        reasoning: result.reasoning,
        context_used: result.context_used,
        latency: optimizeLatency
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
    resetWorkflowState();
  };

  const handleExport = () => {
    const finalStep = steps.find(s => s.id === 'final');
    if (!finalStep || !finalStep.data) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      session_id: sessionId,
      optimized_prompt: finalStep.data,
      metrics: metrics,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `optimized_prompt_${sessionId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
              <span>Session: {sessionId}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={reset} className="text-white/40 hover:text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Session
            </Button>
            <Button 
              size="sm" 
              onClick={handleExport}
              disabled={state !== 'completed'}
              className={cn(
                "font-bold transition-all",
                state === 'completed' 
                  ? "bg-primary-accent text-background hover:bg-primary-accent/90" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
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
                    metrics={metrics}
                    onConfirm={step.id === 'confirm' && state === 'confirming' ? confirmIntent : undefined}
                    onEdit={step.id === 'confirm' && state === 'confirming' ? () => {
                      const intentStep = steps.find(s => s.id === 'intent');
                      setEditingIntent(intentStep?.data);
                      setState('editing');
                    } : undefined}
                  />
                ))}
                {state === 'editing' && editingIntent && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card p-8 border-primary-accent/30 bg-primary-accent/[0.02] space-y-6"
                  >
                    <h3 className="text-xl font-display font-bold">Edit Extracted Intent</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Task</label>
                        <input 
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary-accent outline-none"
                          value={editingIntent.task}
                          onChange={e => setEditingIntent({...editingIntent, task: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Domain</label>
                        <input 
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary-accent outline-none"
                          value={editingIntent.domain}
                          onChange={e => setEditingIntent({...editingIntent, domain: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Format</label>
                        <input 
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary-accent outline-none"
                          value={editingIntent.format}
                          onChange={e => setEditingIntent({...editingIntent, format: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button onClick={() => handleIntentUpdate(editingIntent)} className="bg-primary-accent text-background hover:bg-primary-accent/90 font-bold px-8">
                        Save Changes
                      </Button>
                      <Button variant="ghost" onClick={() => setState('confirming')} className="text-white/40 hover:text-white">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
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
            <InsightCard 
              label="Latency" 
              value={performance.total > 0 ? `${performance.total}ms` : "---"} 
              subValue="Total Pipeline" 
              icon={Zap} 
              color="text-warning" 
            />
            
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

function PipelineCard({ step, index, metrics, onConfirm, onEdit }: { step: PipelineStep, index: number, metrics: any, onConfirm?: () => void, onEdit?: () => void }) {
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
                    <Button variant="outline" onClick={onEdit} className="border-white/10 hover:bg-white/5">
                      Edit Intent
                    </Button>
                  </div>
                )}
              </div>
            )}
            {step.id === 'optimize' && (
              <div className="space-y-6">
                <div className="flex items-center gap-12">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-primary-accent">
                      -{typeof step.data.reduction === 'number' ? step.data.reduction.toFixed(0) : step.data.reduction}
                    </span>
                    <span className="text-xs text-white/40 uppercase font-bold">Reduction</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold">{step.data.tokens || metrics.optimizedTokens}</span>
                    <span className="text-xs text-white/40 uppercase font-bold">Tokens</span>
                  </div>
                  <div className="flex-1 h-[1px] bg-border" />
                  <div className="flex items-center gap-2 text-success">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Validated</span>
                  </div>
                </div>

                {metrics.reasoning && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary-accent" />
                        <h5 className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Optimization Reasoning</h5>
                      </div>
                      {metrics.contextUsed && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-accent/20 border border-secondary-accent/20">
                          <BrainCircuit className="w-3 h-3 text-secondary-accent" />
                          <span className="text-[9px] font-bold text-secondary-accent uppercase tracking-wider">Memory Applied</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed italic">
                      {metrics.reasoning}
                    </p>
                  </div>
                )}
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
