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

const EXPANDED_SCALE = 1.85;
// Twelve floor plans per chapter, their east-west reflections, and the final arena.
// Keep the center of the north and south approaches clear for entry and exit.
const expandedRuins = [
 [rect(224, 278, 300, 469), rect(391, 349, 456, 404), rect(503, 426, 674, 470), rect(774, 284, 845, 434), rect(877, 524, 969, 597)],
 [rect(204, 336, 362, 392), rect(355, 511, 486, 570), rect(520, 309, 592, 384), rect(685, 452, 845, 516), rect(884, 283, 950, 373)],
 [rect(178, 453, 275, 556), rect(319, 284, 383, 431), rect(486, 389, 649, 466), rect(742, 316, 824, 402), rect(751, 498, 815, 596)],
 [rect(175, 274, 259, 457), rect(377, 299, 438, 368), rect(387, 493, 448, 564), rect(696, 299, 757, 368), rect(840, 397, 972, 445)],
 [rect(256, 273, 404, 325), rect(256, 325, 313, 463), rect(421, 504, 485, 600), rect(547, 342, 649, 389), rect(761, 406, 936, 471), rect(881, 471, 936, 550)],
 [rect(212, 365, 273, 425), rect(342, 365, 403, 425), rect(477, 365, 538, 425), rect(636, 460, 697, 520), rect(766, 460, 827, 520), rect(896, 460, 957, 520)],
 [rect(183, 326, 298, 409), rect(299, 509, 397, 594), rect(494, 324, 635, 427), rect(727, 507, 826, 600), rect(878, 307, 947, 427)],
 [rect(249, 261, 314, 393), rect(249, 476, 314, 588), rect(415, 461, 478, 526), rect(717, 279, 785, 360), rect(840, 409, 908, 557)],
 [rect(207, 476, 380, 545), rect(273, 297, 341, 399), rect(462, 366, 526, 460), rect(615, 373, 741, 428), rect(837, 492, 969, 555)],
 [rect(182, 273, 264, 440), rect(365, 421, 433, 492), rect(524, 304, 689, 351), rect(670, 517, 835, 576), rect(845, 284, 915, 409)],
 [rect(217, 281, 348, 334), rect(313, 449, 377, 585), rect(479, 354, 639, 404), rect(560, 404, 639, 487), rect(752, 468, 930, 527), rect(851, 275, 918, 366)],
 [rect(207, 309, 272, 477), rect(351, 252, 421, 334), rect(379, 520, 449, 590), rect(698, 252, 768, 334), rect(852, 375, 930, 520)],
 [rect(198, 273, 259, 475), rect(348, 282, 414, 347), rect(348, 509, 414, 574), rect(706, 282, 772, 347), rect(706, 509, 772, 574), rect(861, 273, 922, 475)],
];
const expandedCanals = [
 [across(296, 362, [163, 349], [468, 642], [795, 964]), across(442, 509, [277, 457], [696, 876])],
 [along(259, 346, [175, 310], [477, 623]), along(738, 821, [257, 413], [544, 690])],
 [across(315, 393, [283, 458], [694, 849]), across(465, 525, [167, 329], [496, 620], [826, 981])],
 [along(214, 313, [234, 402], [515, 666]), along(780, 881, [172, 316], [458, 620])],
 [across(288, 351, [124, 276], [500, 658], [804, 972]), across(415, 476, [341, 511], [628, 771])],
 [across(326, 400, [163, 305], [622, 802]), across(472, 529, [354, 505], [775, 939])],
 [along(305, 391, [181, 322], [484, 650]), along(671, 747, [268, 427], [552, 700])],
 [across(313, 377, [248, 450], [651, 853]), across(456, 519, [205, 363], [477, 630], [804, 947])],
 [across(284, 355, [176, 354], [464, 652]), across(433, 505, [590, 757], [835, 967])],
 [along(239, 330, [285, 432], [532, 682]), along(789, 878, [161, 329], [447, 606])],
 [across(321, 388, [178, 326], [498, 656], [793, 962]), across(457, 522, [218, 385], [681, 864])],
 [along(193, 289, [187, 361], [511, 654]), along(806, 916, [229, 384], [484, 672])],
 [along(276, 365, [214, 364], [486, 642]), along(755, 844, [214, 364], [486, 642])],
];
const expandedChasms = [
 [across(292, 372, [203, 331], [780, 913]), across(446, 530, [479, 626])],
 [along(309, 410, [188, 310], [499, 628]), along(696, 806, [331, 463])],
 [across(306, 401, [641, 755]), across(462, 526, [225, 357], [795, 909])],
 [along(239, 346, [240, 379], [552, 670]), along(790, 895, [335, 474])],
 [across(287, 359, [137, 257], [483, 617]), across(429, 518, [752, 911])],
 [along(353, 457, [315, 461]), along(712, 823, [176, 290], [524, 664])],
 [across(310, 384, [759, 908]), across(451, 521, [168, 298], [471, 622])],
 [along(224, 324, [201, 326]), along(780, 891, [340, 475], [545, 657])],
 [across(285, 364, [273, 407]), across(432, 522, [495, 634], [861, 969])],
 [along(273, 376, [329, 463], [565, 677]), along(720, 834, [190, 318])],
 [across(301, 387, [194, 319], [791, 920]), across(465, 534, [376, 507])],
 [along(208, 301, [340, 489]), along(778, 886, [230, 366], [516, 638])],
 [along(250, 353, [211, 346], [488, 623]), along(767, 870, [294, 429], [554, 689])],
];

