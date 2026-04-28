import type { KnowledgeGraphData } from './types';

export const mockKnowledgeGraph: KnowledgeGraphData = {
    graph_metadata: {
        document_id: 'uuid-pdf-123',
        title: 'Introduction to Microeconomics',
        total_concepts: 6,
        last_updated: '2026-04-28T14:30:00Z',
    },
    nodes: [
        {
            id: 'concept_001',
            label: 'Supply and Demand',
            type: 'core_concept',
            description:
                'The fundamental model of price determination in a market.',
            page_refs: [12, 13, 15],
            importance: 0.9,
            mastery_score: 0.95,
            status: 'mastered',
            metadata: {
                difficulty: 'medium',
                estimated_study_time: '45m',
            },
        },
        {
            id: 'concept_002',
            label: 'Price Elasticity',
            type: 'sub_concept',
            description:
                'Measurement of the change in consumption of a product in relation to a change in its price.',
            page_refs: [18, 19],
            importance: 0.85,
            mastery_score: 0.45,
            status: 'in_progress',
        },
        {
            id: 'concept_003',
            label: 'Market Equilibrium',
            type: 'core_concept',
            description:
                'A situation where market supply and demand balance each other.',
            page_refs: [22],
            importance: 0.9,
            mastery_score: 0.1,
            status: 'in_progress',
        },
        {
            id: 'concept_004',
            label: 'Consumer Surplus',
            type: 'sub_concept',
            description:
                'The difference between the total amount that consumers are willing and able to pay for a good or service and the total amount that they actually do pay.',
            page_refs: [30],
            importance: 0.7,
            mastery_score: 0.0,
            status: 'locked',
        },
        {
            id: 'concept_005',
            label: 'Producer Surplus',
            type: 'sub_concept',
            description:
                'The difference between how much a person would be willing to accept for given quantity of a good versus how much they can receive by selling the good at the market price.',
            page_refs: [32],
            importance: 0.7,
            mastery_score: 0.0,
            status: 'locked',
        },
        {
            id: 'concept_006',
            label: 'Deadweight Loss',
            type: 'advanced_concept',
            description:
                'A loss of economic efficiency that can occur when the free market equilibrium for a good or a service is not achieved.',
            page_refs: [40],
            importance: 0.8,
            mastery_score: 0.0,
            status: 'locked',
        },
    ],
    edges: [
        {
            id: 'edge_001',
            source: 'concept_001',
            target: 'concept_002',
            type: 'requires',
            label: 'Pre-requisite',
            weight: 1.0,
        },
        {
            id: 'edge_002',
            source: 'concept_001',
            target: 'concept_003',
            type: 'requires',
            label: 'Pre-requisite',
            weight: 1.0,
        },
        {
            id: 'edge_003',
            source: 'concept_003',
            target: 'concept_004',
            type: 'requires',
            label: 'Builds upon',
            weight: 0.8,
        },
        {
            id: 'edge_004',
            source: 'concept_003',
            target: 'concept_005',
            type: 'requires',
            label: 'Builds upon',
            weight: 0.8,
        },
        {
            id: 'edge_005',
            source: 'concept_004',
            target: 'concept_006',
            type: 'related_to',
            label: 'Connected concept',
            weight: 0.5,
        },
        {
            id: 'edge_006',
            source: 'concept_005',
            target: 'concept_006',
            type: 'related_to',
            label: 'Connected concept',
            weight: 0.5,
        },
    ],
};
