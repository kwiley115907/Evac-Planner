import { GRID_CELL_SIZE, GRID_COLS, GRID_ROWS, type PaintTool } from "./planner-config";

export type CellType = "unpainted" | PaintTool;
export type GridMap = CellType[][];

export interface Cell {
  row: number;
  col: number;
}

export interface MarkerLike {
  id: string;
  type: string;
  x: number;
  y: number;
}

export interface RoutePath {
  id: string;
  points: string; // "x,y x,y ..." for an SVG polyline
}

export function createEmptyGrid(): GridMap {
  return Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => "unpainted" as CellType));
}

export function isWalkableCell(type: CellType): boolean {
  return type === "walkable" || type === "stairs" || type === "door";
}

export function pixelToCell(x: number, y: number): Cell {
  return {
    row: Math.max(0, Math.min(Math.floor(y / GRID_CELL_SIZE), GRID_ROWS - 1)),
    col: Math.max(0, Math.min(Math.floor(x / GRID_CELL_SIZE), GRID_COLS - 1)),
  };
}

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function neighbors(cell: Cell): Cell[] {
  return [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ];
}

function inBounds(cell: Cell): boolean {
  return cell.row >= 0 && cell.col >= 0 && cell.row < GRID_ROWS && cell.col < GRID_COLS;
}

/** BFS outward from `start` to find the nearest walkable cell (the marker itself may sit on an unpainted cell). */
export function findNearestWalkable(grid: GridMap, start: Cell): Cell | null {
  if (!inBounds(start)) return null;
  if (isWalkableCell(grid[start.row][start.col])) return start;

  const queue: Cell[] = [start];
  const seen = new Set<string>([`${start.row},${start.col}`]);

  while (queue.length > 0) {
    const cell = queue.shift();
    if (!cell) break;
    for (const next of neighbors(cell)) {
      if (!inBounds(next)) continue;
      const key = `${next.row},${next.col}`;
      if (seen.has(key)) continue;
      if (isWalkableCell(grid[next.row][next.col])) return next;
      seen.add(key);
      queue.push(next);
    }
  }
  return null;
}

interface AStarNode {
  row: number;
  col: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

/** A* over walkable/stairs/door cells only. Returns cell path from start to goal, or []. */
export function astarWalkable(grid: GridMap, start: Cell, goal: Cell): Cell[] {
  if (!isWalkableCell(grid[start.row][start.col]) || !isWalkableCell(grid[goal.row][goal.col])) return [];

  const open: AStarNode[] = [];
  const closed = new Set<string>();
  const h0 = manhattan(start, goal);
  open.push({ row: start.row, col: start.col, g: 0, h: h0, f: h0, parent: null });

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (!current) break;
    if (current.row === goal.row && current.col === goal.col) {
      const path: Cell[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.push({ row: node.row, col: node.col });
        node = node.parent;
      }
      return path.reverse();
    }

    closed.add(`${current.row},${current.col}`);

    for (const next of neighbors(current)) {
      if (!inBounds(next) || !isWalkableCell(grid[next.row][next.col])) continue;
      const key = `${next.row},${next.col}`;
      if (closed.has(key)) continue;
      const g = current.g + 1;
      const existing = open.find((n) => n.row === next.row && n.col === next.col);
      if (!existing) {
        const h = manhattan(next, goal);
        open.push({ row: next.row, col: next.col, g, h, f: g + h, parent: current });
      } else if (g < existing.g) {
        existing.g = g;
        existing.f = g + existing.h;
        existing.parent = current;
      }
    }
  }

  return [];
}

function cellToPixelCenter(cell: Cell): { x: number; y: number } {
  return { x: GRID_CELL_SIZE * cell.col + GRID_CELL_SIZE / 2, y: GRID_CELL_SIZE * cell.row + GRID_CELL_SIZE / 2 };
}

/** For every "room" marker, finds the shortest path (by painted walkable cells) to the nearest "exit" marker. */
export function computeRoutes(items: MarkerLike[], grid: GridMap): RoutePath[] {
  const rooms = items.filter((i) => i.type === "room");
  const exits = items.filter((i) => i.type === "exit");
  if (rooms.length === 0 || exits.length === 0) return [];

  const routes: RoutePath[] = [];

  for (const room of rooms) {
    const startCell = findNearestWalkable(grid, pixelToCell(room.x, room.y));
    if (!startCell) continue;

    let best: Cell[] | null = null;
    let bestExit: MarkerLike | null = null;

    for (const exit of exits) {
      const goalCell = findNearestWalkable(grid, pixelToCell(exit.x, exit.y));
      if (!goalCell) continue;
      const path = astarWalkable(grid, startCell, goalCell);
      if (path.length > 0 && (!best || path.length < best.length)) {
        best = path;
        bestExit = exit;
      }
    }

    if (best && bestExit) {
      const points = best.map((cell) => {
        const p = cellToPixelCenter(cell);
        return `${p.x},${p.y}`;
      });
      routes.push({ id: `${room.id}-${bestExit.id}`, points: points.join(" ") });
    }
  }

  return routes;
}
