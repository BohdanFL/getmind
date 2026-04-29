import React, { useEffect, useState, useMemo } from 'react';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ConceptNode from './components/ConceptNode';
import { getLayoutedElements } from './graphUtils';
import type { KnowledgeGraphData, GraphNode, GraphEdge } from './types';

const nodeTypes = {
    conceptNode: ConceptNode,
};

// Backend response shape based on schemas.py
interface BackendNode {
    id: string;
    label: string;
    summary: string;
    page_anchor: number;
    hl_text?: string;
    level: string;
    cluster?: string;
}

interface BackendEdge {
    source: string;
    target: string;
    relationship: string;
    strength: number;
}

interface BackendGraphResponse {
    file_id: string;
    total_chunks_processed: number;
    graph: {
        nodes: BackendNode[];
        edges: BackendEdge[];
    };
}

export default function KnowledgeGraphVisualizer() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rawGraph, setRawGraph] = useState<BackendGraphResponse | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        async function fetchGraph() {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8000/extract/test/default');
                if (!response.ok) throw new Error('Failed to fetch extraction data');
                const data: BackendGraphResponse = await response.json();
                setRawGraph(data);

                // Map Backend to Frontend
                const mappedNodes: GraphNode[] = data.graph.nodes.map((n) => ({
                    id: n.id,
                    label: n.label,
                    type: 'concept',
                    description: n.summary,
                    page_refs: [n.page_anchor],
                    importance: 1.0,
                    mastery_score: 0.0,
                    status: 'available',
                    level: 2, // Default depth for concepts
                    metadata: {
                        cluster: n.cluster,
                        level_tag: n.level
                    }
                }));

                const mappedEdges: GraphEdge[] = data.graph.edges.map((e, idx) => ({
                    id: `e-${idx}`,
                    source: e.source,
                    target: e.target,
                    relationship: e.relationship,
                    weight: e.strength
                }));

                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(mappedNodes, mappedEdges);
                
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGraph();
    }, []);

    const onConnect = (params: Connection | Edge) =>
        setEdges((eds) => addEdge({ ...params, animated: true }, eds));

    if (loading) {
        return (
            <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-lg font-medium">Extracting Knowledge Graph...</p>
                <p className="text-sm text-slate-400 mt-2">Gemini is analyzing your document. This may take a minute.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4 text-center">
                <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl max-w-md">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Extraction Failed</h2>
                    <p className="text-slate-300 mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md z-10 relative">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/')}
                        className="hover:bg-slate-800 text-slate-300">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            Live Extraction Preview
                        </h1>
                        <p className="text-xs text-slate-400">
                            Extracted {rawGraph?.graph.nodes.length} nodes from {rawGraph?.total_chunks_processed} chunks
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded">Phase 2: Skeleton</span>
                </div>
            </div>
            
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    zoomOnScroll={true}
                    panOnDrag={true}
                    fitView
                    colorMode="dark"
                    className="bg-slate-950"
                >
                    <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
                    <MiniMap
                        nodeColor={() => '#3b82f6'}
                        maskColor="rgba(2, 6, 23, 0.8)"
                        className="bg-slate-950 border-slate-800"
                    />
                    <Background color="#334155" gap={16} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
}
