import React, { useCallback, useMemo } from 'react';
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
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConceptNode from './components/ConceptNode';
import { mockKnowledgeGraph } from './mockData';
import { getLayoutedElements } from './graphUtils';

const nodeTypes = {
    conceptNode: ConceptNode,
};

function NavHeaderContent() {
    return (
        <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
                Knowledge Graph
            </h1>
            <p className="text-xs text-slate-400">
                {mockKnowledgeGraph.graph_metadata.title} ({mockKnowledgeGraph.graph_metadata.total_concepts} concepts)
            </p>
        </div>
    );
}

function NavHeader() {
    const navigate = useNavigate();

    return (
        <div className="p-4 border-b border-slate-800 flex items-center space-x-4 shrink-0 bg-slate-950/80 backdrop-blur-md z-10 relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-slate-800 text-slate-300">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <NavHeaderContent />
        </div>
    );
}

export default function KnowledgeGraph() {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => getLayoutedElements(mockKnowledgeGraph.nodes, mockKnowledgeGraph.edges), []);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection | Edge) =>
            setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges],
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        // Here we could open a sidebar, navigate to PDF, or start a chat
        console.log('Node clicked:', node.data);
    }, []);

    return (
        <div className="w-full h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
            <NavHeader />
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    zoomOnScroll={true}
                    panOnDrag={true}
                    fitView
                    colorMode="dark"
                    className="bg-slate-950"
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
                    <MiniMap
                        nodeColor={(node) => {
                            if (node.data?.status === 'locked') return '#1e293b'; // slate-800
                            if (node.data?.status === 'mastered') return '#10b981'; // emerald-500
                            return '#3b82f6'; // blue-500
                        }}
                        maskColor="rgba(2, 6, 23, 0.8)"
                        className="bg-slate-950 border-slate-800"
                    />
                    <Background color="#334155" gap={16} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
}
