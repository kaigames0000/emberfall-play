import {bplusImage,drawBplus} from './bplus-art.js?v=124';
import {drawRareGear,paintGearCrest} from './rare-gear-art.js?v=108';
import {applyHeroBodyPose} from './hero-motion.js?v=127';

const TAU=Math.PI*2;
const FACINGS=['right','front','left','back'];
const HANDS={
 right:{main:[.50,.79],off:[.70,.75],feet:.54,torso:.57},
 front:{main:[.24,.79],off:[.79,.79],feet:.52,torso:.52},
 left:{main:[.44,.79],off:[.28,.75],feet:.46,torso:.42},
 back:{main:[.78,.78],off:[.23,.78],feet:.51,torso:.50},
};
const CAPE_TIPS=[0,5,-2,3];
// Grips use the handle's center in the unrotated item art.
const HELD_ART={
 sword:{size:36,grip:[.28,.75],tilt:.87},
 greatsword:{size:48,grip:[.26,.77],tilt:.87},
 dagger:{size:25,grip:[.29,.74],tilt:.82},
 axe:{size:33,grip:[.29,.73],tilt:1.10},
 greataxe:{size:44,grip:[.43,.74],tilt:1.40},
 wand:{size:29,grip:[.29,.74],tilt:.87},
 staff:{size:53,grip:[.28,.71],tilt:.87},
 bow:{size:42,grip:[.32,.57],tilt:2.40},
 shield:{size:27,grip:[.5,.47],tilt:0,support:true},
 towerShield:{size:36,grip:[.5,.47],tilt:0,support:true,file:'tower-shield'},
 tome:{size:25,grip:[.5,.57],tilt:0,support:true,file:'grimoire'},
 quiver:{size:34,grip:[.5,.60],tilt:0,support:true},
};

