import {drawSceneSprite, sceneTexture} from './bplus-scene.js?v=124';
import {LEGACY_BOUNDS} from './world-space.js?v=108';

const {left: LEFT, top: TOP, right: RIGHT, bottom: BOTTOM} = LEGACY_BOUNDS;
const CENTER = 560;
const STONE = ['#4d4d56','#52535c','#4a4b55','#565660','#4f505a'];
const VIOLET = ['#57526f','#605a79','#554e6c','#625a76','#544f6b'];
const WOOD = ['#645145','#69554b','#6e594d','#5d4d44','#68534a'];

function noise(seed) {
 const value = Math.sin(seed * 127.1 + 13.7) * 43758.5453;
 return value - Math.floor(value);
}

function texture(c, name, x, y, w, h, alpha) {
 const image = sceneTexture(name);
 const pattern = image && c.createPattern(image, 'repeat');
 if (!pattern) return;
 c.save();
 c.globalAlpha *= alpha;
 c.fillStyle = pattern;
 c.fillRect(x, y, w, h);
 c.restore();
}

function paving(draw, bounds, palette, material, seed = 0) {
 const c = draw.ctx;
 const {left, top, right, bottom} = bounds;
 const wooden = material === 'dock-wood';
 const width = wooden ? 112 : 64, height = wooden ? 18 : 37;
 c.save();
 c.beginPath();
 c.rect(left, top, right - left, bottom - top);
 c.clip();
 c.fillStyle = wooden ? '#2e2828' : '#2d2d38';
 c.fillRect(left, top, right - left, bottom - top);
 for (let row = 0, y = top; y < bottom; row++, y += height) {
  for (let col = 0, x = left - row % 2 * width / 2; x < right; col++, x += width) {
   const n = noise(col * 19 + row * 43 + seed);
   const color = palette[Math.floor(n * palette.length)];
   draw.path([[x+2,y+1],[x+width-3,y+1],[x+width-1,y+4],[x+width-1,y+height-4],
    [x+width-5,y+height-1],[x+3,y+height-1],[x+1,y+height-4]], color);
   draw.line([[x+4,y+2],[x+width-5,y+2]], wooden ? '#a488705f' : '#9b92a04c');
   if (wooden) {
    draw.line([[x+17,y+height-5],[x+49,y+height-7],[x+89,y+height-6]], '#3c312e7a');
    c.fillStyle = '#362c28a0';
    for (const dx of [8, width - 10]) c.fillRect(x+dx,y+height/2,2,2);
   } else if (n > .87) {
    draw.line([[x+width*.33,y+3],[x+width*.41,y+height*.37],[x+width*.53,y+height*.44],[x+width*.57,y+height*.62]], '#292730a8', 1.5);
   }
  }
 }
 texture(c, material, left, top, right - left, bottom - top, wooden ? .18 : .21);
 c.restore();
}

function masonry(draw, x, y, width, height, violet = false) {
 const c = draw.ctx;
 const seam = violet ? '#222034' : '#282932';
 const colors = violet ? VIOLET : STONE;
 c.save();
 c.beginPath();
 c.rect(x,y,width,height);
 c.clip();
 c.fillStyle = seam;
 c.fillRect(x,y,width,height);
 for (let row = 0, base = y; base < y + height; row++, base += 28) {
  for (let col = 0, xx = x - row % 2 * 30; xx < x + width; col++, xx += 60) {
   const shade = noise(row * 32 + col + x + y);
   draw.path([[xx+3,base+1],[xx+56,base+1],[xx+59,base+5],[xx+57,base+25],
    [xx+4,base+25],[xx+1,base+20]], colors[Math.floor(shade * colors.length)], seam);
   draw.line([[xx+5,base+3],[xx+55,base+3]], violet ? '#9f8da871' : '#9692a376', 1.5);
   draw.line([[xx+5,base+23],[xx+55,base+23]], seam, 2);
  }
 }
 c.restore();
}

function backdrop(draw, near, far) {
 const c = draw.ctx;
 const sky = c.createLinearGradient(0,0,0,800);
 sky.addColorStop(0,near);
 sky.addColorStop(1,far);
 c.fillStyle=sky;
 c.fillRect(0,0,1120,800);
}

