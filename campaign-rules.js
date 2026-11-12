import {CHAPTERS} from './chapter-data.js?v=108';
// Regional progression data for chapter encounters and drops.
export const CAMPAIGN_CHAPTERS=Object.fromEntries(Object.entries(CHAPTERS).map(([id,c])=>[id,{id:c.id,name:c.name,available:c.available,hellCap:c.hellCap}]));
const regions={
 1:{
  1:{levels:[1,4,7,9,12,15,17,20],min:[1,3,5,8,10,13,16,18],max:[3,5,8,10,13,16,18,20]},
  2:{levels:[23,26,30,34,38,42,46,50],min:[21,24,27,31,35,39,43,47],max:[25,28,32,36,40,44,48,50]},
  3:{levels:[53,56,59,62,64,66,68,70],min:[51,54,57,60,62,64,66,68],max:[55,58,61,63,65,67,69,70]}
 },
 2:{
  1:{levels:[12,13,14,15,16,17,18,20],min:[12,13,14,15,16,17,18,19],max:[14,15,16,17,18,19,20,20]},
  2:{levels:[36,38,40,42,44,46,48,50],min:[35,37,39,41,43,45,47,48],max:[38,40,42,44,46,48,50,50]},
  3:{levels:[72,74,76,78,80,82,84,85],min:[71,72,74,76,78,80,82,83],max:[73,75,77,79,81,83,84,85]}
 },
 3:{
  1:{levels:[16,17,18,18,19,19,20,20],min:[16,16,17,17,18,18,19,19],max:[18,19,19,20,20,20,20,20]},
  2:{levels:[45,46,47,48,49,50,50,50],min:[44,44,45,46,47,48,49,49],max:[46,47,48,49,50,50,50,50]},
  3:{levels:[86,87,88,89,91,92,94,95],min:[86,87,88,89,90,91,92,93],max:[87,88,89,90,92,93,94,95]}
 }
};
const difficulty=value=>[1,2,3].includes(Number(value))?Number(value):1;
const chapterID=value=>Object.hasOwn(CAMPAIGN_CHAPTERS,value)?Number(value):1;
const roomIndex=value=>Math.max(0,Math.min(7,Math.floor(Number(value)||0)));
export function equipmentDropCap(diff=1,chapter=1){const tier=difficulty(diff);return tier===1?20:tier===2?50:CAMPAIGN_CHAPTERS[chapterID(chapter)].hellCap;}
export function equipmentDropBand(diff=1,room=0,chapter=1){
 const data=regions[chapterID(chapter)][difficulty(diff)],index=roomIndex(room);
 return {min:data.min[index],max:data.max[index],monsterLevel:data.levels[index],chapter:chapterID(chapter)};
}
export function rollDropLevel(diff=1,room=0,source='normal',rand=Math.random,chapter=1){
 return rollBandLevel(equipmentDropBand(diff,room,chapter),source,rand);
}
export function rollBandLevel(band,source,rand){
 const unit=Number(rand());
 if(!Number.isFinite(unit))throw Error('Invalid random value');
 const bias=source==='boss'?2:['elite','miniboss'].includes(source)?1:0;
 return Math.min(band.max,band.min+Math.floor(Math.max(0,Math.min(.999999999999,unit))*(band.max-band.min+1))+bias);
}
// Keep earlier gear anchors; add smaller deliberate steps for future endgame caps.
const whiteAnchors=[[1,1],[10,1.45],[20,2.1],[35,3.1],[50,4.5],[70,6.6],[85,8.8],[95,11],[99,12.3],[100,12.3]];
export function whiteLevelMultiplier(value){
 const level=Math.max(1,Math.min(100,Math.floor(Number(value)||1)));
 for(let n=1;n<whiteAnchors.length;n++){
  const [end,max]=whiteAnchors[n],[start,min]=whiteAnchors[n-1];
  if(level<=end)return min+(max-min)*(level-start)/(end-start);
 }
 return 12.3;
}
