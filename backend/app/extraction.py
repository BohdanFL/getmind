import os
from google import genai
from google.genai import types
from .schemas import KnowledgeGraph, ConceptNode, GraphEdge
from typing import List, Optional

EXTRACTION_SYSTEM_PROMPT = """
You are an expert in Cognitive Science and Knowledge Engineering.
Your task is to analyze the provided study material and extract a "Knowledge Backbone" (Skeleton).

### Instructions:
1. Identify the major thematic clusters (chapters/topics).
2. Extract 10-20 core concepts that are fundamental for mastering this material.
3. Establish primary hierarchical relationships (e.g., 'parent_child', 'requires').
4. Use the provided Markdown headers in the text to identify the 'cluster' for each concept.
5. Provide a brief 'summary' (1-3 sentences) for each concept.
6. Estimate the 'level' (fundamental, intermediate, advanced).

### Output Constraint:
Your output MUST be a strict JSON object matching the provided schema (KnowledgeGraph).
Do NOT wrap the JSON in Markdown formatting blocks (e.g. ```json).
"""

class ExtractionService:
    def __init__(self):
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
        api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(
            api_key=api_key,
            http_options={'timeout': 600000.0}
        )

    async def extract_skeleton(self, chunks: List[any]) -> KnowledgeGraph:
        """
        Extracts the foundational Knowledge Graph from a list of Markdown chunks.
        """
        print("Starting Knowledge Graph skeleton extraction from chunks...")
        
        # Prepare context from chunks
        context_text = "### Source Material ###\n\n"
        for i, chunk in enumerate(chunks):
            # Extract metadata (headers)
            headers = ", ".join([f"{k}: {v}" for k, v in chunk.metadata.items()])
            context_text += f"--- Chunk {i+1} [{headers}] ---\n"
            context_text += f"{chunk.page_content}\n\n"
            
        prompt = (
            "Analyze the following source material and extract the Knowledge Graph Skeleton.\n"
            "Ensure the output strictly follows the required JSON schema.\n\n"
            f"{context_text}"
        )
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=EXTRACTION_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_json_schema=KnowledgeGraph.model_json_schema(),
                    temperature=0.2 # Low temperature for more deterministic extraction
                )
            )
            
            # The SDK might return the JSON as text
            parsed_graph = KnowledgeGraph.model_validate_json(response.text)
            
            # Post-processing: Filter out invalid edges where source or target doesn't exist
            valid_node_ids = {node.id for node in parsed_graph.nodes}
            valid_edges = []
            for edge in parsed_graph.edges:
                if edge.source in valid_node_ids and edge.target in valid_node_ids:
                    valid_edges.append(edge)
                else:
                    print(f"Filtered out invalid edge: {edge.source} -> {edge.target}")
            
            parsed_graph.edges = valid_edges
            return parsed_graph
            
        except Exception as e:
            print(f"Error in skeleton extraction pass: {e}")
            import traceback
            traceback.print_exc()
            # Return empty graph on failure
            return KnowledgeGraph(nodes=[], edges=[])

extraction_service = ExtractionService()
