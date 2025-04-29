from fastapi import FastAPI
from pydantic import BaseModel
import random
import networkx as nx
from typing import List
from scipy.spatial import Delaunay
import numpy as np
import matplotlib.pyplot as plt
from collections import defaultdict
from app.routes import router

app = FastAPI()
# Include routes from the app folder
app.include_router(router)

# Simple data model to represent the graph structure
class GraphResponse(BaseModel):
    nodes: List[int]
    colors: List[int]
    num_colors: int

@app.get("/generate-graph")
def generate_graph(n: int = 5):
    """Generates a graph with no edges, just nodes."""
    graph = nx.gnp_random_graph(n, 0)  # Generates a graph with n nodes and 0 edges
    nodes = list(graph.nodes)
    return {"nodes": nodes}

def conflict_free_coloring(graph):
    """Simple random coloring logic for now - replace with your CF coloring algorithm."""
    nodes = list(graph.nodes)
    # Generate a random color (just for example) for each node
    colors = [random.randint(1, 5) for _ in nodes]  # Replace this with your CF algorithm
    num_colors = len(set(colors))  # Count of unique colors used
    return colors, num_colors

@app.get("/generate-conflict-free-coloring")
def generate_conflict_free_coloring(n: int = 5):
    """Generates the CF coloring for the graph."""
    graph = nx.gnp_random_graph(n, 0)
    colors, num_colors = conflict_free_coloring(graph)
    return GraphResponse(nodes=list(graph.nodes), colors=colors, num_colors=num_colors)
