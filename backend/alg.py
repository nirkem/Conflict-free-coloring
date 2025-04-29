from scipy.spatial import Delaunay
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx
from collections import defaultdict

# given points and Delaunay triangulation, get the graph
def get_graph(points, trices):
    # build the NetworkX graph
    G = nx.Graph()
    G.add_nodes_from(range(len(points)))

    # convert trices into 2-vertex edges and add to G
    for simplex in trices.simplices:
        for i in range(3):
            u = simplex[i]
            v = simplex[(i + 1) % 3]
            G.add_edge(u, v)
            
    return G
    
# given a coloring of a graph, find the most common color
def get_most_common_color(coloring: dict) -> int:
    color_groups = defaultdict(list)
    for node, color in coloring.items():
        color_groups[color].append(node)
    
    most_common_color = max(color_groups, key=lambda c: len(color_groups[c]))
    return most_common_color

# Step 1: Generate some random 2D points
initial_points = np.array([
    [0.2, 0.2],   
    [0.1, 0.1],   
    [0, 0.1],   
    [0.5, 0.5], 
    [0.2, 0.5], 
    [0.8, 0.5], 
    [0.5, 0.2], 
    [0.5, 0.8], 
])  

def conflict_free_coloring_alg(initial_points):
    # copy initial_points to points
    points = initial_points.copy()
    current_indices = list(range(len(points)))

    current_color = 0
    CF_coloring = {i: 0 for i in range(len(points))}

    # Start the loop
    while len(points) > 0:
        
        if len(points) < 4:
            for i in range(len(points)):
                global_idx = current_indices[i]
                CF_coloring[global_idx] = current_color
                current_color += 1
            break
        
        # generate trices by Delaunay triangulation
        trices = Delaunay(points)

        # build graph
        G = get_graph(points, trices)
                
        # color the graph
        coloring = nx.coloring.greedy_color(G, strategy="largest_first")
        
        # Find the color group with the most nodes
        most_common_color = get_most_common_color(coloring)
        
        i = 0
        points_to_delete = []
        for i in range(len(points)):
            global_idx = current_indices[i]
            if coloring[i] == most_common_color:
                CF_coloring[global_idx] = current_color
                points_to_delete.append(i)
        
        # remove the points from the list
        points = np.delete(points, points_to_delete, axis=0)
        current_indices = [idx for j, idx in enumerate(current_indices) if j not in points_to_delete]
        current_color += 1
        
    return CF_coloring

CF_coloring = conflict_free_coloring_alg(initial_points)

def plot_the_graph(points, CF_coloring):
    plt.figure(figsize=(6, 6))

    # generate trices by Delaunay triangulation
    trices = Delaunay(points)

    # build graph
    G = get_graph(points, trices)

    # Edges from Delaunay
    for u, v in G.edges():
        x = [points[u][0], points[v][0]]
        y = [points[u][1], points[v][1]]
        plt.plot(x, y, color='gray')

    # generate 10 colors
    cmap = plt.get_cmap('tab10')
    colors = [cmap(i) for i in range(10)]
    # color the vertices with the CF_coloring
    for i, (x, y) in enumerate(points):
        color = colors[CF_coloring[i]]
        plt.plot(x, y, 'o', color=color)
        plt.text(x + 0.2, y + 0.2, str(i), fontsize=9, color='black')

    plt.title("CF-Coloring of Delaunay Graph")
    plt.gca().set_aspect('equal')
    plt.grid(True)
    plt.show()


# Im here for the Plot
plot_the_graph(initial_points, CF_coloring)




