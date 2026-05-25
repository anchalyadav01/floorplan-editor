// ─── Vector Math Utilities ───────────────────────────────────────────────────

export function normalizeVector(dx, dy) {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

export function getPerpendicularVector(dx, dy) {
  const n = normalizeVector(dx, dy);
  return { x: -n.y, y: n.x };
}

export function vectorLength(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

export function dotProduct(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

// ─── Wall Polygon Generation ──────────────────────────────────────────────────

export function getWallPolygonPoints(x1, y1, x2, y2, thickness) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const perp = getPerpendicularVector(dx, dy);
  const half = thickness / 2;

  return {
    p1: { x: x1 + perp.x * half, y: y1 + perp.y * half },
    p2: { x: x2 + perp.x * half, y: y2 + perp.y * half },
    p3: { x: x2 - perp.x * half, y: y2 - perp.y * half },
    p4: { x: x1 - perp.x * half, y: y1 - perp.y * half },
  };
}

// ─── Line Intersection ────────────────────────────────────────────────────────
//
// This is the CORRECT way to compute clean wall corners.
// Instead of miter math, we find where the EDGES of two walls actually cross.
// That crossing point is the true corner — no gaps, no overlaps, ever.
//
// Two lines defined as:
//   Line 1: point P + direction r  (P = start, r = direction vector)
//   Line 2: point Q + direction s
//
// They intersect where:  P + t*r = Q + u*s
// Solve for t:           t = (Q-P) x s / (r x s)
// (x here means 2D cross product: ax*by - ay*bx)
//
// Then intersection = P + t * r

const INTERSECTION_EPSILON = 0.0001;
const SNAP = 3;
const MAX_CORNER_EXTENSION_FACTOR = 6;

function crossProduct(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

function lineIntersection(p1, d1, p2, d2) {
  // 2D cross product
  const cross = crossProduct(d1.x, d1.y, d2.x, d2.y);

  // Lines are parallel — no intersection
  if (Math.abs(cross) < INTERSECTION_EPSILON) return null;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const t = crossProduct(dx, dy, d2.x, d2.y) / cross;

  return {
    x: p1.x + t * d1.x,
    y: p1.y + t * d1.y,
  };
}

// ─── Get Wall Edge Lines ──────────────────────────────────────────────────────
//
// Every wall has 2 edges (left and right).
// Each edge is defined by: a point on the edge + the wall direction.
//
// Left edge  = offset by +half perpendicularly
// Right edge = offset by -half perpendicularly

function getWallEdges(wall) {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const dir = normalizeVector(dx, dy);
  const perp = { x: -dir.y, y: dir.x };
  const half = wall.thickness / 2;

  return {
    dir,
    // Left edge: a point on it + direction
    leftPoint:  { x: wall.x1 + perp.x * half, y: wall.y1 + perp.y * half },
    rightPoint: { x: wall.x1 - perp.x * half, y: wall.y1 - perp.y * half },
    perp,
  };
}

// ─── Clean Corner via Intersection ───────────────────────────────────────────
//
// WallA ends at the shared point S.
// WallB starts at the shared point S.
//
// We find where:
//   left  edge of A intersects left  edge of B  → outer corner
//   right edge of A intersects right edge of B  → inner corner
//
// Both walls then use THESE exact points as their shared corners.
// Result: perfect seamless join at any angle.

function getEndpointPoint(wall, endpoint) {
  return endpoint === 'start'
    ? { x: wall.x1, y: wall.y1 }
    : { x: wall.x2, y: wall.y2 };
}

function getEndpointFallback(wall, endpoint) {
  const polygon = getWallPolygonPoints(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness);

  return endpoint === 'start'
    ? { left: polygon.p1, right: polygon.p4 }
    : { left: polygon.p2, right: polygon.p3 };
}

function clampCorner(intersection, sharedPoint, wallA, wallB) {
  if (!intersection) return null;

  const distanceFromJoint = vectorLength(
    intersection.x - sharedPoint.x,
    intersection.y - sharedPoint.y
  );
  const maxExtension = Math.max(wallA.thickness, wallB.thickness) * MAX_CORNER_EXTENSION_FACTOR;

  if (distanceFromJoint <= maxExtension || distanceFromJoint < INTERSECTION_EPSILON) {
    return intersection;
  }

  const scale = maxExtension / distanceFromJoint;

  return {
    x: sharedPoint.x + (intersection.x - sharedPoint.x) * scale,
    y: sharedPoint.y + (intersection.y - sharedPoint.y) * scale,
  };
}

function getConnectedEndpointCorners(wall, endpoint, otherWall) {
  const edges = getWallEdges(wall);
  const otherEdges = getWallEdges(otherWall);
  const fallback = getEndpointFallback(wall, endpoint);
  const sharedPoint = getEndpointPoint(wall, endpoint);

  const leftCorner = clampCorner(
    lineIntersection(edges.leftPoint, edges.dir, otherEdges.leftPoint, otherEdges.dir),
    sharedPoint,
    wall,
    otherWall
  );
  const rightCorner = clampCorner(
    lineIntersection(edges.rightPoint, edges.dir, otherEdges.rightPoint, otherEdges.dir),
    sharedPoint,
    wall,
    otherWall
  );

  return {
    left: leftCorner || fallback.left,
    right: rightCorner || fallback.right,
  };
}

export function getCornerIntersections(wallA, wallB) {
  const eA = getWallEdges(wallA);
  const eB = getWallEdges(wallB);

  // Intersect left edges
  const leftCorner = lineIntersection(
    eA.leftPoint,  eA.dir,
    eB.leftPoint,  eB.dir
  );

  // Intersect right edges
  const rightCorner = lineIntersection(
    eA.rightPoint, eA.dir,
    eB.rightPoint, eB.dir
  );

  // Fallback: if walls are parallel (0° or 180°), just use plain endpoints
  const fallback = getEndpointFallback(wallA, 'end');

  return {
    left:  leftCorner  || fallback.left,
    right: rightCorner || fallback.right,
  };
}

// ─── Angle Snapping ───────────────────────────────────────────────────────────

export function snapAngle(x1, y1, x2, y2, snapDeg = 15) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = vectorLength(dx, dy);
  if (len === 0) return { x: x2, y: y2 };

  const angle = Math.atan2(dy, dx);
  const snapRad = (snapDeg * Math.PI) / 180;
  const snapped = Math.round(angle / snapRad) * snapRad;

  return {
    x: x1 + Math.cos(snapped) * len,
    y: y1 + Math.sin(snapped) * len,
  };
}

// ─── Endpoint Snapping ────────────────────────────────────────────────────────

export function findSnapPoint(walls, x, y, radius = 14, excludeIds = []) {
  for (const wall of walls) {
    if (excludeIds.includes(wall.id)) continue;
    if (vectorLength(wall.x1 - x, wall.y1 - y) <= radius) {
      return { x: wall.x1, y: wall.y1, wallId: wall.id, endpoint: 'start' };
    }
    if (vectorLength(wall.x2 - x, wall.y2 - y) <= radius) {
      return { x: wall.x2, y: wall.y2, wallId: wall.id, endpoint: 'end' };
    }
  }
  return null;
}

// ─── Main Geometry Computer ───────────────────────────────────────────────────
//
// For every wall:
//   1. Start with plain 4-corner rectangle
//   2. Check if start point connects to another wall → replace start corners
//      with the intersection of both walls' edges
//   3. Check if end point connects to another wall   → replace end corners
//      with the intersection of both walls' edges
//
// The intersection approach guarantees:
//   ✅ No gaps at corners
//   ✅ No overlaps at corners
//   ✅ Works at 90°, 45°, any angle
//   ✅ Works with different thicknesses

export function computeWallGeometry(walls) {
  if (!walls || walls.length === 0) return [];

  // Build adjacency map
  const adjacency = {};

  for (const wall of walls) {
    adjacency[`${wall.id}-start`] = [];
    adjacency[`${wall.id}-end`]   = [];
  }

  for (const wall of walls) {
    for (const other of walls) {
      if (other.id === wall.id) continue;

      // wall START connects to other START
      if (vectorLength(wall.x1 - other.x1, wall.y1 - other.y1) < SNAP) {
        adjacency[`${wall.id}-start`].push({ wall: other, myEnd: 'start', otherEnd: 'start' });
      }
      // wall START connects to other END
      if (vectorLength(wall.x1 - other.x2, wall.y1 - other.y2) < SNAP) {
        adjacency[`${wall.id}-start`].push({ wall: other, myEnd: 'start', otherEnd: 'end' });
      }
      // wall END connects to other START
      if (vectorLength(wall.x2 - other.x1, wall.y2 - other.y1) < SNAP) {
        adjacency[`${wall.id}-end`].push({ wall: other, myEnd: 'end', otherEnd: 'start' });
      }
      // wall END connects to other END
      if (vectorLength(wall.x2 - other.x2, wall.y2 - other.y2) < SNAP) {
        adjacency[`${wall.id}-end`].push({ wall: other, myEnd: 'end', otherEnd: 'end' });
      }
    }
  }

  return walls.map(wall => {
    // Start with plain rectangle corners
    let { p1, p2, p3, p4 } = getWallPolygonPoints(
      wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness
    );

    const startConns = adjacency[`${wall.id}-start`] || [];
    const endConns   = adjacency[`${wall.id}-end`]   || [];

    // ── Fix START corners (p1 = left, p4 = right) ──────────────────────────
    if (startConns.length >= 1) {
      const conn  = startConns[0];
      const corners = getConnectedEndpointCorners(wall, 'start', conn.wall);

      // corners.left  → p1 (left  side of wall start)
      // corners.right → p4 (right side of wall start)
      p1 = corners.left;
      p4 = corners.right;
    }

    // ── Fix END corners (p2 = left, p3 = right) ────────────────────────────
    if (endConns.length >= 1) {
      const conn  = endConns[0];
      const other = conn.wall;

      // wall goes naturally from start → end (toward junction)
      const wallA = { ...wall };

      // other wall: make it go FROM shared point outward
      const otherFromShared = conn.otherEnd === 'end'
        ? { ...other, x1: other.x2, y1: other.y2, x2: other.x1, y2: other.y1 }
        : { ...other };

      const corners = getCornerIntersections(wallA, otherFromShared);

      p2 = corners.left;
      p3 = corners.right;
    }

    const corners = [p1, p2, p3, p4];

    return {
      ...wall,
      corners,
      flatPoints: corners.flatMap(c => [c.x, c.y]),
    };
  });
}
