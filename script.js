import { generateConflictFreeColoring } from "./App.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// Set the canvas coordinate system to range from 0 to 100 on both axes
ctx.setTransform(
	canvas.width / 100, // Scale x-axis to 100 units
	0,
	0,
	-canvas.height / 100, // Scale y-axis to 100 units (negative to flip y-axis)
	0,
	canvas.height // Translate origin to bottom-left corner
);

let points = [];
let isCircleMode = false;
let circle = null;
let isMouseDown = false;
let circleStart = null;

// Attach functions to the global window object
window.handleDraw = handleDraw;
window.handleColoring = handleColoring;
window.toggleCircleMode = toggleCircleMode;

function drawGrid(spacing = 10) {
	ctx.clearRect(0, 0, 100, 100); // Clear the canvas in the new coordinate system
	ctx.strokeStyle = "#e0e0e0";
	ctx.lineWidth = 0.5;

	for (let x = 0; x <= 100; x += spacing) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, 100);
		ctx.stroke();
	}

	for (let y = 0; y <= 100; y += spacing) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(100, y);
		ctx.stroke();
	}
}

function drawRandomPoints(n) {
	points = [];
	for (let i = 0; i < n; i++) {
		// Generate random numbers between 0 and 100
		const x = +(Math.random() * 98).toFixed(1) + 1; // Random number between 0 and 100
		const y = +(Math.random() * 98).toFixed(1) + 1; // Random number between 0 and 100
		points.push({ x, y, color: 0 });
		drawPoint(x, y, "#000000", n); // Pass the total number of points
	}
	updateJsonViewer();
}

function drawPoint(x, y, color = "#000000", totalPoints = 100) {
	const maxRadius = 1.5; // Smaller maximum radius for fewer points
	const minRadius = 0.3; // Smaller minimum radius for many points
	const radius = Math.max(minRadius, maxRadius - totalPoints / 250); // Adjust radius dynamically

	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2); // Use the calculated radius
	ctx.fillStyle = color;
	ctx.fill();
}

function handleDraw() {
	const count = parseInt(document.getElementById("pointCount").value);
	if (!isNaN(count) && count > 0) {
		drawGrid();
		drawRandomPoints(count);

		// Enable the "Generate conflict-free coloring" button
		const generateButton = document.getElementById("generateColoringButton");
		generateButton.disabled = false;
	} else {
		alert("Please enter a valid number of points.");
	}
}

async function handleColoring() {
	try {
		console.log("Sending points to backend:", points);
		const coloredPoints = await generateConflictFreeColoring(points);

		console.log("Received colored points from backend:", coloredPoints);

		drawGrid();
		coloredPoints.forEach((p, i) => {
			points[i].x = +p.x.toFixed(1); // Ensure 1 decimal place
			points[i].y = +p.y.toFixed(1); // Ensure 1 decimal place
			points[i].color = p.color; // Assign the color, including 0
			const { code } = colorFromPalette(p.color);
			drawPoint(points[i].x, points[i].y, code, points.length); // Pass the total number of points
		});

		updateJsonViewer();

		// Update the number of colors
		const uniqueColors = new Set(points.map((p) => p.color));
		document.getElementById("colorCountOutput").textContent = uniqueColors.size;

		// Enable the "Draw Circle" button
		const drawCircleButton = document.getElementById("drawCircleButton");
		drawCircleButton.disabled = false;

		console.log("Assigned colors:", points);
	} catch (err) {
		console.error("Error from backend:", err);
		alert("Failed to generate coloring from server.");
	}
}

function updateJsonViewer() {
	const tableBody = document.getElementById("pointsTableBody");
	tableBody.innerHTML = ""; // Clear existing rows

	points.forEach((point, index) => {
		const row = document.createElement("tr");

		// Add index
		const indexCell = document.createElement("td");
		indexCell.textContent = index + 1;
		row.appendChild(indexCell);

		// Add X coordinate
		const xCell = document.createElement("td");
		xCell.textContent = point.x.toFixed(1);
		row.appendChild(xCell);

		// Add Y coordinate
		const yCell = document.createElement("td");
		yCell.textContent = point.y.toFixed(1);
		row.appendChild(yCell);

		// Add Color
		const colorCell = document.createElement("td");
		const { code, name } = colorFromPalette(point.color); // Get the color code and name
		colorCell.style.backgroundColor = code; // Set the background color
		colorCell.textContent = name; // Display the color name
		colorCell.style.color = "#ffffff"; // Ensure text is visible on dark backgrounds
		row.appendChild(colorCell);

		tableBody.appendChild(row);
	});
}

