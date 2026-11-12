import {drawSkillSprite} from './skill-sprites.js?v=125';
import {hasTargetImpact} from './combat-vfx.js?v=126';

const melee = {
 a_execute:[1.75,1.05,.21], a_stab:[1.85,.94,.27],
 a_mirrorstrike:[1.98,1.45,.08], a_storm:[2.08,1.64,0],
 b_cleave:[1.92,1.24,.22], b_execute:[1.72,1.54,.14],
 b_flurry:[2.22,1.78,0], a_flurry:[1.88,1.2,.21],
};
const fields={r_rain:[2.22,1.97],m_meteor:[2.19,2.09]};
const weapons={a_shuriken:[5.2,4.1],a_kunai:[6.0,3.15]};
const idFor=source=>source.visualAbility??source.ability??source.source??source.id;
const animationClock=(clock,options)=>clock*(options.reducedMotion?.45:1);
const progressOf=effect=>Math.max(0,Math.min(1,1-(effect.t??.5)/(effect.max||.5)));

export function drawNamedPaintedField(ctx,field,clock=0,options={}){
 if(field.friendly===false||field.hostile)return false;
 const id=idFor(field),shape=fields[id],r=field.r??field.radius;
 if(!shape||!(r>0))return false;
 return drawSkillSprite(ctx,id,field.x,field.y+(id==='r_rain'?r*.24:0),r*shape[0],r*shape[1],{
  clock:animationClock(clock,options)+Math.abs(field.x*.009+field.y*.005),
  opacity:id==='m_meteor'?.92:.88,blend:options.detail==='full'
 });
}

export function drawNamedPaintedBolt(ctx,bolt,clock=0,options={}){
 if(bolt.friendly===false||bolt.hostile)return false;
 const id=idFor(bolt),shape=weapons[id];
 if(!shape||!(bolt.r>0))return false;
 ctx.save();
 ctx.translate(bolt.x,bolt.y);
 ctx.rotate(Math.atan2(bolt.vy||0,bolt.vx||1));
 const painted=drawSkillSprite(ctx,id,-bolt.r*.52,0,bolt.r*shape[0],bolt.r*shape[1],{
  clock:animationClock(clock,options),opacity:.97
 });
 ctx.restore();
 return painted;
}

export function drawNamedPaintedEffect(ctx,effect,clock=0,options={}){
 if(effect.friendly===false||effect.hostile)return false;
 const id=idFor(effect),progress=progressOf(effect),motion=animationClock(clock,options);
 const linked=Number.isFinite(effect.x2)&&Number.isFinite(effect.y2);
 const r=Math.max(12,effect.r||0);
 if(fields[id]){
  if(!['field','impact'].includes(effect.visual))return false;
  return drawSkillSprite(ctx,id,effect.x,effect.y-r*.18,r*1.26,r*1.44,{
   clock:motion+progress*.21,opacity:(1-progress)*.54
  });
 }
 if(weapons[id]){
  if(effect.visual!=='impact')return effect.visual==='cast'||effect.visual==='release';
  ctx.save();
  ctx.translate(effect.x,effect.y);
  ctx.rotate((effect.angle??0)+progress*.38);
  const painted=drawSkillSprite(ctx,id,0,0,r*2.45,r*1.65,{
   clock:motion,opacity:Math.min(.94,(1-progress)*1.9)
  });
  ctx.restore();
  return painted;
 }
 const shape=melee[id];
 if(!shape)return false;
 const dx=linked?effect.x2-effect.x:0,dy=linked?effect.y2-effect.y:0;
 const reach=linked?Math.max(r,Math.hypot(dx,dy)*.6):r;
 const centered=effect.visual==='impact'&&hasTargetImpact(effect);
 const direction=id==='b_execute'&&centered?0:linked?Math.atan2(dy,dx):effect.angle??effect.a??0;
 ctx.save();
 ctx.translate(effect.x+dx*.5,effect.y+dy*.5);
 ctx.rotate(direction);
 const painted=drawSkillSprite(ctx,id,linked||centered?0:reach*shape[2],centered?0:-reach*.09,reach*shape[0],reach*shape[1],{
  progress,clock:motion,opacity:Math.min(1,(1-progress)*2.5),blend:id==='b_flurry'&&options.detail==='full'
 });
 ctx.restore();
 return painted;
}
