import React, { memo } from 'react';
import { Line, Circle, Group } from 'react-konva';
import { getWallPolygonPoints } from '../utils/geometry';

const WALL_COLOR = '#8a8f98';
const WALL_OUTLINE_COLOR = '#000000';
const WALL_SELECTED_COLOR = '#1a6ef5';
const WALL_PREVIEW_COLOR = '#555a66';
const ENDPOINT_RADIUS = 5;

const WallShape = memo(({ wall, isSelected, isPreview, onSelect, onDragStart, onEndpointDrag, showEndpoints }) => {
  const fallback = getWallPolygonPoints(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness);
  const pts = wall.flatPoints || [
    fallback.p1.x, fallback.p1.y,
    fallback.p2.x, fallback.p2.y,
    fallback.p3.x, fallback.p3.y,
    fallback.p4.x, fallback.p4.y,
  ];
  const color = isPreview ? WALL_PREVIEW_COLOR : isSelected ? WALL_SELECTED_COLOR : WALL_COLOR;

  return (
    <Group>
      <Line
        points={pts}
        closed
        fill={color}
        stroke={isPreview ? '#000000' : WALL_OUTLINE_COLOR}
        strokeWidth={isPreview ? 0.5 : 1.2}
        opacity={isPreview ? 0.55 : 1}
        onClick={isPreview ? undefined : () => onSelect && onSelect(wall.id)}
        onTap={isPreview ? undefined : () => onSelect && onSelect(wall.id)}
        draggable={isSelected && !isPreview}
        onDragStart={onDragStart ? (e) => {
          e.cancelBubble = true;
          onDragStart(wall.id, e);
        } : undefined}
        onDragMove={onDragStart ? (e) => {
          e.cancelBubble = true;
        } : undefined}
        perfectDrawEnabled={false}
        listening={!isPreview}
      />

      {/* Endpoint handles — only when selected, no debug dots in final */}
      {isSelected && showEndpoints && (
        <>
          <Circle
            x={wall.x1} y={wall.y1}
            radius={ENDPOINT_RADIUS}
            fill="#fff"
            stroke={WALL_SELECTED_COLOR}
            strokeWidth={1.5}
            draggable
            onDragMove={(e) => {
              e.cancelBubble = true;
              onEndpointDrag && onEndpointDrag(wall.id, 'start', e.target.x(), e.target.y());
            }}
            hitStrokeWidth={10}
          />
          <Circle
            x={wall.x2} y={wall.y2}
            radius={ENDPOINT_RADIUS}
            fill="#fff"
            stroke={WALL_SELECTED_COLOR}
            strokeWidth={1.5}
            draggable
            onDragMove={(e) => {
              e.cancelBubble = true;
              onEndpointDrag && onEndpointDrag(wall.id, 'end', e.target.x(), e.target.y());
            }}
            hitStrokeWidth={10}
          />
        </>
      )}
    </Group>
  );
});

export default WallShape;
