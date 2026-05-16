'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Database,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listMemories, createMemory } from '@/lib/api';

export default function MemoryCenter() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const sid = localStorage.getItem('totem_session_id') || 'anonymous';
    setSessionId(sid);
    fetchMemories(sid);
  }, []);

  const fetchMemories = async (sid: string) => {
    try {
      setLoading(true);
      const data = await listMemories(sid);
      setMemories(data);
    } catch (err) {
      console.error("Failed to fetch memories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    const fact = prompt("Enter a new fact/preference:");
    if (!fact) return;
    
    try {
      await createMemory({ user_session_id: sessionId, fact_text: fact });
      fetchMemories(sessionId);
    } catch (err) {
      console.error("Failed to create memory:", err);
    }
  };

  const filteredMemories = memories.filter(m => 
    m.fact_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Button onClick={handleAddMemory} className="bg-primary-accent text-background hover:bg-primary-accent/90 h-10 px-6 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Active Nodes" value={memories.length.toString()} icon={Database} subValue="Live Data" />
        <StatCard label="Knowledge Density" value="High" icon={BrainCircuit} subValue="Deterministic" />
        <StatCard label="Retrieval Latency" value="<10ms" icon={History} subValue="Optimized" />
      </div>

      {/* Memory Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((memory, i) => (
            <MemoryCard key={memory.id} memory={memory} index={i} router={router} />
          ))}
          {filteredMemories.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl">
              <p className="text-white/20">No memories found for this session.</p>
            </div>
          )}
        </div>
      )}
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

function MemoryCard({ memory, index, router }: { memory: any, index: number, router: any }) {
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
            memory.is_merged ? "bg-secondary-accent/20 text-secondary-accent" : "bg-primary-accent/20 text-primary-accent"
          )}>
            {memory.memory_type}
          </div>
          <button className="text-white/20 hover:text-white transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="text-sm font-bold mb-4 group-hover:text-primary-accent transition-colors line-clamp-2">
          {memory.fact_text}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/40 font-medium">
            <Tag className="w-3 h-3" />
            {memory.status}
          </div>
          {memory.is_merged && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary-accent/10 border border-secondary-accent/10 text-[10px] text-secondary-accent font-medium">
              <Merge className="w-3 h-3" />
              Merged
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase font-bold">Created</span>
            <span className="text-xs font-bold text-white/60">{new Date(memory.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/30 uppercase font-bold">ID</span>
            <span className="text-[10px] font-mono text-white/20">{memory.id.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] text-white/40">Confidence: 99%</span>
        <button 
          onClick={() => router.push(`/workflow?sessionId=${memory.user_session_id}`)}
          className="text-primary-accent text-xs font-bold flex items-center gap-1 hover:underline"
        >
          Open Graph
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
