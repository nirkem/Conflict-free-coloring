CF-coloring

backend api docs:
https://conflict-free-coloring.onrender.com/docs#/

Points JSON example:

{
  "points": [
    { "x": 0, "y": 0, "color": 0 },
    { "x": 1, "y": 0, "color": 0 },
    { "x": 1, "y": 1, "color": 0 },
    { "x": 0, "y": 1, "color": 0 },
    { "x": 0.5, "y": 0.5, "color": 0 },
    { "x": 0.2, "y": 0.5, "color": 0 },
    { "x": 0.8, "y": 0.5, "color": 0 },
    { "x": 0.5, "y": 0.2, "color": 0 },
    { "x": 0.5, "y": 0.8, "color": 0 }
  ]
}

Circle JSON example:

{
  "circle": {
    "center": { "x": 0.5, "y": 0.5 },
    "radius": 0.25
  }
}


Project Overview
We’re building a web app for conflict-free coloring of a graph. The user will:
1. Input a number n (number of nodes).
2. Click "Generate Graph" → generate n nodes.
3. The user clicks "Generate conflict-free coloring" → FE sends Points JSON to the BE.
4. The BE returns the same nodes with color assignments → FE re-render them with colors.
5. The user can draw a circle on the graph.
6. FE send the circle data (center and radius) to the BE.
7. The BE responds with the uniquely-colored node inside the circle → FE highlight it.
