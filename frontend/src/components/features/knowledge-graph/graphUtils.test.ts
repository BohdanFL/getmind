import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from './graphUtils';
import type { GraphNode, GraphEdge } from './types';

describe('graphUtils', () => {
    describe('getLayoutedElements', () => {
        it('should transform backend nodes and layout them as a tree without edges', () => {
            const backendNodes: GraphNode[] = [
                {
                    id: 'concept_1',
                    label: 'Concept 1',
                    type: 'core_concept',
                    description: 'Desc 1',
                    page_refs: [1],
                    importance: 0.9,
                    mastery_score: 0.5,
                    status: 'in_progress'
                },
                {
                    id: 'concept_2',
                    label: 'Concept 2',
                    type: 'sub_concept',
                    description: 'Desc 2',
                    page_refs: [2],
                    importance: 0.8,
                    mastery_score: 0.0,
                    status: 'locked'
                }
            ];

            const backendEdges: GraphEdge[] = [
                 {
                     id: 'edge_1',
                     source: 'concept_1',
                     target: 'concept_2',
                     relationship: 'parent_child',
                     label: 'Pre-requisite',
                     weight: 1.0
                 }
             ];

            const { nodes, edges } = getLayoutedElements(backendNodes, backendEdges);

            expect(nodes).toHaveLength(2);
            expect(nodes[0].id).toBe('concept_1');
            expect(nodes[0].type).toBe('conceptNode');
            expect(nodes[0].draggable).toBe(false);
            expect(nodes[0].position).toBeDefined();
            
            // We expect edges to be empty to remove lines visually
            expect(edges).toHaveLength(0);
        });
    });
});

