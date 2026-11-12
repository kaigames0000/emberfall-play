import {LEGACY_BOUNDS,expandPoint,expandedBounds} from './world-space.js?v=108';
const BOUNDS=LEGACY_BOUNDS;
export const terrainBounds=terrain=>terrain?.bounds??BOUNDS;
const FOOT_CLEARANCE = 14;
const EDGE = 1;
const WAYPOINT_REFRESH = 48;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rect = (left, top, right, bottom) => ({ left, top, right, bottom });

// Cuts describe a canal or a chasm and the openings left by its bridges.
const across = (from, to, ...openings) => ({ axis: 'y', from, to, openings });
const along = (from, to, ...openings) => ({ axis: 'x', from, to, openings });
const ruins = [
 [],
 [rect(265, 289, 365, 438), rect(755, 289, 855, 438)],
 [rect(265, 328, 404, 382), rect(716, 472, 855, 526)],
 [rect(261, 346, 393, 417), rect(727, 346, 859, 417)],
 [rect(462, 359, 658, 443)],
 [rect(286, 267, 364, 454), rect(756, 430, 834, 590)],
 [rect(315, 326, 431, 405), rect(689, 326, 805, 405)],
 [rect(276, 287, 352, 380), rect(768, 287, 844, 380)],
];
const canals = [
 [across(328, 440, [169, 347], [482, 638], [774, 951])],
 [along(487, 633, [110, 253], [508, 735])],
 [along(235, 339, [110, 310], [485, 647]), along(780, 884, [216, 374], [546, 735])],
 [across(324, 424, [429, 691])],
 [along(408, 520, [110, 282], [475, 658]), along(677, 792, [169, 342], [548, 735])],
 [across(320, 454, [312, 468], [652, 808])],
 [across(275, 380, [237, 413], [718, 896]), across(492, 581, [438, 674])],
 [across(377, 486, [182, 351], [459, 661], [769, 939])],
];
const chasms = [
 [across(276, 379, [203, 391], [729, 917]), across(489, 578, [451, 669])],
 [along(404, 521, [110, 256], [445, 632]), along(678, 796, [235, 416], [580, 735])],
 [across(413, 512, [117, 277], [463, 657], [843, 1003])],
 [across(281, 373, [424, 696]), across(496, 588, [218, 408], [712, 902])],
 [across(387, 502, [438, 682], [854, 1018])],
 [across(278, 386, [689, 891]), across(490, 590, [227, 431])],
 [along(483, 637, [110, 253], [365, 520], [604, 735])],
 [across(345, 464, [202, 363], [442, 678], [757, 918])],
];

const layouts = new Map();
const routes = new WeakMap();

function cutRect(cut, low, high) {
 return cut.axis === 'y' ? rect(low, cut.from, high, cut.to) : rect(cut.from, low, cut.to, high);
}

export function terrainFor(chapter, layer, scale=1) {
 scale=Number.isFinite(scale)?Math.max(1,Math.min(2,scale)):1;
 const key = chapter+':'+layer+':'+scale;
 if (layouts.has(key)) return layouts.get(key);
 if(scale!==1){
  const base=terrainFor(chapter,layer),convert=b=>{const a=expandPoint(b.left,b.top,scale),z=expandPoint(b.right,b.bottom,scale);return rect(a.x,a.y,z.x,z.y);};
  const blocks=(base?.blocks??[]).map(convert),terrain={material:base?.material??'open',scale,bounds:expandedBounds(scale),blocks,bridges:(base?.bridges??[]).map(b=>({...convert(b),axis:b.axis})),edges:blocks.map(b=>rect(b.left-FOOT_CLEARANCE,b.top-FOOT_CLEARANCE,b.right+FOOT_CLEARANCE,b.bottom+FOOT_CLEARANCE))};
  preparePaths(terrain);layouts.set(key,terrain);return terrain;
 }
 const cuts = (chapter === 2 ? canals : chapter === 3 ? chasms : [])[layer] || [];
 const blocks = [...(chapter === 1 ? ruins[layer] || [] : [])];
 const bridges = [];
 for (const cut of cuts) {
  let start = cut.axis === 'y' ? 66 : 110;
  const end = cut.axis === 'y' ? 1054 : 735;
  for (const [left, right] of cut.openings) {
   if (left > start) blocks.push(cutRect(cut, start, left));
   bridges.push({ ...cutRect(cut, left, right), axis: cut.axis });
   start = right;
  }
  if (start < end) blocks.push(cutRect(cut, start, end));
 }
 const terrain = blocks.length ? {
  material: chapter === 2 ? 'water' : chapter === 3 ? 'void' : 'stone',
  blocks,
  bridges,
  edges: blocks.map(b => rect(b.left - FOOT_CLEARANCE, b.top - FOOT_CLEARANCE,
   b.right + FOOT_CLEARANCE, b.bottom + FOOT_CLEARANCE)),
 } : null;
 if (terrain) preparePaths(terrain);
 layouts.set(key, terrain);
 return terrain;
}

export function canStand(terrain, x, y) {
 const bounds=terrainBounds(terrain);
 return Number.isFinite(x)&&Number.isFinite(y)&&x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
  && (!terrain || !terrain.edges.some(b => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom));
}

