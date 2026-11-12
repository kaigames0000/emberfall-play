import {bplusAsset} from './bplus-art.js?v=124';

const skillArt = {
 flame:'vfx/flame-burst.webp',
 snow:'vfx/frost-impact.webp',
 lightning:'vfx/lightning.webp',
 meteor:'vfx/frost-projectile.webp',
};

const icons={
 rune:['#dfd7fa','#8276bd','M16 2 28 16 16 30 4 16Z','M16 7l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z'],
 wind:['#d2f0f4','#699ab7','M3 11h7l10-6h7v4h3v4l-4 3H15l-5 3h15l4 3v5h-4v-3H13l-7 2H3l3-6 4-5 10-3h5v-3h-4l-9 5H3Z','M5 12h6l10-6h5v2h-5l-9 6H5Z'],
 heart:['#ffc1b1','#b85879','M5 8h3V5h6v4h4V5h6v3h3v4h2v6l-5 5-8 6-8-6-5-5v-6h2Z','M6 10h3V7h4v4h-3v3H6Z'],
 flag:['#f7d99f','#98704d','M5 4h3v2h17l-2 5 3 6H8v11H5Z','M8 7h15l-1 2H10v6H8Z'],
 bag:['#f2d5a4','#a07352','M10 5h12l3 7 3 2v14H4V14l3-2ZM12 6l-2 6h12l-2-6Z','M7 16h18v2H7Zm6 2h6v5h-6Z'],
 tree:['#e7ca8f','#665c63','M14 3h4l4 4-4 4v5h8v4l4 4-4 4h-4l-4-4 4-4v-1H10v1l4 4-4 4H6l-4-4 4-4v-4h8v-5l-4-4Z','M16 4l3 3-3 3-3-3Zm-8 17 3 3-3 3-3-3Zm16 0 3 3-3 3-3-3Z'],
 shield:['#f1d9a8','#5f6e7b','M5 6l11-3 11 3v13l-4 6-7 4-7-4-4-6Z','M15 8h2v6h6v2h-6v7h-2v-7H9v-2h6Z'],
};

function setSymbol(defs, name, body) {
 let symbol = defs.querySelector('#i-' + name);
 if (!symbol) {
  symbol = defs.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'symbol');
  symbol.id = 'i-' + name;
  defs.append(symbol);
 }
 symbol.setAttribute('viewBox', '0 0 32 32');
 symbol.innerHTML = body;
}

export function animeUiSymbols(defs) {
 for (const [name, [light, dark, shape, shine]] of Object.entries(icons)) {
  setSymbol(defs, name, `<path d="${shape}" fill="${dark}" stroke="${light}" stroke-width="1"/><path d="${shine}" fill="${light}" stroke="none"/>`);
 }
 for (const [name, art] of Object.entries(skillArt)) {
  setSymbol(defs, name, `<image x="1" y="1" width="30" height="30" href="${bplusAsset(art)}"/>`);
 }
}
