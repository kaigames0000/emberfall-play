import {bplusAsset} from './bplus-art.js?v=124';

const artwork = {
 gold:'gold',
 enhance:'enhancement-stone',
 mark:'expedition-seal',
 ticket:'map-ticket',
};

const materials={
 gold:['#ffe8a2','#ac7539','M16 3a13 13 0 1 0 0 26 13 13 0 1 0 0-26Z','M16 8 21 16 16 24 11 16Z'],
 shard:['#c9e6ff','#6275ad','M16 2 25 13 21 26 13 30 7 20 9 9Z','M16 4 18 13 14 26 10 20 12 9Z'],
 enhance:['#edb2a2','#98617b','M6 8 19 3 27 10 26 24 16 30 5 22Z','M16 8v15m-6-8h12'],
 chisel:['#d8dfe8','#655873','M23 2 29 7 21 16 17 13 8 27 2 29l2-6 13-11-3-3Z','M21 5 26 8 18 13 16 10Z'],
 ascend:['#fff0bc','#b78a61','M16 2 29 17 24 17 24 24 8 24 8 17 3 17Z','M16 7 24 16 20 16 20 21 12 21 12 16 8 16Z'],
 reforge:['#efcead','#986c67','M3 9h26l-3 8-8 3 1 4 5 3H8l5-3 1-5-8-3Z','M6 11h20l-2 4H8Z'],
 reroll:['#c8c0f7','#8173a9','M7 5 20 3 29 11 26 25 12 29 3 20Z','M10 11h2m9 3h2m-9 8h2'],
 gem:['#c9fff1','#518d9a','M16 2 25 7 29 16 25 25 16 30 7 25 3 16 7 7Z','M16 6 23 16 16 26 9 16Z'],
 mark:['#ffd8a6','#b6815d','M16 3 27 9v14l-11 6-11-6V9Z','M16 9 22 16 16 23 10 16Z'],
 fragment:['#d9d8f4','#70668b','M9 4 25 5l-3 9 5 6-11 9-9-5 3-9-5-5Z','M12 7 20 8 16 18 19 22 12 25 14 17Z'],
 ticket:['#eadbbc','#9b7c79','M3 7h26v5a4 4 0 0 0 0 8v5H3v-5a4 4 0 0 0 0-8Z','M14 11h4v10h-4zm-4 3h12v3H10Z'],
 key:['#f2d7a4','#a98b63','M13 5a7 7 0 0 1 10 10l-9 7-1 4-4-1-3 5-4-4 12-13a7 7 0 0 1-1-8Z','M19 6a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z'],
 emblem:['#f5d2c5','#a85d79','M16 1 21 9 29 8 26 18 30 25 20 24 16 31 12 24 2 25 6 18 3 8 11 9Z','M16 9 23 16 16 23 9 16Z'],
 voucher:['#d9e5fa','#7186a9','M7 4h18l3 5v14l-3 5H7l-3-5V9Z','M9 10h14m-14 5h14m-14 5h8']
};
export function animeMaterialSymbols(){
 return Object.entries(materials).map(([id,[highlight,body,shape,glint]])=>{
  if(artwork[id])return `<symbol id="i-item-${id}" viewBox="0 0 32 32"><image x="1" y="1" width="30" height="30" href="${bplusAsset('gear/'+artwork[id]+'.webp')}"/></symbol>`;
  const key='material-finish-'+id;
  return `<symbol id="i-item-${id}" viewBox="0 0 32 32"><defs><linearGradient id="${key}" x2=".8" y2="1"><stop stop-color="${highlight}"/><stop offset=".35" stop-color="${body}"/><stop offset=".66" stop-color="${body}"/><stop offset=".67" stop-color="#534c62"/><stop offset="1" stop-color="#30303e"/></linearGradient></defs><path d="${shape}" fill="url(#${key})" stroke="#1a1921" stroke-width="1.1"/><path d="${glint}" fill="${highlight}" fill-opacity=".75" stroke="${highlight}" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter"/></symbol>`;
 }).join('');
}