export function heroFacing(angle){
 return FACINGS[(Math.round(angle/(Math.PI/2))%4+4)%4];
}
function shape(ctx,points,fill,stroke='#211c27'){
 ctx.beginPath();
 ctx.moveTo(...points[0]);
 for(const point of points.slice(1))ctx.lineTo(...point);
 ctx.closePath();
 ctx.fillStyle=fill;
 ctx.fill();
 ctx.strokeStyle=stroke;
 ctx.lineWidth=1.15;
 ctx.stroke();
}
function piece(ctx,image,sx,sy,sw,sh,x,y,w,h){
 ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);
}
function paintedCape(ctx,v,facing,sway){
 const drift=facing==='left'?1:-1;
 const art=v.cloak.design;
 if(art){
  const [shade,base,light]=art.palette,tip=CAPE_TIPS[art.cut];
  if(facing==='back'||facing==='front'){
   shape(ctx,[[-11,-43],[10,-43],[19+sway,-23],[25+sway,-10],[16+sway,-5-tip],[7+sway,-9],[0+sway,-5-tip],[-9+sway,-9],[-22+sway,-6],[-23+sway,-13]],base,shade);
   shape(ctx,[[9,-37],[15+sway,-24],[24+sway,-11],[17+sway,-8-tip],[12+sway,-11],[15+sway,-16]],shade,light);
   paintGearCrest(ctx,art,18+sway,-12,.66);
  }else{
   shape(ctx,[[drift*5,-44],[drift*15,-42],[drift*(22+sway),-28],[drift*(31+sway),-15],[drift*(32+sway),-9-tip],[drift*(23+sway),-9],[drift*(18+sway),-12-tip],[drift*9,-20]],base,shade);
   shape(ctx,[[drift*13,-33],[drift*(21+sway),-26],[drift*(31+sway),-13],[drift*(27+sway),-10-tip],[drift*(22+sway),-14]],shade,light);
   paintGearCrest(ctx,art,drift*(26+sway),-15,.64);
  }
  return;
 }
 if(facing==='back'||facing==='front'){
  shape(ctx,[[-11,-45],[9,-45],[17+sway,-14],[5+sway,-7],[-14+sway,-11],[-18,-18]],v.cloak.color,v.cloak.trim);
 }else{
  shape(ctx,[[drift*6,-45],[drift*15,-41],[drift*(27+sway),-19],[drift*(20+sway),-14],[drift*9,-19]],v.cloak.color,v.cloak.trim);
 }
}
function paintHeld(ctx,weapon,point,angle,scale,paintWeapon){
 if(!weapon)return;
 const art=HELD_ART[weapon.type];
 if(!art)return;
 ctx.save();
 ctx.translate(...point);
 ctx.scale(scale,scale);
 if(!art.support)ctx.rotate(angle+art.tilt);
 if(!drawRareGear(ctx,weapon.design,0,0,art.size,weapon.design?.shape.grip)&&
    !drawBplus(ctx,'gear/'+(art.file??weapon.type)+'.webp',0,0,art.size,art.size,{anchorX:art.grip[0],anchorY:art.grip[1]})){
  if(!art.support)ctx.rotate(-art.tilt);
  paintWeapon(ctx,weapon);
 }
 ctx.restore();
}
function paintRareArmor(ctx,rare,garment,facing,x,y,headY){
 const profile=facing==='left'||facing==='right';
 const direction=facing==='left'?-1:1;
 if(rare.chest){
  const [shade,base,light]=rare.chest.palette,plate=garment==='heavy';
  const w=profile?6:plate?11:9,h=plate?7:6;
  shape(ctx,[[x-w,y-h+2],[x,y-h],[x+w,y-h+2],[x+w-2,y+h-2],[x,y+h],[x-w+2,y+h-2]],base,shade);
  shape(ctx,[[x-w+2,y-h+2],[x,y-h+1],[x+w-2,y-h+2],[x+w-4,y-h+4],[x,y-h+3],[x-w+4,y-h+4]],light,base);
  paintGearCrest(ctx,rare.chest,x+(profile?direction:0),y+1,plate?1.03:.86);
 }
 if(rare.helm){
  const [shade,base,light]=rare.helm.palette,w=profile?6:9;
  const peak=rare.helm.form==='crown'?5:2;
  shape(ctx,[[x-w,headY],[x-w+3,headY-1],[x,headY-peak],[x+w-3,headY-1],[x+w,headY],[x+w-2,headY+3],[x-w+2,headY+3]],base,shade);
  paintGearCrest(ctx,rare.helm,x,headY,.5);
  ctx.fillStyle=light;
  ctx.fillRect(x-w+3,headY+1,2,1);
 }
}
function paintRareHand(ctx,point,glove,ring){
 const [x,y]=point;
 if(glove){
  ctx.fillStyle=glove.palette[0];
  ctx.fillRect(x-2.4,y-2.2,4.8,2.1);
  ctx.fillStyle=glove.palette[2];
  ctx.fillRect(x-1.7,y-2.15,3.4,1);
 }
 if(ring){
  ctx.fillStyle=ring.palette[3];
  ctx.fillRect(x-1.1,y+.15,2.2,1.2);
 }
}
function paintGrip(ctx,point,v){
 ctx.beginPath();
 ctx.ellipse(point[0],point[1],2.15,1.85,-.25,0,TAU);
 ctx.fillStyle=v.gloveGear?v.gloves:'#eac4ad';
 ctx.fill();
 ctx.strokeStyle='#342631';
 ctx.lineWidth=.8;
 ctx.stroke();
}

