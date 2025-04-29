from pydantic import BaseModel
from typing import List

class GraphResponse(BaseModel):
    nodes: List[int]
    colors: List[int]
    num_colors: int