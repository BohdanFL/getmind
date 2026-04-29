import os
from google.genai import types
from .tutor import SocraticTutor
from .schemas import KnowledgeGraph, ConceptNode, GraphEdge
from typing import List, Optional

class ExtractionService:
    def __init__(self, tutor: SocraticTutor):
        self.tutor = tutor
        self.model_id = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")

    async def extract_knowledge_graph(self, file_name: str) -> KnowledgeGraph:
        """
        Performs a multi-pass extraction of the Knowledge Graph from a PDF.
        1. Pass 1: Semantic Skeleton (Key Concepts & Chapters)
        2. Pass 2: Detailed Relations (Prerequisites & Analogies)
        """
        print(f"Starting Knowledge Graph extraction for: {file_name}")
        
        # Pass 1: Extract the backbone
        skeleton_prompt = """
        Analyze the provided PDF document and identify the most important concepts.
        Organize them into a hierarchical structure (Knowledge Backbone).
        Focus on identifying:
        - Major chapters or thematic clusters.
        - 10-15 core concepts that a student must master.
        - Primary 'parent_child' relationships between these concepts.
        """
        
        skeleton_graph = await self._run_extraction_pass(file_name, skeleton_prompt)
        
        # Pass 2: Refine relations and add prerequisites
        refine_prompt = f"""
        Based on these concepts: {[n.label for n in skeleton_graph.nodes]}, 
        identify complex relationships such as 'requires' (prerequisites), 'relates_to', and 'analogy'.
        Also, ensure every concept has a precise 'page_anchor' and 'hl_text' (snippet) from the PDF.
        """
        
        final_graph = await self._run_extraction_pass(file_name, refine_prompt, existing_nodes=skeleton_graph.nodes)
        
        return final_graph

    async def _run_extraction_pass(self, file_name: str, prompt: str, existing_nodes: Optional[List[ConceptNode]] = None) -> KnowledgeGraph:
        """Helper to run a structured extraction pass with Gemini."""
        request_contents = []
        
        # Add PDF reference
        file_obj = self.tutor.client.files.get(name=file_name)
        request_contents.append(file_obj)
        
        full_prompt = prompt
        if existing_nodes:
            nodes_context = "\n".join([f"- {n.label} (ID: {n.id})" for n in existing_nodes])
            full_prompt += f"\n\nContext of existing concepts:\n{nodes_context}"
            
        try:
            # Using the tutor's structured response capability
            response = await self.tutor.get_structured_response(
                prompt=full_prompt,
                response_schema=KnowledgeGraph
            )
            return response
        except Exception as e:
            print(f"Error in extraction pass: {e}")
            # Return empty graph on failure
            return KnowledgeGraph(nodes=[], edges=[])

extraction_service = ExtractionService(SocraticTutor())
