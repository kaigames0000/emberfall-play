import {consumePoison} from './poison-stacks.js?v=108';
import {TalentCombat} from './talent-combat.js?v=108';
import {MasteryCombat} from './mastery-combat.js?v=108';
import {UniqueCombat} from './unique-combat.js?v=108';
import {WeaponCombat} from './weapon-combat.js?v=108';
import * as M from './model.js?v=140';
import {BloodCombat} from './blood-combat.js?v=108';
import {AssassinCombat} from './assassin-combat.js?v=129';
import {pointerAimPoint,playerAimAngle,playerAimTarget,playerAimPlacement} from './aiming.js?v=108';
import {skillWeaponCompatible,skillWeaponFailure} from './skill-weapon-rules.js?v=129';
import {hasHunterMark} from './ranger-beast-combat.js?v=108';
import {skillCue,travelCue} from './combat-vfx.js?v=123';
import {movementTiming} from './hero-motion.js?v=127';
import {circleInSector} from './combat-geometry.js?v=108';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const direct=o=>!o.dot&&!o.indirect&&!o.minion&&!o.clone&&!o.periodic&&!o.triggered&&!o.aura&&!o.setSecondary;
export class GameplayRuntime{
 constructor(g){this.g=g;this.weapons=new WeaponCombat(g,this);this.blood=new BloodCombat(g);this.assassin=new AssassinCombat(g);this.uniques=new UniqueCombat(g,this);this.mastery=new MasteryCombat(this);this.talents=new TalentCombat(g,this);const onPaid=g.setCombat.onPaidDamage.bind(g.setCombat),onMove=g.setCombat.onMovement.bind(g.setCombat);g.setCombat.onPaidDamage=(def,cost)=>{onPaid(def,cost);this.talents.paid(def,cost);g.ringCombat.paidSpell(def,this.blood.receipts.get(def?.castId));};g.setCombat.onMovement=(...args)=>{onMove(...args);this.talents.onMovement();};this.sequence=0;this.time=0;this.comboUntil=0;this.formUntil=0;this.zones=[];this.once=new Map();this.focus=null;this.focusStacks=0;this.resonanceAt=0;this.avatarWas=false;this.carryForm=false;this.rollWindow=0;this.nextPierce=false;this.nextPoisonFog=false;this.quickCharge=false;const move=g.minionCombat.movementTarget.bind(g.minionCombat);g.minionCombat.movementTarget=(a,dt)=>a.focusTarget?.hp>0&&a.kind==='shadow_clone'?a.focusTarget:move(a,dt);}
 get followups(){return this.weapons.followups;}
 channelInterval(def){const stance=M.dualState(this.g.c);return Math.max(.08,def.interval*(stance.mode==='single-twohand'?1.2:1)/Math.max(.25,this.g.s[def.speedStat]||1));}
 usable(){const g=this.g;return g.mode==='playing'&&!g.paused&&!g.transition&&!g.training?.finished;}
 targets(r=150,center=this.g.player,max=12){return this.g.damageables().filter(e=>e.hp>0&&dist(e,center)<=r+e.r).sort((a,b)=>dist(a,center)-dist(b,center)).slice(0,max);}
 oncePer(key,cast){if(!cast)return true;const id=key+':'+cast;if(this.once.has(id))return false;this.once.set(id,this.time);return true;}
 cast(id,source='manual'){
  const g=this.g,def=g.ability(id);if(!def)return false;if(def.type==='aura')return g.toggleAura(def);
  if(g.channel?.id===id&&source==='manual'){if(def.type==='charge')return this.releaseCharge();g.channel=null;return true;}
  const available=g.skillAvailability(id,{source});if(!available.usable){g.skillError=available.reason;return false;}
  if(def.type==='dash'&&id==='a_blink'){if(this.assassin.charges<1||this.assassin.lock>0)return false;const to=this.assassin.landing(def);if(!to){g.skillError='找不到安全落點';return false;}const receipt=this.blood.pay(def,++this.sequence);if(!receipt){g.skillError='資源不足';return false;}this.assassin.blink(def,to);g.setCombat.onPaidDamage(def,receipt.mana||0);g.emit('cast');return true;}
  if((g.skillCooldowns[id]||0)>0)return false;
  if(def.type==='channel'){const interval=this.channelInterval(def),receipt=this.blood.pay(def,++this.sequence,interval);if(!receipt){g.skillError='生命或魔力不足';return false;}g.channel={id,source,timer:interval,stamp:g.skillStamp(id)};this.channelHit(def,receipt);g.emit('cast');return true;}
  const receipt=this.blood.pay(def,++this.sequence);if(!receipt){g.skillError='生命、魔力或狂怒不足';g.notifyMana();return false;}
  if(def.type==='charge'){g.setCombat.onPaidDamage(def,receipt.mana);g.channel={id,source,timer:0,charge:0,castId:receipt.id,stamp:g.skillStamp(id)};g.fx(g.player.x,g.player.y,31,def.color,'ring',.38,skillCue(def,'charge',{angle:playerAimAngle(g,def)}));g.emit('cast');return true;}
  g.skillCooldowns[id]=g.skillCooldown(def);
  this.perform({...def,castId:receipt.id,rageSpent:receipt.spent});g.setCombat.onPaidDamage({...def,castId:receipt.id},receipt.mana);g.autoCastCD=.4/Math.max(.25,g.s.haste);g.syncCooldowns();g.emit('cast');return true;
 }
 channelHit(def,receipt){this.assassin.beginOffense(def);const g=this.g,options={...def,castId:receipt.id,ability:def.id,tag:'attack'};g.setCombat.onPaidDamage(def,receipt.mana||0);this.weapons.strike(def,options,g.player,{channel:true});if(def.m3&&this.sequence%3===0){const target=g.nearest();if(target&&dist(target,g.player)>60){g.approachActor(g.player,target,10);}}}

