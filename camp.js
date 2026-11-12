import {paintBplusNPC} from './anime-art.js?v=125';
import {campStationArt, drawSceneSprite} from './bplus-scene.js?v=124';
import {paintCampFloor} from './chapter-scenes.js?v=108';

export const CAMP_STATIONS = [
 { id: 'travel', panel: 'quests', name: '遠征傳送門', icon: 'map', x: 560, y: 188, color: '#91cbb8', kind: 'gate' },
 { id: 'marks', panel: 'sets', name: '印記收藏家', icon: 'flag', x: 360, y: 285, color: '#dbbf83', kind: 'table' },
 { id: 'stash', panel: 'stash', name: '共用倉庫', icon: 'chest', x: 241, y: 377, color: '#c3ab76', kind: 'chest' },
 { id: 'artisan', panel: 'forge', panels:['merchant','flasks','forge'], name: '工匠商人', icon: 'salvage', x: 820, y: 420, color: '#d4986d', kind: 'forge' },
 { id: 'guide', panel: 'guide', name: '冒險指南', icon: 'book', x: 402, y: 515, color: '#c5c8a0', kind: 'table' },
 { id: 'characters', panel: 'characters', name: '行者名冊', icon: 'shield', x: 430, y: 685, color: '#b6c798', kind: 'table' },
 { id: 'training', panel: 'training', name: 'DPS 訓練場', icon: 'target', x: 747, y: 655, color: '#c5aa84', kind: 'dummy' },
];

const campDecorations = [
 ['flower-pot',108,175,44], ['lantern-post',167,220,91], ['sacks',206,222,41],
 ['crate',245,247,37], ['flower-pot',266,236,33], ['sacks',409,224,37], ['rope',403,253,31],
 ['crate',169,366,45], ['bedroll',172,335,48], ['flower-pot',193,402,31],
 ['supply-bundle',124,424,53], ['flower-pot',128,520,47],
 ['candle-stand',115,606,54], ['bedroll',208,684,47], ['leaves',161,713,46],
 ['flower-pot',268,727,44], ['rope',293,636,34], ['leaves',480,730,41], ['leaves',465,276,34],
 ['flower-pot',442,482,34], ['leaves',463,633,30],
 ['flower-pot',999,174,42], ['lantern-post',918,212,94], ['sacks',968,233,44],
 ['crate',960,347,49], ['sacks',959,306,43], ['rope',960,384,34], ['supply-bundle',993,384,51],
 ['crate',794,369,43], ['candle-stand',781,400,37], ['leaves',645,261,39],
 ['lantern-post',995,464,69], ['tea-set',897,530,65], ['candle-stand',848,521,38],
 ['flower-pot',945,544,38], ['leaves',922,560,30], ['sacks',966,521,35],
 ['rope',832,649,39], ['handcart',945,701,85], ['crate',906,692,43],
 ['flower-pot',813,731,48], ['leaves',995,720,39],
];

export function nearbyCampStation(player) {
 let nearest = null, best = 86 ** 2;
 for (const station of CAMP_STATIONS) {
  const distance = (station.x - player.x) ** 2 + (station.y - player.y) ** 2;
  if (distance < best) { best = distance; nearest = station; }
 }
 return nearest;
}

// Props and NPCs have independent ground anchors. Interaction uses the NPC feet.
export function campDrawables(){
 const items=campDecorations.map(([name,x,y,size])=>({kind:'decor',image:(name==='supply-bundle'||name==='crate'?'props/':'decor/')+name+'.webp',x,y,w:size*1.25,h:size}));
 for(const station of CAMP_STATIONS){const art=campStationArt[station.id],offset=art.propOffset||{x:0,y:0};items.push({kind:'station',stationID:station.id,image:art.image,x:station.x+offset.x,y:station.y+offset.y,w:art.w,h:art.h,color:station.color});if(art.npc)items.push({kind:'npc',stationID:station.id,image:art.npc,x:station.x,y:station.y,w:66,h:66});}
 return items.sort((a,b)=>a.y-b.y||Number(a.kind==='npc')-Number(b.kind==='npc'));
}

export function paintCampLabels(draw) {
 const c = draw.ctx, dpr = draw.dpr || 1;
 const active = nearbyCampStation(draw.g.player);
 c.save();
 c.setTransform(dpr, 0, 0, dpr, 0, 0);
 c.font = (draw.w < 600 ? 12 : 14) + 'px "Cubic 11", sans-serif';
 c.textAlign = 'center';
 c.textBaseline = 'middle';
 for (const station of CAMP_STATIONS) {
  const x = Math.round((draw.w / 2 + (station.x - draw.cx) * draw.scale) * dpr) / dpr;
  const y = Math.round((draw.h / 2 + (station.y + 29 - draw.cy) * draw.scale) * dpr) / dpr;
  if (station === active) {
   const width = Math.ceil(c.measureText(station.name).width) + 16;
   c.fillStyle = '#1a1f2bf0';
   c.fillRect(x - width / 2, y - 11, width, 22);
   c.strokeStyle = station.color + 'a9';
   c.lineWidth = 1;
   c.strokeRect(x - width / 2, y - 11, width, 22);
  } else {
   c.lineWidth = 3;
   c.strokeStyle = '#1a1c26eb';
   c.strokeText(station.name, x, y);
  }
  c.fillStyle = station === active ? '#fff1c9' : '#d9d2bf';
  c.fillText(station.name, x, y);
 }
 c.restore();
}

export function paintCampBackdrop(draw) {
 paintCampFloor(draw);
 for(const item of campDrawables()){
  if(item.kind==='npc'){paintBplusNPC(draw.ctx,item.image,item.x,item.y,66);continue;}
  if(item.stationID==='travel'||item.stationID==='artisan')draw.glow(item.x,item.y-14,96,item.color+'27');
  if(!drawSceneSprite(draw.ctx,item.image,item.x,item.y,item.w,item.h,item.kind==='decor'?.9:1)&&item.kind==='station')draw.path([[item.x-25,item.y-2],[item.x,item.y-21],[item.x+25,item.y-2],[item.x,item.y+16]],'#2b3240',item.color);
 }
}

export function paintCampFocus(draw, player) {
 const station = nearbyCampStation(player);
 if (station) draw.circle(station.x, station.y + 7, 38, null, station.color);
}
