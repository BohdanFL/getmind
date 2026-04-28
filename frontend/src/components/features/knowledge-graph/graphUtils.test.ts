import { describe, it, expect } from 'vitest';
import { transformToReactFlowNodes, transformToReactFlowEdges } from './graphUtils';
import type { GraphNode, GraphEdge } from './types';

describe('graphUtils', () => {
    describe('transformToReactFlowNodes', () => {
        it('should transform backend nodes to React Flow nodes', () => {
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
                }
            ];

            const result = transformToReactFlowNodes(backendNodes);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('concept_1');
            expect(result[0].type).toBe('conceptNode'); // Custom node type
            expect(result[0].data).toMatchObject({
                label: 'Concept 1',
                mastery_score: 0.5,
                status: 'in_progress',
                description: 'Desc 1'
            });
            expect(result[0].position).toBeDefined();
        });
    });

    describe('transformToReactFlowEdges', () => {
        it('should transform backend edges to React Flow edges', () => {
             const backendEdges: GraphEdge[] = [
                 {
                     id: 'edge_1',
                     source: 'concept_1',
                     target: 'concept_2',
                     type: 'requires',
                     label: 'Pre-requisite',
                     weight: 1.0
                 }
             ];

             const result = transformToReactFlowEdges(backendEdges);

             expect(result).toHaveLength(1);
             expect(result[0].id).toBe('edge_1');
             expect(result[0].source).toBe('concept_1');
             expect(result[0].target).toBe('concept_2');
             expect(result[0].label).toBe('Pre-requisite');
             // We might want to add animated: true for 'requires' edges
             expect(result[0].animated).toBe(true);
        });
    });
});
