from fastapi import APIRouter
from app.models import GraphResponse
from app.algorithms import conflict_free_coloring
import networkx as nx

router = APIRouter()

@router.get("/generate-graph")
def generate_graph(n: int = 5):
    """Generates a graph with no edges, just nodes."""
    graph = nx.gnp_random_graph(n, 0)
    nodes = list(graph.nodes)
    return {"nodes": nodes}

@router.get("/generate-conflict-free-coloring")
def generate_conflict_free_coloring(n: int = 5):
    """Generates the CF coloring for the graph."""
    graph = nx.gnp_random_graph(n, 0)
    colors, num_colors = conflict_free_coloring(graph)
    return GraphResponse(nodes=list(graph.nodes), colors=colors, num_colors=num_colors)