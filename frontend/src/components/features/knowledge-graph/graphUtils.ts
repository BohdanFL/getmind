import type { Node, Edge } from '@xyflow/react';
import type { GraphNode, GraphEdge } from './types';

export function transformToReactFlowNodes(nodes: GraphNode[]): Node[] {
    return nodes.map((node, index) => {
        // Very basic grid layout for now. Better to use Dagre later.
        const x = (index % 3) * 250;
        const y = Math.floor(index / 3) * 150;

        return {
            id: node.id,
            type: 'conceptNode',
            position: { x, y },
            data: {
                ...node
            }
        };
    });
}

export function transformToReactFlowEdges(edges: GraphEdge[]): Edge[] {
    return edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep', // nice default edge type
        animated: edge.type === 'requires', // animate prerequisites to show flow
        style: {
            stroke: edge.type === 'requires' ? '#3b82f6' : '#64748b', // Blue for requires, slate for related
            strokeWidth: edge.weight ? 1 + edge.weight : 1.5,
        }
    }));
}
