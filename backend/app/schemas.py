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
