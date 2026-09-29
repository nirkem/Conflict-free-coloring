This repository implements a simple interactive Conflict-free coloring demo.

A coloring of points is **conflict-free with respect to discs** if every disc that contains at least one point also contains a point whose color is unique inside that disc.

## How it works

1. **Draw Points** places the chosen number of distinct random points (up to 9801) on a 100x100 grid. With **Add points** you can also click to place or remove points yourself.
2. **Generate coloring** repeatedly builds the Delaunay triangulation of the remaining points, colors that graph greedily in smallest-last order (at most 6 colors, since it is planar), gives its largest color class the next color and removes it. Because every disc holding two or more of the remaining points contains a Delaunay edge, the highest color inside any disc is unique. This uses O(log n) colors.
3. **Circle** lets you drag a disc on the canvas. The point with the highest color inside it is highlighted live, and the page checks that this color really appears only once.
4. **Triangulation** overlays the Delaunay graph, and **Test 10,000 random circles** checks the coloring automatically.

## Running it

**Both methods require Google Chrome or another modern browser.**

- GitHub Pages (web):
  1. open https://nirkem.github.io/Conflict-free-coloring/

- Local use:
  1. clone the repository using cmd/powershell/bash:
     `git clone https://github.com/nirkem/Conflict-free-coloring.git`
  2. open the file `index.html` in the project folder.

  Everything runs offline: [Delaunator](https://github.com/mapbox/delaunator) (ISC license) is in `vendor/` and the [Geist](https://vercel.com/font) fonts (SIL Open Font License) are in `fonts/`.
