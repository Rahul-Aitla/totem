'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  BrainCircuit, 
  History, 
  Tag, 
  Merge, 
  MoreVertical,
  Plus,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Mock Data ---
const MEMORIES = [
  {
    id: '1',
    title: 'Marketing Strategy - Fitness',
    tags: ['marketing', 'fitness', 'enterprise'],
    confidence: 0.98,
    lastUsed: '2h ago',
    status: 'Merged',
    usage: 142
  },
  {
    id: '2',
    title: 'Content Creation - Startup',
    tags: ['content', 'startup', 'saas'],
    confidence: 0.94,
    lastUsed: '1d ago',
    status: 'Isolated',
    usage: 85
  },
  {
    id: '3',
    title: 'Hinglish Intent Parser',
    tags: ['language', 'hinglish', 'parsing'],
    confidence: 0.99,
    lastUsed: '15m ago',
    status: 'Core',
    usage: 1240
  },
  {
    id: '4',
    title: 'Legal Document Optimization',
    tags: ['legal', 'optimization', 'compliance'],
    confidence: 0.91,
    lastUsed: '3d ago',
    status: 'Merged',
    usage: 42
  },
  {
    id: '5',
    title: 'Email Sequence Builder',
    tags: ['sales', 'outreach', 'email'],
    confidence: 0.96,
    lastUsed: '5h ago',
    status: 'Isolated',
    usage: 215
  },
  {
    id: '6',
    title: 'Product Roadmap Synthesis',
    tags: ['product', 'management', 'agile'],
    confidence: 0.93,
    lastUsed: '1w ago',
    status: 'Merged',
    usage: 67
  }
];

export default function MemoryCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Memory Center</h2>
          <p className="text-white/40">Manage deterministic intent patterns and historical AI contexts.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search memories..." 
              className="w-full bg-elevated/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-accent/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10 hover:bg-white/5 h-10 px-4">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-primary-accent text-background hover:bg-primary-accent/90 h-10 px-6 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Memories" value="1,284" icon={Database} subValue="+12 this week" />
        <StatCard label="Knowledge Density" value="84%" icon={BrainCircuit} subValue="High Signal" />
        <StatCard label="Retrieval Latency" value="12ms" icon={History} subValue="Optimized" />
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MEMORIES.map((memory, i) => (
          <MemoryCard key={memory.id} memory={memory} index={i} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, subValue }: any) {
  return (
    <div className="premium-card p-6 flex items-center justify-between">
      <div>
        <p className="text-[11px] text-white/40 uppercase font-bold tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display font-bold">{value}</span>
          <span className="text-[10px] text-primary-accent font-medium">{subValue}</span>
        </div>
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-white/40" />
      </div>
    </div>
  );
}

function MemoryCard({ memory, index }: { memory: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card group"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
            memory.status === 'Core' ? "bg-primary-accent/20 text-primary-accent" : 
            memory.status === 'Merged' ? "bg-secondary-accent/20 text-secondary-accent" : "bg-white/10 text-white/40"
          )}>
            {memory.status}
          </div>
          <button className="text-white/20 hover:text-white transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="text-lg font-display font-bold mb-4 group-hover:text-primary-accent transition-colors">
          {memory.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {memory.tags.map((tag: string) => (
            <div key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/40 font-medium">
              <Tag className="w-3 h-3" />
              {tag}
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase font-bold">Confidence</span>
            <span className="text-sm font-bold text-white/80">{(memory.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/30 uppercase font-bold">Usage</span>
            <span className="text-sm font-bold text-white/80">{memory.usage}x</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] text-white/40">Last used {memory.lastUsed}</span>
        <button className="text-primary-accent text-xs font-bold flex items-center gap-1">
          Open Graph
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
