import React, { useCallback, useEffect } from 'react';
import { useWallEditor } from './hooks/useWallEditor';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import './App.css';

export default function App() {
  const editor = useWallEditor();

  const handleCanvasClick = useCallback((pos, escape = false) => {
    if (escape) {
      editor.cancelDrawing();
      return;
    }
    if (editor.mode !== 'draw') return;

    if (!editor.drawingState) {
      editor.startWall(pos.x, pos.y);
    } else {
      editor.finishWall(pos.x, pos.y);
    }
  }, [editor]);

  const handleMouseMove = useCallback((x, y) => {
    if (editor.mode === 'draw') {
      editor.updatePreview(x, y);
    }
  }, [editor]);

  const handleWallSelect = useCallback((id) => {
    if (editor.mode === 'select') {
      editor.selectWall(id);
    }
  }, [editor]);

  const handleEndpointDrag = useCallback((id, endpoint, x, y) => {
    editor.updateWallEndpoint(id, endpoint, x, y);
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input')) return;
      if (e.key === 'Escape') editor.cancelDrawing();
      if (e.key === 'd' || e.key === 'D') editor.setMode('draw');
      if (e.key === 's' || e.key === 'S') { editor.setMode('select'); editor.cancelDrawing(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedWallId !== null) {
        e.preventDefault();
        editor.deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor]);

  return (
    <div className="app">
      <Toolbar
        mode={editor.mode}
        setMode={editor.setMode}
        defaultThickness={editor.defaultThickness}
        setDefaultThickness={editor.setDefaultThickness}
        angleSnap={editor.angleSnap}
        setAngleSnap={editor.setAngleSnap}
        endpointSnap={editor.endpointSnap}
        setEndpointSnap={editor.setEndpointSnap}
        selectedWallId={editor.selectedWallId}
        walls={editor.walls}
        updateWallThickness={editor.updateWallThickness}
        deleteSelected={editor.deleteSelected}
        clearAll={editor.clearAll}
        isDrawing={!!editor.drawingState}
        cancelDrawing={editor.cancelDrawing}
      />
      <Canvas
        walls={editor.walls}
        previewWall={editor.previewWall}
        drawingState={editor.drawingState}
        selectedWallId={editor.selectedWallId}
        mode={editor.mode}
        angleSnap={editor.angleSnap}
        endpointSnap={editor.endpointSnap}
        snapPoint={editor.snapPoint}
        setSnapPoint={editor.setSnapPoint}
        onCanvasClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onWallSelect={handleWallSelect}
        onEndpointDrag={handleEndpointDrag}
        onWallDrag={editor.moveWall}
      />
    </div>
  );
}
