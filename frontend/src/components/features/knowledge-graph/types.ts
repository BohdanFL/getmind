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
    type: 'module' | 'chapter' | 'concept' | string;
    parent?: string; // New field for hierarchy
    level?: number;  // New field for depth
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
    relationship: 'parent_child' | 'requires' | 'similar_to' | 'contradicts' | string;
    label?: string;
    weight?: number;
}

export interface KnowledgeGraphData {
    graph_metadata: GraphMetadata;
    nodes: GraphNode[];
    edges: GraphEdge[];
}
