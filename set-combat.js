import {restoreSiphonedMana} from './mana-economy.js?v=108';
import {poisonBudget} from './poison-stacks.js?v=108';
import * as SetModel from './model.js?v=140';
import {hasGearCurse} from './gear-builds.js?v=108';
import {skillCue} from './combat-vfx.js?v=123';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const types=['physical','fire','cold','lightning','poison'];
const sum=packet=>types.reduce((n,type)=>n+(packet.byType?.[type]||0),0);
const positive=n=>Number.isFinite(n)?Math.max(0,n):0;
const curseStrength=curse=>positive(curse.armorShred)+positive(curse.weaken)+positive(curse.slow);
const returnBounds=g=>{const b=g.worldBounds();return {left:b.left-45,right:b.right+45,top:b.top-55,bottom:b.bottom+51};};
const within=(entities,origin,radius,cap)=>entities.filter(e=>e.hp>0&&distance(e,origin)<=radius+(e.r||0)).sort((a,b)=>distance(a,origin)-distance(b,origin)).slice(0,cap);

// Cached at character refresh; no equipment or inventory scans in damage/field loops.
export class SetCombat{
 constructor(game){
  this.g=game;this.returnHitGroups=new WeakMap();this.flags={};this.fields=[];this.counter=0;this.counterT=0;this.counterCD=0;
  this.shatterCD=0;this.pullCD=1;this.fieldTick=.5;this.channelAge=0;this.residualNext=1;this.freeTimer=0;
  this.driftCD=0;this.huntHits=0;this.huntCD=0;this.manaEnergy=0;this.manaPulseCD=0;this.convergenceAge=0;this.propagated=new WeakSet();
  this.bastionCD=0;this.starCD=0;this.starHits=0;this.faultAt=0;this.frostMirrorAt=0;this.twinAt=0;this.twinMarks=new WeakMap();this.refresh();
 }
 refresh(){
  const g=this.g;this.flags={...g.baseS.setEffects};this.evolution=this.flags.evolution?g.c.setOptions?.evolution:null;
  this.fields=this.fields.filter(field=>this.flags[field.owner]);
  if(!this.flags.huntmark){this.huntHits=0;for(const e of g.enemies||[])e.setHuntMark=0;}
  if(!this.flags.manavessel)this.manaEnergy=0;else this.manaEnergy=Math.min(this.manaEnergy,positive(g.s?.mana)*.5);
  if(!this.flags.convergence)this.convergenceAge=0;
  if(!this.flags.iron){this.counter=0;this.counterT=0;}
  g.skillEffects=(g.skillEffects||[]).filter(effect=>effect.id!=='set:galeguard'||this.flags.galeguard).filter(effect=>effect.id!=='set:bastion'||this.flags.bastion);
  if(!this.flags.fletcher)this.starHits=0;
  if(!this.flags.twinvanguard)this.twinMarks=new WeakMap();
  if(!this.flags.faultguard)g.skillEffects=g.skillEffects.filter(effect=>effect.id!=='set:faultguard');
  const chosen=this.flags.covenant?g.c.setOptions?.covenant:null;
  const learned=chosen&&SetModel.TREES[g.c.cls]?.flat().some(n=>n.ability===chosen&&(g.c.talents[n.id]||0)>0);
  const def=learned?g.ability(chosen):null;
  this.freeAura=def&&SetModel.skillCategory(def)==='aura'?this.scaledAura(def):null;
  if(!this.freeAura)this.freeTimer=0;
 }
 scaledAura(def){
  const scaled={...def,covenant:true,drain:0,mana:0};
  for(const key of ['damage','burn','lifeRestorePct','manaRestore','manaRestorePct','freezeChance'])if(typeof scaled[key]==='number')scaled[key]*=.6;
  for(const key of ['buff','debuff','infusion','elementalBoost'])if(def[key])scaled[key]=Object.fromEntries(Object.entries(def[key]).map(([k,v])=>[k,typeof v==='number'?v*.6:v]));
  return scaled;
 }
 activeFreeAura(){return this.freeAura&&!this.g.auraIds.has(this.freeAura.id)?this.freeAura:null;}
 auraDefinitions(){return [...this.g.auraIds].map(id=>this.g.ability(id)).filter(Boolean).concat(this.activeFreeAura()||[]);}
 updateAura(dt){
  const g=this.g,def=this.activeFreeAura();if(!def)return;
  if(def.lifeRestorePct>0)g.hp=g.healValue(def.lifeRestorePct*g.s.hp*dt);
  g.mana=Math.min(g.s.mana,g.mana+((def.manaRestore||0)+(def.manaRestorePct||0)*g.s.mana)*dt);
  this.freeTimer-=dt;if(this.freeTimer>0)return;this.freeTimer+=g.auraPulseInterval(def);
  g.pulseAura(def);
 }
 critMultiplier(crit,indirect=false){
  const base=this.g.s.critDmg;if(!crit||indirect||(!this.flags.fate&&!this.flags.hunt))return base;
  if(this.g.rand()>=.2)return base;
  return this.flags.fate?Math.max(base,6):Math.max(base,Math.min(4,base+1));
 }
 // All generated packets are scaled once here, then bypass outgoing scaling in hit().
 rawDamage(amount,type,options={}){return sum(this.g.damagePacket(positive(amount),{damageType:type,indirect:true,...options}));}
 onMovement(origin){this.g.gameplay?.uniques.onMovement();
  if(this.flags.galeguard){const g=this.g;g.skillEffects=g.skillEffects.filter(e=>e.id!=='set:galeguard');g.skillEffects.push({id:'set:galeguard',t:3,buff:{haste:.22,castSpeed:.22}});g.applyBuffs();}
  if(!this.flags.drift||this.driftCD>1e-8||!Number.isFinite(origin?.x)||!Number.isFinite(origin?.y))return false;
  this.driftCD=2;this.fields=this.fields.filter(f=>f.owner!=='drift');
  this.fields.push({owner:'drift',x:origin.x,y:origin.y,r:140,t:2,max:2,tick:.5,interval:.5,damage:this.rawDamage(this.g.s.atk*.3,'lightning'),color:'#a4d5ec'});
  this.g.fx(origin.x,origin.y,140,'#a4d5ec','ring',.35,skillCue({id:'set:drift',damageType:'lightning'},'field'));return true;
 }
 absorbMana(amount){
  if(!this.flags.manavessel||!Number.isFinite(amount)||amount<=0)return amount;
  const paid=Math.min(amount*.25,this.g.ringCombat?.shieldMana()??positive(this.g.mana));this.g.mana-=paid;
  this.manaEnergy=Math.min(positive(this.g.s.mana)*.5,this.manaEnergy+paid);return amount-paid;
 }
 onPaidDamage(value,cost){
  const def=typeof value==='string'?SetModel.ABILITIES[value]:value;
  if(!this.flags.manavessel||this.manaPulseCD>1e-8||!Number.isFinite(cost)||cost<=0||this.manaEnergy<=0||SetModel.skillCategory(def)!=='damage')return false;
  const g=this.g,energy=this.manaEnergy;this.manaEnergy=0;this.manaPulseCD=2;
  const amount=this.rawDamage(energy*1.5,'lightning',{tag:'spell'});
  for(const e of within(g.enemies,g.player,160,5))this.secondary(e,amount,'lightning','manavessel');
  g.fx(g.player.x,g.player.y,160,'#a3b9f1','ring',.4,skillCue({id:'set:manavessel',damageType:'lightning'},'impact'));return true;
 }
 huntHit(enemy,options){
  if(!this.flags.huntmark||options.setSecondary||options.dot||options.periodic||options.indirect||options.triggered||options.aura||['r_trap','r_venom'].includes(options.id||options.ability))return;
  const def=SetModel.ABILITIES[options.id||options.ability],projectile=options.type==='projectile'||def?.type==='projectile'||Number.isFinite(options.vx);
  // Consume an existing mark before counting this hit, so the marking hit never consumes itself.
  if(enemy.hp>0&&enemy.setHuntMark>0&&this.huntCD<=1e-8&&(options.minion||projectile)){
   enemy.setHuntMark=0;this.huntCD=1;
   this.secondary(enemy,this.rawDamage(this.g.s.mana*.2,'lightning',{tag:'spell'}),'lightning','huntmark');
  }
  if(options.minion)return;
  this.huntHits++;if(this.huntHits>=3){this.huntHits=0;if(enemy.hp>0)enemy.setHuntMark=2;}
 }
 onKill(enemy){
  if(!this.flags.rotcycle||!enemy||this.propagated.has(enemy))return false;
  this.propagated.add(enemy);
  let strongest=null;
  const consider=(dot,type,time)=>{const raw=dot.stacks?poisonBudget(dot,true)/Math.max(1e-8,time):positive(dot.rawRate??dot.rate);if(!dot.poisonFog&&!dot.rotcycleInherited&&!dot.inherited&&time>0&&raw>0&&dot.rate!==0&&(!strongest||raw>strongest.rawRate))strongest={rawRate:raw,type,time:Math.min(4,time),source:dot.source,minion:dot.minion,triggerKey:dot.triggerKey};};
  for(const dot of (enemy.burnStacks||[]).slice(0,8))consider(dot,'fire',dot.t);
  for(const [key,dot] of Object.entries(enemy.dots||{}).slice(0,32)){const type=dot.damageType||key.split(':')[0];if(type==='fire'||type==='poison')consider(dot,type,dot.time??dot.t);}
  const curses=Object.entries(enemy.auraDebuffs||{}).filter(([id,d])=>id.startsWith('curse:')&&d.t>0&&!d.rotcycleInherited&&!d.beastMark).slice(0,12);
  if(!strongest&&!curses.length)return false;
  const g=this.g,targets=within(g.enemies.filter(e=>e!==enemy),enemy,160,3);
  for(const target of targets){
   if(strongest){
    const rate=g.mitigateDot(strongest.rawRate,strongest.type,target,strongest),dot={rate,rawRate:strongest.rawRate,source:'set:rotcycle',originSource:strongest.source,rotcycleInherited:true};
    if(rate>0&&strongest.type==='fire'){
     const stacks=(target.burnStacks||[]).filter(b=>b.t>0),old=stacks.find(b=>b.source==='set:rotcycle');
     if(old){if(positive(old.rawRate??old.rate)<=strongest.rawRate)Object.assign(old,dot,{t:strongest.time});}
     else if(stacks.length<8)stacks.push({...dot,t:strongest.time});
     else{let weakest=0;for(let i=1;i<stacks.length;i++)if(stacks[i].rate<stacks[weakest].rate)weakest=i;if(stacks[weakest].rate<=rate)stacks[weakest]={...dot,t:strongest.time};}
     target.burnStacks=stacks;
    }else if(rate>0){
     target.dots??={};const key=strongest.type+':set:rotcycle',old=target.dots[key];
     if(!old||old.time<=0||positive(old.rawRate??old.rate)<=strongest.rawRate)target.dots[key]={...dot,damageType:strongest.type,time:strongest.time};
    }
   }
   if(curses.length){
    const debuffs=target.auraDebuffs??={};
    for(const [id,curse] of curses){
     const key=id+':rotcycle',old=debuffs[key],t=Math.min(4,curse.t);
     if(old?.t>0){
      const difference=curseStrength(curse)-curseStrength(old);
      if(difference<0||difference===0&&old.t>=t)continue;
     }
     const {castId,ringCurseId,ringCurseOrder,...effect}=curse;
     debuffs[key]={...effect,t,transferred:true,rotcycleInherited:true};
    }
    g.aggregateAuraDebuffs(target);
   }
  }
  if(targets.length)g.fx(enemy.x,enemy.y,160,'#9fc185','ring',.35,skillCue({id:'set:rotcycle',damageType:strongest?.type},'impact'));return targets.length>0;
 }
 updateConvergence(dt){
  if(!this.flags.convergence)return;
  const g=this.g,living=g.summons.filter(a=>a.hp>0).slice(0,18),sources=new Map();
  for(const ally of living)if(ally.source&&!sources.has(ally.source))sources.set(ally.source,ally);
  if(sources.size<3){this.convergenceAge=0;return;}
  this.convergenceAge+=dt;if(this.convergenceAge+1e-8<6)return;this.convergenceAge=0;
  for(const ally of [...sources.values()].slice(0,4)){
   const target=g.nearest(ally);if(!target)continue;const type=types.includes(ally.damageType)?ally.damageType:'physical',damage=this.rawDamage(g.s.atk*.45,type,{minion:true});
   g.shoot(ally.x,ally.y,Math.atan2(target.y-ally.y,target.x-ally.x),430,damage,'#d4b6f0',0,7,false,{damageType:type,ability:'set:convergence',source:'set:convergence',minion:true,setSecondary:true,preScaled:true,noCrit:true,indirect:true});
  }
  for(const ally of living)ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.05);
  g.hp=g.healValue(g.s.hp*.05);
 }
 onBlock(prevented){
  if(this.flags.bastion&&this.bastionCD<=0&&prevented>0){const g=this.g;this.bastionCD=4;g.skillEffects=g.skillEffects.filter(e=>e.id!=='set:bastion');g.skillEffects.push({id:'set:bastion',t:3,shield:g.s.hp*.12,buff:{}});}

  if(!this.flags.iron||this.counterCD>0||prevented<=0)return;
  this.counter=Math.min(this.g.s.atk,this.counter+prevented*.4);this.counterT=4;
 }
 secondary(target,amount,type,owner,options={}){
  if(!target||target.hp<=0||amount<=0)return;
  this.g.hit(target,amount,true,{damageType:type,ability:'set:'+owner,source:'set:'+owner,
   setSecondary:true,preScaled:true,noCrit:true,indirect:true,...options});
 }
 afterHit(enemy,options,uncriticalTotal){
  this.huntHit(enemy,options);
  if(this.flags.twinvanguard)this.twinVanguardHit(enemy,options);
  if(options.setSecondary||options.minion||options.dot||options.periodic||options.indirect||options.triggered||options.triggerKey)return;
  if(this.flags.faultguard&&(options.id||options.ability)==='w_cleave'&&!options.clone&&uncriticalTotal>0&&this.g.gameplay.time>=this.faultAt){
   const g=this.g;
   this.faultAt=g.gameplay.time+4;
   g.skillEffects=g.skillEffects.filter(effect=>effect.id!=='set:faultguard');
   g.skillEffects.push({id:'set:faultguard',t:3,shield:g.s.hp*.07,buff:{}});
   for(const target of within(g.enemies,enemy,115,4))this.secondary(target,uncriticalTotal*.35,'physical','faultguard');
   g.fx(enemy.x,enemy.y,115,'#cba377','shock',.36,skillCue({id:'set:faultguard'},'impact'));
  }
  if(this.flags.fletcher&&this.g.c.equipment.weapon?.weaponType==='bow'&&(Number.isFinite(options.vx)||options.type==='projectile')){this.starHits=Math.min(4,this.starHits+1);if(this.starHits>=4&&this.starCD<=0){this.starHits=0;this.starCD=.8;const g=this.g;const targets=within(g.enemies,g.player,700,2);for(let n=0;n<2&&targets.length&&g.bullets.length<235;n++){const target=targets[n%targets.length];g.shoot(g.player.x,g.player.y,Math.atan2(target.y-g.player.y,target.x-g.player.x)+(n?1:-1)*.04,650,g.s.atk*.3,'#edc882',0,5,false,{tag:'attack',ability:'set:fletcher',damageType:'physical',setSecondary:true,indirect:true,noCrit:true});}}}
  if(this.flags.iron&&this.counter>0&&this.counterCD<=0){
   const amount=this.counter;this.counter=0;this.counterT=0;this.counterCD=4;this.secondary(enemy,amount,'physical','iron');
  }
  if(this.flags.frost&&enemy.hp<=0&&enemy.frozen>0&&this.shatterCD<=0){
   this.shatterCD=.5;this.g.fx(enemy.x,enemy.y,160,'#b2e7ef','frost',.4,skillCue({id:'set:frost',damageType:'cold'},'impact',{sprite:'frost-impact'}));
   const targets=this.g.enemies.filter(e=>e!==enemy&&e.hp>0&&distance(e,enemy)<=160+e.r).sort((a,b)=>distance(a,enemy)-distance(b,enemy)).slice(0,5);
   for(const e of targets)this.secondary(e,uncriticalTotal*.3,'cold','frost');
  }
 }
 twinVanguardHit(enemy,options){
  if(!options.minion||options.clone||options.setSecondary||options.dot||options.periodic||options.indirect||options.triggered||options.triggerKey||
     enemy.hp<=0||!types.includes(options.damageType)||!hasGearCurse(enemy))return;
  const g=this.g,time=g.gameplay.time,kind=options.damageType,prior=this.twinMarks.get(enemy);
  if(prior&&time-prior.time<=4&&(prior.kind==='physical')!==(kind==='physical')&&time>=this.twinAt){
   this.twinAt=time+2;
   this.twinMarks.delete(enemy);
   const element=kind==='physical'?prior.kind:kind,amount=this.rawDamage((g.s.summonAttackBase||g.s.atk)*.4,'physical',{minion:true});
   this.secondary(enemy,amount,'physical','twinvanguard',{damageTypes:{physical:.5,[element]:.5}});
   if(g.auraIds.size)restoreSiphonedMana(g,Math.min(8,g.s.mana*.03));
   g.fx(enemy.x,enemy.y,65,'#b6cdb2','shock',.35,skillCue({id:'set:twinvanguard',damageTypes:{physical:.5,[element]:.5}},'impact'));
  }else this.twinMarks.set(enemy,{kind,time});
 }
 fireballImpact(b,target){
  if(b.ability!=='m_fireball'||b.setSecondary||b.minion||b.clone||b.triggered||b.triggerKey)return;
  this.g.gameplay?.uniques?.frostImpact(target,b);
  const g=this.g;
  let reflect;
  if(this.flags.frostmirror&&g.gameplay.time>=this.frostMirrorAt&&this.isFrostSlowed(target)){
   const amount=sum(g.damagePacket(b.damage,{...b,skill:true}))*.4;
   this.frostMirrorAt=g.gameplay.time+2;
   reflect=()=>{
    for(const enemy of within(g.enemies,target,120,4))this.secondary(enemy,amount,'cold','frostmirror');
    g.fx(target.x,target.y,120,'#addbed','frost',.4,skillCue({id:'set:frostmirror',damageType:'cold'},'impact',{sprite:'frost-impact'}));
   };
  }
  if(this.flags.flame){
   const damage=sum(g.damagePacket(b.damage,{...b,skill:true}))*.15;
   const own=this.fields.filter(f=>f.owner==='flame');if(own.length>=2)this.fields.splice(this.fields.indexOf(own[0]),1);
   this.fields.push({owner:'flame',x:target.x,y:target.y,r:Math.min(180,b.explosionRadius||90),damage,t:3,max:3,color:'#9ecfe5'});
  }
  return reflect;
 }
 isFrostSlowed(target){
  return target.frozen>0||Object.entries(target.auraDebuffs??{}).some(([source,debuff])=>{
   if(!(debuff.slow>0)||!(debuff.t>0)||!(/^(skill|summon):/.test(source)))return false;
   return SetModel.ABILITIES[source.split(':')[1]]?.damageType==='cold';
  });
 }
 channelTick(def,seconds){
  if(def.id!=='w_whirl')return;
  const g=this.g;
  if(this.flags.wrath){
   this.pullCD-=seconds;if(this.pullCD<=1e-8){
    this.pullCD+=1;let pulled=0;
    for(const e of g.enemies)if(e.hp>0&&distance(e,g.player)<=120+e.r){
     e.setPhysicalTaken=.1;e.setPhysicalTakenT=4;
     if(e.type!=='boss'&&e.type!=='miniboss'&&pulled<6){const d=distance(e,g.player)||1,step=Math.min(80,Math.max(0,d-25));g.moveActor(e,(g.player.x-e.x)/d*step,(g.player.y-e.y)/d*step,false);pulled++;}
    }
    g.fx(g.player.x,g.player.y,120,'#db9d76','ring',.25);
   }
  }
  this.channelAge+=seconds;
  if(this.flags.rifts&&this.channelAge+1e-8>=this.residualNext){
   this.residualNext=this.channelAge+2;this.fields=this.fields.filter(f=>f.owner!=='rifts');
   const damage=sum(g.damagePacket(g.s.atk*def.damage*(g.s.whirl||1),{...def,skill:true}))*.3;
   const interval=Math.max(.08,(def.interval||.4)/Math.max(.25,g.s[def.speedStat||'haste']||1));
   this.fields.push({owner:'rifts',x:g.player.x,y:g.player.y,r:120,damage,t:2,max:2,tick:interval,interval,color:'#c5a4ed'});
  }
 }
 decorateProjectile(b){
  const def=SetModel.ABILITIES[b.ability],bow=def?.cls==='ranger'&&def.type==='projectile'||!b.ability&&this.g.c.equipment.weapon?.weaponType==='bow';
  if(this.flags.wind&&bow&&!b.hostile&&!b.minion&&!b.setSecondary&&!b.explosionRadius&&!b.chain&&!b.homing){
   b.setReturn=true;b.returning=false;b.startX=b.x;b.startY=b.y;b.travelLimit=700;
  }
 }
 returnProjectile(b){
  if(!b.setReturn||b.returning||!this.flags.wind)return false;
  const g=this.g,packet=g.damagePacket(b.damage,{...b,skill:!!b.skill}),total=sum(packet);
  b.damage=total*.5;b.damageTypes=Object.fromEntries(types.map(type=>[type,total?packet.byType[type]/total:0]));
  b.returning=true;b.outboundSpent=false;b.setSecondary=true;b.preScaled=true;b.noCrit=true;b.indirect=true;b.source='set:wind';b.ability='set:wind';
  b.burn=0;b.freeze=0;b.freezeChance=0;b.minionBurnFraction=0;const outboundHits=b.hit??new Set();let returnHits=this.returnHitGroups.get(outboundHits);if(!returnHits){returnHits=new Set();this.returnHitGroups.set(outboundHits,returnHits);}b.hit=returnHits;b.pierce=Infinity;b.t=2.5;
  const bounds=returnBounds(g);b.x=Math.max(bounds.left,Math.min(bounds.right,b.x));b.y=Math.max(bounds.top,Math.min(bounds.bottom,b.y));
  const speed=Math.hypot(b.vx,b.vy),d=distance(b,g.player)||1;b.vx=(g.player.x-b.x)/d*speed;b.vy=(g.player.y-b.y)/d*speed;
  return true;
 }
 projectileStep(b){
  if(!b.setReturn)return;
  if(b.returning){if(!this.flags.wind||distance(b,this.g.player)<24)b.t=0;return;}
  const bounds=returnBounds(this.g);
  if(b.t<=0||Math.hypot(b.x-b.startX,b.y-b.startY)>=b.travelLimit||b.x<=bounds.left||b.x>=bounds.right||b.y<=bounds.top||b.y>=bounds.bottom)this.returnProjectile(b);
 }
 summonAttack(ally,target,damage,options){
  const g=this.g,spec=ally.summonSpec||{};ally.attacks=(ally.attacks||0)+1;
  const evolved=this.flags.evolution&&this.evolution===ally.source,third=ally.attacks%3===0;
  if(evolved&&ally.source==='m_spirit'){
   const a=Math.atan2(target.y-ally.y,target.x-ally.x);
   for(const sign of [-1,1])g.shoot(ally.x,ally.y,a+sign*.035,430,damage*.65,ally.color,0,7,false,{...options,explosionRadius:spec.attackRadius||60,summonMaxTargets:3});
   return true;
  }
  if(evolved&&['m_thorn','m_avatar'].includes(ally.source)){
   g.strikeChain(ally,target,damage*.9,ally.color,options,{...(spec.chain||{range:200,falloff:.7}),jumps:Math.min(6,(spec.chain?.jumps||0)+2)});
   return true;
  }
  if(evolved&&['m_frostgolem','m_icegod'].includes(ally.source)&&third){
   const own=this.fields.filter(f=>f.owner==='evolution');if(own.length>=2)this.fields.splice(this.fields.indexOf(own[0]),1);
   this.fields.push({owner:'evolution',x:target.x,y:target.y,r:160,t:3,max:3,color:'#a4e4ec',slow:.2});
   if(ally.source==='m_icegod'){const amount=this.rawDamage(damage*.4,'cold',{minion:true});for(const enemy of within(g.enemies,target,160,5))this.secondary(enemy,amount,'cold','evolution',{minion:true});g.fx(target.x,target.y,160,'#a4e4ec','frost',.4,skillCue({id:ally.source,damageType:'cold'},'impact',{sprite:'frost-impact'}));}
  }
  const titan=ally.source==='m_titan'&&third,earth=ally.source==='m_golem'&&third&&(evolved||this.flags.soul);
  if(!titan&&!earth)return false;
  let targets;
  if(titan||evolved){
   const radius=(titan?140:150)*(1+Math.min(1.5,g.s.skillArea||0));
   targets=g.enemies.filter(e=>e.hp>0&&distance(e,target)<=radius+e.r).sort((a,b)=>distance(a,target)-distance(b,target)).slice(0,5);
   g.fx(target.x,target.y,radius,titan?'#d7c48d':'#9ed7ef','shock',.35,skillCue({...options,damageType:evolved&&earth?'cold':options.damageType},'impact'));
  }else{
   const d=distance(ally,target)||1,dx=(target.x-ally.x)/d,dy=(target.y-ally.y)/d,area=1+Math.min(1.5,g.s.skillArea||0),length=160*area,width=60*area;
   targets=g.enemies.filter(e=>{const x=e.x-ally.x,y=e.y-ally.y;return e.hp>0&&x*dx+y*dy>=-e.r&&x*dx+y*dy<=length+e.r&&Math.abs(-x*dy+y*dx)<=width*.5+e.r;}).sort((a,b)=>distance(a,ally)-distance(b,ally)).slice(0,4);
   g.fx(ally.x,ally.y,length,'#d7bd91','channel-flame',.3,skillCue(options,'thrust',{a:Math.atan2(dy,dx),length,width}));
  }
  for(const victim of targets)g.hit(victim,damage*(titan?1:1.2),true,{...options,...(evolved&&earth?{damageType:'cold',minionSlow:.2,minionSlowDuration:3}:{}),origin:ally});
  return true;
 }
 update(dt){this.bastionCD=Math.max(0,this.bastionCD-dt);this.starCD=Math.max(0,this.starCD-dt);
  const g=this.g;dt=positive(dt);this.driftCD=Math.max(0,this.driftCD-dt);this.huntCD=Math.max(0,this.huntCD-dt);this.manaPulseCD=Math.max(0,this.manaPulseCD-dt);this.updateConvergence(dt);
  for(const e of g.enemies)if(e.setHuntMark>0)e.setHuntMark=Math.max(0,e.setHuntMark-dt);
  this.counterCD=Math.max(0,this.counterCD-dt);this.shatterCD=Math.max(0,this.shatterCD-dt);this.counterT-=dt;
  if(this.counterT<=0)this.counter=0;
  if(g.channel?.id!=='w_whirl'){this.channelAge=0;this.residualNext=1;this.fields=this.fields.filter(f=>f.owner!=='rifts');}
  for(const e of g.enemies)if(e.setPhysicalTakenT>0){e.setPhysicalTakenT-=dt;if(e.setPhysicalTakenT<=0)e.setPhysicalTaken=0;}
  for(const f of this.fields){
   f.t-=dt;if(f.owner==='drift'&&f.t>=-1e-8){f.tick-=dt;if(f.tick<=1e-8){f.tick+=f.interval;for(const e of within(g.enemies,f,f.r,5))this.secondary(e,f.damage,'lightning','drift');}}
   if(f.owner==='rifts'){
    f.tick-=dt;if(f.tick<=1e-8){f.tick+=f.interval;for(const e of g.enemies.filter(e=>e.hp>0&&distance(e,f)<=f.r+e.r).sort((a,b)=>distance(a,f)-distance(b,f)).slice(0,5))this.secondary(e,f.damage,'physical','rifts');}
   }
  }
  this.fieldTick-=dt;
  if(this.fieldTick<=1e-8){
   this.fieldTick+=.5;
   for(const e of [...g.enemies])if(e.hp>0){
    let damage=0,slow=0;
    for(const f of this.fields)if(f.t>=-1e-8&&distance(e,f)<=f.r+e.r){if(f.owner==='flame')damage=Math.max(damage,f.damage);if(f.slow)slow=Math.max(slow,f.slow*(1-Math.max(-.5,Math.min(.75,e.resistances?.cold||0))));}
    if(damage)this.secondary(e,damage*.5,'cold','flame',{dot:true});
    if(slow&&e.hp>0){e.auraDebuffs??={};e.auraDebuffs['set:evolution']={slow,t:.6};g.aggregateAuraDebuffs(e);}
   }
  }
  this.fields=this.fields.filter(f=>f.t>1e-8&&this.flags[f.owner]);
 }
}
