'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeProps,
  Edge,
  Connection,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Mic2, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Settings, 
  MessageSquare,
  Zap,
  ShieldCheck,
  BrainCircuit,
  Loader2,
  FileText,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getSessionGraph } from '@/lib/api';

type WorkflowNodeData = {
  label: string;
  category: string;
  icon: React.ElementType;
  color: 'cyan' | 'purple' | 'amber' | 'green' | 'pink';
};

type WorkflowNode = Node<WorkflowNodeData, 'custom'>;

// --- Custom Node Component ---
function CustomNode({ data, selected }: NodeProps<WorkflowNode>) {
  if (!data) return null;
  const Icon = data.icon;
  
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border bg-elevated/80 backdrop-blur-md min-w-[200px] transition-all duration-300",
      selected ? "border-primary-accent shadow-[0_0_20px_rgba(124,255,107,0.2)]" : "border-white/10"
    )}>
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-primary-accent !border-none" />
      
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center border",
          data.color === 'cyan' && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
          data.color === 'purple' && "bg-purple-500/10 border-purple-500/20 text-purple-400",
          data.color === 'amber' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
          data.color === 'green' && "bg-green-500/10 border-green-500/20 text-green-400",
          data.color === 'pink' && "bg-pink-500/10 border-pink-500/20 text-pink-400"
        )}>
          {Icon && (typeof Icon === 'string' ? <span className="text-xs font-bold">{Icon}</span> : <Icon className="w-4 h-4" />)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] text-white/40 uppercase tracking-widest font-bold truncate">{data.category}</div>
          <div className="text-[11px] font-bold text-white/90 truncate">{data.label}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-primary-accent !border-none" />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

function WorkflowGraphContent() {
  const searchParams = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  const ensureSessionId = () => {
    let sid = localStorage.getItem('totem_session_id');
    if (!sid) {
      sid = `session-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('totem_session_id', sid);
    }
    return sid;
  };

  useEffect(() => {
    const sidFromQuery = searchParams.get('sessionId');
    const sidFromStorage = ensureSessionId();
    const sid = sidFromQuery || sidFromStorage;
    
    setActiveSessionId(sid);
    fetchGraph(sid);
  }, [searchParams]);

  const fetchGraph = async (sid: string) => {
    try {
      setLoading(true);
      const data = await getSessionGraph(sid);
      
      const newNodes: WorkflowNode[] = data.nodes.map((n: any, i: number) => {
        let icon = Sparkles;
        let color: WorkflowNodeData['color'] = 'purple';
        const group = n.group || 'unknown';
        
        // Dynamic positioning based on group
        let x = 0;
        let y = 0;

        if (group === 'voice') {
          icon = Mic2;
          color = 'cyan';
          x = 0;
          // Find index within voice group for y positioning
          const voiceIndex = data.nodes.filter((node: any) => node.group === 'voice').indexOf(n);
          y = voiceIndex * 200;
        } else if (group === 'intent') {
          icon = Target;
          color = 'amber';
          x = 300;
          const intentIndex = data.nodes.filter((node: any) => node.group === 'intent').indexOf(n);
          y = intentIndex * 200;
        } else if (group === 'prompt') {
          icon = FileText;
          color = 'green';
          x = 600;
          const promptIndex = data.nodes.filter((node: any) => node.group === 'prompt').indexOf(n);
          y = promptIndex * 200;
        } else if (group === 'memory') {
          icon = BrainCircuit;
          color = 'pink';
          x = -300;
          const memoryIndex = data.nodes.filter((node: any) => node.group === 'memory').indexOf(n);
          y = memoryIndex * 150;
        }

        return {
          id: n.id,
          type: 'custom',
          position: { x, y },
          data: { 
            label: n.label || 'Unknown Node', 
            category: group.toUpperCase(), 
            icon: icon,
            color: color
          },
        };
      });

      const newEdges: Edge[] = data.edges.map((e: any, i: number) => ({
        id: `e-${i}`,
        source: e.from,
        target: e.to,
        label: e.label,
        animated: true,
        style: { stroke: '#7CFF6B' }
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      console.error("Failed to fetch graph:", err);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-display font-bold">Session Decision Graph</h2>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Settings className="w-4 h-4" />
            <span className="font-mono">{activeSessionId.substring(0, 12)}...</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => fetchGraph(activeSessionId)} size="sm" variant="outline" className="border-white/10 hover:bg-white/5">
            Refresh Map
          </Button>
        </div>
      </header>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50">
            <Loader2 className="w-12 h-12 text-primary-accent animate-spin" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center space-y-4">
              <BrainCircuit className="w-16 h-16 text-white/10 mx-auto" />
              <p className="text-white/20">No decision nodes recorded yet.</p>
            </div>
          </div>
        ) : null}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#050505]"
        >
          <Background color="#ffffff" gap={20} size={1} style={{ opacity: 0.03 }} />
          <Controls className="!bg-elevated !border-border !fill-white" />
          <MiniMap 
            className="!bg-elevated !border-border" 
            nodeColor={(n) => {
              if (n.data?.color === 'cyan') return '#06b6d4';
              if (n.data?.color === 'purple') return '#a855f7';
              if (n.data?.color === 'amber') return '#f59e0b';
              if (n.data?.color === 'green') return '#10b981';
              if (n.data?.color === 'pink') return '#ec4899';
              return '#7CFF6B';
            }}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function WorkflowGraph() {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-12 h-12 text-primary-accent animate-spin" />
      </div>
    }>
      <WorkflowGraphContent />
    </Suspense>
  );
}
