import {drawAnimeBurst,drawAnimeCast,drawAnimeChannelBeam,drawAnimeChannelWhirl,drawAnimeLightning,drawAnimeRing,drawAnimeSlash} from './anime-effects.js?v=125';
import {drawSkillSprite} from './skill-sprites.js?v=125';
import {drawColdEffect,drawColdField} from './cold-signature-vfx.js?v=125';
import {drawMartialSignature} from './martial-signature-vfx.js?v=129';
import {drawSignatureEffect,drawSignatureField} from './skill-signature-vfx.js?v=135';
import {drawNamedPaintedEffect,drawNamedPaintedField} from './named-painted-vfx.js?v=126';
import {drawAuraPulse} from './aura-vfx.js?v=127';
import {hasTargetImpact} from './combat-vfx.js?v=126';
import {drawMovementEffect} from './movement-vfx.js?v=127';

const TAU=Math.PI*2;
const TOP=-Math.PI/2;
const FIELD_COLORS={physical:'#ddc6a4',fire:'#f39a69',cold:'#8cdcf2',lightning:'#eed49b',poison:'#abd878'};
const DANGER_STYLES={
 warning:{fill:.11,rim:.93,width:2,dash:[10,6]},
 danger:{fill:.095,rim:.78,width:1.8,dash:[6,5]},
};
const GROUND_ART={fire:'fireField',cold:'iceField',lightning:'lightningField',poison:'poisonField'};
const FIELD_MOTION={cold:.35,lightning:.95,arrows:1.8,poison:.27,fire:.64};
const SUPPORT_CUES=new Set(['summon','summon-circle','ward','shield','curse','warcry','aura']);
const CAST_CUES=new Set(['cast','charge','release']);
const BURST_TYPES=new Set(['burst','frost','shock','meteor']);
export const DANGER_RIM='#ffab94';

export function combatVisualOptions(scene,reducedMotion=false){
 const fields=(scene.hazards?.length??0)+(scene.rangerCombat?.clouds?.length??0);
 const workload=(scene.bullets?.length??0)+(scene.effects?.length??0)*3+fields*3;
 return {detail:reducedMotion||workload>=140?'low':'full',reducedMotion,clock:scene.clock??scene.elapsed??0};
}

export function fieldInView(field,view,margin=0){
 if(!Number.isFinite(field.x)||!Number.isFinite(field.y))return false;
 if(!view)return true;
 const r=(field.r??field.radius??0)+margin;
 return field.x+r>=view.left&&field.x-r<=view.right&&field.y+r>=view.top&&field.y-r<=view.bottom;
}

function arc(ctx,x,y,r,from=0,to=TAU){
 ctx.beginPath();
 ctx.arc(x,y,r,from,to);
}

function fieldParticles(ctx,field,r,family,step,count){
 const drift=step*(FIELD_MOTION[family]??.45);
 ctx.beginPath();
 for(let i=0;i<count;i++){
  const seed=i*.381966,angle=i*2.39996+drift*.6;
  const phase=drift+seed,travel=phase-Math.floor(phase);
  const offset=r*(.16+(family==='arrows'?seed-Math.floor(seed):travel)*.65);
  const rise=family==='fire'?travel*9:family==='arrows'?-travel*19:0;
  const x=Math.round(field.x+Math.cos(angle)*offset),y=Math.round(field.y+Math.sin(angle)*offset*.83-rise);
  if(family==='cold'){
   ctx.moveTo(x-4,y+3);ctx.lineTo(x+5,y-6);ctx.lineTo(x+1,y+4);ctx.closePath();
   ctx.moveTo(x+5,y-6);ctx.lineTo(x+9,y-8);
  }else if(family==='lightning'){
   ctx.moveTo(x-7,y-8);ctx.lineTo(x+3,y-3);ctx.lineTo(x-2,y+2);ctx.lineTo(x+5,y+6);
  }else if(family==='arrows'){
   const length=11+(i%3)*5;
   ctx.moveTo(x-length*.64,y-length);ctx.lineTo(x,y);
   ctx.lineTo(x-5,y-1);ctx.moveTo(x,y);ctx.lineTo(x,y-5);
  }else if(family==='poison'){
   ctx.rect(x-2,y-2,4,4);ctx.rect(x+4,y-5,2,2);
  }else if(family==='fire'){
   ctx.moveTo(x-3,y+3);ctx.lineTo(x+1,y-6);ctx.lineTo(x+3,y-1);ctx.lineTo(x+1,y+3);
  }else{
   ctx.moveTo(x-3,y+1);ctx.lineTo(x,y-4);ctx.lineTo(x+4,y+2);
  }
 }
 ctx.stroke();
}

