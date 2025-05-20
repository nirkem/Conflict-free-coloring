// App.js

const IP_address = "http://127.0.0.1:8000";

// Function to send points to backend and get colored points
export const generateConflictFreeColoring = async (points) => {
	// Format the points data for the backend
	const pointsData = {
		points: points.map((p) => ({
			x: +p.x.toFixed(1), // Keep one decimal place
			y: +p.y.toFixed(1), // Keep one decimal place
			color: 0,
		})),
	};

	try {
		// Send POST request to the backend
		const response = await axios.post(
			`${IP_address}/generate-conflict-free-coloring`,
			pointsData
		);

		// Return the colored points from the backend
		return response.data.points;
	} catch (error) {
		console.error("Error sending points to backend:", error);
		throw error;
	}
};
