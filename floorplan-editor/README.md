# FloorPlan Editor

A lightweight browser-based floor plan wall editor built with React, Konva, and React Konva. The app lets users draw wall segments on a grid canvas, snap them into clean connected corners, edit wall thickness, and delete or clear wall geometry.

## Features

- Draw continuous wall segments on a grid canvas
- Preview walls before placing them
- Select existing walls and view their length and angle
- Edit default wall thickness and selected wall thickness
- Drag selected wall endpoints to reshape walls
- Snap wall angles to 15-degree increments
- Snap new wall endpoints to existing wall endpoints
- Compute seamless wall joins using polygon edge intersections
- Delete selected walls or clear the full canvas
- Keyboard shortcuts for common editing actions

## Tech Stack

- React 18
- Create React App / React Scripts
- Konva
- React Konva

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The app will run at:

```text
http://localhost:3000
```

Create a production build:

```bash
npm run build
```

## How To Use

The app starts in draw mode.

1. Click the canvas to set the first wall point.
2. Move the cursor to preview the wall.
3. Click again to place the wall.
4. Continue clicking to draw connected wall segments.
5. Press `Esc` or use the cancel button to stop drawing.
6. Switch to select mode to select walls and edit them.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `D` | Switch to draw mode |
| `S` | Switch to select mode |
| `Esc` | Cancel the active drawing operation |
| `Delete` / `Backspace` | Delete the selected wall |

## Project Structure

```text
floorplan-editor/
  public/
    index.html
  src/
    components/
      Canvas.jsx
      Toolbar.jsx
      WallShape.jsx
    hooks/
      useWallEditor.js
    utils/
      geometry.js
    App.css
    App.js
    index.js
  package.json
```

## Important Files

- `src/App.js` wires the editor state, toolbar actions, canvas events, and keyboard shortcuts together.
- `src/hooks/useWallEditor.js` stores wall state and exposes editing operations such as drawing, selecting, deleting, resizing, and moving walls.
- `src/components/Canvas.jsx` renders the Konva stage, grid, wall previews, snap indicators, and pointer interactions.
- `src/components/WallShape.jsx` renders each wall polygon and selected-wall endpoint handles.
- `src/components/Toolbar.jsx` provides mode controls, thickness controls, snap toggles, wall stats, and delete/clear actions.
- `src/utils/geometry.js` contains vector math, wall polygon generation, angle snapping, endpoint snapping, and clean corner intersection logic.

## Notes

- Wall dimensions are currently represented in canvas pixels.
- The current state is stored in React state only, so drawings reset when the page is refreshed.
- Export, import, undo/redo, zoom, and persistence are not implemented yet.