function segmentLimit(terrain, x, y, dx, dy) {
 let first = 1;
 for (const b of terrain.edges) {
  if ((!dx && (x < b.left || x > b.right)) || (!dy && (y < b.top || y > b.bottom))) continue;
  const x1 = dx ? (b.left - x) / dx : -Infinity, x2 = dx ? (b.right - x) / dx : Infinity;
  const y1 = dy ? (b.top - y) / dy : -Infinity, y2 = dy ? (b.bottom - y) / dy : Infinity;
  const enter = Math.max(0, Math.min(x1, x2), Math.min(y1, y2));
  const exit = Math.min(first, Math.max(x1, x2), Math.max(y1, y2));
  if (enter <= exit) first = Math.max(0, enter - 0.025 / Math.max(1, Math.hypot(dx, dy)));
  if (!first) break;
 }
 return first;
}

export function walkVisible(terrain, from, to) {
 return !terrain || canStand(terrain, to.x, to.y)
  && segmentLimit(terrain, from.x, from.y, to.x - from.x, to.y - from.y) === 1;
}

export function nearestGround(terrain, x, y) {
 const bounds=terrainBounds(terrain);
 x = clamp(Number.isFinite(x)?x:560, bounds.left, bounds.right);
 y = clamp(Number.isFinite(y)?y:650, bounds.top, bounds.bottom);
 if (canStand(terrain, x, y)) return { x, y };
 let best = { x: 560, y: 650 }, bestScore = Infinity;
 const consider = (tx, ty) => {
  if (!canStand(terrain, tx, ty)) return;
  const score = (x - tx) ** 2 + (y - ty) ** 2;
  if (score < bestScore) { best = { x: tx, y: ty }; bestScore = score; }
 };
 for (const b of terrain.edges) {
  consider(b.left - EDGE, y);
  consider(b.right + EDGE, y);
  consider(x, b.top - EDGE);
  consider(x, b.bottom + EDGE);
 }
 for (const corner of terrain.corners) consider(corner.x, corner.y);
 return best;
}

function moveSegment(terrain, body, dx, dy) {
 const bounds=terrainBounds(terrain);
 const x = clamp(body.x + dx, bounds.left, bounds.right);
 const y = clamp(body.y + dy, bounds.top, bounds.bottom);
 const mx = x - body.x, my = y - body.y;
 const fraction = segmentLimit(terrain, body.x, body.y, mx, my);
 body.x += mx * fraction;
 body.y += my * fraction;
 return fraction;
}

export function moveOnTerrain(terrain, body, dx, dy, slide = true) {
 if (!terrain) {
  body.x += dx;
  body.y += dy;
  return true;
 }
 const fraction = moveSegment(terrain, body, dx, dy);
 if (slide && fraction < 1) {
  moveSegment(terrain, body, dx * (1 - fraction), 0);
  moveSegment(terrain, body, 0, dy * (1 - fraction));
 }
 return fraction === 1;
}

function preparePaths(terrain) {
 const corners = [];
 for (const b of terrain.edges) {
  for (const x of [b.left - EDGE, b.right + EDGE]) {
   for (const y of [b.top - EDGE, b.bottom + EDGE]) {
    if (canStand(terrain, x, y)) corners.push({ x, y });
   }
  }
 }
 const costs = corners.map(a => corners.map(b => walkVisible(terrain, a, b) ? distance(a, b) : Infinity));
 const next = costs.map(row => row.map((cost, j) => Number.isFinite(cost) ? j : -1));
 for (let k = 0; k < corners.length; k++) {
  for (let i = 0; i < corners.length; i++) {
   for (let j = 0; j < corners.length; j++) {
    const via = costs[i][k] + costs[k][j];
    if (via < costs[i][j]) { costs[i][j] = via; next[i][j] = next[i][k]; }
   }
  }
 }
 Object.assign(terrain, { corners, costs, next });
}

function findRoute(terrain, body, goal) {
 const { corners, costs, next } = terrain;
 const goalCosts = corners.map(corner => walkVisible(terrain, corner, goal) ? distance(corner, goal) : Infinity);
 let first = -1, last = -1, best = Infinity;
 for (let i = 0; i < corners.length; i++) {
  const corner = corners[i];
  if (!walkVisible(terrain, body, corner)) continue;
  const startCost = distance(body, corner);
  for (let j = 0; j < corners.length; j++) {
   const total = startCost + costs[i][j] + goalCosts[j];
   if (total < best) { first = i; last = j; best = total; }
  }
 }
 if (first < 0) return [];
 const path = [corners[first]];
 while (first !== last && path.length < corners.length) {
  first = next[first][last];
  path.push(corners[first]);
 }
 return path;
}

export function approachOnTerrain(terrain, body, target, step, stop = 0) {
 if (step <= 0) return;
 const goal = terrain ? nearestGround(terrain, target.x, target.y) : target;
 let waypoint = goal, clearance = stop;
 if (terrain && !walkVisible(terrain, body, goal)) {
  let route = routes.get(body);
  if (!route || route.terrain !== terrain || distance(route.goal, goal) > WAYPOINT_REFRESH
      || !route.path.length || !walkVisible(terrain, body, route.path[0])) {
   route = { terrain, goal, path: findRoute(terrain, body, goal) };
   routes.set(body, route);
  }
  while (route.path.length && distance(body, route.path[0]) < .25) route.path.shift();
  waypoint = route.path[0];
  clearance = 0;
  if (!waypoint) return;
 } else if (terrain) routes.delete(body);
 const d = distance(body, waypoint);
 if (d <= clearance || d < .001) return;
 const amount = Math.min(step, d - clearance) / d;
 moveOnTerrain(terrain, body, (waypoint.x - body.x) * amount, (waypoint.y - body.y) * amount, false);
}
