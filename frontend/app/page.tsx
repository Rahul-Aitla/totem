'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mic2, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  Shield, 
  Share2,
  Layers,
  Sparkles,
  GitBranch,
  BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary-accent/30 selection:text-primary-accent">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-accent/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple/5 rounded-full blur-[150px] -z-10" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-accent flex items-center justify-center">
              <Mic2 className="text-background w-5 h-5" />
            </div>
            <span className="font-display font-bold tracking-tighter text-xl">VOICE ENGINE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Features</Link>
            <Link href="#workflow" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Workflow</Link>
            <Link href="#architecture" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Architecture</Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-primary-accent/20 text-primary-accent hover:bg-primary-accent/10 rounded-full px-6">
                Launch Workspace
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary-accent text-xs font-bold tracking-widest uppercase mb-8">
              <Sparkles className="w-3 h-3" />
              <span>Next-Gen AI Orchestration</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight mb-8 leading-[1.05]">
              Turn raw voice into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-accent to-secondary-accent">deterministic prompts.</span>
            </h1>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Capture voice, validate intent, and generate high-signal AI-ready prompts with complete system transparency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary-accent text-background hover:bg-primary-accent/90 rounded-full px-8 h-14 text-base font-bold">
                  Launch Workspace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/workflow">
                <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 rounded-full px-8 h-14 text-base font-bold">
                  View Workflow
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* AI Pipeline Visualization */}
          <div className="mt-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-accent/5 to-transparent blur-3xl -z-10" />
            <PipelineVisualization />
          </div>
        </div>
      </section>

      {/* Stats/Metrics */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Optimizations', value: '1.2M+', icon: Zap },
              { label: 'Tokens Saved', value: '42%', icon: Cpu },
              { label: 'Intent Accuracy', value: '99.9%', icon: Shield },
              { label: 'Active Nodes', value: '850', icon: Layers },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <stat.icon className="w-6 h-6 text-primary-accent" />
                </div>
                <div className="text-3xl font-display font-bold mb-1">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-display font-bold mb-4">Engineered for Precision</h2>
            <p className="text-white/40 max-w-xl mx-auto">Built for enterprise-grade AI workflows where accuracy is non-negotiable.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Voice Intelligence",
                desc: "High-fidelity transcription with domain-aware context extraction.",
                icon: Mic2,
                color: "primary-accent"
              },
              {
                title: "Deterministic Mapping",
                desc: "Transform fuzzy natural language into strict, executable prompt structures.",
                icon: GitBranch,
                color: "secondary-accent"
              },
              {
                title: "Memory Synthesis",
                desc: "Recursive learning system that improves intent detection over time.",
                icon: BrainCircuit,
                color: "purple"
              }
            ].map((feature, i) => (
              <div key={i} className="premium-card p-8 group">
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}/10 border border-${feature.color}/20 flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Mic2 className="text-white w-5 h-5" />
            </div>
            <span className="font-display font-bold tracking-tighter text-xl">VOICE ENGINE</span>
          </div>
          <p className="text-white/20 text-sm">© 2026 Voice-Driven Deterministic Prompt Optimization Engine. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Privacy</Link>
            <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Terms</Link>
            <Link href="#" className="text-white/40 hover:text-white transition-colors text-sm">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PipelineVisualization() {
  const steps = [
    { label: "Voice Input", icon: Mic2, color: "#38BDF8" },
    { label: "Intent Detection", icon: Sparkles, color: "#8B5CF6" },
    { label: "Optimization", icon: Cpu, color: "#F59E0B" },
    { label: "Final Prompt", icon: CheckCircle2, color: "#7CFF6B" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-12 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm relative overflow-hidden">
      {/* Animated Connection Lines */}
      <svg className="absolute inset-0 w-full h-full -z-10" preserveAspectRatio="none">
        <motion.path
          d="M 150 150 Q 300 150 450 150 T 750 150"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          strokeDasharray="10 10"
          animate={{ strokeDashoffset: [-20, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="33%" stopColor="#8B5CF6" />
            <stop offset="66%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#7CFF6B" />
          </linearGradient>
        </defs>
      </svg>

      <div className="grid grid-cols-4 gap-8 relative">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center relative group"
              style={{ backgroundColor: `${step.color}10`, border: `1px solid ${step.color}30` }}
            >
              <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <step.icon className="w-10 h-10" style={{ color: step.color }} />
              
              {/* Animated Rings */}
              {i === 0 && (
                <motion.div 
                  className="absolute -inset-4 border border-cyan-500/20 rounded-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-white/60">{step.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
