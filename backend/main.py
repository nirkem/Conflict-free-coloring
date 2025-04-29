from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np
from alg import conflict_free_coloring_alg

app = FastAPI()

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

# Include routes from the app folder
app.include_router(router)

def conflict_free_coloring(points_json):
    """
    Transforms the JSON input into a NumPy array, calls conflict_free_coloring_alg,
    and updates the JSON with the assigned colors.
    """
    # Step 1: Transform JSON to NumPy array
    points_array = np.array([[point.x, point.y] for point in points_json])

    # Step 2: Call conflict_free_coloring_alg to get the coloring
    coloring = conflict_free_coloring_alg(points_array)  # Returns a dict like {0: 0, 1: 2, ...}

    # Step 3: Update the JSON with the assigned colors
    for i, point in enumerate(points_json):
        point.color = coloring[i]  # Update the color field in the JSON

    # Step 4: Return the updated JSON
    return points_json

@app.post("/generate-conflict-free-coloring")
def generate_conflict_free_coloring(request: PointsRequest):
    """Generates the CF coloring for the graph based on input points."""
    points = request.points

    # Call conflict_free_coloring to process the points and update their colors
    updated_points = conflict_free_coloring(points)

    return {"points": [point.dict() for point in updated_points]}