function paintStoneWall(draw, {left,top,right,bottom}, scale, violet = false) {
 const c=draw.ctx;
 const bevel=Math.min(7*scale,(right-left)/8,(bottom-top)/8);
 const face=bottom-Math.min(36*scale,(bottom-top)*.43);
 const cap=violet?['#605b75','#675f7c','#58546d']:['#61616d','#6a6975','#575865'];
 const highlight=violet?'#a193ad':'#96939d';
 draw.path([[left-3, bottom-2],[right,bottom-2],[right+bevel,bottom+bevel],
  [left+bevel,bottom+bevel]], '#13121a7a');
 masonry(draw,left,face,right-left,bottom-face,violet);
 c.fillStyle='#1917235c';
 c.fillRect(left,face,right-left,bottom-face);
 draw.path([[left+bevel,top],[right-bevel,top],[right,top+bevel],[right,face],
  [left,face],[left,top+bevel]], '#302f3b');
 const capLeft=left+bevel,capTop=top+bevel/2,capWidth=right-left-2*bevel,capHeight=face-capTop;
 const cols=Math.max(1,Math.ceil(capWidth/(66*scale))),rows=Math.max(1,Math.ceil(capHeight/(58*scale)));
 const slabWidth=capWidth/cols,slabHeight=capHeight/rows;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const x=capLeft+col*slabWidth,y=capTop+row*slabHeight;
  const grain=noise(left+top+col*17+row*31);
  const color=cap[Math.floor(grain*cap.length)];
  draw.path([[x+2,y+1],[x+slabWidth-2,y+1],[x+slabWidth-1,y+3],
   [x+slabWidth-1,y+slabHeight-2],[x+1,y+slabHeight-2],[x+1,y+3]],color);
  draw.line([[x+4,y+2],[x+slabWidth-5,y+2]],highlight+'55');
  if(grain>.56)draw.line([[x+slabWidth*.27,y+3],[x+slabWidth*.36,y+slabHeight*.3],
   [x+slabWidth*.33,y+slabHeight*.5]],'#38384485',1.2);
 }
 draw.line([[left+bevel,top+1],[right-bevel,top+1]],highlight,2);
 draw.line([[left+1,top+bevel],[left+1,face-1]],highlight+'76',2);
 draw.line([[left,face],[right,face]],'#aaa1ac',Math.min(3,2*scale));
 draw.line([[left+1,bottom-1],[right-1,bottom-1]],'#22212b',Math.min(4,3*scale));
}

function stoneBorder(draw, violet = false) {
 paintStoneWall(draw,{left:42,top:31,right:1078,bottom:TOP},1,violet);
 masonry(draw, 42, TOP, LEFT-42, BOTTOM-TOP+32, violet);
 masonry(draw, RIGHT, TOP, 34, BOTTOM-TOP+32, violet);
 masonry(draw, LEFT, BOTTOM, RIGHT-LEFT, 32, violet);
 const edge = violet ? '#bc9b7d' : '#93898d';
 draw.line([[LEFT,TOP],[RIGHT,TOP],[RIGHT,BOTTOM],[LEFT,BOTTOM],[LEFT,TOP]], edge, 2);
}

function carpet(draw, camp = false) {
 const top = camp ? 156 : TOP, bottom = camp ? 701 : BOTTOM;
 const w = camp ? 52 : 45, color = camp ? '#694c56' : '#65515a78';
 const c = draw.ctx;
 c.fillStyle = '#1d17266e';
 c.fillRect(CENTER-w-2,top+4,w*2+8,bottom-top);
 c.fillStyle = color;
 c.fillRect(CENTER-w,top,w*2,bottom-top);
 for (const dx of [-w+6,w-6]) draw.line([[CENTER+dx,top+2],[CENTER+dx,bottom-2]], '#c6a276a8', 2);
 for (let y = top + 91; y < bottom - 18; y += 112) {
  draw.path([[CENTER,y-13],[CENTER+15,y],[CENTER,y+13],[CENTER-15,y]], null, '#c5a16b79');
  draw.path([[CENTER,y-7],[CENTER+7,y],[CENTER,y+7],[CENTER-7,y]], '#c5a16b5c');
 }
}

function inlay(draw, x, y, radius, color) {
 const c = draw.ctx;
 c.save();
 c.globalAlpha *= .47;
 c.lineWidth = 2;
 draw.circle(x,y,radius,null,color);
 draw.circle(x,y,radius-10,null,color);
 for (const [dx,dy] of [[0,-radius],[radius,0],[0,radius],[-radius,0]]) {
  draw.path([[x+dx,y+dy-9],[x+dx+10,y+dy],[x+dx,y+dy+9],[x+dx-10,y+dy]], null, color);
 }
 draw.path([[x,y-27],[x+11,y-9],[x+28,y],[x+11,y+9],[x,y+27],[x-11,y+9],[x-28,y],[x-11,y-9]], null, color);
 c.restore();
}

