import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { GraphNode, GraphEdge } from './types';

export function getLayoutedElements(graphNodes: GraphNode[], graphEdges: GraphEdge[]) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 220;
    const nodeHeight = 120;

    // Structured tree layout (Top to Bottom)
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    graphNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    graphEdges.forEach((edge) => {
        // Build the strict tree skeleton using parent_child and requires
        if (edge.relationship === 'parent_child' || edge.relationship === 'requires') {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    const nodes: Node[] = graphNodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        
        return {
            id: node.id,
            type: 'conceptNode',
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
            data: { ...node },
            draggable: false, // Prevent movement as requested
        };
    });

    const edges: Edge[] = graphEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relationship === 'parent_child' ? '' : edge.label || edge.relationship,
        type: 'smoothstep',
        animated: false,
        style: {
            stroke: edge.relationship === 'parent_child' ? '#334155' : '#475569',
            strokeWidth: 1.5,
            opacity: 0.6,
        },
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
    }));

    return { nodes, edges };
}
