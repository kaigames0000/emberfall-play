import {ABILITIES} from './model.js?v=140';

const abilityId=source=>source.shadowBasic?(source.basicAttack??'weapon-basic'):source.ability??source.id??source.basicAttack??source.visualAbility;
const spritesByElement={cold:'frost-impact',fire:'flame-burst',poison:'poison-cloud'};
const targetImpactRadii={
 a_stab:38,a_execute:47,a_mirrorstrike:46,a_flurry:38,a_storm:48,b_execute:54,
 a_shuriken:17,a_kunai:20,
};

export const hasTargetImpact=source=>Object.hasOwn(targetImpactRadii,abilityId(source));

export function targetImpactCue(source,target,origin){
 const id=abilityId(source),radius=targetImpactRadii[id];
 if(!radius||source.dot||source.periodic||source.setSecondary)return null;
 const bodyRadius=target.r??16;
 const angle=Number.isFinite(source.vx)&&Number.isFinite(source.vy)
  ?Math.atan2(source.vy,source.vx):Math.atan2(target.y-origin.y,target.x-origin.x);
 return skillCue(source,'impact',{
  x:target.x,y:target.y-Math.min(44,12+bodyRadius*.65),
  r:radius*Math.max(.85,Math.min(1.28,bodyRadius/16)),
  color:source.color??ABILITIES[id]?.color??'#eadcba',angle
 });
}

function damageType(source,id){
 if(source.visualDamageType)return source.visualDamageType;
 if(source.damageTypes){
  let primary=null,weight=0;
  for(const [type,part] of Object.entries(source.damageTypes)){
   if(part>weight){primary=type;weight=part;}
  }
  if(primary)return primary;
 }
 return source.damageType??source.summon?.damageType??ABILITIES[id]?.damageType??ABILITIES[id]?.summon?.damageType??'physical';
}

export function skillCue(source,visual,geometry={}){
 const ability=abilityId(source);
 return {ability,damageType:damageType(source,ability),...(source.damageTypes?{damageTypes:source.damageTypes}:{}),friendly:true,visual,...geometry};
}

export function projectileCue(source,hostile){
 const visualAbility=abilityId(source);
 const visualDamageType=source.damageType===undefined&&hostile?'fire':damageType(source,visualAbility);
 const cls=source.cls??ABILITIES[visualAbility]?.cls;
 const weaponArrow=source.tag==='attack'&&(!visualAbility||visualAbility==='r_clone');
 const arrow=(cls==='ranger'&&visualAbility!=='r_clone')||visualAbility?.startsWith('r_basic_')||weaponArrow;
 let visual=source.visual;
 if(!visual){
  if(hostile)visual='bolt';
  else if(visualAbility==='r_eagle')visual='feather';
  else if(cls==='assassin'||visualAbility?.startsWith('a_'))visual='dagger';
  else if(arrow)visual='arrow';
  else visual=visualDamageType==='fire'||visualDamageType==='cold'?'orb':'bolt';
 }
 return {visualAbility,visualDamageType,visual,friendly:!hostile};
}

export function travelCue(source,to){
 return skillCue(source,'travel',{x2:to.x,y2:to.y});
}

export const elementalSprite=type=>spritesByElement[type];
