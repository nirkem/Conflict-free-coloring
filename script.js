// --- Theme ---
const theme = getComputedStyle(document.documentElement);
const token = (name) => theme.getPropertyValue(name).trim();
const GRID_COLOR = token("--canvas-grid");
const ACCENT = token("--accent");
const UNCOLORED = token("--point-uncolored");
const TEXT_COLOR = token("--text");
const EDGE_COLOR = token("--canvas-edge");

const prefersReducedMotion = window.matchMedia(
	"(prefers-reduced-motion: reduce)"
).matches;

// --- Color Palette ---
// Tuned to stay distinct and readable on the dark canvas. Color 0 means
// "not colored yet".
const colorPalette = [
	UNCOLORED, // 0 Uncolored
	"#ff6b6b", // 1 Red
	"#4dabf7", // 2 Blue
	"#69db7c", // 3 Green
	"#ffd43b", // 4 Yellow
	"#da77f2", // 5 Violet
	"#3bc9db", // 6 Cyan
	"#ff922b", // 7 Orange
	"#f783ac", // 8 Pink
	"#a9e34b", // 9 Lime
	"#9775fa", // 10 Purple
	"#38d9a9", // 11 Teal
	"#ffa8a8", // 12 Salmon
	"#748ffc", // 13 Indigo
	"#e8590c", // 14 Rust
	"#99e9f2", // 15 Ice
	"#fcc2d7", // 16 Rose
	"#c0eb75", // 17 Pale Lime
	"#d0bfff", // 18 Lavender
	"#ffc078", // 19 Apricot
	"#63e6be", // 20 Mint
];

