import { useState, useCallback, useRef } from 'react';
import { findSnapPoint } from '../utils/geometry';

let wallIdCounter = 1;

export function useWallEditor() {
  const [walls, setWalls] = useState([]);
  const [drawingState, setDrawingState] = useState(null); // { x1, y1 }
  const [previewWall, setPreviewWall] = useState(null);
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [defaultThickness, setDefaultThickness] = useState(16);
  const [mode, setMode] = useState('draw'); // 'draw' | 'select'
  const [snapPoint, setSnapPoint] = useState(null);
  const [angleSnap, setAngleSnap] = useState(true);
  const [endpointSnap, setEndpointSnap] = useState(true);
  const dragRef = useRef(null);

  const startWall = useCallback((x, y) => {
    setDrawingState({ x1: x, y1: y });
    setSelectedWallId(null);
  }, []);

  const updatePreview = useCallback((x, y) => {
    if (!drawingState) return;
    setPreviewWall({
      id: 'preview',
      x1: drawingState.x1,
      y1: drawingState.y1,
      x2: x,
      y2: y,
      thickness: defaultThickness,
    });
  }, [drawingState, defaultThickness]);

  const finishWall = useCallback((x, y) => {
    if (!drawingState) return;
    const dx = x - drawingState.x1;
    const dy = y - drawingState.y1;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      setDrawingState(null);
      setPreviewWall(null);
      return;
    }

    const newWall = {
      id: wallIdCounter++,
      x1: drawingState.x1,
      y1: drawingState.y1,
      x2: x,
      y2: y,
      thickness: defaultThickness,
    };

    setWalls(prev => [...prev, newWall]);
    // Continue drawing from end point
    setDrawingState({ x1: x, y1: y });
    setPreviewWall(null);
  }, [drawingState, defaultThickness]);

  const cancelDrawing = useCallback(() => {
    setDrawingState(null);
    setPreviewWall(null);
  }, []);

  const selectWall = useCallback((id) => {
    setSelectedWallId(id);
  }, []);

  const deleteWall = useCallback((id) => {
    setWalls(prev => prev.filter(w => w.id !== id));
    if (selectedWallId === id) setSelectedWallId(null);
  }, [selectedWallId]);

  const deleteSelected = useCallback(() => {
    if (selectedWallId !== null) deleteWall(selectedWallId);
  }, [selectedWallId, deleteWall]);

  const clearAll = useCallback(() => {
    setWalls([]);
    setDrawingState(null);
    setPreviewWall(null);
    setSelectedWallId(null);
  }, []);

  const updateWallThickness = useCallback((id, thickness) => {
    setWalls(prev => prev.map(w => w.id === id ? { ...w, thickness } : w));
  }, []);

  const updateWallEndpoint = useCallback((id, endpoint, x, y) => {
    setWalls(prev => prev.map(w => {
      if (w.id !== id) return w;
      return endpoint === 'start'
        ? { ...w, x1: x, y1: y }
        : { ...w, x2: x, y2: y };
    }));
  }, []);

  const moveWall = useCallback((id, dx, dy) => {
    setWalls(prev => prev.map(w => {
      if (w.id !== id) return w;
      return { ...w, x1: w.x1 + dx, y1: w.y1 + dy, x2: w.x2 + dx, y2: w.y2 + dy };
    }));
  }, []);

  return {
    walls,
    drawingState,
    previewWall,
    selectedWallId,
    defaultThickness,
    mode,
    snapPoint,
    angleSnap,
    endpointSnap,
    dragRef,
    setDefaultThickness,
    setMode,
    setSnapPoint,
    setAngleSnap,
    setEndpointSnap,
    startWall,
    updatePreview,
    finishWall,
    cancelDrawing,
    selectWall,
    deleteWall,
    deleteSelected,
    clearAll,
    updateWallThickness,
    updateWallEndpoint,
    moveWall,
  };
}
