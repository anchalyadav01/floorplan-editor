import React from 'react';

export default function Toolbar({
  mode, setMode,
  defaultThickness, setDefaultThickness,
  angleSnap, setAngleSnap,
  endpointSnap, setEndpointSnap,
  selectedWallId, walls,
  updateWallThickness, deleteSelected, clearAll,
  isDrawing, cancelDrawing,
}) {
  const selectedWall = walls.find(w => w.id === selectedWallId);

  const handleThicknessChange = (delta, forWall = false) => {
    if (forWall && selectedWall) {
      const next = Math.max(4, Math.min(120, selectedWall.thickness + delta));
      updateWallThickness(selectedWall.id, next);
    } else {
      setDefaultThickness(v => Math.max(4, Math.min(120, v + delta)));
    }
  };

  const ThicknessControl = ({ label, value, onMinus, onPlus, onChange }) => (
    <div className="thickness-control">
      <span className="ctrl-label">{label}</span>
      <div className="ctrl-row">
        <button className="ctrl-btn" onClick={onMinus}>−</button>
        <input
          type="number"
          className="ctrl-input"
          value={value}
          min={4} max={120}
          onChange={e => onChange(Number(e.target.value))}
        />
        <button className="ctrl-btn" onClick={onPlus}>+</button>
      </div>
    </div>
  );

  return (
    <div className="toolbar">
      <div className="toolbar-section brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-name">FloorPlan</span>
      </div>

      <div className="toolbar-section">
        <div className="section-title">MODE</div>
        <div className="mode-btns">
          <button
            className={`mode-btn ${mode === 'draw' ? 'active' : ''}`}
            onClick={() => { setMode('draw'); }}
            title="Draw walls (D)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 14L7 3l7 7-11 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Draw
          </button>
          <button
            className={`mode-btn ${mode === 'select' ? 'active' : ''}`}
            onClick={() => { setMode('select'); cancelDrawing(); }}
            title="Select walls (S)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l4.5 10.5 2-4.5 4-2L3 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Select
          </button>
        </div>
        {isDrawing && mode === 'draw' && (
          <button className="cancel-btn" onClick={cancelDrawing}>
            ✕ Cancel
          </button>
        )}
      </div>

      <div className="toolbar-section">
        <div className="section-title">DEFAULT WALL</div>
        <ThicknessControl
          label="Thickness"
          value={defaultThickness}
          onMinus={() => handleThicknessChange(-2)}
          onPlus={() => handleThicknessChange(2)}
          onChange={v => setDefaultThickness(Math.max(4, Math.min(120, v)))}
        />
      </div>

      {selectedWall && (
        <div className="toolbar-section highlight-section">
          <div className="section-title">SELECTED WALL</div>
          <ThicknessControl
            label="Thickness"
            value={selectedWall.thickness}
            onMinus={() => handleThicknessChange(-2, true)}
            onPlus={() => handleThicknessChange(2, true)}
            onChange={v => updateWallThickness(selectedWall.id, Math.max(4, Math.min(120, v)))}
          />
          <div className="wall-info">
            {(() => {
              const dx = selectedWall.x2 - selectedWall.x1;
              const dy = selectedWall.y2 - selectedWall.y1;
              const len = Math.round(Math.sqrt(dx*dx+dy*dy));
              const angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
              return <>
                <span className="info-tag">L: {len}px</span>
                <span className="info-tag">∠ {angle}°</span>
              </>;
            })()}
          </div>
          <button className="delete-btn" onClick={deleteSelected}>
            ⌫ Delete Wall
          </button>
        </div>
      )}

      <div className="toolbar-section">
        <div className="section-title">SNAP</div>
        <label className="snap-toggle">
          <input type="checkbox" checked={angleSnap} onChange={e => setAngleSnap(e.target.checked)} />
          Angle snap (15°)
        </label>
        <label className="snap-toggle">
          <input type="checkbox" checked={endpointSnap} onChange={e => setEndpointSnap(e.target.checked)} />
          Endpoint snap
        </label>
      </div>

      <div className="toolbar-section">
        <div className="section-title">CANVAS</div>
        <div className="stats">
          <span>{walls.length} wall{walls.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="clear-btn" onClick={clearAll} disabled={walls.length === 0}>
          Clear All
        </button>
      </div>

      <div className="toolbar-section help-section">
        <div className="section-title">HOW TO USE</div>
        <div className="help-text">
          <div className="help-item"><kbd>Click</kbd> Set start point</div>
          <div className="help-item"><kbd>Click</kbd> Place wall</div>
          <div className="help-item"><kbd>Esc</kbd> Stop drawing</div>
          <div className="help-item"><kbd>Del</kbd> Delete selected</div>
        </div>
      </div>
    </div>
  );
}
