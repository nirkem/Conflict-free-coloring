from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np
from alg import conflict_free_coloring_alg
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Define a Pydantic model for the incoming JSON
class Point(BaseModel):
    x: float
    y: float
    color: int
    
class PointsRequest(BaseModel):
    points: List[Point]

class GraphResponse(BaseModel):
    nodes: List[int]
    colors: List[int]
    num_colors: int 

def conflict_free_coloring(points_json):
    """
    Transforms the JSON input into a NumPy array, calls conflict_free_coloring_alg,
    and updates the JSON with the assigned colors.
    """   
     
    array = [[point.x, point.y] for point in points_json]
    points_array = np.array(array)
    
    coloring = conflict_free_coloring_alg(points_array)  

    for i, point in enumerate(points_json):
        point.color = coloring[i]  

    return points_json

@app.post("/generate-conflict-free-coloring")
def generate_conflict_free_coloring(request: PointsRequest):
    """Generates the CF coloring for the graph based on input points."""

    points = request.points
    updated_points = conflict_free_coloring(points)

    return {"points": [point.dict() for point in updated_points]}
