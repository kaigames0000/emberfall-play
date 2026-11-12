import {poisonBudget} from './poison-stacks.js?v=108';
import * as M from './model.js?v=140';
import {PASSIVE_NODES} from './passive-tree.js?v=108';
import {passiveMechanics} from './passive-constellations.js?v=108';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const direct=o=>!o.minion&&!o.clone&&!o.dot&&!o.aura&&!o.periodic&&!o.indirect&&!o.triggered&&!o.setSecondary&&!o.dualFollowup;
const spell=id=>M.ABILITIES[id]?.cls==='mage';
const livingDot=e=>Object.values(e.dots||{}).find(d=>d.time>0&&d.rate>0)||(e.burnStacks?.some(d=>d.t>0&&d.rate>0)?{damageType:'fire'}:null);
export class TalentCombat{
 constructor(g,runtime){this.g=g;this.r=runtime;this.time=0;this.queue=[];this.cooldowns={};this.counts={};this.manaSpent=0;this.manaRefund=0;this.manaRefundTime=0;this.lifeSpent=0;this.travel=0;this.previous={...g.player};this.refresh();}
 refresh(){this.active=passiveMechanics(this.g.c,PASSIVE_NODES);this.nodeIds=new Map(Object.entries(this.g.c.passives||{}).filter(([id])=>PASSIVE_NODES[id]?.mechanic).map(([id])=>[PASSIVE_NODES[id].mechanic,id]));this.equipmentAuraCount=M.equipmentAuras(this.g.c).length;this.queue=this.queue.filter(q=>this.active.has(q.key));this.g.bullets=this.g.bullets.filter(b=>!b.passiveKey||this.active.has(b.passiveKey));const before=this.g.skillEffects.length;this.g.skillEffects=this.g.skillEffects.filter(b=>!b.passiveKey||this.owns(b.passiveKey));if(!this.active.has('manaCycle')){this.manaSpent=0;this.manaRefund=0;this.manaRefundTime=0;}if(!this.active.has('bloodCharge')){this.lifeSpent=0;this.bloodReady=false;}if(!this.active.has('spellEcho')){this.spellReady=false;this.counts.spell=0;}if(!this.active.has('cleave'))this.counts.cleave=0;if(!this.active.has('alternation')){this.counts.alternation=0;this.previousHand=null;this.alternateUntil=0;}if(!this.active.has('blockReprisal')){this.counter=0;this.counterUntil=0;}if(!this.active.has('pursuit'))this.pursuitUntil=0;if(!this.active.has('stopGuard'))this.travel=0;for(const e of this.g.enemies||[]){if(!this.active.has('command'))delete e.talentCommandUntil;if(!this.active.has('bossHunt'))delete e.talentHunt;}if(!this.active.has('minionQuake'))for(const a of this.g.summons)a.talentAttackCount=0;if(before!==this.g.skillEffects.length)this.g.applyBuffs();}
 owns(key){return this.active.has(key)&&(this.g.c.passives?.[this.nodeIds.get(key)]||0)>0;}
 ready(key,seconds=0){if((this.cooldowns[key]??-1)>this.time)return false;this.cooldowns[key]=this.time+seconds;return true;}
 once(key,o){return !!o.castId&&this.r.oncePer('talent:'+key,o.castId);}
 targets(center,r,max=8){return this.r.targets(r,center,max);}
 secondary(key,e,damage,type='physical',extra={}){if(e.hp>0&&damage>0)this.g.hit(e,damage,true,{ability:'talent:'+key,damageType:type,indirect:true,setSecondary:true,noCrit:true,talentSecondary:key,...extra});}
 blast(key,center,damage,r=90,max=4,type='physical',extra={}){for(const e of this.targets(center,r,max))this.secondary(key,e,damage,type,extra);this.g.fx(center.x,center.y,r,'#c2bb91','shock',.25);}
 later(key,data){if(this.queue.length>=24)this.queue.shift();this.queue.push({key,t:0,...data});}
 buff(key,name,values={},duration=3,shield=0){const g=this.g,id='talent:'+key;let effect=g.skillEffects.find(e=>e.id===id);if(effect){effect.t=duration;effect.max=duration;effect.shield=Math.max(effect.shield||0,shield);}else{effect={id,name,passiveKey:key,buff:values,t:duration,max:duration,shield,sourceHP:g.baseS.hp};g.skillEffects.push(effect);}g.applyBuffs();return effect;}
 beforeHit(e,amount,skill,o){const g=this.g,id=o.id||o.ability;
  if(o.trapHit&&!o.talentSecondary&&this.active.has('crossfire')&&g.rangerCombat.traps.filter(t=>t.t>0&&distance(t,e)<=220).length>=2)amount*=1.12;
  if(o.minion&&!o.indirect&&!o.talentSecondary&&this.active.has('command')&&e.talentCommandUntil>this.time)amount*=1.12;
  if(!direct(o))return amount;
  if(skill&&this.active.has('alternation')&&this.alternateUntil>this.time&&M.weaponDefinition(g.c.equipment.weapon,g.c.cls).kind==='melee'){amount*=1.15;this.alternateUntil=0;}
  return amount;
 }
 afterHit(e,o){const g=this.g,id=o.id||o.ability;if(!direct(o))return;
  if(this.active.has('command'))e.talentCommandUntil=this.time+3;
  if(this.active.has('cleave')&&M.weaponDefinition(g.c.equipment.weapon,g.c.cls).kind==='melee'&&this.once('cleave',o)){this.counts.cleave=(this.counts.cleave||0)+1;if(this.counts.cleave%3===0&&this.ready('cleave',.8))this.blast('cleave',e,g.s.atk*.18);}
  if(this.active.has('alternation')&&M.dualState(g.c).dual&&!id&&o.hand&&this.once('alternation',o)){this.counts.alternation=this.previousHand&&this.previousHand!==o.hand?(this.counts.alternation||1)+1:1;this.previousHand=o.hand;if(this.counts.alternation>=3){this.counts.alternation=0;this.alternateUntil=this.time+3;}}
  if(this.active.has('spellEcho')&&spell(id)&&this.spellReady&&this.once('spellEcho',o)){this.spellReady=false;this.secondary('spellEcho',e,g.s.atk*.18,o.damageType||M.ABILITIES[id]?.damageType||'lightning');}
  if(this.active.has('bossHunt')&&['boss','miniboss'].includes(e.type)&&this.once('bossHunt',o)){e.talentHunt=(e.talentHunt||0)+1;if(e.talentHunt%6===0&&this.ready('bossHunt',1))this.secondary('bossHunt',e,g.s.atk*.35);}
  if(this.active.has('blockReprisal')&&this.counter>0&&this.counterUntil>this.time&&this.once('blockReprisal',o)){const damage=this.counter;this.counter=0;this.blast('blockReprisal',e,damage);}
  if(this.active.has('pursuit')&&this.pursuitUntil>this.time&&this.once('pursuit',o)){this.pursuitUntil=0;this.blast('pursuit',e,g.s.atk*.22,80,3);}
  if(this.active.has('bloodCharge')&&this.bloodReady&&M.ABILITIES[id]?.bloodSkill&&this.once('bloodCharge',o)){this.bloodReady=false;this.secondary('bloodCharge',e,g.s.atk*.15);}
  if(this.active.has('splinter')&&o.vx!==undefined&&this.once('splinter',o)&&this.ready('splinter',.6)){const angle=Math.atan2(o.vy,o.vx);for(const sign of [-1,1])this.later('splinter',{kind:'shot',x:e.x,y:e.y,angle:angle+sign*.5,damage:g.s.atk*.14,type:o.damageType||'physical',hit:new Set([e])});}
  const dot=livingDot(e);if(this.active.has('afflictionEcho')&&dot&&this.ready('afflictionEcho',.5))this.secondary('afflictionEcho',e,g.s.atk*.12,dot.damageType||'physical');
 }
 paid(def,cost){if(!(cost>0)||def.triggered||def.type==='aura')return;const g=this.g;if(this.active.has('manaCycle')){this.manaSpent=Math.min(g.s.mana*.7,this.manaSpent+cost);if(this.manaSpent>=g.s.mana*.35&&this.ready('manaCycle',5)){this.manaSpent-=g.s.mana*.35;this.manaRefund=g.s.mana*.06;this.manaRefundTime=3;}}
  if(this.active.has('spellEcho')&&spell(def.id)&&def.damage>0){this.counts.spell=(this.counts.spell||0)+1;if(this.counts.spell%4===0)this.spellReady=true;}
  if(this.active.has('armyMend')&&cost>=12){const injured=g.summons.filter(a=>a.hp>0&&a.hp<a.maxHp&&distance(a,g.player)<=300).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,3);if(injured.length&&this.ready('armyMend',2))for(const a of injured)a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.02*(1+(g.s.summonHealing||0)));}
 }
 lifePaid(receipt){if(this.active.has('bloodCharge')&&receipt.life>0){this.lifeSpent=Math.min(this.g.s.hp*.16,this.lifeSpent+receipt.life);if(this.lifeSpent>=this.g.s.hp*.08){this.lifeSpent-=this.g.s.hp*.08;this.bloodReady=true;}}}
 beforeIncoming(amount){return this.active.has('lowWard')&&this.g.hp<this.g.s.hp*.35?amount*.92:amount;}
 onBlock(prevented){if(this.active.has('blockReprisal')){this.counter=Math.min(this.g.s.atk*.3,(this.counter||0)+prevented*.15);this.counterUntil=this.time+3;}}
 onMovement(){if(this.active.has('pursuit'))this.pursuitUntil=this.time+3;}
 beforeMinion(a,target,damage){if(!this.active.has('minionQuake'))return;a.talentAttackCount=(a.talentAttackCount||0)+1;if(a.talentAttackCount%4===0&&(a.talentQuakeAt??-1)<=this.time){a.talentQuakeAt=this.time+1;this.blast('minionQuake',target,damage*.18,90,3,a.damageType||'physical',{minion:true});}}
 onSummonDeath(a){if(a.hp>0||a.talentDeathNotified)return;a.talentDeathNotified=true;if(this.active.has('legacy')&&this.ready('legacy',2)&&this.g.summons.some(s=>s!==a&&s.hp>0))this.buff('legacy','遺志承接',{summonHaste:.1},4);}
 onTrap(t){if(t.mode!=='proximity'||t.talentAftershock||!this.active.has('trapAftershock'))return;t.talentAftershock=true;this.later('trapAftershock',{kind:'blast',t:.2,x:t.x,y:t.y,r:t.r,damage:this.g.s.atk*t.def.damage*.25,type:'physical'});}
 projectileEnd(b){if(b.hostile||b.indirect||b.triggered||b.minion||!b.castId||!b.hit?.size||!this.active.has('returnShot')||!this.once('returnShot',b))return;this.later('returnShot',{kind:'shot',...this.g.clampWorldPoint(b.x,b.y),angle:Math.atan2(this.g.player.y-b.y,this.g.player.x-b.x),damage:b.damage*.22,type:b.damageType||'physical'});}
 onKill(e){const g=this.g;if(this.active.has('markLegacy')){const pair=Object.entries(e.auraDebuffs||{}).find(([key,m])=>['curse:r_mark','curse:a_mark'].includes(key)&&!m.transferred&&m.t>0);if(pair){const [key,m]=pair;m.transferred=true;for(const t of this.targets(e,200,2)){t.auraDebuffs??={};t.auraDebuffs[key]={...m,t:Math.min(3,m.t),transferred:true};g.aggregateAuraDebuffs(t);}}}
  if(this.active.has('ailmentHarvest')){const candidates=[...Object.values(e.dots||{}),...(e.burnStacks||[]).map(d=>({...d,time:d.t,damageType:'fire'}))];
   const d=candidates.filter(d=>!d.inherited&&!d.poisonFog&&!d.rotcycleInherited&&!d.triggerKey&&!d.minion&&d.rawRate>0&&d.rate>0&&d.time>0).sort((a,b)=>poisonBudget(b,true)-poisonBudget(a,true))[0];
   if(d){const type=d.damageType||'physical',targets=this.targets(e,140,8).filter(t=>!t.immunities?.includes(type)||g.mitigateDot(1,type,t)>0).slice(0,2);
    if(targets.length){const budget=Math.min(g.s.atk*5,poisonBudget(d,true)*(type==='poison'?.3:.2))/targets.length,duration=Math.min(2,d.time),rawRate=budget/duration;
     for(const t of targets){const rate=g.mitigateDot(rawRate,type,t),key='talent:harvest',old=t.dots?.[key];if(rate>0&&(!old||old.rawRate*old.time<budget)){t.dots??={};t.dots[key]={damageType:type,rawRate,rate,time:duration,talentInherited:true,inherited:true,source:key};}}
    }
   }}
 }
 update(dt){this.time+=dt;const g=this.g;if(this.manaRefundTime>0&&this.active.has('manaCycle')){const elapsed=Math.min(dt,this.manaRefundTime),refund=this.manaRefund*elapsed/this.manaRefundTime;this.manaRefund-=refund;this.manaRefundTime-=elapsed;g.mana=Math.min(g.s.mana,g.mana+refund);}
  const due=[];this.queue=this.queue.filter(q=>{q.t-=dt;if(q.t<=0){due.push(q);return false;}return this.active.has(q.key);});for(const q of due)if(this.active.has(q.key)){if(q.kind==='shot')g.shoot(q.x,q.y,q.angle,520,q.damage,'#b8c894',0,4,false,{ability:'talent:'+q.key,damageType:q.type,skill:true,indirect:true,setSecondary:true,noCrit:true,talentSecondary:q.key,passiveKey:q.key,hit:q.hit||new Set()});else this.blast(q.key,q,q.damage,q.r,4,q.type);}
  if(g.hp>0&&g.hp<g.s.hp*.35&&this.active.has('emergency')&&this.ready('emergency',12))this.buff('emergency','背水壁壘',{},3,g.s.hp*.08);
  const moved=distance(this.previous,g.player)>1;this.previous={...g.player};if(moved)this.travel=Math.min(2,this.travel+dt);else{if(this.travel>=1&&this.active.has('stopGuard')&&this.ready('stopGuard',5)){this.buff('stopGuard','流轉守勢',{},1.5,g.s.hp*.03);for(const e of this.targets(g.player,120,8)){e.auraDebuffs??={};e.auraDebuffs['talent:stopGuard']={slow:.2,t:2};g.aggregateAuraDebuffs(e);}}this.travel=0;}
  const aura=g.auraIds.size>0||this.equipmentAuraCount>0;
  if(aura&&this.active.has('auraPulse')&&this.ready('auraPulse',2)&&g.mana>=2){g.mana-=2;this.blast('auraPulse',g.player,g.s.atk*.15,Math.min(220,160*(1+(g.s.auraArea||0))),6);}
  if(aura&&this.active.has('auraShelter')&&this.ready('auraShelter',8)&&g.mana>=g.s.mana*.01){g.mana-=g.s.mana*.01;this.buff('auraShelter','庇護結界',{},3,g.s.hp*.06);}
 }
}