const layouts = new Map();
const expandedLayouts = new Map();
const routes = new WeakMap();

function cutRect(cut, low, high) {
 return cut.axis === 'y' ? rect(low, cut.from, high, cut.to) : rect(cut.from, low, cut.to, high);
}

function carveCuts(cuts, blocks = []) {
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
 return { blocks, bridges };
}

function buildTerrain(material, { blocks, bridges }, scale = 1) {
 const terrain = {
  material, blocks, bridges,
  edges: blocks.map(b => rect(b.left - FOOT_CLEARANCE, b.top - FOOT_CLEARANCE,
   b.right + FOOT_CLEARANCE, b.bottom + FOOT_CLEARANCE)),
 };
 if (scale !== 1) Object.assign(terrain, { scale, bounds: expandedBounds(scale) });
 preparePaths(terrain);
 return terrain;
}

function scaleTerrain(material, { blocks, bridges }, scale) {
 const convert = b => {
  const start = expandPoint(b.left, b.top, scale);
  const end = expandPoint(b.right, b.bottom, scale);
  return rect(start.x, start.y, end.x, end.y);
 };
 return buildTerrain(material, {
  blocks: blocks.map(convert),
  bridges: bridges.map(b => ({ ...convert(b), axis: b.axis })),
 }, scale);
}

export function terrainForExpanded(chapter, layer) {
 if (!Number.isInteger(chapter) || chapter < 1 || chapter > 3 ||
     !Number.isInteger(layer) || layer < 0 || layer >= 25) return null;
 const key = chapter + ':' + layer;
 if (expandedLayouts.has(key)) return expandedLayouts.get(key);
 const plans = [expandedRuins, expandedCanals, expandedChasms][chapter - 1];
 const plan = plans[layer === 24 ? 12 : layer % 12];
 const material = ['stone', 'water', 'void'][chapter - 1];
 const geometry = chapter === 1 ? { blocks: plan, bridges: [] } : carveCuts(plan);
 if (layer >= 12 && layer < 24) {
  const centerLine = BOUNDS.left + BOUNDS.right;
  const reflect = b => ({ ...b, left: centerLine - b.right, right: centerLine - b.left });
  geometry.blocks = geometry.blocks.map(reflect);
  geometry.bridges = geometry.bridges.map(reflect);
 }
 const terrain = scaleTerrain(material, geometry, EXPANDED_SCALE);
 expandedLayouts.set(key, terrain);
 return terrain;
}

export function terrainFor(chapter, layer, scale=1) {
 scale=Number.isFinite(scale)?Math.max(1,Math.min(2,scale)):1;
 const key = chapter+':'+layer+':'+scale;
 if (layouts.has(key)) return layouts.get(key);
 let terrain;
 if(scale!==1){
  const base = terrainFor(chapter, layer);
  terrain = scaleTerrain(base?.material ?? 'open', base ?? { blocks: [], bridges: [] }, scale);
 } else {
  const cuts = (chapter === 2 ? canals : chapter === 3 ? chasms : [])[layer] || [];
  const blocks = [...(chapter === 1 ? ruins[layer] || [] : [])];
  const geometry = carveCuts(cuts, blocks);
  terrain = blocks.length ? buildTerrain(chapter === 2 ? 'water' : chapter === 3 ? 'void' : 'stone', geometry) : null;
 }
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
