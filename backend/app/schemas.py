from pydantic import BaseModel, Field
from typing import List, Optional

class SocraticHint(BaseModel):
    """A hint provided by the Socratic Tutor."""
    hint: str = Field(description="The hint to guide the student.")
    reasoning: str = Field(description="The reasoning behind this hint.")

class BoundingBox(BaseModel):
    """Normalized coordinates [0-1000]."""
    ymin: int = Field(description="Normalized Y minimum", ge=0, le=1000)
    xmin: int = Field(description="Normalized X minimum", ge=0, le=1000)
    ymax: int = Field(description="Normalized Y maximum", ge=0, le=1000)
    xmax: int = Field(description="Normalized X maximum", ge=0, le=1000)

class Highlight(BaseModel):
    """A visual highlight on a PDF page."""
    page: int = Field(description="1-indexed page number")
    box: BoundingBox = Field(description="Bounding box coordinates")
    label: Optional[str] = Field(None, description="Optional label for the highlight")

class SocraticResponse(BaseModel):
    """A structured response from the Socratic Tutor."""
    thought_process: str = Field(description="The tutor's internal reasoning.")
    response_text: str = Field(description="The actual response to the student.")
    hints: List[SocraticHint] = Field(default_factory=list, description="A list of hints if applicable.")
    highlights: List[Highlight] = Field(default_factory=list, description="Associated PDF highlights.")
    is_discovered: bool = Field(description="Whether the student has discovered the answer.")

class ConceptNode(BaseModel):
    """A node in the Knowledge Graph representing a single concept."""
    id: str = Field(description="Unique identifier for the node (snake_case).")
    label: str = Field(description="Human-readable name of the concept.")
    summary: str = Field(description="Brief explanation of the concept.")
    page_anchor: int = Field(description="Primary page number in the PDF where this concept is introduced.")
    hl_text: Optional[str] = Field(None, description="Exact text snippet for highlighting.")
    level: str = Field(description="Difficulty level or depth (e.g., fundamental, intermediate, advanced).")
    cluster: Optional[str] = Field(None, description="Thematic cluster or chapter name.")

class GraphEdge(BaseModel):
    """A directed edge between two concepts in the Knowledge Graph."""
    source: str = Field(description="ID of the source concept.")
    target: str = Field(description="ID of the target concept.")
    relationship: str = Field(description="Type of relationship (e.g., requires, parent_child, relates_to, analogy).")
    strength: float = Field(0.5, description="Strength or weight of the relationship [0.0 - 1.0].", ge=0.0, le=1.0)

class KnowledgeGraph(BaseModel):
    """The complete Knowledge Graph structure extracted from a document."""
    nodes: List[ConceptNode] = Field(description="List of all unique concepts.")
    edges: List[GraphEdge] = Field(description="List of relationships between concepts.")
