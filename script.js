// --- Utility Functions and Color Palette ---
function colorFromPalette(colorNumber) {
	const colorPalette = [
		{ code: "#000000" }, // 0 Black
		{ code: "#FF0000" }, // 1 Red
		{ code: "#00FF00" }, // 2 Green
		{ code: "#0000FF" }, // 3 Blue
		{ code: "#FFFF00" }, // 4 Yellow
		{ code: "#FF00FF" }, // 5 Magenta
		{ code: "#00FFFF" }, // 6 Cyan
		{ code: "#800000" }, // 7 Maroon
		{ code: "#808000" }, // 8 Olive
		{ code: "#008080" }, // 9 Teal
		{ code: "#800080" }, // 10 Purple
		{ code: "#FFA500" }, // 11 Orange
		{ code: "#A52A2A" }, // 12 Brown
		{ code: "#8A2BE2" }, // 13 Blue Violet
		{ code: "#5F9EA0" }, // 14 Cadet Blue
		{ code: "#7FFF00" }, // 15 Chartreuse
		{ code: "#D2691E" }, // 16 Chocolate
		{ code: "#FF7F50" }, // 17 Coral
		{ code: "#6495ED" }, // 18 Cornflower Blue
		{ code: "#DC143C" }, // 19 Crimson
		{ code: "#00CED1" }, // 20 Dark Turquoise
		{ code: "#9400D3" }, // 21 Dark Violet
		{ code: "#FF1493" }, // 22 Deep Pink
		{ code: "#00BFFF" }, // 23 Deep Sky Blue
		{ code: "#696969" }, // 24 Dim Gray
		{ code: "#1E90FF" }, // 25 Dodger Blue
		{ code: "#B22222" }, // 26 Firebrick
		{ code: "#228B22" }, // 27 Forest Green
		{ code: "#FF69B4" }, // 28 Hot Pink
		{ code: "#CD5C5C" }, // 29 Indian Red
	];
	return colorPalette[colorNumber % colorPalette.length] || { code: "#000000" };
}

// --- Canvas Setup ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.setTransform(
	canvas.width / 100,
	0,
	0,
	-canvas.height / 100,
	0,
	canvas.height
);

// --- State ---
let points = [];
let isCircleMode = false;
let circleStart = null;

