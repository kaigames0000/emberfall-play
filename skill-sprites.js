import {bplusImage} from './bplus-art.js?v=124';

const atlases = {
 impact:{path:'vfx/impact-atlas.webp',columns:4,rows:4},
 cast:{path:'vfx/cast-atlas.webp',columns:4,rows:3},
 field:{path:'vfx/field-atlas.webp',columns:4,rows:4},
 support:{path:'vfx/support-atlas.webp',columns:4,rows:4},
 earthbreak:{path:'vfx/earthbreak-atlas.webp',columns:3,rows:2},
 projectile:{path:'vfx/projectile-atlas.svg',columns:4,rows:4},
 assassinPainted:{path:'vfx/assassin-painted-atlas.webp',columns:4,rows:4},
 raiderPainted:{path:'vfx/raider-painted-atlas.webp',columns:4,rows:4},
 volleyPainted:{path:'vfx/volley-painted-atlas.webp',columns:4,rows:4},
};
const fourCels = [0,1,2,3];
const drift = [0,1,2,3,2,1];
const impactBeats = [.13,.38,.68];
const sprites = {
 iceImpact:{atlas:'impact',row:0},
 fireImpact:{atlas:'impact',row:1},
 lightningImpact:{atlas:'impact',row:2},
 poisonImpact:{atlas:'impact',row:3},
 beam:{atlas:'cast',row:0,anchorX:0,fps:12,order:fourCels},
 thrust:{atlas:'cast',row:1,anchorX:0},
 slash:{atlas:'cast',row:2},
 whirl:{atlas:'cast',row:2,fps:12,order:[1,2,3,2]},
 cleave:{atlas:'earthbreak',row:0,beats:[.09,.2,.34,.5,.72],still:2},
 iceField:{atlas:'field',row:0,fps:6,order:drift},
 poisonField:{atlas:'field',row:1,fps:5,order:drift},
 fireField:{atlas:'field',row:2,fps:7,order:drift},
 lightningField:{atlas:'field',row:3,fps:9,order:drift},
 summon:{atlas:'support',row:0},
 shield:{atlas:'support',row:1},
 curse:{atlas:'support',row:2},
 warcry:{atlas:'support',row:3},
 coldBolt:{atlas:'projectile',row:0,fps:12,order:fourCels},
 fireBolt:{atlas:'projectile',row:1,fps:16,order:fourCels},
 lightningBolt:{atlas:'projectile',row:2,fps:19,order:fourCels},
 poisonBolt:{atlas:'projectile',row:3,fps:9,order:fourCels},
 shieldLoop:{atlas:'support',row:1,fps:4,order:[1,2,1,3]},
 curseLoop:{atlas:'support',row:2,fps:5,order:[1,2,1,3]},
 a_execute:{atlas:'assassinPainted',row:0},
 a_stab:{atlas:'assassinPainted',row:1},
 a_mirrorstrike:{atlas:'assassinPainted',row:2},
 a_storm:{atlas:'assassinPainted',row:3},
 b_cleave:{atlas:'raiderPainted',row:0},
 b_execute:{atlas:'raiderPainted',row:1,anchorY:.6875},
 b_flurry:{atlas:'raiderPainted',row:2,fps:14,order:fourCels},
 a_flurry:{atlas:'raiderPainted',row:3},
 r_rain:{atlas:'volleyPainted',row:0,anchorY:.8086,fps:9,order:fourCels},
 m_meteor:{atlas:'volleyPainted',row:1,anchorY:.8086,fps:11,order:fourCels},
 a_shuriken:{atlas:'volleyPainted',row:2,fps:16,order:fourCels},
 a_kunai:{atlas:'volleyPainted',row:3,fps:12,order:fourCels},
};

export function warmSkillSprites() {
 for(const {path} of Object.values(atlases))bplusImage(path);
}

function oneShotFrame(beats,progress) {
 let frame=0;
 while(frame<beats.length&&progress>=beats[frame])frame++;
 return frame;
}

// The source cel changes independently of its destination rectangle and pivot.
export function drawSkillSprite(ctx,key,x,y,width,height,{progress=0,clock=0,opacity=1,reducedMotion=false,blend=false}={}) {
 const sprite=sprites[key];
 if(!sprite?.atlas||!(width>0&&height>0&&opacity>0))return false;
 const {path,columns,rows}=atlases[sprite.atlas];
 const image=bplusImage(path);
 if(!image)return false;
 const w=image.naturalWidth/columns,h=image.naturalHeight/rows;
 const dx=x-width*(sprite.anchorX??.5),dy=y-height*(sprite.anchorY??.5);
 const looping=sprite.order&&!reducedMotion;
 const tick=looping?Math.max(0,clock*sprite.fps):0;
 const step=Math.floor(tick);
 const mix=looping&&blend?Math.max(0,(tick-step-.65)/.35):0;
 const frame=looping?sprite.order[step%sprite.order.length]:
  sprite.order?sprite.still??1:oneShotFrame(sprite.beats??impactBeats,progress);
 const drawFrame=cel=>ctx.drawImage(image,(cel%columns)*w,(sprite.row+Math.floor(cel/columns))*h,w,h,dx,dy,width,height);
 ctx.save();
 const alpha=ctx.globalAlpha*opacity;
 ctx.globalAlpha=alpha*(1-mix);
 drawFrame(frame);
 if(mix>0){
  ctx.globalAlpha=alpha*mix;
  drawFrame(sprite.order[(step+1)%sprite.order.length]);
 }
 ctx.restore();
 return true;
}
