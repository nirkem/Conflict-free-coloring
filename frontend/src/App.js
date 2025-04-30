// App.js
import axios from 'axios';

// Function to send points to backend and get colored points
export const generateConflictFreeColoring = async (points) => {
  // Format the points data for the backend
  const pointsData = {
    points: points.map(p => ({
      x: +(p.x / 500).toFixed(3), // Assuming canvas width is 500
      y: +(p.y / 500).toFixed(3), // Assuming canvas height is 500
      color: 0
    }))
  };
  
  try {
    // Send POST request to the backend
    const response = await axios.post(
      'https://conflict-free-coloring.onrender.com/generate-conflict-free-coloring', 
      pointsData
    );
    
    // Return the colored points from the backend
    return response.data.points;
  } catch (error) {
    console.error('Error sending points to backend:', error);
    throw error;
  }
};

// Function to send circle data and get conflict-free color in that circle
export const checkCircleConflictFree = async (circle, points) => {
  const data = {
    circle: circle,
    points: points.map(p => ({
      x: +(p.x / 500).toFixed(3),
      y: +(p.y / 500).toFixed(3),
      color: p.color || 0
    }))
  };
  
  try {
    const response = await axios.post(
      'https://conflict-free-coloring.onrender.com/check-circle',
      data
    );
    
    return response.data;
  } catch (error) {
    console.error('Error checking circle conflict-free status:', error);
    throw error;
  }
};