 channel(dt){const g=this.g,ch=g.channel;if(!ch)return false;const def=g.ability(ch.id);if(!def?.designV29)return null;if(!skillWeaponCompatible(g.c,def)){g.channel=null;return false;}if(def.type==='charge'){ch.charge+=dt;const need=Math.max(.35,(def.chargeTime||.9)/(g.s.haste||1)*(this.quickCharge?.6:1));if(['auto','tap'].includes(ch.source)&&ch.charge>=need)this.releaseCharge();return true;}if(def.type!=='channel')return false;ch.timer-=dt;let ticks=0;while(g.channel===ch&&ch.timer<=0&&ticks++<3){const interval=this.channelInterval(def),r=this.blood.pay(def,++this.sequence,interval);if(!r){g.channel=null;g.autoCastCD=.25;return false;}ch.timer+=interval;this.channelHit(def,r);}return true;}
 releaseCharge(){const g=this.g,ch=g.channel,def=ch&&g.ability(ch.id);if(!def||def.type!=='charge')return false;g.channel=null;const failure=skillWeaponFailure(g.c,def);if(failure){g.skillError=failure;return false;}const duration=Math.max(.35,(def.chargeTime||.9)/(g.s.haste||1)),power=clamp(ch.charge/duration,.15,1);this.quickCharge=false;this.perform({...def,type:'projectile',damage:def.damage*(.35+.65*power),pierce:def.pierce+(def.m3&&power>=.99?1:0),castId:ch.castId,fullCharge:power>=.99});g.skillCooldowns[def.id]=g.skillCooldown(def);g.autoCastCD=.25;return true;}
 perform(def,context={}){
  def=this.mastery.prepare(this.uniques.prepare(def));const g=this.g,id=def.id,options={...def,...context,ability:id,castId:def.castId||++this.sequence,tag:'attack'},p=context.actor||g.player,target=playerAimTarget(g,Infinity,options,p);
  this.assassin.beginOffense(def,context);if(this.assassin.performShadow(def,context))return;
   if(g.c.cls==='wanderer'&&def.type==='dash'&&!context.triggered&&!context.actor)this.rollWindow=this.time+2;
  if(id==='a_blink'){const to=this.assassin.landing(def);if(to)this.assassin.blink(def,to);return;}
  if(id==='b_leap'){const from={...p},a=Math.hypot(g.input.x,g.input.y)>.1?Math.atan2(g.input.y,g.input.x):target?Math.atan2(target.y-p.y,target.x-p.x):p.angle,range=Math.min(def.distance,target?dist(p,target):def.distance),to=playerAimPlacement(g,def.distance,options,p)||g.clampWorldPoint(p.x+Math.cos(a)*range,p.y+Math.sin(a)*range);g.setCombat.onMovement(from);if(g.canLand(to.x,to.y))Object.assign(p,to);else g.moveActor(p,to.x-p.x,to.y-p.y,false);this.weapons.strike(def,options,p,{landing:true});g.fx(from.x,from.y,30,def.color,'burst',.25,skillCue(def,'cast',{angle:a}));const {duration,travelDelay,landingDelay}=movementTiming(id);g.fx(from.x,from.y,0,def.color,'lightning',duration+.14,{...travelCue(def,p),motionDuration:duration,delay:travelDelay});g.fx(p.x,p.y,def.radius,def.color,'shock',landingDelay+.27,skillCue(def,'landing',{angle:Math.atan2(p.y-from.y,p.x-from.x),delay:landingDelay}));if(def.m6)this.comboUntil=this.time+2;if(g.ability('b_guardcry')?.m6)for(const debt of this.blood.debts)if(!debt.extended){debt.t+=1;debt.extended=true;}return;}
  if(['b_cleave','b_execute'].includes(id)){this.weapons.strike({...def,damage:def.damage*(def.rageSpent?1.3:1),radius:(def.radius||120)+(id==='b_cleave'&&(this.avatarWas&&g.ability('b_avatar')?.m3||this.carryForm||g.auraIds.has('b_bloodaura')&&(g.hp<g.s.hp*.35||this.formUntil>this.time))?35:0)},options,p);if(id==='b_cleave')this.carryForm=false;return;}
  if(['a_stab','a_execute','a_mirrorstrike'].includes(id)){
   const r=def.radius||120,halfArc=1.5,angle=playerAimAngle(g,options,p);
   const aimedExecute=id==='a_execute'&&pointerAimPoint(g,options,p);
   const chosen=aimedExecute?playerAimTarget(g,r,options,p):null;
   const targets=aimedExecute?(chosen?[chosen]:[]):this.targets(r,p,Infinity);
   p.angle=angle;
   const hits=targets.filter(e=>circleInSector(p,angle,r,halfArc,e)).slice(0,id==='a_execute'?1:5);
   for(const e of hits)g.hit(e,g.s.atk*def.damage*(def.rageSpent?1.3:1),true,{...options});
   g.fx(p.x,p.y,r,def.color,'slash',.25,skillCue(options,'melee',{angle,halfArc}));
   return;
  }
  if(id==='b_guardcry'&&def.m3)g.playerSlow=1;
  if(id==='b_ritual'&&def.m10&&g.c.talents.b_avatar)this.comboUntil=this.time+2;
  if(id==='r_dash'){if(g.channel&&g.ability(g.channel.id)?.type==='charge'&&!def.m6)g.channel=null;const old=g.invuln;this.originalPerform(def,context);g.invuln=Math.max(old,Math.min(.15,g.invuln));this.rollWindow=this.time+2;this.galeReady=true;if(def.m10)for(const h of g.hazards)if(h.friendly&&h.ability==='r_rain'&&!h.rollMoved){h.rollMoved=true;Object.assign(h,g.clampWorldPoint(h.x+(g.input.x||0)*45,h.y+(g.input.y||0)*45));}return;}
  if(def.type==='charge'){this.originalPerform({...def,type:'projectile'},context);return;}
  let prepared={...def};
  if(def.type==='projectile'){prepared.speed=(def.speed||650)*(1+(g.s.projectileSpeed||0));if(def.m3&&id==='r_ricochet')prepared.chain={...def.chain,jumps:Math.min(7,def.chain.jumps+1)};if(def.m6&&id==='r_ricochet')prepared.chain={...prepared.chain,range:Math.min(400,prepared.chain.range+35)};if(id==='r_pierce'&&this.nextPierce){prepared.pierce++;this.nextPierce=false;}if(id==='r_volley'&&(def.m6||g.ability('r_dash')?.m3)&&this.rollWindow>this.time)prepared.spread=.075;}
  if(def.trap){prepared.trap={...def.trap,duration:Math.min(20,def.trap.duration*(1+(g.s.trapDuration||0))),maxCount:Math.min(5,def.trap.maxCount+(g.s.trapCapacity||0)),armTime:Math.max(.1,def.trap.armTime/(1+(g.s.trapSetup||0))),range:g.trapPlacementRange(def)};prepared.radius=Math.min(250,def.radius*(1+(g.s.trapArea||0)));prepared.damage*=Math.max(.2,1+(g.s.trapDamage||0));}
  this.originalPerform(prepared,{...context,castId:options.castId});this.mastery.afterPerform(prepared);
 }
 beforeHit(e,amount,skill,o){
  const g=this.g,id=o.id||o.ability,def=g.ability(id),isDirect=direct(o);amount=this.talents.beforeHit(e,amount,skill,o);amount=this.mastery.beforeHit(e,this.uniques.beforeHit(e,amount,skill,o),o);amount=this.assassin.trapPinDamage(e,amount,o);if(isDirect){if((!id||id.startsWith('b_')||['a_stab','a_execute','a_mirrorstrike','a_flurry','a_storm'].includes(id))&&M.weaponDefinition(g.c.equipment.weapon,g.c.cls).kind==='melee')amount*=g.s.weaponDamageScale||1;amount*=this.assassin.beforeHit(e,o);if(g.hp<=g.s.hp*.35)amount*=1+(g.s.lowLifeDamage||0);if(g.s.directDamage)amount*=Math.max(.1,1+g.s.directDamage);if(g.s.markedDamage&&hasHunterMark(e))amount*=1+g.s.markedDamage;if(this.focus===e)this.focusStacks=Math.min(5,this.focusStacks+1);else{this.focus=e;this.focusStacks=0;}amount*=1+(g.s.focusDamage||0)*this.focusStacks/5;if(e.concord&&g.c.talents.a_concord){amount*=1.12;e.concord=false;}}
  if(o.vx!==undefined){amount*=Math.max(.2,1+(g.s.projectileDamage||0)+(dist(o.origin||g.player,e)>230?g.s.farDamage||0:0));}
  if(id==='r_rain'&&Object.values(e.dots||{}).some(d=>d.rangerPoison&&!d.inherited)){o.damageTypes={physical:.5,poison:.5};o.rangerPoison=true;o.poisonFraction=.1;o.poisonDuration=1.5;}
  if(o.trapHit&&e.trapExposed>this.time)amount*=1.12;
  if(id==='b_cleave'&&this.comboUntil>this.time&&def?.m6)this.bleed(e,amount*.12,3,id);
  return amount;
 }
 bleed(e,raw,duration,source){const g=this.g,packet=g.damagePacket(raw,{skill:true,damageType:'physical',dot:true,indirect:true,bleed:true}),rate=g.mitigateDot(packet.total,'physical',e);e.dots??={};const key='physical:bleed',old=e.dots[key];if(!old||old.rate<rate)e.dots[key]={damageType:'physical',source,rawRate:packet.total,rate,time:Math.min(6,duration)};else old.time=Math.min(6,Math.max(old.time,duration));}
 secondary(e,amount,type,id){if(e.hp>0)this.g.hit(e,amount,true,{ability:id,damageType:type,indirect:true,setSecondary:true,noCrit:true});}
 afterHit(e,o,lifeLost){
  const g=this.g,id=o.id||o.ability,def=g.ability(id),isDirect=direct(o),hadBloodMark=e.bloodMarkUntil>this.time;
  const harvest=id==='b_execute'&&def?.m3&&isDirect&&hadBloodMark;
  if(harvest)e.bloodMarkUntil=0;
  this.talents.afterHit(e,o);this.weapons.afterHit(e,o);this.uniques.afterHit(e,o);this.mastery.afterHit(e,o,harvest);if(id==='a_clone'&&g.c.talents.a_concord)e.concord=true;if(isDirect)this.blood.onHit(o,lifeLost);this.assassin.afterHit(e,o);if(!def?.designV29||!isDirect)return;
  if(id==='b_leap'&&this.leapCombo){this.leapCombo=false;this.comboUntil=this.time+2;}if(g.c.talents.r_gale&&this.galeReady&&this.rollWindow>this.time&&['r_volley','r_ricochet'].includes(id)){const m=e.auraDebuffs?.['curse:r_mark'];if(m&&!m.transferred){const other=this.targets(180,e,4).find(t=>t!==e&&!t.auraDebuffs?.['curse:r_mark']);if(other){this.galeReady=false;m.transferred=true;other.auraDebuffs??={};other.auraDebuffs['curse:r_mark']={...m,t:Math.min(3,m.t),transferred:true};g.aggregateAuraDebuffs(other);}}}
  if(id.startsWith('b_')){
   if(id==='b_execute'){
    if(harvest&&this.oncePer('harvest',o.castId))for(const other of this.targets(110,e,3))if(other!==e)this.secondary(other,g.s.atk*.35,'physical',id);
    if(g.c.talents.b_hunt&&o.rageSpent)this.leapCombo=true;
   }else{
    const baseExpiry=this.time+4;
    e.bloodMarkUntil=id==='b_flurry'&&def.m6&&hadBloodMark?Math.min(this.time+6,Math.max(baseExpiry,e.bloodMarkUntil+.2)):baseExpiry;
    if(id==='b_cleave'&&def.m3&&hadBloodMark&&!o.dualFollowup)this.comboUntil=this.time+2;
   }
   if(g.c.talents.b_resonance&&this.blood.rage>=80&&this.time>=this.resonanceAt&&this.oncePer('resonance',o.castId)){this.blood.rage-=10;this.resonanceAt=this.time+1;for(const other of this.targets(135,g.player,6))this.secondary(other,g.s.atk*.25,'physical',id);}
   if(g.ability('b_bloodaura')?.m3)this.formUntil=this.time+2;
  }
  if(id==='a_stab'){if(def.m3&&dist(g.player,e)>85){const n=dist(g.player,e);g.moveActor(g.player,(e.x-g.player.x)/n*15,(e.y-g.player.y)/n*15,false);}if(def.m6&&(e.shadowMarks||0)>=3)this.bleed(e,g.s.atk*.15,3,id);if(def.m10&&e.shadowMarks===3&&e.dots?.['physical:bleed']&&!e.dots['physical:bleed'].stabExtended){e.dots['physical:bleed'].stabExtended=true;e.dots['physical:bleed'].time=Math.min(6,e.dots['physical:bleed'].time+.25);}}
  if(id==='a_execute'){if(def.m3&&o.consumedMarks===3&&e.dots?.['physical:bleed'])e.dots['physical:bleed'].time=Math.min(6,e.dots['physical:bleed'].time+1);if(def.m10&&o.consumedMarks===3&&this.oncePer('execute',o.castId))this.secondary(e,g.s.atk*.5,'physical',id);}
  if(id==='a_mirrorstrike'){const ally=g.summons.find(a=>a.source==='a_clone');if(ally&&def.m6&&e.shadowMarks>0)ally.focusTarget=e;if(def.m3&&this.oncePer('mirror-splash',o.castId))for(const other of this.targets(80,e,3))if(other!==e)this.secondary(other,g.s.atk*.2,'physical',id);}
  if(['r_pierce','r_volley','r_snipe','r_ricochet'].includes(id)){e.arrowMarkUntil=this.time+3;const mark=e.auraDebuffs?.['curse:r_mark'];if(mark?.t>0&&g.ability('r_mark')?.m6)mark.t=Math.min(8,mark.t+.15);if(hasHunterMark(e)){if(id==='r_pierce'&&def.m6)this.nextPierce=true;if(id==='r_snipe'&&(def.m6||g.c.talents.r_precision))this.nextWave=true;}if(this.nextWave&&id==='r_pierce'&&this.oncePer('pierce-wave',o.castId)){this.nextWave=false;for(const other of this.targets(100,e,4))if(other!==e)this.secondary(other,g.s.atk*.35,'physical',id);}if(def.m10&&id==='r_volley'&&this.oncePer('side-arrows',o.castId)){const a=Math.atan2(e.y-g.player.y,e.x-g.player.x);for(const sign of [-1,1])g.shoot(e.x,e.y,a+sign*.7,500,g.s.atk*.25,def.color,0,4,false,{ability:id,indirect:true,setSecondary:true,skill:true,hit:new Set([e])});}}
  if(id==='r_burst'&&e.hp>0&&(!e.immunities?.includes('poison')||g.mitigateDot(1,'poison',e,o)>0)){
   const budget=consumePoison(e);
   if(budget>0){
    g.hit(e,budget,true,{ability:id,damageType:'poison',preScaled:true,preMitigated:true,dot:true,indirect:true,noCrit:true});
    if(def.m3)for(const other of this.targets(def.m6&&hasHunterMark(e)?150:90,e,2))if(other!==e)this.secondary(other,g.s.atk*.3,'poison',id);
    if(def.m10)this.nextPoisonFog=true;
   }
  }
  if(id==='r_poisonarrow'){if(this.nextPoisonFog&&this.oncePer('poison-fog',o.castId)){this.nextPoisonFog=false;g.rangerCombat.cloud(e,id,g.s.atk*.12,{t:1.5,max:1.5});}}
 }
 onKill(e){this.talents.onKill(e);const g=this.g;this.assassin.onKill(e);this.mastery.onKill(e);if(e.bloodMarkUntil>this.time){const ritual=g.skillEffects.find(x=>x.id==='b_ritual'&&x.t>0);if(ritual&&!ritual.extended&&g.ability('b_ritual')?.m3){ritual.t+=1;ritual.extended=true;}if(g.hp<g.s.hp*.35&&g.ability('b_bloodaura')?.m6)for(const other of this.targets(110,e,1))other.bloodMarkUntil=this.time+2;}
  const mark=e.auraDebuffs?.['curse:r_mark'];if(mark&&g.ability('r_mark')?.m3&&!mark.transferred){const other=this.targets(200,e,1)[0];if(other){other.auraDebuffs??={};other.auraDebuffs['curse:r_mark']={...mark,t:Math.min(3,mark.t),transferred:true};}}
  if(g.ability('r_poisonarrow')?.m3&&Object.values(e.dots||{}).some(d=>d.rangerPoison&&!d.inherited&&!d.poisonFog&&!d.triggerKey&&d.time>1e-8))g.rangerCombat.cloud(e,'r_poisonarrow',g.s.atk*.2,{t:3,max:3});
  if(g.ability('r_snipe')?.m10&&e.arrowChargedUntil>this.time)this.quickCharge=true;
 }
 onTrapTriggered(t){this.talents.onTrap(t);this.assassin.trapTriggered(t);this.mastery.trap(t);const g=this.g;if(t.def.m3&&t.source==='a_blades'){if(this.zones.length>=4)this.zones.shift();this.zones.push({x:t.x,y:t.y,r:t.r,t:2});}if(t.source==='a_mine'){for(const e of this.targets(t.r,t,8)){if(t.def.m3&&!['boss','miniboss'].includes(e.type)){const n=dist(e,t)||1;g.moveActor(e,(e.x-t.x)/n*25,(e.y-t.y)/n*25,false);}if(t.def.m6&&(e.auraDebuffs?.['trap:a_blades']||e.auraDebuffs?.['trap-zone']||g.c.cls==='wanderer'&&e.auraSlow>0))e.trapExposed=this.time+2;if(t.def.m10)this.secondary(e,g.s.atk*.25,'physical',t.source);}for(const turret of g.rangerCombat.traps)if(turret.source==='a_sentry'&&turret.def.m6&&dist(turret,t)<250)turret.tick=0;}}
 update(dt){this.time+=dt;this.g.ringCombat.update();this.talents.update(dt);this.weapons.update(dt);this.uniques.update(dt);this.mastery.update();this.g.endgameCombat?.update(dt);this.blood.update(dt);this.assassin.update(dt);for(const[k,t]of this.once)if(this.time-t>5)this.once.delete(k);for(const z of this.zones){z.t-=dt;for(const e of this.targets(z.r,z,12)){e.auraDebuffs??={};e.auraDebuffs['trap-zone']={slow:.25,t:.2};}}this.zones=this.zones.filter(z=>z.t>0);const avatar=this.g.skillEffects.some(e=>e.id==='b_avatar'&&e.t>0);if(this.avatarWas&&!avatar&&this.g.ability('b_avatar')?.m10)this.carryForm=true;this.avatarWas=avatar;}
}
export function installGameplay(Game){
 const P=Game.prototype,original={};for(const name of ['reset','refresh','cast','performAbility','updateAuto','beginChannel','updateChannel','dodge','movementCooldown','hit','kill','updateAuras','update','attack','applyBuffs','projectileImpact','summonDeathExplosion'])original[name]=P[name];
 P.attack=function(){this.gameplay?.assassin.beginOffense();this._talentAttackId=++this.gameplay.sequence;try{const result=this.gameplay?.weapons.attack();return result===null||result===undefined?original.attack.call(this):result;}finally{this._talentAttackId=null;}};
 P.applyBuffs=function(){const result=original.applyBuffs.call(this);if(this.baseS){const ratio=this.s.atk/Math.max(1,this.baseS.atk);this.s.offhandAtk=this.baseS.offhandAtk*ratio;this.s.summonAttackBase=this.baseS.summonAttackBase*ratio;}return result;};
 P.healValue=function(amount){return Math.min(this.s.hp,this.hp+Math.max(0,amount)*(1-clamp(this.s.healingPenalty||0,0,.5)));};
 P.reset=function(...args){original.reset.apply(this,args);this.gameplay=new GameplayRuntime(this);this.gameplay.originalPerform=original.performAbility.bind(this);this.gameplay.originalAttack=original.attack.bind(this);};
 P.refresh=function(...args){const result=original.refresh.apply(this,args);if(this.gameplay){this.gameplay.originalPerform=original.performAbility.bind(this);this.gameplay.uniques.refresh();this.gameplay.talents.refresh();}return result;};
 P.cast=function(index){const id=M.skillLoadout(this.c)[index];return this.ability(id)?.designV29?this.gameplay.cast(id,'manual'):original.cast.call(this,index);};
 P.performAbility=function(def,context={}){if(!skillWeaponCompatible(this.c,def))return false;this.gameplay?.assassin.beginOffense(def,context);if(def.designV29)return this.gameplay.perform(def,context);context={...context,castId:context.castId??def.castId??++this.gameplay.sequence};return original.performAbility.call(this,this.gameplay.uniques.prepare({...def,triggered:context.triggered||def.triggered}),context);};

 P.beginChannel=function(def,source,slot){if(!def.designV29&&this.canPayResourceCost(M.resourceCost(def,this.s)))this.gameplay?.assassin.beginOffense(def);return def.designV29?this.gameplay.cast(def.id,source):original.beginChannel.call(this,def,source,slot);};
 P.updateChannel=function(dt,initial){return this.channel&&this.ability(this.channel.id)?.designV29?this.gameplay.channel(dt):original.updateChannel.call(this,dt,initial);};
 P.projectileImpact=function(b,target){this.gameplay?.mastery.projectileImpact(b,target);return original.projectileImpact.call(this,b,target);};
 P.releaseCharge=function(){return this.gameplay.releaseCharge();};
 P.dodge=function(){const id=M.movementSkill(this.c),def=this.ability(id);const mana=this.mana,result=def?.designV29?this.gameplay.cast(id,'manual'):original.dodge.call(this);if(result){this.ringCombat.moved();if(def&&!def.designV29)this.gameplay.talents.paid(def,Math.max(0,mana-this.mana));}return result;};
 P.summonDeathExplosion=function(ally){this.gameplay?.talents.onSummonDeath(ally);return original.summonDeathExplosion.call(this,ally);};
 P.movementCooldown=function(){
  if(M.movementSkill(this.c)!=='a_blink')return original.movementCooldown.call(this);
  const {charges,lock,recharge}=this.gameplay.assassin;
  return charges?lock:Math.max(0,this.skillCooldown('a_blink')-recharge);
 };
 P.hit=function(e,amount,skill=false,options={}){if(e?.worldProp)return this.worldObjects?.hit(e,amount);if(!options.castId&&this._talentAttackId)options={...options,castId:this._talentAttackId};if(!e||e.hp<=0)return;if(options.ringSecondary)return original.hit.call(this,e,amount,skill,options);const hp=e.hp;amount=this.gameplay?.beforeHit(e,amount,skill,options)??amount;original.hit.call(this,e,amount,skill,options);const lost=Math.max(0,Math.min(hp,hp-e.hp));if(lost>0)this.gameplay?.afterHit(e,options,lost);};
 P.kill=function(e){if(!this.training&&!this._identityHit?.options?.ringSecondary&&this.enemies.includes(e))this.gameplay?.onKill(e);return original.kill.call(this,e);};
 P.updateAuras=function(dt){return original.updateAuras.call(this,dt);};
 const previousAuto=P.updateAuto;P.updateAuto=function(...args){if(this.gameplay?.assassin.veiled()||this.gameplay?.assassin.combo)return;return previousAuto.apply(this,args);};
 P.update=function(dt){if(!this.paused&&!this.transition&&this.mode==='playing'&&!this.training?.finished)this.gameplay?.update(Math.min(dt,.1));return original.update.call(this,dt);};
}