export function drawBplusHero(ctx,v,{
 x=0,y=0,angle=.35,movementAngle=angle,weaponAngle=angle,time=0,moving=false,attacking=false,scale=1,alpha=1,pose
}={},paintWeapon){
 if(alpha<=0)return true;
 const facing=heroFacing(moving&&!attacking?movementAngle:angle);
 const image=bplusImage('heroes/'+v.garment+'/'+v.gender+'-'+facing+'.webp')??
  bplusImage('heroes/base/'+v.gender+'-'+facing+'.webp');
 if(!image)return false;
 const frame=moving&&!attacking&&!pose?Math.floor(time*10)%4:0;
 const stride=[0,2,0,-2][frame];
 const lean=attacking?Math.cos(angle)*2:0;
 const lift=attacking?1:moving?Math.abs(stride)*.65:0;
 const grip=HANDS[facing];
 const sw=image.naturalWidth,sh=image.naturalHeight;
 const height=77,width=height*sw/sh,top=-height+3,left=-width*grip.feet;
 const waist=Math.floor(sh*.52),ankle=Math.floor(sh*.86);
 const waistY=top+waist/sh*height,ankleY=top+ankle/sh*height;
 const profile=facing==='left'||facing==='right';
 const heavy=v.garment==='heavy';
 const hand=([px,py])=>[
  left+width*px+lean,
  top+height*(heavy?py-.025:py)-lift,
 ];
 const main=hand(grip.main),off=hand(grip.off);
 const resting={front:.62,back:-.62,left:2.52,right:.62}[facing];
 const upright={front:-2.4,back:-.6,left:-2.7,right:-.44}[facing];
 const mainAngle=pose?.tuck>.40?resting+Math.sin(angle)*.12:attacking?weaponAngle:['staff','wand'].includes(v.main?.type)?upright:
  v.main?.type==='bow'?{front:Math.PI/2,back:-Math.PI/2,left:Math.PI,right:0}[facing]:resting+stride*.025;
 const offAngle=attacking?weaponAngle:resting;
 const offBehind=profile||facing==='back';

 ctx.save();
 ctx.translate(x,y);
 ctx.scale(scale,scale);
 ctx.globalAlpha*=alpha;
 ctx.imageSmoothingEnabled=false;
 ctx.beginPath();
 const shadow=pose?.shadow??1;
 ctx.ellipse(0,3,21*shadow,6*shadow,0,0,TAU);
 ctx.fillStyle='#11162080';
 ctx.fill();
 applyHeroBodyPose(ctx,pose);
 if(v.cloak.visible)paintedCape(ctx,v,facing,stride);
 const quiver=v.off?.type==='quiver';
 if(quiver){
  if(facing!=='back')paintHeld(ctx,v.off,[facing==='left'?10:-10,-31],0,.72,paintWeapon);
 }else if(offBehind){
  paintHeld(ctx,v.off,off,offAngle,.78,paintWeapon);
 }

 // Boots step independently while the torso and its held items share one anchor.
 const split=Math.round(sw*grip.feet),splitWidth=split/sw*width;
 const tuck=(pose?.tuck??0)*6;
 piece(ctx,image,0,ankle,split,sh-ankle,left+(profile?stride*.6:0)+tuck*.7,ankleY-Math.max(0,stride)-tuck,splitWidth,height+top-ankleY);
 piece(ctx,image,split,ankle,sw-split,sh-ankle,left+splitWidth-(profile?stride*.6:0)-tuck*.7,ankleY+Math.min(0,stride)-tuck*.6,width-splitWidth,height+top-ankleY);
 piece(ctx,image,0,waist,sw,ankle-waist+2,left+lean,waistY-lift,width,(ankle-waist+2)/sh*height+lift);
 piece(ctx,image,0,0,sw,waist+1,left+lean,top-lift,width,(waist+1)/sh*height);
 if(v.bootGear){
  ctx.fillStyle=v.boots;
  ctx.fillRect(-9,ankleY+4-Math.max(0,stride),5,2);
  ctx.fillRect(4,ankleY+4+Math.min(0,stride),5,2);
 }
 const rare=v.rare;
 const torsoX=left+width*grip.torso+lean;
 if(rare?.chest||rare?.helm)paintRareArmor(ctx,rare,v.garment,facing,torsoX,top+height*.72-lift,top+height*.27-lift);
 if(quiver&&facing==='back')paintHeld(ctx,v.off,[torsoX-9,top+height*.74-lift],0,.72,paintWeapon);
 if(rare?.feet){
  ctx.fillStyle=rare.feet.palette[3];
  ctx.fillRect(-8,ankleY+4-Math.max(0,stride),3,1.2);
  ctx.fillRect(5,ankleY+4+Math.min(0,stride),3,1.2);
 }
 if(v.amulet&&facing==='front'){
  if(rare?.charm)paintGearCrest(ctx,rare.charm,torsoX,top+height*.607-lift,.69);
  else shape(ctx,[[-2,-30],[0,-33],[2,-30],[0,-27]],v.trim);
 }
 if(v.off&&!quiver&&!offBehind){
  paintHeld(ctx,v.off,off,offAngle,.78,paintWeapon);
  paintGrip(ctx,off,v);
 }
 if(!offBehind&&(rare?.hands||rare?.rings[0]))paintRareHand(ctx,off,rare.hands,rare.rings[0]);
 if(v.main){
  paintHeld(ctx,v.main,main,mainAngle,.82,paintWeapon);
  paintGrip(ctx,main,v);
 }
 if(rare?.hands||rare?.rings[1])paintRareHand(ctx,main,rare.hands,rare.rings[1]);
 ctx.restore();
 return true;
}
