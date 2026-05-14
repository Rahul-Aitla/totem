'use client';

import React, { useCallback } from 'react';
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
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type WorkflowNodeData = {
  label: string;
  category: string;
  icon: LucideIcon;
  color: 'cyan' | 'purple' | 'amber' | 'green';
};

type WorkflowNode = Node<WorkflowNodeData>;

// --- Custom Node Component ---
const CustomNode = ({ data, selected }: NodeProps<WorkflowNode>) => {
  const Icon = data.icon;
  
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border bg-elevated/80 backdrop-blur-md min-w-[180px] transition-all duration-300",
      selected ? "border-primary-accent shadow-[0_0_20px_rgba(124,255,107,0.2)]" : "border-white/10"
    )}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-primary-accent !border-none" />
      
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center border",
          data.color === 'cyan' && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
          data.color === 'purple' && "bg-purple-500/10 border-purple-500/20 text-purple-400",
          data.color === 'amber' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
          data.color === 'green' && "bg-green-500/10 border-green-500/20 text-green-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{data.category}</div>
          <div className="text-sm font-bold text-white/90">{data.label}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary-accent !border-none" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// --- Initial Data ---
const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 0, y: 100 },
    data: { label: 'Voice Input', category: 'Source', icon: Mic2, color: 'cyan' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { label: 'STT Processing', category: 'Processing', icon: Cpu, color: 'purple' },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 500, y: 100 },
    data: { label: 'Intent Detection', category: 'Processing', icon: Sparkles, color: 'purple' },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 750, y: 0 },
    data: { label: 'Validation', category: 'Security', icon: ShieldCheck, color: 'amber' },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 750, y: 200 },
    data: { label: 'User Confirmation', category: 'Interaction', icon: MessageSquare, color: 'amber' },
  },
  {
    id: '6',
    type: 'custom',
    position: { x: 1000, y: 100 },
    data: { label: 'Optimization', category: 'Engine', icon: Zap, color: 'purple' },
  },
  {
    id: '7',
    type: 'custom',
    position: { x: 1250, y: 100 },
    data: { label: 'Final Output', category: 'Result', icon: CheckCircle2, color: 'green' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#38BDF8' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#8B5CF6' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#8B5CF6' } },
  { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#8B5CF6' } },
  { id: 'e4-6', source: '4', target: '6', animated: true, style: { stroke: '#F59E0B' } },
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: '#F59E0B' } },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: '#7CFF6B' } },
];

export default function WorkflowGraph() {
  const [nodes, , onNodesChange] = useNodesState<WorkflowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-display font-bold">Workflow Topology</h2>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Settings className="w-4 h-4" />
            <span>Deterministic Engine v2.4.0</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-6 mr-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] text-white/40 uppercase font-bold">Input</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-[11px] text-white/40 uppercase font-bold">Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] text-white/40 uppercase font-bold">Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[11px] text-white/40 uppercase font-bold">Output</span>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5">
            Auto Layout
          </Button>
        </div>
      </header>

      <div className="flex-1 relative">
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
          <Background color="#ffffff" gap={20} size={1} opacity={0.03} />
          <Controls className="!bg-elevated !border-border !fill-white" />
          <MiniMap 
            className="!bg-elevated !border-border" 
            nodeColor={(node: WorkflowNode) => {
              if (node.data.color === 'cyan') return '#38BDF8';
              if (node.data.color === 'purple') return '#8B5CF6';
              if (node.data.color === 'amber') return '#F59E0B';
              if (node.data.color === 'green') return '#7CFF6B';
              return '#111827';
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
          />
        </ReactFlow>

        {/* Overlay Info */}
        <div className="absolute bottom-8 left-8 p-6 glass-panel rounded-2xl max-w-xs pointer-events-none">
          <h4 className="text-sm font-bold mb-2">Graph Intelligence</h4>
          <p className="text-xs text-white/40 leading-relaxed">
            The deterministic engine uses a non-linear processing graph to ensure 
            intent validation before prompt synthesis. Each node represents a 
            discrete AI microservice.
          </p>
        </div>
      </div>
    </div>
  );
}
