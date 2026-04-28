export interface GraphMetadata {
    document_id: string;
    title: string;
    total_concepts: number;
    last_updated: string;
}

export interface NodeMetadata {
    difficulty?: string;
    estimated_study_time?: string;
    [key: string]: string | undefined;
}

export interface GraphNode {
    id: string;
    label: string;
    type: 'core_concept' | 'sub_concept' | string;
    description: string;
    page_refs: number[];
    importance: number;
    mastery_score: number;
    status: 'locked' | 'available' | 'in_progress' | 'mastered' | string;
    metadata?: NodeMetadata;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: 'requires' | 'related_to' | string;
    label?: string;
    weight?: number;
}

export interface KnowledgeGraphData {
    graph_metadata: GraphMetadata;
    nodes: GraphNode[];
    edges: GraphEdge[];
}