// --- Drawing Functions ---
function drawGrid(spacing = 10) {
	ctx.clearRect(0, 0, 100, 100);
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
function drawPoint(x, y, color = "#000000", totalPoints = 100) {
	const maxRadius = 1.5;
	const minRadius = 0.3;
	const radius = Math.max(minRadius, maxRadius - totalPoints / 250);
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fillStyle = color;
	ctx.fill();
}

function drawRandomPoints(n) {
	points = [];
	for (let i = 0; i < n; i++) {
		const x = Math.round(Math.random() * 98) + 1;
		const y = Math.round(Math.random() * 98) + 1;
		points.push({ x, y, color: 0 });
		drawPoint(x, y, "#000000", n);
	}
	updateJsonViewer();
}

// --- Circle Drawing Logic ---
function toggleCircleMode() {
	isCircleMode = !isCircleMode;
	const button = document.getElementById("drawCircleButton");
	button.innerText = `Draw Circle (${isCircleMode ? "On" : "Off"})`;

	if (isCircleMode) {
		canvas.addEventListener("mousedown", startDrawingCircle);
		canvas.addEventListener("mousemove", previewCircle);
		canvas.addEventListener("mouseup", finishDrawingCircle);
	} else {
		canvas.removeEventListener("mousedown", startDrawingCircle);
		canvas.removeEventListener("mousemove", previewCircle);
		canvas.removeEventListener("mouseup", finishDrawingCircle);
		drawGrid();
		points.forEach((p) =>
			drawPoint(p.x, p.y, colorFromPalette(p.color).code, points.length)
		);
	}
}

function startDrawingCircle(event) {
	const rect = canvas.getBoundingClientRect();
	const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
	const y = Math.round(100 - ((event.clientY - rect.top) / rect.height) * 100);
	circleStart = { x, y };
}

function previewCircle(event) {
	if (!circleStart) return;
	const rect = canvas.getBoundingClientRect();
	const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
	const y = Math.round(100 - ((event.clientY - rect.top) / rect.height) * 100);
	const radius = Math.sqrt((x - circleStart.x) ** 2 + (y - circleStart.y) ** 2);
	drawCirclePreview(circleStart, radius);
}

function finishDrawingCircle(event) {
	if (!circleStart) return;
	const rect = canvas.getBoundingClientRect();
	const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
	const y = Math.round(100 - ((event.clientY - rect.top) / rect.height) * 100);
	const radius = Math.sqrt((x - circleStart.x) ** 2 + (y - circleStart.y) ** 2);
	drawCirclePreview(circleStart, radius);

	const pointsInsideCircle = getPointsInsideCircle(circleStart, radius);
	const highestColorPoint = findHighestColorPoint(pointsInsideCircle);

	if (highestColorPoint) {
		highlightPoint(highestColorPoint.x, highestColorPoint.y);
		document.getElementById("uniqueColorOutput").textContent =
			highestColorPoint.color;
	} else {
		document.getElementById("uniqueColorOutput").textContent = "N/A";
	}
	circleStart = null;
}

function drawCirclePreview(center, radius) {
	ctx.clearRect(0, 0, 100, 100);
	drawGrid();
	points.forEach((p) => {
		const color = colorFromPalette(p.color).code;
		drawPoint(p.x, p.y, color, points.length);
	});
	if (center && radius) {
		ctx.beginPath();
		ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(0,0,0,0.1)";
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		ctx.fill();
		ctx.stroke();
	}
}

function getPointsInsideCircle(center, radius) {
	return points.filter((point) => {
		const distance = Math.sqrt(
			(point.x - center.x) ** 2 + (point.y - center.y) ** 2
		);
		return distance <= radius;
	});
}

function findHighestColorPoint(pointsInsideCircle) {
	if (pointsInsideCircle.length === 0) return null;
	return pointsInsideCircle.reduce((maxPoint, currentPoint) =>
		currentPoint.color > maxPoint.color ? currentPoint : maxPoint
	);
}

function highlightPoint(x, y) {
	const highlightColor = "rgba(255, 215, 0, 0.5)";
	const highlightRadius = 5;
	ctx.beginPath();
	ctx.arc(x, y, highlightRadius, 0, Math.PI * 2);
	ctx.fillStyle = highlightColor;
	ctx.fill();
	const originalPoint = points.find((p) => p.x === x && p.y === y);
	if (originalPoint) {
		const color = colorFromPalette(originalPoint.color).code;
		drawPoint(x, y, color, points.length);
	}
}

// --- UI and Backend Communication ---
function handleDraw() {
	const count = parseInt(document.getElementById("pointCount").value);
	if (!isNaN(count) && count > 0) {
		drawGrid();
		drawRandomPoints(count);
		document.getElementById("generateColoringButton").disabled = false;
	} else {
		alert("Please enter a valid number of points.");
	}
}

async function handleColoring() {
	try {
		const coloredPoints = await generateConflictFreeColoring(points);
		drawGrid();
		coloredPoints.forEach((p, i) => {
			points[i].x = Math.round(p.x);
			points[i].y = Math.round(p.y);
			points[i].color = p.color;
			const { code } = colorFromPalette(p.color);
			drawPoint(points[i].x, points[i].y, code, points.length);
		});
		updateJsonViewer();
		const uniqueColors = new Set(points.map((p) => p.color));
		document.getElementById("colorCountOutput").textContent = uniqueColors.size;
		const drawCircleButton = document.getElementById("drawCircleButton");
		drawCircleButton.disabled = false;
	} catch (err) {
		console.error("Error from backend:", err);
		alert("Failed to generate coloring from server.");
	}
}

function updateJsonViewer() {
	const tableBody = document.getElementById("pointsTableBody");
	tableBody.innerHTML = "";
	points.forEach((point, index) => {
		const row = document.createElement("tr");
		const indexCell = document.createElement("td");
		indexCell.textContent = index + 1;
		row.appendChild(indexCell);
		const xCell = document.createElement("td");
		xCell.textContent = Math.round(point.x);
		row.appendChild(xCell);
		const yCell = document.createElement("td");
		yCell.textContent = Math.round(point.y);
		row.appendChild(yCell);
		const colorCell = document.createElement("td");
		const { code } = colorFromPalette(point.color);
		colorCell.style.backgroundColor = code;
		colorCell.textContent = point.color;
		colorCell.style.color = "#ffffff";
		row.appendChild(colorCell);
		tableBody.appendChild(row);
	});
}

// --- Conflict-Free Coloring Algorithm (Standalone, No Import) ---
function generateConflictFreeColoring(pointsInput) {
	// This is a placeholder for the backend algorithm.
	// For demonstration, assign colors in a round-robin fashion.
	const coloredPoints = pointsInput.map((p, i) => ({
		x: p.x,
		y: p.y,
		color: i % 10, // Just cycle through 10 colors for demo
	}));
	return Promise.resolve(coloredPoints);
}

// --- Attach to Window for HTML Event Handlers ---
window.handleDraw = handleDraw;
window.handleColoring = handleColoring;
window.toggleCircleMode = toggleCircleMode;

// --- Initialization ---
drawGrid();
document.getElementById("pointCount").addEventListener("keydown", function (e) {
	if (e.key === "Enter") {
		handleDraw();
	}
});
