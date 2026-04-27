import React, { useState, useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming this exists based on your shadcn/ui setup

const initialNodes = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Machine Learning' },
        position: { x: 250, y: 5 },
        className:
            'bg-blue-500 text-white border-none rounded-md px-4 py-2 font-bold shadow-lg',
    },
    {
        id: '2',
        data: { label: 'Supervised Learning' },
        position: { x: 100, y: 100 },
        className:
            'bg-slate-800 text-slate-100 border-slate-600 rounded-md shadow-md',
    },
    {
        id: '3',
        data: { label: 'Unsupervised Learning' },
        position: { x: 400, y: 100 },
        className:
            'bg-slate-800 text-slate-100 border-slate-600 rounded-md shadow-md',
    },
    {
        id: '4',
        data: { label: 'Neural Networks' },
        position: { x: 100, y: 200 },
        className:
            'bg-electric-violet text-white border-none rounded-md shadow-[0_0_15px_rgba(139,92,246,0.5)]',
    },
];

const initialEdges = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
        style: { stroke: '#3b82f6' },
    },
    {
        id: 'e1-3',
        source: '1',
        target: '3',
        animated: true,
        style: { stroke: '#3b82f6' },
    },
    { id: 'e2-4', source: '2', target: '4', style: { stroke: '#8b5cf6' } },
];

export default function KnowledgeGraph() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const navigate = useNavigate();

    const onConnect = useCallback(
        (params: Connection | Edge) =>
            setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges],
    );

    return (
        <div className="w-full h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center space-x-4 shrink-0 bg-slate-950/80 backdrop-blur-md z-10 relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    className="hover:bg-slate-800">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Knowledge Graph Playground
                    </h1>
                    <p className="text-xs text-slate-400">
                        Testing @xyflow/react integration
                    </p>
                </div>
            </div>

            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    colorMode="dark">
                    <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
                    <MiniMap
                        nodeColor={(node) => {
                            switch (node.type) {
                                case 'input':
                                    return '#3b82f6';
                                default:
                                    return '#1e293b';
                            }
                        }}
                        maskColor="rgba(2, 6, 23, 0.8)"
                        className="bg-slate-950 border-slate-800"
                    />
                    <Background color="#334155" gap={16} />
                </ReactFlow>
            </div>
        </div>
    );
}
