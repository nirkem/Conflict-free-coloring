import React, { useEffect, useState } from "react";
import axios from "axios";
import { Stage, Layer, Circle } from "react-konva";

function App() {
  const [nodes, setNodes] = useState([]);
  const [colors, setColors] = useState([]);
  const [numColors, setNumColors] = useState(0);

  // Fetch the graph and conflict-free coloring from the backend
  const generateGraph = async () => {
    try {
      const response = await axios.get("http://localhost:8000/generate-conflict-free-coloring?n=10");
      setNodes(response.data.nodes);
      setColors(response.data.colors);
      setNumColors(response.data.num_colors);
    } catch (error) {
      console.error("Error fetching graph data:", error);
    }
  };

  // Generate the graph when the component mounts
  useEffect(() => {
    generateGraph();  // Call to generate the graph
  }, []);

  return (
    <div>
      <h1>Conflict-Free Coloring Graph</h1>
      <button onClick={generateGraph}>Generate Conflict-Free Coloring</button>
      <p>Number of Colors: {numColors}</p>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {nodes.map((node, index) => (
            <Circle
              key={node}
              x={Math.random() * window.innerWidth}  // Random positions
              y={Math.random() * window.innerHeight}
              radius={20}
              fill={colors[index] ? `hsl(${colors[index] * 50}, 80%, 60%)` : "gray"}
              draggable
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
