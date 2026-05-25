import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';
import WallShape from './WallShape';
import { snapAngle, findSnapPoint, computeWallGeometry } from '../utils/geometry';

const GRID_SIZE = 20;
const SNAP_RADIUS = 14;

function drawGrid(ctx, width, height, offset = { x: 0, y: 0 }) {
  // handled via SVG background
}

export default function Canvas({
  walls,
  previewWall,
  drawingState,
  selectedWallId,
  mode,
  angleSnap,
  endpointSnap,
  snapPoint,
  setSnapPoint,
  onCanvasClick,
  onMouseMove,
  onWallSelect,
  onEndpointDrag,
  onWallDrag,
}) {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 280, height: window.innerHeight });
  const [cursor, setCursor] = useState('default');
  const [mousePos, setMousePos] = useState(null);
  const dragStartRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth - 280, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onCanvasClick && onCanvasClick(null, true); // escape
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.matches('input')) {
        e.preventDefault();
        // handled in parent
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCanvasClick]);

  const getPointerPos = useCallback(() => {
  const stage = stageRef.current;
  if (!stage) return { x: 0, y: 0 };

  const container = stage.container().getBoundingClientRect();
  const pointerPos = stage.getPointerPosition();
  if (!pointerPos) return { x: 0, y: 0 };

  return {
    x: pointerPos.x,
    y: pointerPos.y,
  };
}, []);

  const resolvePos = useCallback((rawX, rawY) => {
    let x = rawX, y = rawY;

    // Endpoint snapping
    if (endpointSnap) {
      const snap = findSnapPoint(walls, x, y, SNAP_RADIUS);
      if (snap) {
        setSnapPoint(snap);
        return { x: snap.x, y: snap.y };
      }
      // Also snap to drawing origin
      if (drawingState) {
        const distToOrigin = Math.sqrt(
          (x - drawingState.x1) ** 2 + (y - drawingState.y1) ** 2
        );
        if (distToOrigin < SNAP_RADIUS) {
          setSnapPoint({ x: drawingState.x1, y: drawingState.y1 });
          return { x: drawingState.x1, y: drawingState.y1 };
        }
      }
    }
    setSnapPoint(null);

    // Angle snapping
    if (angleSnap && drawingState) {
      const snapped = snapAngle(drawingState.x1, drawingState.y1, x, y, 15);
      return snapped;
    }

    return { x, y };
  }, [walls, drawingState, angleSnap, endpointSnap, setSnapPoint]);

  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current) return;
    const raw = getPointerPos(e);
    const resolved = resolvePos(raw.x, raw.y);
    setMousePos(resolved);
    onMouseMove && onMouseMove(resolved.x, resolved.y);

    if (mode === 'draw' && drawingState) {
      setCursor('crosshair');
    } else if (mode === 'draw') {
      setCursor('crosshair');
    } else {
      setCursor('default');
    }
  }, [getPointerPos, resolvePos, onMouseMove, mode, drawingState]);

  const handleStageClick = useCallback((e) => {
    if (isDraggingRef.current) return;
    if (e.target !== stageRef.current && mode === 'draw') {
      // clicked a wall shape — still continue drawing
    }
    if (mode !== 'draw') return;

    const raw = getPointerPos(e);
    const resolved = resolvePos(raw.x, raw.y);
    onCanvasClick && onCanvasClick(resolved);
  }, [getPointerPos, resolvePos, onCanvasClick, mode]);

  const handleStageMouseDown = useCallback((e) => {
    dragStartRef.current = getPointerPos(e);
    isDraggingRef.current = false;
  }, [getPointerPos]);

  const handleStageDragMove = useCallback((e) => {
    isDraggingRef.current = true;
  }, []);

  const allWalls = previewWall ? [...walls, previewWall] : walls;
  const computedWalls = computeWallGeometry(allWalls);

  // Snap indicator
  const showSnap = snapPoint && drawingState;

  return (
    <div
      className="canvas-container"
      style={{ cursor: mode === 'draw' ? 'crosshair' : 'default' }}
    >
      {/* SVG grid background */}
      <svg
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="smallGrid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e8eaed" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
            <rect width={GRID_SIZE * 5} height={GRID_SIZE * 5} fill="url(#smallGrid)"/>
            <path d={`M ${GRID_SIZE*5} 0 L 0 0 0 ${GRID_SIZE*5}`} fill="none" stroke="#d0d4db" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleStageMouseDown}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Layer>
          {computedWalls.map((wall) => {
            const isPreview = wall.id === 'preview';
            const isSelected = wall.id === selectedWallId;

            return (
              <WallShape
                key={wall.id}
                wall={wall}
                isSelected={isSelected}
                isPreview={isPreview}
                showEndpoints={isSelected && mode === 'select'}
                onSelect={mode === 'select' ? onWallSelect : undefined}
                onEndpointDrag={mode === 'select' ? onEndpointDrag : undefined}
                onDragStart={mode === 'select' ? (id, e) => {
                  isDraggingRef.current = false;
                  dragStartRef.current = { x: e.target.x(), y: e.target.y() };
                } : undefined}
              />
            );
          })}

          {/* Drawing origin indicator */}
          {drawingState && (
            <Circle
              x={drawingState.x1}
              y={drawingState.y1}
              radius={5}
              fill="#1a6ef5"
              opacity={0.9}
              listening={false}
            />
          )}

          {/* Snap indicator */}
          {showSnap && (
            <Circle
              x={snapPoint.x}
              y={snapPoint.y}
              radius={8}
              stroke="#1a6ef5"
              strokeWidth={1.5}
              fill="rgba(26,110,245,0.12)"
              listening={false}
            />
          )}

          {/* Coordinates readout */}
          {mousePos && mode === 'draw' && (
            <Text
              x={mousePos.x + 12}
              y={mousePos.y - 24}
              text={`${Math.round(mousePos.x)}, ${Math.round(mousePos.y)}`}
              fontSize={11}
              fontFamily="DM Mono, monospace"
              fill="#666"
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
