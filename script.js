import { generateConflictFreeColoring } from "./App.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// Set the canvas coordinate system to range from -1.5 to 1.5
ctx.setTransform(
	canvas.width / 3,
	0,
	0,
	-canvas.height / 3,
	canvas.width / 2,
	canvas.height / 2
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

function drawGrid(spacing = 0.5) {
	ctx.clearRect(-1.5, -1.5, 3, 3); // Clear the canvas in the new coordinate system
	ctx.strokeStyle = "#e0e0e0";
	ctx.lineWidth = 0.01;

	for (let x = -1.5; x <= 1.5; x += spacing) {
		ctx.beginPath();
		ctx.moveTo(x, -1.5);
		ctx.lineTo(x, 1.5);
		ctx.stroke();
	}

	for (let y = -1.5; y <= 1.5; y += spacing) {
		ctx.beginPath();
		ctx.moveTo(-1.5, y);
		ctx.lineTo(1.5, y);
		ctx.stroke();
	}
}

function drawRandomPoints(n) {
	points = [];
	for (let i = 0; i < n; i++) {
		// Generate random numbers between -1 and 1 with 1 decimal place
		const x = +(Math.random() * 2 - 1).toFixed(1); // Random number between -1 and 1
		const y = +(Math.random() * 2 - 1).toFixed(1); // Random number between -1 and 1
		points.push({ x, y, color: 0 });
		drawPoint(x, y);
	}
	updateJsonViewer();
}

function drawPoint(x, y, color = "#000000") {
	ctx.beginPath();
	ctx.arc(x, y, 0.05, 0, Math.PI * 2); // Radius is now in canvas units
	ctx.fillStyle = color;
	ctx.fill();
}

function handleDraw() {
	const count = parseInt(document.getElementById("pointCount").value);
	if (!isNaN(count) && count > 0) {
		drawGrid();
		drawRandomPoints(count);
	} else {
		alert("Please enter a valid positive number.");
	}
}

async function handleColoring() {
	try {
		console.log("Sending points to backend:", points);
		const coloredPoints = await generateConflictFreeColoring(points);

		console.log("Received colored points from backend:", coloredPoints.points);

		drawGrid();
		coloredPoints.forEach((p, i) => {
			points[i].x = +p.x.toFixed(1); // Ensure 1 decimal place
			points[i].y = +p.y.toFixed(1); // Ensure 1 decimal place
			points[i].color = p.color;
			const colorIndex = p.color % 10;
			drawPoint(points[i].x, points[i].y, colorFromPalette(colorIndex));
		});

		updateJsonViewer();
		console.log("Assigned colors:", points);
	} catch (err) {
		console.error("Error from backend:", err);
		alert("Failed to generate coloring from server.");
	}
}

function updateJsonViewer() {
	const viewer = document.getElementById("jsonViewer");
	const displayPoints = points.map((p) => ({
		x: +p.x.toFixed(1), // Ensure 1 decimal place
		y: +p.y.toFixed(1), // Ensure 1 decimal place
		color: p.color,
	}));
	viewer.textContent = JSON.stringify({ points: displayPoints }, null, 2);
}

function toggleCircleMode() {
	isCircleMode = !isCircleMode;
	const button = document.getElementById("drawCircleButton");
	const resultBox = document.getElementById("circleResult");
	button.innerText = `Draw Circle (${isCircleMode ? "On" : "Off"})`;
	resultBox.classList.toggle("faded", !isCircleMode);

	if (!isCircleMode) {
		drawGrid();
		points.forEach((p) => drawPoint(p.x, p.y));
	}
}

function drawCirclePreview(center, radius) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid();
	points.forEach((p) => {
		const color = p.color === 0 ? "#000000" : colorFromPalette(p.color);
		drawPoint(p.x, p.y, color);
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
		"#FF0000", // Red
		"#00FF00", // Green
		"#0000FF", // Blue
		"#FFFF00", // Yellow
		"#FF00FF", // Magenta
		"#00FFFF", // Cyan
		"#800000", // Maroon
		"#808000", // Olive
		"#008080", // Teal
		"#800080", // Purple
	];
	return colorPalette[(colorNumber - 1) % colorPalette.length];
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