function toggleCircleMode() {
	isCircleMode = !isCircleMode;
	const button = document.getElementById("drawCircleButton");
	const resultBox = document.getElementById("circleResult");
	button.innerText = `Draw Circle (${isCircleMode ? "On" : "Off"})`;
	resultBox.classList.toggle("faded", !isCircleMode);

	if (!isCircleMode) {
		drawGrid();
		points.forEach((p) => drawPoint(p.x, p.y, "#000000", points.length));
	}
}

function drawCirclePreview(center, radius) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid();
	points.forEach((p) => {
		const color = p.color === 0 ? "#000000" : colorFromPalette(p.color).code;
		drawPoint(p.x, p.y, color, points.length);
	});

	if (center && radius) {
		ctx.beginPath();
		ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(255, 87, 51, 0.2)";
		ctx.strokeStyle = "#FF5733";
		ctx.lineWidth = 2;
		ctx.fill();
		ctx.stroke();
	}
}

function colorFromPalette(colorNumber) {
	const colorPalette = [
		{ code: "#000000", name: "Black" }, // Black for color 0
		{ code: "#FF0000", name: "Red" }, // Red
		{ code: "#00FF00", name: "Green" }, // Green
		{ code: "#0000FF", name: "Blue" }, // Blue
		{ code: "#FFFF00", name: "Yellow" }, // Yellow
		{ code: "#FF00FF", name: "Magenta" }, // Magenta
		{ code: "#00FFFF", name: "Cyan" }, // Cyan
		{ code: "#800000", name: "Maroon" }, // Maroon
		{ code: "#808000", name: "Olive" }, // Olive
		{ code: "#008080", name: "Teal" }, // Teal
		{ code: "#800080", name: "Purple" }, // Purple
		{ code: "#FFA500", name: "Orange" }, // Orange
		{ code: "#A52A2A", name: "Brown" }, // Brown
		{ code: "#8A2BE2", name: "Blue Violet" }, // Blue Violet
		{ code: "#5F9EA0", name: "Cadet Blue" }, // Cadet Blue
		{ code: "#7FFF00", name: "Chartreuse" }, // Chartreuse
		{ code: "#D2691E", name: "Chocolate" }, // Chocolate
		{ code: "#FF7F50", name: "Coral" }, // Coral
		{ code: "#6495ED", name: "Cornflower Blue" }, // Cornflower Blue
		{ code: "#DC143C", name: "Crimson" }, // Crimson
		{ code: "#00CED1", name: "Dark Turquoise" }, // Dark Turquoise
		{ code: "#9400D3", name: "Dark Violet" }, // Dark Violet
		{ code: "#FF1493", name: "Deep Pink" }, // Deep Pink
		{ code: "#00BFFF", name: "Deep Sky Blue" }, // Deep Sky Blue
		{ code: "#696969", name: "Dim Gray" }, // Dim Gray
		{ code: "#1E90FF", name: "Dodger Blue" }, // Dodger Blue
		{ code: "#B22222", name: "Firebrick" }, // Firebrick
		{ code: "#228B22", name: "Forest Green" }, // Forest Green
		{ code: "#FF69B4", name: "Hot Pink" }, // Hot Pink
		{ code: "#CD5C5C", name: "Indian Red" }, // Indian Red
	];

	const color = colorPalette[colorNumber % colorPalette.length];
	return color || { code: "N/A", name: "N/A" }; // Fallback for invalid colors
}

canvas.addEventListener("mousedown", (event) => {
	if (!isCircleMode) return;
	isMouseDown = true;
	const rect = canvas.getBoundingClientRect();
	circleStart = {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
	circle = { center: { ...circleStart }, radius: 0 };
});

canvas.addEventListener("mousemove", (event) => {
	if (!isMouseDown || !isCircleMode || !circleStart) return;
	const rect = canvas.getBoundingClientRect();
	const mouseX = event.clientX - rect.left;
	const mouseY = event.clientY - rect.top;

	const dx = mouseX - circleStart.x;
	const dy = mouseY - circleStart.y;
	circle.radius = Math.sqrt(dx * dx + dy * dy);

	drawCirclePreview(circle.center, circle.radius);
});

canvas.addEventListener("mouseup", () => {
	if (!isMouseDown || !isCircleMode || !circleStart) return;
	isMouseDown = false;

	const circleData = {
		circle: {
			center: {
				x: (circle.center.x / canvas.width).toFixed(3),
				y: (circle.center.y / canvas.height).toFixed(3),
			},
			radius: (circle.radius / canvas.width).toFixed(3),
		},
	};
	console.log("Generated circle.json:", JSON.stringify(circleData, null, 2));

	ctx.beginPath();
	ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(255, 87, 51, 0.2)";
	ctx.strokeStyle = "#FF5733";
	ctx.lineWidth = 2;
	ctx.fill();
	ctx.stroke();
});

drawGrid();

document.getElementById("pointCount").addEventListener("keydown", function (e) {
	if (e.key === "Enter") {
		handleDraw();
	}
});
