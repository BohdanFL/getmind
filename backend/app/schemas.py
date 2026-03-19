from pydantic import BaseModel, Field
from typing import List, Optional

class SocraticHint(BaseModel):
    """A hint provided by the Socratic Tutor."""
    hint: str = Field(description="The hint to guide the student.")
    reasoning: str = Field(description="The reasoning behind this hint.")

class SocraticResponse(BaseModel):
    """A structured response from the Socratic Tutor."""
    thought_process: str = Field(description="The tutor's internal reasoning.")
    response_text: str = Field(description="The actual response to the student.")
    hints: List[SocraticHint] = Field(default_factory=list, description="A list of hints if applicable.")
    is_discovered: bool = Field(description="Whether the student has discovered the answer.")