function drawDanger(ctx,field,r,color,kind){
 const {x,y}=field,style=DANGER_STYLES[kind];
 const alpha=ctx.globalAlpha;
 ctx.save();
 arc(ctx,x,y,r);
 ctx.fillStyle=color;
 ctx.globalAlpha=alpha*style.fill;
 ctx.fill();
 ctx.setLineDash(style.dash);
 ctx.lineWidth=style.width;
 ctx.strokeStyle=DANGER_RIM;
 ctx.globalAlpha=alpha*style.rim;
 ctx.stroke();
 ctx.setLineDash([]);
 if(kind==='warning'){
  const phase=1-(field.t??0)/(field.max||1);
  const arm=Math.min(8,r*.21);
  ctx.beginPath();
  ctx.moveTo(x-arm,y);ctx.lineTo(x+arm,y);
  ctx.moveTo(x,y-arm);ctx.lineTo(x,y+arm);
  ctx.lineWidth=1.6;
  ctx.stroke();
  if(phase>0){
   arc(ctx,x,y,Math.max(1,r-3),TOP,TOP+TAU*Math.min(1,phase));
   ctx.lineWidth=1.5;
   ctx.globalAlpha=alpha*.78;
   ctx.stroke();
  }
 }
 ctx.restore();
}

export function drawCombatField(ctx,field,{kind='ground',clock=0,detail='full',reducedMotion=false,phase}={}){
 const {x,y}=field,r=field.r??field.radius;
 if(!Number.isFinite(x)||!Number.isFinite(y)||!(r>0))return;
 const type=field.visualDamageType??field.damageType;
 const color=FIELD_COLORS[type]??field.color??'#bbcef0';
 if(Object.hasOwn(DANGER_STYLES,kind)){
  drawDanger(ctx,field,r,color,kind);
  return;
 }
 if(kind==='ground'&&drawNamedPaintedField(ctx,field,clock,{detail,reducedMotion})||
    drawColdField(ctx,field,clock,{detail,reducedMotion}))return;
 const ground=kind==='ground',full=detail==='full';
 const family=(field.ability??field.source)==='r_rain'?'arrows':type;
 const step=reducedMotion?0:Math.floor(clock*12)/12;
 ctx.save();
 const alpha=ctx.globalAlpha;
 if(ground){
  const sprite=GROUND_ART[family];
  const fade=field.friendly!==false&&Number.isFinite(field.t)?Math.max(.16,Math.min(1,field.t*3.4)):1;
  const painted=sprite&&drawSkillSprite(ctx,sprite,x,y,r*1.98,r*1.72,
   {clock:clock+(Math.abs(x)*.013+Math.abs(y)*.009),opacity:fade*(full?.69:.52),blend:full,reducedMotion});
  if(painted||field.friendly!==false&&!field.hostile&&drawSignatureField(ctx,field,clock,{detail,reducedMotion})){
   ctx.restore();
   return;
  }
  ctx.globalAlpha=alpha*fade*(full?.81:.67);
 }else{
  const sprite=kind==='ward'?'shieldLoop':kind==='hex'?'curseLoop':null;
  if(sprite&&drawSkillSprite(ctx,sprite,x,y,Math.min(77,r*1.42),Math.min(67,r*1.22),
   {clock:clock+Math.abs(x)*.003,opacity:.49,blend:full,reducedMotion})){
   ctx.restore();
   return;
  }
  ctx.globalAlpha=alpha*(.48+(Number.isFinite(phase)?Math.max(0,Math.min(1,phase))*.17:0));
 }
 ctx.lineWidth=ground?1.6:1.3;
 ctx.strokeStyle=color;
 const spread=ground?r:Math.min(70,r*.58);
 const count=ground?(full?9:4):(full?4:3);
 fieldParticles(ctx,field,spread,family,step,count);
 ctx.restore();
}

