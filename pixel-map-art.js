const swatches={
 abbey:['#24283e','#3b3d58','#5d596e','#a58d91','#ebae76'],
 port:['#172e43','#214557','#3c6a73','#65878b','#efc48a'],
 court:['#20213f','#33305b','#5a5485','#9b84bd','#c6e2ff'],
 vault:['#242637','#3a394b','#585368','#978183','#efc287'],
 forge:['#301e2b','#563244','#885164','#c7796c','#ffbd72'],
 contract:['#1b293a','#2c4a53','#46656a','#799487','#bdde9a'],
 royal:['#26263d','#403b56','#65576e','#ac8e96','#ffdf9e'],
 hunt:['#222941','#383d5c','#566582','#879eb5','#c4ecfa'],
 sanctum:['#22213f','#3d3561','#645786','#ad8cc2','#d5ebff'],
 final:['#201b36','#3c2d53','#614c83','#a988c0','#ecd8f7']
};
const layouts={
 abbey:'abbey',port:'port',court:'court',
 vault:'gate',forge:'gate',contract:'forest',royal:'gate',hunt:'court',sanctum:'court',final:'court'
};
const art=new Map();
const unit=n=>{const x=Math.sin(n*97.13+73.1)*4112.671;return x-Math.floor(x);};
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path=(d,fill)=>`<path d="${d}" fill="${fill}"/>`;

