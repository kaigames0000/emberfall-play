import {restoreSiphonedMana} from './mana-economy.js?v=108';
import * as M from './model.js?v=140';
import {hasGearCurse} from './gear-builds.js?v=108';
const POISON_IMMUNITY_PIERCE={poison:.30},BURN_IMMUNITY_PIERCE={fire:.20},BOTH_IMMUNITY_PIERCE={...POISON_IMMUNITY_PIERCE,...BURN_IMMUNITY_PIERCE};
const primary=o=>!o.dot&&!o.indirect&&!o.triggered&&!o.triggerKey&&!o.setSecondary&&!o.periodic&&!o.aura;
export class UniqueCombat{
 constructor(g,runtime){this.g=g;this.r=runtime;this.ids=new Set();this.time=0;this.counter=0;this.counterUntil=0;this.moveUntil=0;this.fastTrap=false;this.furnaceAt=0;this.sealPhase=-1;this.faultReadyUntil=0;this.faultCast=null;this.frostWellAt=0;this.choirAt=0;this.refresh();}
 refresh(){this.ids=new Set(Object.values(this.g.c.equipment).map(i=>i.uniqueID).filter(Boolean));this.fastTrap=false;this.counter=0;this.moveUntil=0;if(!this.has('fault_axe')){this.faultReadyUntil=0;this.faultCast=null;}this.g.skillEffects=(this.g.skillEffects||[]).filter(e=>!['unique:night_sail','unique:duelist_buckler'].includes(e.id)||this.has(e.id.slice(7)));this.g.bullets=this.g.bullets?.filter(b=>!b.uniqueSource||this.ids.has(b.uniqueSource))||[];if(this.g.rangerCombat)this.g.rangerCombat.clouds=this.g.rangerCombat.clouds.filter(b=>!b.uniqueSource||this.ids.has(b.uniqueSource));if(!this.has('echo_seal'))this.g.skillEffects=this.g.skillEffects.filter(e=>e.id!=='unique:echo_seal');}
 has(id){return this.ids.has(id);}
 immunityPierce(o){if(o.minion||o.clone||o.triggered||o.triggerKey)return null;const poison=this.has('poison_bow'),burn=o.dot&&this.has('ember_loop');return poison&&burn?BOTH_IMMUNITY_PIERCE:poison?POISON_IMMUNITY_PIERCE:burn?BURN_IMMUNITY_PIERCE:null;}
 onMovement(){if(this.has('night_sail')){const g=this.g;g.skillEffects=g.skillEffects.filter(e=>e.id!=='unique:night_sail');g.skillEffects.push({id:'unique:night_sail',t:3,buff:{speedPct:.12,projectileDamage:.15}});g.applyBuffs();}if(this.has('reaver_hands'))this.moveUntil=this.time+3;if(this.has('device_mail'))this.fastTrap=true;}
 onBlock(prevented){if(this.has('fault_axe')&&prevented>0)this.faultReadyUntil=this.time+3;if(this.has('duelist_buckler')&&prevented>0){const g=this.g;g.skillEffects=g.skillEffects.filter(e=>e.id!=='unique:duelist_buckler');g.skillEffects.push({id:'unique:duelist_buckler',t:2,buff:{haste:.18,castSpeed:.18}});g.applyBuffs();}if(!this.has('tide_shield'))return;this.counter=Math.min(this.g.s.atk*.6,this.counter+prevented*.5);this.counterUntil=this.time+4;}
 paid(receipt){if(!this.has('blood_loop')||!(receipt.life>0))return;const g=this.g;if(!['berserker','blood'].includes(g.s.resourceClass)){g.mana=Math.min(g.s.mana,g.mana+Math.min(receipt.life*.1,g.s.mana*.02));return;}const bucket=Math.floor(this.time);if(this.bloodRefundBucket!==bucket){this.bloodRefundBucket=bucket;this.bloodRefunded=0;}const heal=Math.max(0,Math.min(receipt.life*.1,g.s.hp*.005-(this.bloodRefunded||0),g.s.hp-g.hp));this.bloodRefunded=(this.bloodRefunded||0)+heal;if(heal)g.hp=g.healValue(heal);}
 prepare(def){let d=def;if(this.has('thunder_wand')&&def.id==='m_spark'&&!def.triggered)d={...d,chain:{...d.chain,jumps:Math.max(0,(d.chain?.jumps||0)-1)}};if(this.fastTrap&&def.trap&&!def.triggered){this.fastTrap=false;d={...d,trap:{...d.trap,armTime:.1,duration:d.trap.duration*.75}};}return d;}
 beforeHit(e,amount,skill,o){if(o.shadowEcho&&this.has('mirror_dagger'))return amount*1.35;if(!primary(o))return amount;const id=o.id||o.ability;if(!o.minion&&id==='m_spark'&&this.has('thunder_wand')&&this.r.oncePer('unique:thunder-first',o.castId))amount*=1.18;
  if(o.minion&&id==='a_clone'&&this.has('mirror_dagger'))return amount*.7;
  if(o.minion&&!o.clone&&o.damageType==='physical'&&this.has('stone_vow')&&hasGearCurse(e))amount*=1.2;
  if(!o.minion&&id==='w_cleave'&&o.castId&&this.has('fault_axe')){
   if(this.faultReadyUntil>this.time&&this.faultCast!==o.castId){this.faultCast=o.castId;this.faultReadyUntil=0;}
   if(this.faultCast===o.castId)amount*=1.2;
  }
  if(!o.minion&&skill&&this.has('reaver_hands')&&(this.moveUntil>this.time||o.castId===this.moveCast&&this.moveCastUntil>this.time)&&M.ABILITIES[id]?.damageType==='physical'&&!M.ABILITIES[id]?.trap){if(this.r.oncePer('unique:move',o.castId)){this.moveCast=o.castId;this.moveCastUntil=this.time+.25;this.moveUntil=0;}if(o.castId===this.moveCast)amount*=1.2;}
  return amount;
 }
 beforeMinion(ally,target,damage,options){if(ally.source==='m_golem'&&this.has('lone_core')&&this.g.summons.length===1){ally.uniqueHeavy=(ally.uniqueHeavy||0)+1;if(ally.uniqueHeavy%4===0)for(const e of this.r.targets(120,target,4))this.g.hit(e,damage*.3,true,{minion:true,ability:ally.source,damageType:'physical',indirect:true,setSecondary:true,noCrit:true});}
  if(ally.source==='m_spirit'&&this.has('mist_tome')){ally.uniqueMist=(ally.uniqueMist||0)+1;if(ally.uniqueMist%2===0&&this.g.bullets.length<235)this.g.shoot(target.x,target.y,Math.atan2(ally.y-target.y,ally.x-target.x),350,damage*.25,'#9acbdc',1,6,false,{minion:true,skill:true,ability:ally.source,uniqueSource:'mist_tome',damageType:'cold',indirect:true,setSecondary:true,noCrit:true,hit:new Set([target])});}
 }
 frostImpact(enemy,bullet){
  const g=this.g;
  if(!this.has('frost_well')||bullet.ability!=='m_fireball'||bullet.minion||bullet.clone||!primary(bullet)||!(enemy.frozen>0)||
     this.time<this.frostWellAt||!(g.s.mana>0))return;
  this.frostWellAt=this.time+2;
  restoreSiphonedMana(g,Math.min(8,g.s.mana*.05));
 }
 afterHit(e,o){if(!primary(o))return;const g=this.g,id=o.id||o.ability;
  if(o.minion&&!o.clone&&['fire','cold','lightning','poison'].includes(o.damageType)&&this.has('choir_standard')&&g.auraIds.size&&this.time>=this.choirAt&&g.hp<g.s.hp){
   this.choirAt=this.time+2;
   g.hp=g.healValue(g.s.hp*.015);
  }
  if(!o.minion&&id&&this.counter>0&&this.counterUntil>this.time){const damage=this.counter;this.counter=0;this.r.secondary(e,damage,'physical','unique:tide_shield');}
  if(!o.minion&&id==='m_spark'&&this.has('thunder_wand')&&this.r.oncePer('unique:thunder',o.castId))this.r.secondary(e,g.s.atk*.25,'lightning','unique:thunder_wand');
  if(this.has('shadow_mantle')&&(id==='a_clone'||!o.minion)){const actor=id==='a_clone'?'shadow':'owner';if(e.uniqueActor&&e.uniqueActor!==actor&&(e.uniqueConcordAt||0)<=this.time){e.uniqueConcordAt=this.time+.5;this.r.secondary(e,(g.s.summonAttackBase||g.s.atk)*.12,'physical','unique:shadow_mantle');}e.uniqueActor=actor;}
 }
 cloud(field){if(this.has('poison_bow')&&!field.triggerKey){const a=this.g.player.angle;field.uniqueSource='poison_bow';field.r=40;field.vx=Math.cos(a)*45;field.vy=Math.sin(a)*45;}}
 update(dt){this.time+=dt;const g=this.g;
  if(this.has('echo_seal')){const phase=g.auraIds.size?Math.floor(this.time/2)%2:-1;if(phase!==this.sealPhase){this.sealPhase=phase;g.skillEffects=g.skillEffects.filter(e=>e.id!=='unique:echo_seal');if(phase>=0)g.skillEffects.push({id:'unique:echo_seal',t:2.1,buff:phase?{reduce:.04}:{damageBonus:.06}});g.applyBuffs();}}
  if(this.has('blood_furnace')&&g.auraIds.has('b_bloodaura')&&this.r.blood.rage>=40&&this.time>=this.furnaceAt){this.furnaceAt=this.time+2;this.r.blood.rage-=5;for(const e of this.r.targets(140,g.player,6))this.r.secondary(e,g.s.atk*.2,'fire','unique:blood_furnace');g.fx(g.player.x,g.player.y,140,'#c67d59','shock',.25);}
  for(const field of g.rangerCombat.clouds)if(field.vx){const b=g.worldBounds();field.x=Math.max(b.left,Math.min(b.right,field.x+field.vx*dt));field.y=Math.max(b.top,Math.min(b.bottom,field.y+field.vy*dt));}
 }
}