export function paintCampFloor(draw) {
 backdrop(draw, '#242332', '#191a24');
 paving(draw, LEGACY_BOUNDS, STONE, 'camp-stone', 156);
 stoneBorder(draw);
 const c = draw.ctx;
 c.fillStyle = '#88766275';
 c.fillRect(LEFT, 510, RIGHT-LEFT, 26);
 carpet(draw, true);
 for (const [x,y,w,h] of [[325,207,174,70],[240,353,153,73],[879,348,177,80],[905,517,152,85]]) {
  c.beginPath();
  c.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);
  c.fillStyle = x>900 ? '#724c4fbb' : '#634e4aaa';
  c.fill();
  c.strokeStyle = '#c29d6b70';
  c.lineWidth = 2;
  c.stroke();
 }
 for (const x of [187, 429, 691, 933]) {
  draw.path([[x-18,48],[x+18,48],[x+18,111],[x,102],[x-18,111]], '#694a56', '#b58c63');
  draw.path([[x,62],[x+9,79],[x,91],[x-9,79]], null, '#d2a66f');
 }
 for (const x of [135, 392, 730, 986]) draw.glow(x, 153, 127, '#e3ad6025');
}

function paintHarborRim(draw) {
 const c = draw.ctx;
 for (const y of [TOP-15,BOTTOM+15]) {
  draw.line([[LEFT-24,y],[RIGHT+24,y]], '#3a2f2c', 9);
  draw.line([[LEFT-24,y-2],[RIGHT+24,y-2]], '#927962', 3);
 }
 for (const x of [LEFT-22,RIGHT+22]) {
  draw.line([[x,TOP-16],[x,BOTTOM+16]], '#352c29', 9);
  draw.line([[x+1,TOP-16],[x+1,BOTTOM+16]], '#8a765a', 3);
  for (let y = TOP - 15; y <= BOTTOM + 16; y += 81) {
   c.fillStyle = '#2b2225';
   c.fillRect(x-8,y-10,16,20);
   draw.circle(x,y-9,9,'#836952','#baa37d');
   draw.circle(x,y-9,4,null,'#5c493e');
  }
 }
}

function paintStars(draw, seed, area) {
 const {left, top, right, bottom} = area;
 for (let i = 0; i < 54; i++) {
  const x=left+noise(i+seed)*(right-left), y=top+noise(i*61+seed)*(bottom-top);
  draw.circle(x,y,i%7===0?1.6:.8,i%3===0?'#d1b7ed95':'#aea6ce5f');
  if(i%11===0)draw.line([[x-3,y],[x+3,y]], '#ebd2f094');
 }
}

export function paintChapterBackdrop(draw, chapter, layer) {
 const c = draw.ctx;
 if (chapter === 2) {
  backdrop(draw,'#142b37','#163d47');
  texture(c,'tidal-water',0,0,1120,800,.42);
  paving(draw, LEGACY_BOUNDS, WOOD, 'dock-wood', layer * 63);
  paintHarborRim(draw);
  for (const x of [174, 945]) {
   drawSceneSprite(c,'decor/lantern-post.webp',x,TOP+32,76,103);
   draw.glow(x,TOP-17,116,'#ddab6439');
  }
 } else if (chapter === 3) {
  backdrop(draw,'#222036','#121421');
  paintStars(draw, layer * 90, {left:0,top:0,right:1120,bottom:800});
  paving(draw, LEGACY_BOUNDS, VIOLET, 'court-stone', layer * 63);
  stoneBorder(draw, true);
  inlay(draw,CENTER,430,68+layer*2,'#b8a681');
  for (const x of [185, 935]) {
   drawSceneSprite(c,'decor/crystal-cluster.webp',x,TOP+32,84,86);
   draw.glow(x,TOP-14,110,'#a283eb29');
  }
 } else {
  backdrop(draw,'#272331','#1b1b25');
  paving(draw, LEGACY_BOUNDS, STONE, 'abbey-stone', layer * 63);
  stoneBorder(draw);
  const wall = sceneTexture('abbey-wall');
  if (wall) c.drawImage(wall,301,10,518,116);
  if (layer === 6 || layer === 7) carpet(draw);
  else inlay(draw,CENTER,430,layer===2?102:87,'#b4a392');
  for (const x of [214, 906]) {
   drawSceneSprite(c,'decor/candle-stand.webp',x,TOP+36,85,92);
   draw.glow(x,TOP-11,143,'#e7b66b36');
  }
 }
}