function masonry(x,y,w,h,p){
 const [dark,shadow,mid,edge]=p;
 let tiles=rect(x,y,w,h,dark);
 for(let yy=y;yy+3<=y+h;yy+=4){
  for(let xx=x;xx+3<=x+w;xx+=7){
   const width=Math.min(6,x+w-xx),shade=unit(xx*3+yy);
   tiles+=rect(xx,yy,width,3,shade>.65?mid:shadow);
   if(shade>.42)tiles+=rect(xx,yy,Math.max(1,width-1),1,edge+'5e');
  }
 }
 return tiles;
}
function lamp(x,y,p){
 return rect(x-3,y-4,7,7,p[4]+'36')+rect(x-1,y-4,3,4,p[4])+rect(x,y-5,1,3,'#fff4cd')+
  rect(x-2,y,5,1,p[3])+rect(x,y+1,1,3,p[0]);
}
function gem(x,y,h,p){
 return path(`M${x} ${y-h}l${h*.5} ${h*.75}-${h*.5} ${h*1.25}-${h*.5}-${h*1.25}z`,p[2])+
  path(`M${x} ${y-h+1}v${h*1.9}l-${h*.42}-${h*1.2}z`,p[4]);
}
function arch(x,y,w,h,p){
 return masonry(x,y,w,h,p)+path(`M${x+3} ${y+h}v-${h-9}h2v-3h2v-2h${w-14}v2h2v3h2v${h-9}z`,p[0])+
  rect(x+3,y+h,w-6,1,p[3]);
}
function build(theme){
 const p=swatches[theme],layout=layouts[theme],[dark,shadow,mid,edge,light]=p;
 let pieces=rect(0,0,160,72,dark);
 for(let i=0;i<44;i++){
  const x=Math.floor(unit(i)*159),y=Math.floor(unit(i+381)*47);
  pieces+=rect(x,y,i%8?1:2,1,i%8?mid:edge);
 }
 if(layout==='abbey'||layout==='gate'){
  pieces+=masonry(0,37,160,21,p)+masonry(38,23,84,35,p);
  if(layout==='abbey'){
   for(const [x,y] of [[38,16],[100,11]]){
    pieces+=masonry(x,y,22,42,p)+path(`M${x-2} ${y}h3v-4h4v-4h4v-4h4v4h4v4h4v4h3v2h-26z`,mid);
    pieces+=rect(x+10,y+5,3,8,dark)+rect(x+11,y+6,1,4,light);
   }
  }else{
   pieces+=masonry(20,22,18,35,p)+masonry(122,22,18,35,p)+masonry(16,18,128,5,p);
   pieces+=rect(19,22,122,1,edge);
  }
  pieces+=arch(66,29,28,28,p)+masonry(50,58,60,4,p)+masonry(44,62,72,4,p)+masonry(38,66,84,5,p);
  for(const x of [28,58,102,132])pieces+=lamp(x,46,p);
  if(theme==='forge')pieces+=rect(0,65,160,7,'#b95c4b')+rect(15,65,32,1,light)+rect(111,68,26,1,light);
  if(theme==='vault'||theme==='royal')pieces+=rect(72,48,16,9,edge)+rect(73,49,14,2,light)+rect(79,51,2,5,light);
 }else if(layout==='port'){
  for(let i=0;i<22;i++){
   const x=Math.floor(unit(i+64)*158),y=34+Math.floor(unit(i+473)*38),w=6+Math.floor(unit(i+171)*17);
   pieces+=rect(x,y,w,1,mid);
  }
  for(const [x,y,w] of [[3,28,28],[24,20,20],[52,23,18],[112,18,15],[133,25,25]]){
   pieces+=masonry(x,y,w,15,p)+rect(x,y-2,w,2,edge);
   pieces+=rect(x+4,y+4,2,3,light)+rect(x+w-6,y+4,2,3,light);
  }
  pieces+=path('M0 47h70l22 25H61L55 57H0z','#675261')+path('M103 43h57v9h-43l-8 15H96z','#675261');
  for(let y=48;y<72;y+=4)pieces+=rect(63+(y-48)*.45,y,11+(y-48)*.36,1,'#b18d82');
  pieces+=path('M77 35h46l-9 9H85z',edge)+rect(101,10,2,28,edge)+path('M101 11v21H79z','#a69ca0')+path('M105 15l15 16h-15z','#7a8593');
  for(const [x,y] of [[23,46],[64,55],[122,49],[150,47]])pieces+=lamp(x,y,p);
 }else if(layout==='forest'){
  pieces+=path('M0 47h30v-7h27v7h28v-9h36v6h39v28H0z',shadow)+path('M49 72l17-21 17-8h13l-8 12-3 17z',mid);
  for(const [x,y,h] of [[7,52,29],[24,58,38],[44,48,24],[115,53,32],[139,55,40],[152,61,25]]){
   pieces+=rect(x-1,y-5,3,15,edge)+path(`M${x} ${y-h}l11 ${h-4}h-22z`,mid)+path(`M${x} ${y-h+5}l7 ${h-10}h-14z`,shadow);
  }
  pieces+=arch(76,34,18,20,p)+lamp(85,47,p);
 }else{
  for(const [x,y,w] of [[12,48,40],[108,53,42],[47,62,26],[54,43,52]]){
   pieces+=path(`M${x} ${y}l8-4h${w-16}l8 4-7 6h-${w-14}z`,edge)+
    path(`M${x} ${y}l7 6h${w-14}l7-6-4 12h-${w-8}z`,mid);
  }
  pieces+=path('M52 48h7v2h-7zm51 1h8v2h-8zm-38 9h6v2h-6z',light+'79');
  if(theme==='final'){
   pieces+=gem(80,29,19,p)+gem(47,24,9,p)+gem(113,24,9,p);
   pieces+=path('M64 12h5v2h-5zm26 0h5v2h-5zM53 30h4v2h-4zm50 0h4v2h-4zM67 48h5v2h-5zm22 0h5v2h-5z',edge);
  }else{
   pieces+=arch(66,19,28,25,p)+gem(80,33,8,p)+gem(37,40,6,p)+gem(124,40,7,p);
  }
 }
 return pieces+rect(0,71,160,1,edge);
}
export function pixelMapArt(theme,label){
 if(!art.has(theme))art.set(theme,build(theme));
 return `<svg class="chapter-card-art" viewBox="0 0 160 72" role="img" aria-label="${label}"><g shape-rendering="crispEdges" stroke="none">${art.get(theme)}</g></svg>`;
}
