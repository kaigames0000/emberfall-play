import {bplusImage, watchBplusImages} from './bplus-art.js?v=124';
import {canStand, terrainBounds} from './room-terrain.js?v=108';

const prop = name => 'props/' + name + '.webp';
const state = name => 'states/' + name + '.webp';
const decor = name => 'decor/' + name + '.webp';
export const sceneTexture = name => bplusImage('scenes/' + name + '.webp');

export const campStationArt = {
 travel: {image: prop('expedition-portal'), w: 152, h: 142},
 marks: {image: prop('collector-counter'), w: 125, h: 101, npc: 'collector', propOffset: {x:-39,y:-50}},
 stash: {image: prop('shared-stash'), w: 123, h: 95},
 artisan: {image: prop('artisan-workbench'), w: 142, h: 118, npc: 'artisan', propOffset: {x:65,y:-50}},
 guide: {image: prop('guide-lectern'), w: 97, h: 84, npc: 'guide', propOffset: {x:-45,y:-50}},
 characters: {image: prop('roster-board'), w: 124, h: 106, npc: 'registrar', propOffset: {x:-62,y:-34}},
 training: {image: prop('training-dummy'), w: 86, h: 92},
};
export const FIELD_EXIT = Object.freeze({x:560,y:138});
export const PROP_FRAME = {
 chest: {w:76,h:63,offsetY:9},
 barrel: {w:58,h:63,offsetY:9},
 crate: {w:63,h:62,offsetY:9},
 urn: {w:54,h:60,offsetY:9},
 watergate: {w:124,h:104,offsetY:4},
 shrine: {w:96,h:98,offsetY:8},
 exit: {w:108,h:66,offsetY:24},
 crystal: {w:78,h:67,offsetY:4},
 dummy: {w:87,h:91,offsetY:10},
};
const props = {
 chest: [prop('loot-chest'), state('chest-open')],
 barrel: [prop('barrel'), state('barrel-broken')],
 crate: [prop('crate'), state('crate-broken')],
 urn: [prop('urn'), state('urn-broken')],
 watergate: [prop('tide-gate'), state('tide-gate-open')],
 shrine: [prop('shrine'), state('shrine-spent')],
 exit: [prop('exit-rune')],
 crystal: [prop('interact-crystal')],
 dummy: [prop('training-dummy')],
};
const pickups = {gold:state('gold'), flask:state('flask-charge'), mana:state('mana-orb')};
export const sceneProp = (kind, used) => props[kind]?.[used ? 1 : 0];
export const scenePickup = kind => pickups[kind];

const floorDressing = [
 ['leaves', 'rubble', 'leaves', 'rubble', 'candle-stand', 'leaves'],
 ['shells', 'rope', 'fishnet', 'fish-basket', 'supply-bundle', 'shells'],
 ['rubble', 'crystal-cluster', 'rubble', 'broken-column', 'crystal-cluster', 'rubble'],
];
const decorativeSize = {
 leaves: 37, rubble: 45, 'candle-stand': 67, shells: 30, rope: 47, fishnet: 61,
 'fish-basket': 55, 'supply-bundle': 63, 'crystal-cluster': 56, 'broken-column': 68,
};
const candidates = [
 [.046,.12],[.071,.245],[.04,.39],[.064,.54],[.042,.69],[.075,.855],
 [.95,.14],[.925,.27],[.958,.405],[.935,.55],[.96,.695],[.927,.86],
 [.19,.06],[.31,.092],[.69,.07],[.83,.075],[.21,.937],[.78,.923],
];

export function roomDressing(terrain, chapter, layer) {
 const {left, right, top, bottom} = terrainBounds(terrain);
 const themes = floorDressing[chapter - 1] ?? floorDressing[0];
 return candidates.flatMap(([px, py], index) => {
  const x = left + (right - left) * px;
  const y = top + (bottom - top) * py;
  const name = themes[(index + layer * 5) % themes.length];
  const size = decorativeSize[name];
  const halfFootprint = size * .36;
  if (!canStand(terrain, x, y) || terrain?.blocks.some(b=>x+halfFootprint>b.left&&x-halfFootprint<b.right&&y+10>b.top&&y-10<b.bottom) ||
   terrain?.bridges.some(b => x > b.left - 32 && x < b.right + 32 && y > b.top - 32 && y < b.bottom + 32)) return [];
  return [{x, y, size, image: name === 'supply-bundle' ? prop(name) : decor(name)}];
 });
}

export function drawSceneSprite(c, image, x, y, maxWidth, maxHeight, opacity = 1) {
 if (!image) return false;
 const art = bplusImage(image);
 if (!art) return false;
 const scale = Math.min(maxWidth / art.naturalWidth, maxHeight / art.naturalHeight);
 const w = art.naturalWidth * scale, h = art.naturalHeight * scale;
 c.save();
 c.globalAlpha *= opacity;
 c.imageSmoothingEnabled = true;
 c.imageSmoothingQuality = 'high';
 c.drawImage(art, x - w / 2, y - h * .94, w, h);
 c.restore();
 return true;
}

export function paintRoomDressing(draw, terrain, chapter, layer) {
 for (const {x, y, size, image} of roomDressing(terrain, chapter, layer)) {
  drawSceneSprite(draw.ctx, image, x, y, size * 1.26, size, .78);
 }
}

export function drawFieldProp(c, kind, x, y, used = false) {
 const frame = PROP_FRAME[kind];
 return !!frame && drawSceneSprite(c, sceneProp(kind, used), x, y + frame.offsetY, frame.w, frame.h);
}

const sceneAssets = [
 ...Object.values(campStationArt).flatMap(art => art.npc ? [art.image, 'units/' + art.npc + '.webp'] : [art.image]),
 ...Object.values(props).flat(),
 ...Object.values(pickups),
 ...['camp-stone','abbey-stone','abbey-wall','dock-wood','tidal-water','court-stone'].map(name => 'scenes/' + name + '.webp'),
 ...['bedroll','tea-set','flower-pot','handcart','rope','sacks','lantern-post','leaves','candle-stand','rubble','fishnet','fish-basket','crystal-cluster','broken-column','shells'].map(decor),
 prop('supply-bundle'),
];
let readyRevision = 0;
let started = false;
export function prepareSceneArt() {
 if (started || typeof document === 'undefined') return;
 started = true;
 const paths = new Set(sceneAssets);
 watchBplusImages(relative => {
  if (!relative || paths.has(relative)) readyRevision++;
 });
 for (const asset of paths) bplusImage(asset);
}
export const sceneArtRevision = () => readyRevision;