function hslToHex(h, s, l) {
	s /= 100;
	l /= 100;
	const k = (n) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n) =>
		l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const toHex = (v) =>
		Math.round(v * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Colors past the fixed palette are generated (golden-angle hue steps) so two
// different color numbers never share the same swatch.
function colorFromPalette(colorNumber) {
	if (colorNumber < colorPalette.length) {
		return { code: colorPalette[colorNumber] };
	}
	const hue = (colorNumber * 137.508) % 360;
	const lightness = colorNumber % 2 === 0 ? 62 : 72;
	return { code: hslToHex(hue, 70, lightness) };
}

// --- Canvas Setup ---
// The canvas works in a 100x100 space with the y-axis pointing up.
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

// Integer coordinates in [1, 99] give this many distinct positions.
const MAX_POINTS = 99 * 99;

// --- State ---
let points = [];
let mode = null; // null | "circle" | "add"
let circleStart = null;
let circle = null; // { center, radius, highest } of the circle on screen
let hoverIndex = null;
let revealFrame = null;
let showTriangulation = false;
let triEdges = null; // cached Delaunay edges of the current points
let testRun = 0; // bumps to stop an outdated circle test

function drawGrid(spacing = 10) {
	ctx.clearRect(0, 0, 100, 100);
	ctx.strokeStyle = GRID_COLOR;
	ctx.lineWidth = 0.12;
	for (let v = spacing; v < 100; v += spacing) {
		ctx.beginPath();
		ctx.moveTo(v, 0);
		ctx.lineTo(v, 100);
		ctx.moveTo(0, v);
		ctx.lineTo(100, v);
		ctx.stroke();
	}
}

function pointRadius() {
	return Math.max(0.45, 1.3 - points.length / 400);
}

function drawPoint(x, y, color) {
	ctx.beginPath();
	ctx.arc(x, y, pointRadius(), 0, Math.PI * 2);
	ctx.fillStyle = color;
	ctx.fill();
}

function drawRing(point, color, gap, width) {
	ctx.beginPath();
	ctx.arc(point.x, point.y, pointRadius() + gap, 0, Math.PI * 2);
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.stroke();
}

// Draws the whole scene: grid, triangulation, points, the current circle and its unique
// point, and the hovered point.
function render() {
	drawGrid();
	drawTriangulation();
	points.forEach((p) => drawPoint(p.x, p.y, colorFromPalette(p.color).code));

	if (circle && circle.radius > 0) {
		ctx.beginPath();
		ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
		ctx.globalAlpha = 0.08;
		ctx.fillStyle = ACCENT;
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.strokeStyle = ACCENT;
		ctx.lineWidth = 0.25;
		ctx.stroke();
		if (circle.highest) drawRing(circle.highest, ACCENT, 1.4, 0.3);
	}

	if (hoverIndex !== null && points[hoverIndex]) {
		drawRing(points[hoverIndex], TEXT_COLOR, 0.9, 0.25);
	}
}

// Points are distinct: two points on the same spot would always share a disc,
// and the Delaunay triangulation silently drops duplicates.
function drawRandomPoints(n) {
	points = [];
	const taken = new Set();
	while (points.length < n) {
		const x = Math.floor(Math.random() * 99) + 1;
		const y = Math.floor(Math.random() * 99) + 1;
		const key = `${x},${y}`;
		if (taken.has(key)) continue;
		taken.add(key);
		points.push({ x, y, color: 0 });
	}
	hoverIndex = null;
}

// Reveal the coloring one color class at a time, lowest first, so the order of
// the algorithm's rounds is visible.
function revealColoring() {
	cancelReveal();
	const maxColor = Math.max(...points.map((p) => p.color));
	if (prefersReducedMotion || maxColor < 1) {
		render();
		return;
	}
	const fade = 220;
	const stagger = Math.min(70, 900 / maxColor);
	const total = (maxColor - 1) * stagger + fade;
	const start = performance.now();

	const frame = (now) => {
		const elapsed = now - start;
		drawGrid();
		drawTriangulation();
		for (const p of points) {
			const t = (elapsed - (p.color - 1) * stagger) / fade;
			const alpha = Math.min(1, Math.max(0, t));
			drawPoint(p.x, p.y, UNCOLORED);
			if (alpha > 0) {
				ctx.globalAlpha = 1 - (1 - alpha) ** 3; // ease-out
				drawPoint(p.x, p.y, colorFromPalette(p.color).code);
				ctx.globalAlpha = 1;
			}
		}
		if (elapsed < total) {
			revealFrame = requestAnimationFrame(frame);
		} else {
			revealFrame = null;
			render();
		}
	};
	revealFrame = requestAnimationFrame(frame);
}

function cancelReveal() {
	if (revealFrame !== null) {
		cancelAnimationFrame(revealFrame);
		revealFrame = null;
	}
}

// --- Outputs ---
function setOutput(el, text, animate = true) {
	text = String(text);
	if (el.textContent === text) return;
	el.textContent = text;
	if (!animate) return;
	// A short settle marks that the value changed.
	el.animate(
		prefersReducedMotion
			? [{ opacity: 0.4 }, { opacity: 1 }]
			: [
					{ opacity: 0, transform: "translateY(4px)" },
					{ opacity: 1, transform: "translateY(0)" },
			  ],
		{ duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
	);
}

function setCircleResult(color, occurrences, animate = true) {
	const output = document.getElementById("uniqueColorOutput");
	const swatch = document.getElementById("uniqueSwatch");
	const note = document.getElementById("circleNote");

	output.classList.toggle("conflict", occurrences > 1);
	if (color === null) {
		setOutput(output, "-", animate);
		swatch.hidden = true;
		note.hidden = true;
		return;
	}
	setOutput(output, color, animate);
	swatch.hidden = false;
	swatch.style.backgroundColor = colorFromPalette(color).code;
	note.hidden = occurrences <= 1;
	note.textContent = `Color ${color} appears ${occurrences} times in this circle. The coloring is not conflict-free.`;
}

// The hint for whichever step comes next when no tool is active.
function nextStepHint() {
	if (points.length === 0) return "Enter a number of points, or pick Add points";
	if (!isColored()) return "Now generate a coloring";
	return "Pick Circle above to test the coloring";
}

function setSummary(pointCount, colorCount) {
	const summary = document.getElementById("coloringSummary");
	if (pointCount === null) {
		summary.hidden = true;
		return;
	}
	const pts = document.createElement("strong");
	pts.textContent = pointCount;
	const cols = document.createElement("strong");
	cols.textContent = colorCount;
	summary.replaceChildren(
		"Colored ",
		pts,
		pointCount === 1 ? " point with " : " points with ",
		cols,
		colorCount === 1
			? " color. Every circle you draw now contains a color that appears exactly once."
			: " colors. Every circle you draw now contains a color that appears exactly once."
	);
	summary.hidden = false;
	if (!prefersReducedMotion) {
		summary.animate(
			[
				{ opacity: 0, transform: "translateY(4px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
		);
	}
}

function setHint(text) {
	const hint = document.getElementById("canvasHint");
	if (text) hint.textContent = text;
	hint.classList.toggle("is-visible", Boolean(text));
}

// --- Tools (Circle / Add points) ---
const MODE_HINTS = {
	circle: "Drag on the canvas to draw a circle",
	add: "Click to add a point. Click a point to remove it.",
};

// Picking the active tool again switches it off.
function setMode(next) {
	mode = next === mode ? null : next;
	circleStart = null;
	circle = null;
	document
		.getElementById("toolCircle")
		.setAttribute("aria-pressed", String(mode === "circle"));
	document
		.getElementById("toolAdd")
		.setAttribute("aria-pressed", String(mode === "add"));
	canvas.classList.toggle("circle-mode", mode === "circle");
	canvas.classList.toggle("add-mode", mode === "add");
	setHint(MODE_HINTS[mode] || nextStepHint());
	setCircleResult(null, 0);
	if (revealFrame === null) render();
}

function getCanvasCoords(event) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: ((event.clientX - rect.left) / rect.width) * 100,
		y: 100 - ((event.clientY - rect.top) / rect.height) * 100,
	};
}

canvas.addEventListener("pointerdown", (event) => {
	if (mode === "circle") startDrawingCircle(event);
	else if (mode === "add") addOrRemovePoint(event);
});
canvas.addEventListener("pointermove", (event) => {
	if (circleStart) previewCircle(event);
	else setHover(pointNear(event, mode === "add" ? 0.6 : 1.2), true);
});
canvas.addEventListener("pointerup", (event) => {
	if (circleStart) finishDrawingCircle(event);
});
canvas.addEventListener("pointercancel", () => {
	if (circleStart) cancelDrawingCircle();
});
canvas.addEventListener("pointerleave", () => {
	if (!circleStart) setHover(null);
});

// --- Circle ---
function radiusTo(event) {
	const { x, y } = getCanvasCoords(event);
	return Math.hypot(x - circleStart.x, y - circleStart.y);
}

function startDrawingCircle(event) {
	// Circles are measured against the final coloring, so skip any reveal
	// still in progress.
	cancelReveal();
	// Capture keeps pointerup coming to the canvas even if released outside it.
	canvas.setPointerCapture(event.pointerId);
	circleStart = getCanvasCoords(event);
	circle = { center: circleStart, radius: 0, highest: null };
	setHover(null);
	setHint(null);
}

function previewCircle(event) {
	circle.radius = radiusTo(event);
	// Updates on every move, so the numbers change without animation.
	measureCircle(false);
	render();
}

function cancelDrawingCircle() {
	circleStart = null;
	circle = null;
	setCircleResult(null, 0);
	render();
}

function finishDrawingCircle(event) {
	circle.radius = radiusTo(event);
	measureCircle(true);
	render();
	circleStart = null;
}

// Finds the highest color inside the current circle. The CF property says it
// appears exactly once; verify it rather than assume it.
function measureCircle(animate) {
	const inside = getPointsInsideCircle(circle.center, circle.radius);
	const highest = findHighestColorPoint(inside);
	circle.highest = highest;
	if (!highest) {
		setCircleResult(null, 0, animate);
		return;
	}
	const occurrences = inside.filter((p) => p.color === highest.color).length;
	setCircleResult(highest.color, occurrences, animate);
}

function getPointsInsideCircle(center, radius) {
	return points.filter(
		(point) => Math.hypot(point.x - center.x, point.y - center.y) <= radius
	);
}

function findHighestColorPoint(pointsInsideCircle) {
	if (pointsInsideCircle.length === 0) return null;
	return pointsInsideCircle.reduce((maxPoint, currentPoint) =>
		currentPoint.color > maxPoint.color ? currentPoint : maxPoint
	);
}

// --- Add points ---
// Clicking on a point removes it; anywhere else adds one on the nearest free
// grid position. Either way the old coloring no longer applies.
function addOrRemovePoint(event) {
	const near = pointNear(event, 0.6);
	if (near !== null) {
		points.splice(near, 1);
		hoverIndex = null;
	} else {
		if (points.length >= MAX_POINTS) return;
		const { x, y } = getCanvasCoords(event);
		const px = Math.min(99, Math.max(1, Math.round(x)));
		const py = Math.min(99, Math.max(1, Math.round(y)));
		if (points.some((p) => p.x === px && p.y === py)) return;
		points.push({ x: px, y: py, color: 0 });
	}
	pointsChanged();
}

function clearPoints() {
	points = [];
	hoverIndex = null;
	pointsChanged();
}

// Shared reset after the set of points changes by hand.
function pointsChanged() {
	cancelReveal();
	triEdges = null;
	resetColoring();
	updateJsonViewer();
	updateToolAvailability();
	setHint(MODE_HINTS[mode] || nextStepHint());
	render();
}

function resetColoring() {
	points.forEach((p) => (p.color = 0));
	if (mode === "circle") setMode(null);
	circle = null;
	setOutput(document.getElementById("colorCountOutput"), 0);
	setCircleResult(null, 0);
	setSummary(null);
	setTestResult(null);
}

function isColored() {
	return points.length > 0 && points.every((p) => p.color > 0);
}

function updateToolAvailability() {
	const hasPoints = points.length > 0;
	document.getElementById("generateColoringButton").disabled = !hasPoints;
	document.getElementById("toolClear").disabled = !hasPoints;
	document.getElementById("toolTriangulation").disabled = points.length < 2;
	document.getElementById("toolCircle").disabled = !isColored();
	document.getElementById("testButton").disabled = !isColored();
}

// --- Triangulation overlay ---
function toggleTriangulation() {
	showTriangulation = !showTriangulation;
	document
		.getElementById("toolTriangulation")
		.setAttribute("aria-pressed", String(showTriangulation));
	if (revealFrame === null) render();
}

// Edges of the Delaunay graph of all points, each listed once.
function triangulationEdges() {
	if (!triEdges) {
		triEdges = [];
		if (points.length >= 2) {
			getGraph(points).forEach((neighbors, u) => {
				for (const v of neighbors) if (u < v) triEdges.push([u, v]);
			});
		}
	}
	return triEdges;
}

function drawTriangulation() {
	if (!showTriangulation) return;
	ctx.beginPath();
	for (const [u, v] of triangulationEdges()) {
		ctx.moveTo(points[u].x, points[u].y);
		ctx.lineTo(points[v].x, points[v].y);
	}
	ctx.strokeStyle = EDGE_COLOR;
	ctx.lineWidth = 0.14;
	ctx.stroke();
}

// --- Circle test ---
const TEST_CIRCLES = 10000;

function setTestResult(text, bad = false) {
	const el = document.getElementById("testResult");
	el.hidden = text === null;
	if (text === null) return;
	el.classList.toggle("is-bad", bad);
	el.replaceChildren(...text);
}

// Buckets points into square cells so a circle only looks at nearby points.
const CELL = 4;
const CELLS = Math.ceil(101 / CELL);

function buildPointGrid() {
	const grid = Array.from({ length: CELLS * CELLS }, () => []);
	for (const p of points) {
		grid[Math.floor(p.y / CELL) * CELLS + Math.floor(p.x / CELL)].push(p);
	}
	return grid;
}

// Returns how often the highest color inside the circle occurs (0 if empty).
function highestColorCount(grid, center, radius) {
	const clamp = (v) => Math.min(CELLS - 1, Math.max(0, Math.floor(v / CELL)));
	const r2 = radius * radius;
	let best = 0;
	let count = 0;
	for (let cy = clamp(center.y - radius); cy <= clamp(center.y + radius); cy++) {
		for (let cx = clamp(center.x - radius); cx <= clamp(center.x + radius); cx++) {
			for (const p of grid[cy * CELLS + cx]) {
				const dx = p.x - center.x;
				const dy = p.y - center.y;
				if (dx * dx + dy * dy > r2) continue;
				if (p.color > best) {
					best = p.color;
					count = 1;
				} else if (p.color === best) {
					count++;
				}
			}
		}
	}
	return count;
}

// Checks random circles in short time slices so the page stays responsive.
// Radii are biased toward small circles, which hold few points and are the
// likeliest place for a conflict.
function testCircles() {
	const run = ++testRun;
	const button = document.getElementById("testButton");
	button.disabled = true;
	setTestResult(["Testing..."]);
	const grid = buildPointGrid();
	let done = 0;
	let conflicts = 0;
	let firstConflict = null;

	const chunk = () => {
		if (run !== testRun) return; // points changed mid-test
		// Work for about one frame, then yield so the page can repaint.
		const deadline = performance.now() + 14;
		for (; done < TEST_CIRCLES && performance.now() < deadline; done++) {
			const center = { x: Math.random() * 110 - 5, y: Math.random() * 110 - 5 };
			const radius = 60 * Math.random() ** 2;
			if (highestColorCount(grid, center, radius) > 1) {
				conflicts++;
				firstConflict ??= { center, radius, highest: null };
			}
		}
		if (done < TEST_CIRCLES) {
			const strong = document.createElement("strong");
			strong.textContent = done.toLocaleString("en-US");
			setTestResult(["Testing... ", strong, " circles checked"]);
			setTimeout(chunk, 0);
			return;
		}
		const strong = document.createElement("strong");
		strong.textContent = `${conflicts} ${conflicts === 1 ? "conflict" : "conflicts"}`;
		setTestResult(
			[`Checked ${TEST_CIRCLES.toLocaleString("en-US")} circles: `, strong, "."],
			conflicts > 0
		);
		button.disabled = false;
		if (firstConflict) {
			// Show the first failing circle so it can be inspected.
			if (mode !== "circle") setMode("circle");
			circle = firstConflict;
			measureCircle(true);
			render();
		}
	};
	chunk();
}

// --- Hover: link table rows and canvas points ---
function setHover(index, scrollRow = false) {
	if (index === hoverIndex) return;
	const body = document.getElementById("pointsTableBody");
	body.children[hoverIndex]?.classList.remove("is-hovered");
	hoverIndex = index;
	const row = index === null ? null : body.children[index];
	if (row) {
		row.classList.add("is-hovered");
		if (scrollRow) scrollRowIntoView(row);
	}
	// The reveal animation owns the canvas until it finishes.
	if (revealFrame === null) render();
}

// Scrolls only the table container (scrollIntoView could move the whole page).
function scrollRowIntoView(row) {
	const scroller = document.querySelector(".table-scroll");
	const headerHeight = scroller.querySelector("thead").offsetHeight;
	const box = scroller.getBoundingClientRect();
	const r = row.getBoundingClientRect();
	if (r.top < box.top + headerHeight) {
		scroller.scrollTop -= box.top + headerHeight - r.top;
	} else if (r.bottom > box.bottom) {
		scroller.scrollTop += r.bottom - box.bottom + 8;
	}
}

function pointNear(event, extra = 1.2) {
	const { x, y } = getCanvasCoords(event);
	let best = null;
	let bestDist = pointRadius() + extra;
	points.forEach((p, i) => {
		const d = Math.hypot(p.x - x, p.y - y);
		if (d <= bestDist) {
			best = i;
			bestDist = d;
		}
	});
	return best;
}

const tableBody = document.getElementById("pointsTableBody");
tableBody.addEventListener("pointerover", (event) => {
	const row = event.target.closest("tr");
	if (row) setHover(Number(row.dataset.index));
});
tableBody.addEventListener("pointerleave", () => setHover(null));

// --- Button Handlers ---
function showPointError(message) {
	const input = document.getElementById("pointCount");
	const help = document.getElementById("pointHelp");
	input.setAttribute("aria-invalid", message ? "true" : "false");
	help.classList.toggle("is-error", Boolean(message));
	help.textContent = message || `Between 1 and ${MAX_POINTS}.`;
}

function handleDraw() {
	const count = parseInt(document.getElementById("pointCount").value);
	if (isNaN(count) || count < 1 || count > MAX_POINTS) {
		showPointError(`Enter a whole number between 1 and ${MAX_POINTS}.`);
		return;
	}
	showPointError(null);
	drawRandomPoints(count);
	pointsChanged();
}

function handleColoring() {
	const coloredPoints = generateConflictFreeColoring(points);
	coloredPoints.forEach((p, i) => {
		points[i].color = p.color;
	});
	testRun++;
	setTestResult(null);
	updateJsonViewer();
	updateToolAvailability();
	const uniqueColors = new Set(points.map((p) => p.color));
	setOutput(document.getElementById("colorCountOutput"), uniqueColors.size);
	setSummary(points.length, uniqueColors.size);

	// Testing a circle is the natural next step, so switch to that tool.
	if (mode !== "circle") setMode("circle");
	else setCircleResult(null, 0);
	circle = null;
	revealColoring();
}

function updateJsonViewer() {
	const tableBody = document.getElementById("pointsTableBody");
	const rows = document.createDocumentFragment();
	points.forEach((point, index) => {
		const row = document.createElement("tr");
		row.dataset.index = index;
		if (index === hoverIndex) row.classList.add("is-hovered");
		for (const value of [index + 1, point.x, point.y]) {
			const cell = document.createElement("td");
			cell.textContent = value;
			row.appendChild(cell);
		}
		const colorCell = document.createElement("td");
		const colorWrap = document.createElement("span");
		colorWrap.className = "color-cell";
		const swatch = document.createElement("span");
		swatch.className = "swatch";
		swatch.style.backgroundColor = colorFromPalette(point.color).code;
		colorWrap.append(swatch, point.color === 0 ? "-" : String(point.color));
		colorCell.appendChild(colorWrap);
		row.appendChild(colorCell);
		rows.appendChild(row);
	});
	tableBody.replaceChildren(rows);
	document.getElementById("tableEmpty").hidden = points.length > 0;
}

window.handleDraw = handleDraw;
window.handleColoring = handleColoring;
window.setMode = setMode;
window.toggleTriangulation = toggleTriangulation;
window.clearPoints = clearPoints;
window.testCircles = testCircles;

const pointCountInput = document.getElementById("pointCount");
pointCountInput.max = MAX_POINTS;
pointCountInput.addEventListener("keydown", function (e) {
	if (e.key === "Enter") {
		handleDraw();
	}
});
drawGrid();

// --- Conflict-Free Coloring Algorithm ---

// Adjacency sets of the Delaunay graph. When every point is collinear Delaunator
// returns no triangles; the Delaunay graph is then the path through the points
// in order along the line.
function getGraph(pts) {
	const n = pts.length;
	const graph = Array.from({ length: n }, () => new Set());
	const addEdge = (u, v) => {
		graph[u].add(v);
		graph[v].add(u);
	};

	const tris = Delaunator.from(pts.map((p) => [p.x, p.y])).triangles;
	if (tris.length === 0) {
		const order = pts
			.map((_, i) => i)
			.sort((a, b) => pts[a].x - pts[b].x || pts[a].y - pts[b].y);
		for (let i = 1; i < order.length; i++) addEdge(order[i - 1], order[i]);
		return graph;
	}

	for (let t = 0; t < tris.length; t += 3) {
		const u = tris[t],
			v = tris[t + 1],
			w = tris[t + 2];
		addEdge(u, v);
		addEdge(v, w);
		addEdge(w, u);
	}
	return graph;
}

// Smallest-last order: repeatedly remove a vertex of minimum remaining degree.
// A planar graph always has a vertex of degree <= 5, so coloring in the
// reverse of this order uses at most 6 colors, and the largest color class
// holds at least n / 6 points.
function smallestLastOrder(graph) {
	const n = graph.length;
	const degree = graph.map((neighbors) => neighbors.size);
	const buckets = [];
	degree.forEach((d, v) => (buckets[d] ??= new Set()).add(v));
	const removed = new Uint8Array(n);
	const order = [];
	let d = 0;
	while (order.length < n) {
		// Removing a vertex lowers its neighbors' degrees by at most one.
		d = Math.max(0, d - 1);
		while (!buckets[d] || buckets[d].size === 0) d++;
		const v = buckets[d].values().next().value;
		buckets[d].delete(v);
		removed[v] = 1;
		order.push(v);
		for (const u of graph[v]) {
			if (removed[u]) continue;
			buckets[degree[u]].delete(u);
			degree[u]--;
			(buckets[degree[u]] ??= new Set()).add(u);
		}
	}
	return order.reverse();
}

function greedyColor(graph) {
	const coloring = {};
	for (const u of smallestLastOrder(graph)) {
		const used = new Set();
		for (const v of graph[u]) {
			if (coloring[v] !== undefined) used.add(coloring[v]);
		}
		let c = 0;
		while (used.has(c)) c++;
		coloring[u] = c;
	}
	return coloring;
}

function getMostCommonColor(coloring) {
	const counts = {};
	for (const node in coloring) {
		const c = coloring[node];
		counts[c] = (counts[c] || 0) + 1;
	}
	return +Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
}

// Repeatedly take the largest independent set of the remaining points'
// Delaunay graph, give it the next color, and remove it. Any disc with 2+
// remaining points contains a Delaunay edge, so the highest color inside any
// disc is unique.
function generateConflictFreeColoring(initialPoints) {
	let remaining = initialPoints.slice();
	let indices = remaining.map((_, i) => i);
	const CF = {}; // final mapping i -> color
	let curColor = 1;

	while (remaining.length > 0) {
		if (remaining.length < 4) {
			for (let i = 0; i < remaining.length; i++) {
				CF[indices[i]] = curColor++;
			}
			break;
		}
		const G = getGraph(remaining);
		const coloring = greedyColor(G);
		const keepColor = getMostCommonColor(coloring);

		const newPts = [],
			newIdx = [];
		for (let i = 0; i < remaining.length; i++) {
			if (coloring[i] === keepColor) {
				CF[indices[i]] = curColor;
			} else {
				newPts.push(remaining[i]);
				newIdx.push(indices[i]);
			}
		}
		remaining = newPts;
		indices = newIdx;
		curColor++;
	}

	return initialPoints.map((pt, i) => ({
		x: pt.x,
		y: pt.y,
		color: CF[i] !== undefined ? CF[i] : 0,
	}));
}