function drawCleave(ctx,{x,y,r},opacity,{detail,reducedMotion}={}){
 if(!(r>0))return;
 const alpha=ctx.globalAlpha*opacity;
 const phase=1-opacity;
 ctx.save();
 ctx.globalAlpha=alpha;
 const painted=drawSkillSprite(ctx,'cleave',x,y,r*2.02,r*1.52,{progress:phase,opacity:.92,reducedMotion});
 if(painted){
  ctx.restore();
  return;
 }
 ctx.globalAlpha=alpha*.82;
 ctx.strokeStyle='#f2d5a8';
 ctx.lineWidth=1.5;
 ctx.beginPath();
 const count=detail==='full'?5:3;
 for(let i=0;i<count;i++){
  const angle=TOP+i*TAU/count+i*.11,dx=Math.cos(angle)*r,dy=Math.sin(angle)*r;
  const spread=(.68+(i%3)*.09)*(.74+phase*.25);
  ctx.moveTo(x+dx*.09,y+dy*.09);
  ctx.lineTo(x+dx*.34-dy*.12,y+dy*.34+dx*.12);
  ctx.lineTo(x+dx*.48+dy*.07,y+dy*.48-dx*.07);
  ctx.lineTo(x+dx*spread,y+dy*spread);
 }
 ctx.stroke();
 ctx.restore();
}

export function drawCombatEffect(ctx,effect,clock,options={},view){
 const {x,y,x2,y2,type,visual}=effect;
 const beam=type==='channel-flame'||visual==='thrust';
 const linked=Number.isFinite(x2)&&Number.isFinite(y2);
 const cleave=effect.ability==='w_cleave'&&(type==='whirl'||visual==='impact');
 if(view&&linked){
  const margin=effect.ability==='b_leap'?78:30;
  if(Math.max(x,x2)+margin<view.left||Math.min(x,x2)-margin>view.right||
     Math.max(y,y2)+margin<view.top||Math.min(y,y2)-margin>view.bottom)return;
 }else if(!fieldInView(effect,view,beam?Math.hypot(effect.length??0,(effect.width??0)*.5):visual==='landing'?60:18))return;
 const opacity=Math.max(0,Math.min(1,effect.t/(effect.max||1))),progress=1-opacity;
 if(!(opacity>0))return;
 if(effect.friendly!==false&&!effect.hostile&&(visual==='aura'||effect.sprite==='aura')){
  drawAuraPulse(ctx,x,y,progress,options.reducedMotion);return;
 }
 if(drawMovementEffect(ctx,effect,clock,options))return;
 if(visual==='melee'&&hasTargetImpact(effect)&&effect.friendly!==false&&!effect.hostile){
  drawAnimeSlash(ctx,{...effect,r:Math.min(effect.r*.7,60)},opacity*.38,options);return;
 }
 if(drawNamedPaintedEffect(ctx,effect,clock,options)||drawColdEffect(ctx,effect,clock,options)||drawMartialSignature(ctx,effect,clock,options))return;
 if(visual==='field'&&effect.friendly!==false&&!effect.hostile){
  const size=Math.min(36,effect.r*.4)*(.58+progress*.42);
  if(!(size>0))return;
  const flash=ctx.createRadialGradient(x,y,0,x,y,size);
  flash.addColorStop(0,FIELD_COLORS[effect.damageType]??effect.color??'#bbcef0');
  flash.addColorStop(1,'transparent');
  ctx.save();
  ctx.fillStyle=flash;
  ctx.globalAlpha*=opacity*.48;
  ctx.fillRect(x-size,y-size,size*2,size*2);
  ctx.restore();
  return;
 }
 if(drawSignatureEffect(ctx,effect,clock,options))return;
 if(linked&&(type==='lightning'||visual==='travel'))drawAnimeLightning(ctx,effect,progress,clock,options);
 else if(beam)drawAnimeChannelBeam(ctx,effect,progress,clock,options);
 else if(CAST_CUES.has(visual))drawAnimeCast(ctx,effect,progress,options);
 else if(type==='channel-whirl')drawAnimeChannelWhirl(ctx,effect,progress,clock,options);
 else if(type==='slash')drawAnimeSlash(ctx,effect,opacity,options);
 else if(cleave)drawCleave(ctx,effect,opacity,options);
 else if(BURST_TYPES.has(type)&&!SUPPORT_CUES.has(visual))drawAnimeBurst(ctx,effect,progress,options);
 else drawAnimeRing(ctx,effect,progress,options);
}