function paintBridge(draw, {left, top, right, bottom, axis}, water) {
 const c = draw.ctx;
 const vertical = axis === 'y';
 const low = vertical ? top : left, high = vertical ? bottom : right;
 const palette = water ? WOOD : VIOLET;
 const step = water ? 13 : 29;
 c.fillStyle = water ? '#372d28' : '#27253b';
 c.fillRect(left,top,right-left,bottom-top);
 for (let pos = low, i = 0; pos < high; pos += step, i++) {
  const end = Math.min(high,pos+step-1);
  c.fillStyle = palette[i % palette.length];
  if (vertical) c.fillRect(left,pos,right-left,end-pos);
  else c.fillRect(pos,top,end-pos,bottom-top);
  const trim = water ? '#bb936d75' : '#9b8ba572';
  draw.line(vertical?[[left,pos+1],[right,pos+1]]:[[pos+1,top],[pos+1,bottom]],trim);
 }
 const trim = water ? '#d0a572' : '#c9ac86';
 if (vertical) {
  for (const x of [left+2,right-2]) draw.line([[x,top],[x,bottom]],trim,3);
 } else {
  for (const y of [top+2,bottom-2]) draw.line([[left,y],[right,y]],trim,3);
 }
 for (const x of [left+5,right-5]) for (const y of [top+5,bottom-5]) {
  c.fillStyle = water ? '#554339' : '#443c58';
  c.fillRect(x-5,y-5,10,10);
  draw.circle(x,y,2.6,trim);
 }
}

function paintCut(draw, block, water, bounds, scale, seed) {
 const c = draw.ctx;
 // A cut carries through the painted border when it reaches the actual playfield boundary.
 const left = block.left <= bounds.left ? bounds.left-40*scale : block.left;
 const right = block.right >= bounds.right ? bounds.right+40*scale : block.right;
 const top = block.top <= bounds.top ? bounds.top-21*scale : block.top;
 const bottom = block.bottom >= bounds.bottom ? bounds.bottom+36*scale : block.bottom;
 const w = right-left, h = bottom-top;
 c.fillStyle = water ? '#153542' : '#171629';
 c.fillRect(left,top,w,h);
 if (water) {
  texture(c,'tidal-water',left,top,w,h,.72);
  for (let i=0;i<Math.min(18,Math.floor(w*h/2300));i++) {
   const x=left+11+noise(i*23+seed)*Math.max(0,w-34),y=top+8+noise(i*77+seed)*Math.max(0,h-20);
   draw.line([[x,y],[x+9,y-1],[x+21,y]], '#79bab957');
  }
 } else paintStars(draw,seed+12,{left,top,right,bottom});
 draw.line([[left,top+2],[right,top+2]],water?'#0e242d':'#0d0f20',4);
 draw.line([[left,bottom-2],[right,bottom-2]],water?'#8da6a1':'#95859a',3);
 draw.line([[left+1,top],[left+1,bottom]],water?'#607b7a':'#6a5d80',2);
 draw.line([[right-1,top],[right-1,bottom]],water?'#607b7a':'#6a5d80',2);
}

export function paintRoomTerrain(draw, terrain) {
 if (!terrain) return;
 const water = terrain.material === 'water';
 for (const [index, block] of terrain.blocks.entries()) {
  if (terrain.material !== 'stone') {
   paintCut(draw, block, water, terrain.bounds ?? LEGACY_BOUNDS, terrain.scale ?? 1, index * 29);
   continue;
  }
  paintStoneWall(draw,block,terrain.scale??1);
 }
 for (const bridge of terrain.bridges) paintBridge(draw,bridge,water);
}

export function paintChapterAmbient(draw, chapter, clock) {
 // A handful of moving pixels are separate from the cached terrain and geometry.
 for (let i = 0; i < 8; i++) {
  const x = 110 + i * 126 + Math.sin(clock * .7 + i) * 11;
  const y = 110 - (clock * (chapter === 2 ? 5 : 13) + i * 18) % 75;
  const color = ['#d8a36f76','#85b7b67a','#c9b5e68a'][chapter-1] ?? '#c9b5e68a';
  draw.ctx.fillStyle = color;
  draw.ctx.fillRect(x,y,i%4===0?2:1.5,i%4===0?2:1.5);
 }
}
