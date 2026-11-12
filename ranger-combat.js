import {beamBoundingRadius,circleInBeam} from './combat-geometry.js?v=108';
import {autoSkill,skillLoadout,skillCategory,skillManaCost,resourceCost} from './model.js?v=140';
import {MAX_AILMENT_DURATION} from './elemental-rules.js?v=108';
import {playerAimPlacement} from './aiming.js?v=108';
import {skillWeaponCompatible} from './skill-weapon-rules.js?v=129';
import {skillCue} from './combat-vfx.js?v=123';
import {ageInheritedBasic,updateInheritedBasic} from './basic-attack-combat.js?v=129';
import {summonStrike} from './summon-pose.js?v=127';
import {addPoisonStack,addPoisonFog,poisonBudget,MAX_POISON_FIELDS} from './poison-stacks.js?v=108';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const triggerOrigin=effect=>({...effect.triggerKey?{triggerKey:effect.triggerKey,stamp:effect.stamp,triggerScale:effect.triggerScale??1}:{},...effect.minion||effect.actor?{minion:true}:{}});
// Cached, finite ground effects and actor state. All damage returns to Game.hit.
export class RangerCombat{
 constructor(game){this.g=game;this.time=0;this.traps=[];this.clouds=[];this.refresh();}
 refresh(){this.support={...this.g.baseS.rangerSupport};}
 reconcile(){const g=this.g,valid=f=>(f.triggerKey?g.triggerStamp(f.triggerKey)!==null&&f.stamp===g.triggerStamp(f.triggerKey):g.ability(f.source)&&f.stamp===g.skillStamp(f.source))&&(!f.actor||g.summons.includes(f.actor)&&f.actor.hp>0);this.traps=this.traps.filter(valid);this.clouds=this.clouds.filter(valid);for(const a of g.summons)if(a.kind==='mirror_clone'){a.maxMana=g.s.ringMirrorMana??g.s.mana;a.mana=Math.min(a.mana??a.maxMana,a.maxMana);if(a.channel&&!this.copyable(g.ability(a.channel.id)))a.channel=null;}}
 targets(center,r,max=8){return this.g.enemies.filter(e=>e.hp>0&&distance(e,center)<=r+e.r).sort((a,b)=>distance(a,center)-distance(b,center)).slice(0,max);}
 turretTarget(trap){
  const range=trap.spec.range||300;
  if(trap.source!=='a_sentry')return this.targets(trap,range,1)[0];
  const candidates=this.targets(trap,range,Infinity),time=this.g.gameplay.time;
  return candidates.find(enemy=>enemy.trapExposed>time)??candidates[0];
 }
 place(def,actor=null,context={}){const g=this.g,spec=def.trap,p=actor||g.player,target=g.nearest(p),duration=spec.duration||10,source=def.id;while(this.traps.filter(t=>t.source===source).length>=(spec.maxCount||4)){this.traps.splice(this.traps.findIndex(t=>t.source===source),1);}if(this.traps.length>=8)this.traps.shift();const reach=def.designV29?(spec.range||220):Infinity,n=target?distance(p,target):0,ratio=n>reach?reach/n:1,aim=playerAimPlacement(g,Number.isFinite(reach)?reach:g.trapPlacementRange(def),{...def,...context,...(actor?{actor}:{})},p);const placed=g.placeActor({visual:'trap',friendly:true,visualDamageType:def.damageType||'physical',r:def.radius||spec.triggerRadius||35,source,stamp:g.skillStamp(source),actor,mode:spec.mode,armed:false,age:0,t:duration,max:duration,tick:0,color:def.color,def:{...def},spec:{...spec}},aim?.x??(target?p.x+(target.x-p.x)*ratio:p.x),aim?.y??(target?p.y+(target.y-p.y)*ratio:p.y));this.traps.push(placed);g.fx(placed.x,placed.y,placed.r,def.color,'ring',.36,skillCue(def,'trap'));}
 cloud(center,source,rawRate,context={}){const g=this.g,duration=this.support.cloudDuration||3,field={x:center.x,y:center.y,visual:'field',friendly:true,visualDamageType:'poison',r:Math.min(240,(this.support.cloudRadius||90)*(1+Math.max(0,Math.min(1.5,g.s.skillArea||0)))),t:duration,max:duration,tick:.5,rawRate,source,stamp:g.skillStamp(source),color:'#9ab969',...context},existing=context.triggerKey?this.clouds.find(c=>c.triggerKey===context.triggerKey):null;g.gameplay?.uniques.cloud(field);if(existing){const tick=existing.tick;Object.assign(existing,field,{tick});return existing;}if(this.clouds.length>=MAX_POISON_FIELDS)this.clouds.shift();this.clouds.push(field);return field;}
 poisonDuration(duration){return Math.min(MAX_AILMENT_DURATION,duration*(1+(this.g.s.ailmentDuration||0)+(this.g.s.poisonDurationBonus||0)));}
 poison(enemy,source,rawRate,duration,inherited=false,origin={}){
  if(!Number.isFinite(rawRate)||rawRate<=0||!(duration>0))return false;
  const rate=this.g.mitigateDot(rawRate,'poison',enemy,origin);
  if(!(rate>0))return false;
  enemy.dots??={};
  const key=origin.poisonFog?'ranger:fog'+(origin.triggerKey?':'+origin.triggerKey:''):inherited?'ranger:spread':origin.triggerKey?'ranger:'+source+':'+origin.triggerKey:'ranger:'+source,old=enemy.dots[key],time=this.poisonDuration(duration);
  if(origin.poisonFog)return addPoisonFog(enemy,key,{damageType:'poison',rawRate,rate,time,source,rangerPoison:true,inherited,...origin});
  if(!inherited&&!origin.triggerKey)return addPoisonStack(enemy,key,{rawRate,rate,time},this.g.s.poisonStackLimit||5,{source,rangerPoison:true,inherited:false,...origin});
  if(!old||rate>old.rate)enemy.dots[key]={damageType:'poison',rawRate,rate,time,source,rangerPoison:true,inherited,...origin};
  else if(old.rate===rate||(!old.triggerKey&&!origin.triggerKey))old.time=Math.max(old.time,time);
  return true;
 }
 onHit(enemy,amount,options){
  if(!options.rangerPoison||options.dot||options.setSecondary)return;const g=this.g,source=options.id||options.ability||'r_poisonarrow',fraction=options.poisonFraction||0,s=options.actorStats||g.s,inherited=!!options.clone,packet={damageType:'poison',skill:true,tag:'attack',indirect:true,dot:true,...(inherited?{clone:true,minion:true,inheritance:options.inheritance,actorStats:s}:{})},raw=g.damagePacket(s.atk*fraction,packet).total;
  if(options.castId&&!options.triggerKey){const key=source+':'+options.castId;enemy.poisonCasts??=[];if(enemy.poisonCasts.includes(key))return;enemy.poisonCasts.push(key);if(enemy.poisonCasts.length>16)enemy.poisonCasts.shift();}
  if(fraction)this.poison(enemy,source,raw,options.poisonDuration||3,inherited,triggerOrigin({...options,stamp:options.stamp??g.triggerStamp(options.triggerKey)}));
  if(options.poisonCloud&&(!options.designV29||options.triggered)&&(!options.indirect||inherited)){enemy.rangerCloudReady??={};const key=source+(inherited?':clone':'')+(options.triggerKey?':'+options.triggerKey:'');if((enemy.rangerCloudReady[key]||0)<=this.time){enemy.rangerCloudReady[key]=this.time+1;const rate=g.damagePacket(s.atk*(this.support.cloudDamage||.25)*(options.triggerScale??1),packet).total;this.cloud(enemy,source,rate,{actor:options.actor||null,inherited,...(options.triggerKey?{triggerKey:options.triggerKey,stamp:options.stamp??g.triggerStamp(options.triggerKey),triggerScale:options.triggerScale??1,triggered:true}:{})});}}
 }
 onKill(enemy){
  if(enemy.rangerDeathProcessed)return;enemy.rangerDeathProcessed=true;
  const own=Object.values(enemy.dots||{}).filter(d=>d.rangerPoison&&!d.inherited&&!d.poisonFog&&poisonBudget(d)>0);
  if(!own.length)return;
  const strongest=own.reduce((a,b)=>poisonBudget(a,true)>poisonBudget(b,true)?a:b),g=this.g,
   radius=Math.min(260,(this.support.poisonBurstRadius||100)*(1+Math.max(0,Math.min(1.5,g.s.skillArea||0)))),
   targets=this.targets(enemy,radius),spread=strongest.triggerKey?3:this.support.poisonSpreadTargets??0,
   recipients=targets.filter(e=>!e.immunities?.includes('poison')||g.mitigateDot(1,'poison',e,triggerOrigin(strongest))>0).slice(0,spread);
  for(const e of recipients){
   if(strongest.triggerKey){this.poison(e,strongest.source,strongest.rawRate,Math.min(4,this.support.poisonSpreadDuration||4),true,triggerOrigin(strongest));continue;}
   const budget=own.filter(d=>!d.triggerKey).reduce((sum,d)=>sum+poisonBudget(d,true),0)*.5/recipients.length,
    duration=Math.min(3,Math.max(0,strongest.time)),actual=this.poisonDuration(duration),old=e.dots?.['ranger:spread'];
   if(budget<=0||actual<=0||old&&poisonBudget(old,true)>=budget)continue;
   if(old)delete e.dots['ranger:spread'];this.poison(e,strongest.source,budget/actual,duration,true);
  }
  for(const e of targets)g.hit(e,g.s.atk*(strongest.triggerKey?.6:this.support.poisonBurst??0)*(strongest.triggerScale??1),true,{damageType:'poison',ability:strongest.source,noCrit:true,indirect:true,setSecondary:true,...triggerOrigin(strongest)});
  g.fx(enemy.x,enemy.y,radius,'#99b85f','burst',.4,skillCue({id:strongest.source,damageType:'poison'},'impact',{sprite:'poison-cloud'}));
 }
 update(dt){this.time+=dt;const g=this.g;this.traps=this.traps.filter(t=>!t.actor||t.actor.hp>0&&g.summons.includes(t.actor));this.clouds=this.clouds.filter(c=>!c.actor||c.actor.hp>0&&g.summons.includes(c.actor));for(const t of this.traps){const live=Math.min(dt,t.t),previousAge=t.age;t.t-=dt;t.age+=live;if(t.t<=0)continue;t.armed=t.age+1e-8>=(t.spec.armTime||.4);if(!t.armed)continue;const options={...t.def,ability:t.source,indirect:true,trapHit:true,noCrit:true,...(t.actor?this.context(t.actor):{})},damage=g.s.atk*t.def.damage;if(t.mode==='turret'){if(t.forceTrigger){const targets=this.targets(t,180,t.def.m10?3:1);for(const e of targets)g.hit(e,damage*.5,true,options);g.fx(t.x,t.y,180,t.color,'burst',.34,skillCue(options,'impact'));t.t=0;continue;}const armedTime=Math.max(0,t.age-Math.max(previousAge,t.spec.armTime||.4));t.tick-=armedTime;let shots=0;while(t.tick<=1e-8&&shots++<4){const e=this.turretTarget(t);if(!e){t.tick=0;break;}t.tick+=t.spec.interval||.75;t.visualAngle=Math.atan2(e.y-t.y,e.x-t.x);g.shoot(t.x,t.y,t.visualAngle,480,damage,t.color,t.def.m3&&!(t.shots||0)?1:0,5,false,{...options,skill:true});t.shots=(t.shots||0)+1;}}else if(t.forceTrigger||this.targets(t,t.spec.triggerRadius||75,1).length){for(const e of this.targets(t,t.r)){g.hit(e,damage,true,options);if(t.def.slow){e.auraDebuffs??={};e.auraDebuffs['trap:'+t.source]={slow:t.def.slow,t:t.def.slowDuration||3};g.aggregateAuraDebuffs(e);}if(t.def.stun)e.stun=Math.max(e.stun||0,t.def.stun);}if(t.spec.cloud){const rate=g.damagePacket((options.actorStats||g.s).atk*(this.support.cloudDamage||.25),{...options,damageType:'poison',skill:true,dot:true,indirect:true}).total;this.cloud(t,t.source,rate,{actor:t.actor||null,inherited:!!t.actor});}g.fx(t.x,t.y,t.r,t.color,'burst',.4,skillCue(options,'impact'));g.gameplay?.onTrapTriggered(t);t.t=0;}}
 this.traps=this.traps.filter(t=>t.t>0);for(const c of this.clouds){const live=Math.min(dt,c.t);c.t-=live;c.tick-=live;if(c.tick<=1e-8){c.tick+=.5;for(const e of this.targets(c,c.r))this.poison(e,c.source,c.rawRate,Math.max(.5,Math.min(1,c.t+.5)),!!c.actor||!!c.inherited,{...triggerOrigin(c),poisonFog:true});}}this.clouds=this.clouds.filter(c=>c.t>0);}
 context(actor,stats=this.actorStats(actor)){return {actor,actorStats:stats,clone:true,minion:true,inheritance:actor.inheritance*(actor.singleMode?2:1),indirect:true,origin:actor};}
 modifiers(actor){const out={};for(const effect of actor.effects||[]){const owner=this.g.skillEffects.find(e=>e.id===effect.id&&e.t>0);for(const [key,value]of Object.entries(effect.buff||{}))out[key]=(out[key]||0)+Math.max(0,value-(owner?.buff?.[key]||0));}return out;}
 actorStats(actor){const s={...this.g.s};for(const [key,value]of Object.entries(this.modifiers(actor))){if(key==='atkPct')s.atk+=this.g.baseS.atk*value;else if(typeof s[key]==='number')s[key]+=value;}return s;}
 copyCost(def,stats){
  if(this.g.c.cls!=='wanderer')return skillManaCost(def,stats);
  const manaStats={...stats,resourceClass:'wanderer',bloodSpell:false,bloodAura:false};
  const cost=resourceCost(def,manaStats);
  return cost.life>0||cost.rage>0?Infinity:cost.mana;
 }
 // Shadow combos and veil operate on the player, so mirror casts cannot execute them.
 copyable(def){return !!def&&!def.shadowV70&&skillWeaponCompatible(this.g.c,def)&&['damage','curse','warcry'].includes(skillCategory(def))&&!['dash','summon','aura'].includes(def.type);}
 updateClone(actor,dt){const g=this.g;ageInheritedBasic(g,actor,dt);actor.maxMana=g.s.ringMirrorMana??g.s.mana;actor.mana=Math.min(actor.maxMana,(actor.mana??actor.maxMana)+(g.s.ringMirrorRegen??g.s.manaRegen)*(1+(actor.summonSpec?.manaRegenBonus||0))*dt);actor.cooldowns??={};actor.effects=(actor.effects||[]).filter(e=>(e.t-=dt)>0);if(actor.ownShieldKey&&!actor.effects.some(e=>e.id===actor.ownShieldKey))actor.ownShield=0;const actorS=this.actorStats(actor);actor.hp=Math.min(actor.maxHp,actor.hp+(actorS.lifeRegen||0)*dt);for(const id of Object.keys(actor.cooldowns))actor.cooldowns[id]=Math.max(0,actor.cooldowns[id]-dt);actor.castCD=Math.max(0,(actor.castCD||0)-dt);actor.cd=Math.max(0,(actor.cd||0)-dt);const target=g.nearest(actor);
 if(!target){g.minionCombat.move(actor,null,dt);return;}
 const d=distance(actor,target),follow=distance(actor,g.player);if(follow>100||d>230){const dest=follow>220?g.player:target;g.approachActor(actor,dest,g.s.speed*dt,90);}if(actor.channel){const ch=actor.channel,def=g.ability(ch.id);if(!this.copyable(def)||!this.configured().includes(ch.id)){actor.channel=null;}else{ch.timer-=dt;let count=0;while(ch.timer<=1e-8&&count++<4){const s=this.actorStats(actor),cost=this.copyCost(def,s);if(actor.mana<cost){actor.channel=null;break;}actor.mana-=cost;const interval=Math.max(.08,def.interval/Math.max(.25,s[def.speedStat]||1));ch.timer+=interval;this.channel(actor,def,target,s); }if(actor.channel)return;}}
 if(actor.castCD<=0)for(const id of this.configured()){const def=g.ability(id);if(!this.copyable(def)||(actor.cooldowns[id]||0)>0||d>g.abilityReach(def)+target.r)continue;const s=this.actorStats(actor),cost=this.copyCost(def,s);if(actor.mana+1e-8<cost)continue;if(def.type==='channel'){actor.channel={id,timer:0};return this.updateClone(actor,0);}actor.mana-=cost;actor.cooldowns[id]=def.cooldown*(1-s.cdr);actor.castCD=.45/Math.max(.25,def.cls==='mage'?s.castSpeed:s.haste);summonStrike(actor,target,g.clock,def.cls==='mage'?'cast':'weapon');g.performAbility(def,this.context(actor,s));return;}
 updateInheritedBasic(g,actor,dt,target,this.context(actor,actorS));}
 configured(){const g=this.g;return [...new Set([...(g.c.autoEnabled!==false?[autoSkill(g.c)]:[]),...skillLoadout(g.c)].filter(Boolean))];}
 channel(actor,def,target,s){const g=this.g;summonStrike(actor,target,g.clock,def.cls==='mage'?'cast':'weapon');const angle=Math.atan2(target.y-actor.y,target.x-actor.x),options={...def,...this.context(actor),ability:def.id},beam=['flame','frost'].includes(def.mode),reach=beam?beamBoundingRadius(def.length,def.width):def.radius||300;for(const e of this.targets(actor,reach)){if(beam?(circleInBeam(actor,angle,def.length,def.width,e)):distance(actor,e)<=def.radius+e.r)g.hit(e,s.atk*def.damage*(def.id==='w_whirl'?s.whirl:1),true,options);}g.fx(actor.x,actor.y,def.radius||0,def.color,beam?'channel-flame':'channel-whirl',.2,skillCue(options,beam?'beam':'melee',{a:angle,length:def.length,width:def.width}));}
}
