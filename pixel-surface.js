const surfaces=new Map();
const SIZE=80,ORIGIN_X=40,ORIGIN_Y=54,RESOLUTION=.64,MAX_SPRITES=420;

// Cache complete frames and scale them with nearest-neighbor. Each frame has a fixed pixel grid.
export function paintSprite(ctx,key,x,y,scale,paint,cache=surfaces){
 if(cache===false||typeof document==='undefined'){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);paint(ctx);ctx.restore();
  return;
 }
 let frame=cache.get(key);
 if(!frame){
  frame=document.createElement('canvas');frame.width=SIZE;frame.height=SIZE;
  const sprite=frame.getContext('2d');
  sprite.setTransform(RESOLUTION,0,0,RESOLUTION,ORIGIN_X,ORIGIN_Y);
  sprite.lineJoin='miter';sprite.lineCap='square';
  paint(sprite);
  if(cache.size>=MAX_SPRITES)cache.delete(cache.keys().next().value);
  cache.set(key,frame);
 }
 ctx.save();ctx.imageSmoothingEnabled=false;
 const cell=scale/RESOLUTION;
 ctx.drawImage(frame,Math.round(x-ORIGIN_X*cell),Math.round(y-ORIGIN_Y*cell),SIZE*cell,SIZE*cell);
 ctx.restore();
}
