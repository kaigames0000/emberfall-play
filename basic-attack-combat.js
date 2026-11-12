import {skillCue} from './combat-vfx.js?v=123';
import {addPoisonStack} from './poison-stacks.js?v=108';
import * as M from './model.js?v=140';
import {BASIC_ATTACKS,basicSequence,effectiveBasicAttack} from './basic-attacks.js?v=129';
import {playerAimAngle,pointerAimPoint} from './aiming.js?v=108';
import {beamBoundingRadius,circleInBeam,circleInSector} from './combat-geometry.js?v=108';
import {resourceCost} from './resource-cost.js?v=108';
import {summonStrike} from './summon-pose.js?v=127';

const installed=Symbol.for('emberfall.basic-attacks.installed'),wrapped=Symbol('basic-proc-hook');
const projectileStyles=new Set(['firebolt','homing','volley','daggers','split','pierce','venom']);
const cloneKits=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const ready=(g)=>g.gameplay?.usable()&&g.mode==='playing'&&!g.paused&&!g.transition&&!g.training?.finished&&!g.channelBlocksBasic()&&!g.gameplay.assassin.combo&&g.hp>0;
const live=(g)=>ready(g)&&g.attackCD<=0;
const visible=(g,from,to)=>!g.walkVisible||g.walkVisible(from,to);
const fireboltRadius=def=>(def.m10?110:def.m6?92:def.m3?80:72)*(def.areaScale??1);
const basicInterval=(weapon,haste,def)=>weapon.interval*(def?.style==='blood'?(def.m6?1.25:1.35):1)/Math.max(.25,haste);
const twinInterval=(def,haste)=>Math.max(.035,(def.m6?.058:.075)/Math.max(.25,haste));
const twinSecond=def=>def.m3?.7:.5;
const thrustLength=def=>(def.m6?260:210)*def.areaScale;
const thrustWidth=def=>(def.m10?40:def.m3?32:28)*def.areaScale;
const arcTargets=def=>def.m10?5:def.m6?4:3;
const arcRange=def=>def.m3?195:180;
const venomRatio=def=>def.m10?.3:def.m6?.24:.18;
const venomSeconds=def=>def.m10?4:def.m3?3:2;
const bloodCost=def=>def.m3?.008:.01;
function projectileCount(def,stats){
 const base=def.style==='volley'?3:def.style==='split'?(def.m10?5:def.m6?4:3):def.style==='daggers'?(def.m10?3:2):1;
 return Math.min(8,base+Math.max(0,Math.floor(stats.extraArrows||0)));
}
function projectilePierce(def,stats){
 const base=def.style==='pierce'?(def.m10?4:def.m6?3:2):def.style==='daggers'&&def.m6?1:0;
 return Math.min(8,base+Math.max(0,stats.pierce||0));
}
const targets=(g,center,range,max=8)=>g.damageables().filter(e=>e.hp>0&&distance(e,center)<=range+(e.r||0)&&visible(g,center,e)).sort((a,b)=>distance(a,center)-distance(b,center)).slice(0,max);

// All converted contacts retain ordinary basic damage scaling. Only the first
// damaging contact enters each proc owner, so area attacks do not multiply
// equipment/set/passive counters and cannot create recursive return mechanics.
function hook(owner,name,optionsIndex,key){
 const previous=owner?.[name];if(typeof previous!=='function'||previous[wrapped])return;
 function guarded(...args){const group=args[optionsIndex]?.basicGroup;if(group){if(group.procs.has(key))return;group.procs.add(key);}return previous.apply(this,args);}
 guarded[wrapped]=true;owner[name]=guarded;
}
function procHooks(g){
 hook(g.gameplay,'afterHit',1,'gameplay');hook(g.setCombat,'afterHit',1,'set');hook(g.rangerCombat,'onHit',2,'ranger');hook(g.minionCombat,'onHit',2,'minion');
 // Active skills intentionally have a one-MP minimum. The explicit passive
 // blood attack pays life through the same receipt ledger with zero MP.
 const blood=g.gameplay.blood;if(!blood.cost[wrapped]){const previous=blood.cost;function cost(def,...args){const result=previous.call(this,def,...args);if(BASIC_ATTACKS[def.basicAttack]?.style==='blood')result.mana=0;return result;}cost[wrapped]=true;blood.cost=cost;}
 if(!g.tryTrigger[wrapped]){const previous=g.tryTrigger;function guarded(event,...args){const group=this._basicProcGroup;if(event==='attack'&&group){if(group.procs.has('equipment'))return false;group.procs.add('equipment');}return previous.call(this,event,...args);}guarded[wrapped]=true;g.tryTrigger=guarded;}
}
const weaponStamp=g=>JSON.stringify([g.c.equipment?.weapon,g.c.equipment?.offhand]);
function followups(g,dt){
 const queue=g._basicFollowups;if(!queue?.length)return;
 if(!ready(g)){g._basicFollowups=[];return;}
 const equipped=new Set(basicSequence(g.c).map(d=>d.id)),stamp=weaponStamp(g),due=[];
 g._basicFollowups=queue.filter(q=>{if(q.runtime!==g.gameplay||q.hero!==g.c.id||!equipped.has(q.id)||q.stamp!==stamp)return false;q.t-=clamp(dt,0,.1);if(q.t<=0){due.push(q);return false;}return true;});
 for(const q of due)sweep(g,effectiveBasicAttack(g.c,q.id),q.amount,q.options,q.angle,q.range,.6,1,q.center);
}
function sweep(g,def,amount,options,a,range,arc,max,p=g.player){
 for(const e of targets(g,p,range,Infinity).filter(e=>circleInSector(p,a,range,arc,e)).slice(0,max)){options.basicGroup.hit.add(e);const localAmount=def.style==='rope'&&def.m3&&distance(p,e)>range*.65?amount*1.2:amount;g.hit(e,localAmount,false,{...options});}
 g.fx(p.x,p.y,range,def.color,'slash',.22,skillCue(def,'melee',{angle:a,halfArc:arc}));
}
function meleeRange(def,w){
 if(def.style==='rope')return (def.m6?220:190)*def.areaScale;
 if(def.style==='sweep')return Math.min(230,w.range*(def.m6?1.45:1.25)*def.areaScale);
 return w.range*(def.style==='alternate'&&def.m6?1.15:1);
}
function strike(g,def,amount,options,a,w,p=g.player){
 const style=def.style;
 if(style==='twin'){
  sweep(g,def,amount*.5,options,a,w.range,.6,1,p);
  const followOptions=def.m10?{...options,slow:.15,slowDuration:1.5}:options;
  const next={id:def.id,t:twinInterval(def,g.s.haste),center:{x:p.x,y:p.y},angle:a,range:w.range,amount:amount*twinSecond(def),options:followOptions};
  if(options.shadowBasic)cloneKits.get(p).followup=next;
  else{
   const queue=g._basicFollowups??=[];
   if(queue.length<8)queue.push({...next,hero:g.c.id,runtime:g.gameplay,stamp:weaponStamp(g)});
  }
  return;
 }
 if(style==='thrust'){
  const length=thrustLength(def),width=thrustWidth(def);
  const contacts=targets(g,p,beamBoundingRadius(length,width),Infinity).filter(e=>circleInBeam(p,a,length,width,e));
  for(const e of contacts.slice(0,def.m6?5:4)){options.basicGroup.hit.add(e);g.hit(e,amount,false,{...options});}
  g.fx(p.x,p.y,length,def.color,'channel-flame',.2,skillCue(def,'thrust',{a,length,width}));return;
 }
 const arc=style==='rope'?1.65:style==='sweep'?(def.m3?1.72:1.6):(w.halfArc??1.05)+(style==='alternate'&&def.m3?.1:0);
 sweep(g,def,amount,options,a,meleeRange(def,w),arc,def.m10&&['rope','sweep','alternate'].includes(style)?6:5,p);
}
function shoot(g,def,amount,options,a,w,p=g.player){
 const style=def.style,pierce=projectilePierce(def,g.s);
 let count=projectileCount(def,g.s);const shared=options.basicGroup.hit;
 const homing=style==='homing'||style==='volley',aim=pointerAimPoint(g,{},p)||{x:p.x+Math.cos(a)*600,y:p.y+Math.sin(a)*600};
 const choices=homing?g.enemies.slice(0,96).filter(e=>e.hp>0&&!e.worldProp&&distance(p,e)<750&&visible(g,p,e)).sort((x,y)=>distance(x,aim)-distance(y,aim)).slice(0,8):[];
 if(style==='volley'&&def.m3&&choices.length===1){count=1;amount*=def.m10?1.8:1.45;}
 if(homing){options.basicGroup.homingCandidates=choices;options.basicGroup.homingCooldown=.15;}
 for(let i=0;i<count&&g.bullets.length<240;i++){
  const spread=style==='daggers'?(def.m3?.17:.13):style==='split'&&def.m3?.21:.17;
  const angle=a+(i-(count-1)/2)*spread,speed=(style==='pierce'?(def.m3?850:760):homing?460:w.speed||560)*(1+Math.min(1,Math.max(0,g.s.projectileSpeed||0))),before=g.bullets.length;
  g.shoot(p.x,p.y,angle,speed,amount,def.color,pierce,def.tag==='spell'?7:4,false,{...options,hit:shared,skill:false,basicHoming:homing,basicTarget:choices[i%Math.max(1,choices.length)]||null,payloadRadius:style==='firebolt'?fireboltRadius(def):0});
  if(g.bullets.length>before){const bullet=g.bullets.at(-1);if(!['split','pierce','venom'].includes(style)){delete bullet.setReturn;delete bullet.returning;delete bullet.travelLimit;}bullet.t=Math.min(2.5,bullet.t);}
 }
 g.fx(p.x,p.y,24,def.color,'burst',.18,skillCue(def,'cast',{angle:a}));
}
function performShape(g,def,amount,options,a,w,p=g.player){
 if(projectileStyles.has(def.style))return shoot(g,def,amount,options,a,w,p);
 if(def.style!=='arc')return strike(g,def,amount,options,a,w,p);
 const point=pointerAimPoint(g,{},p),pool=targets(g,p,620,48).filter(e=>Math.abs(delta(Math.atan2(e.y-p.y,e.x-p.x),a))<.5+(e.r||0)/Math.max(1,distance(p,e)));
 if(point)pool.sort((x,y)=>distance(x,point)-distance(y,point));
 const group=options.basicGroup;
 let from=p,current=pool[0];
 for(let i=0;i<arcTargets(def)&&current;i++){
  group.hit.add(current);g.lightningArc(from,current,def.color,'lightning',def);g.hit(current,amount,false,{...options});
  from=current;amount*=.72;current=targets(g,from,arcRange(def),48).find(e=>!group.hit.has(e));
 }
}
function perform(g,def,secondary=null){
 const state=M.dualState(g.c),weapons=g.gameplay.weapons,hand=secondary?.hand||(state.dual?weapons.nextHand:'main');
 if(!secondary&&state.dual)weapons.nextHand=hand==='main'?'off':'main';
 const w=M.weaponDefinition(g.c.equipment[hand==='off'?'offhand':'weapon'],g.c.cls),castId=secondary?.group.castId??++g.gameplay.sequence,group=secondary?{...secondary.group,id:def.id,hit:new Set()}: {id:def.id,hero:g.c.id,castId,hit:new Set(),procs:new Set(),rage:false};
 const options={basicAttack:def.id,basicGroup:group,castId,tag:def.tag,hand,damageType:def.damageType,basicMastery:def,...(secondary?{basicEcho:true,setSecondary:true}:{} )};
 let amount=(hand==='off'?g.s.offhandAtk:g.s.atk)*w.damageMult*def.damage*(secondary?.35:1);
 if(!secondary)g.attackCD=basicInterval(w,g.s.haste,def);
 if(!secondary&&def.style==='counter'&&weapons.counterUntil>g.gameplay.time){amount*=def.m6?1.82:1.65;options.basicCounter=true;weapons.counterUntil=0;}
 if(def.style==='blood'){
  const receipt=g.gameplay.blood.pay({basicAttack:def.id,mana:0,lifeCost:bloodCost(def),bloodSkill:true},castId);
  if(receipt){options.bloodSkill=true;if(def.m10)amount*=1.12;}else amount*=.5;
 }
 const a=playerAimAngle(g);g.player.angle=a;g.gameplay.assassin.beginOffense();
 performShape(g,def,amount,options,a,w);
 if(!secondary){
  g._basicOrdinal=(g._basicOrdinal||0)+1;
  if(g.c.ring?.['x:basicchorus']===1&&g._basicOrdinal%4===0){const echo=basicSequence(g.c).find(d=>d.id!==def.id&&d.style!=='blood');if(echo)perform(g,echo,{group,hand});}
 }
 return true;
}
function inheritedLoadoutStamp(c){
 const gear=['weapon','offhand'].map(slot=>{
  const item=c.equipment?.[slot];
  return item?[item.id,item.weaponType,item.upgrade].join(':'):'';
 });
 const slots=c.basicSkills??[c.basicAttack];
 return [c.id,...gear,...slots.map(id=>id?id+':'+(c.talents?.[id]||0):'')].join('|');
}
function inheritedAttackRange(def,w){
 if(!def)return w.range;
 if(def.style==='thrust')return thrustLength(def);
 if(def.style==='arc'||projectileStyles.has(def.style))return def.range??w.range;
 return meleeRange(def,w);
}

export function basicAttackMetrics(g,def){
 const {c,s}=g,style=def.style;
 const slots=M.dualState(c).dual?['weapon','offhand']:['weapon'];
 const hands=slots.map(slot=>{
  const weapon=M.weaponDefinition(c.equipment[slot],c.cls);
  const base=slot==='offhand'?s.offhandAtk:s.atk;
  const damage=g.damagePacket(base*weapon.damageMult*def.damage,{damageType:def.damageType,tag:def.tag}).total;
  return {interval:basicInterval(weapon,s.haste,def),range:inheritedAttackRange(def,weapon),
   hits:style==='twin'?[damage*.5,damage*twinSecond(def)]:[damage]};
 });
 const metrics={hands};
 if(projectileStyles.has(style))Object.assign(metrics,{projectiles:projectileCount(def,s),pierce:projectilePierce(def,s)});
 if(style==='firebolt')metrics.explosion=fireboltRadius(def);
 if(style==='thrust')metrics.width=thrustWidth(def);
 if(style==='arc')Object.assign(metrics,{chainTargets:arcTargets(def),chainRange:arcRange(def)});
 if(style==='twin')metrics.secondHitDelay=twinInterval(def,s.haste);
 if(style==='venom')Object.assign(metrics,{poisonRatio:venomRatio(def),poisonDuration:g.rangerCombat.poisonDuration(venomSeconds(def))});
 if(style==='blood')metrics.life=g.gameplay.blood.cost({basicAttack:def.id,mana:0,lifeCost:bloodCost(def),bloodSkill:true}).life;
 return metrics;
}
export function ageInheritedBasic(g,actor,dt,stamp){
 const kit=cloneKits.get(actor),next=kit?.followup;
 if(!next)return;
 if(kit.stamp!==(stamp??inheritedLoadoutStamp(g.c))){kit.followup=null;return;}
 if((next.t-=dt)>0)return;
 kit.followup=null;
 const def=effectiveBasicAttack(g.c,next.id);
 if(def)sweep(g,def,next.amount,next.options,next.angle,next.range,.6,1,next.center);
}
export function updateInheritedBasic(g,actor,dt,target=null,context={}){
 const stamp=inheritedLoadoutStamp(g.c),stats=context.actorStats??g.s;
 let kit=cloneKits.get(actor);
 if(!kit||kit.stamp!==stamp){
  kit={stamp,cursor:0,hand:'main',followup:null,sequence:null,stats:null};
  cloneKits.set(actor,kit);
 }
 if(!kit.sequence||kit.stats!==g.baseS){
  kit.sequence=basicSequence(g.c);kit.stats=g.baseS;
 }
 const sequence=kit.sequence,index=kit.cursor%Math.max(1,sequence.length),def=sequence[index];
 const dual=M.dualState(g.c).dual,off=dual&&kit.hand==='off',hand=off?'off':'main';
 const weapon=M.weaponDefinition(g.c.equipment[off?'offhand':'weapon'],g.c.cls);
 const range=inheritedAttackRange(def,weapon);
 if(context.clone){
  if(target&&distance(actor,target)>range+(target.r||0))g.approachActor(actor,target,stats.speed*dt,range*.72);
 }else{
  ageInheritedBasic(g,actor,dt,stamp);
  target=g.minionCombat.movementTarget(actor,dt);
  actor.ranged=range>=350&&(!target||visible(g,actor,target));
  g.minionCombat.move(actor,target,dt);
 }
 if(!target||actor.cd>0||distance(actor,target)>range+(target.r||0)||!visible(g,actor,target))return;
 summonStrike(actor,target,g.clock,def?.tag==='spell'||weapon.kind!=='melee'?'cast':'weapon');
 const angle=actor.angle;
 kit.hand=dual&&!off?'off':'main';
 actor.cd=basicInterval(weapon,g.s.haste,def);
 const options={...context,ability:actor.source,origin:actor,actor,minion:true,shadowBasic:true,shadowLoadout:stamp,hand,
  tag:def?.tag??(weapon.kind==='spell'?'spell':'attack'),damageType:def?.damageType??actor.damageType??'physical'};
 let amount=(off?stats.offhandAtk:stats.atk)*weapon.damageMult*(actor.attackMult??1)*(def?.damage??1);
 if(def?.style==='blood'){
  const cost=resourceCost({lifeCost:bloodCost(def)},{...g.s,hp:actor.maxHp}).life;
  if(actor.hp>cost){actor.hp-=cost;if(def.m10)amount*=1.12;}
  else amount*=.5;
 }
 if(!context.clone){
  g.minionCombat.beforeAttack(actor,target,amount,options);
  g.gameplay?.uniques.beforeMinion(actor,target,amount,options);
  g.gameplay?.talents.beforeMinion(actor,target,amount,options);
  if(g.setCombat.summonAttack(actor,target,amount,options))return;
 }
 if(def){
  procHooks(g);
  const castId=++g.gameplay.sequence,basicGroup={id:def.id,hero:g.c.id,castId,hit:new Set(),procs:new Set(),rage:false};
  performShape(g,def,amount,{...options,castId,basicAttack:def.id,basicMastery:def,basicGroup},angle,weapon,actor);
  kit.cursor=(index+1)%sequence.length;
 }else if(weapon.kind==='melee'){
  const halfArc=weapon.halfArc??1.3;
  const enemies=targets(g,actor,range,Infinity).filter(e=>circleInSector(actor,angle,range,halfArc,e)).slice(0,weapon.maxTargets??3);
  for(const enemy of enemies)g.hit(enemy,amount,false,options);
  g.fx(actor.x,actor.y,range,actor.color,'slash',.22,skillCue(options,'melee',{angle,halfArc}));
 }else{
  g.shoot(actor.x,actor.y,angle,weapon.speed||480,amount,actor.color,g.s.pierce,weapon.kind==='spell'?8:4,false,
   {...options,visual:weapon.kind==='spell'?'orb':'arrow'});
 }
}
function impact(g,b,target){
 const def=b.basicMastery||BASIC_ATTACKS[b.basicAttack];if(!def)return;
 if(def.style==='firebolt'){
  const radius=fireboltRadius(def),pool=targets(g,target,radius,24).filter(e=>e===target||!b.hit.has(e)).sort((a,c)=>(a===target?-1:c===target?1:distance(a,target)-distance(c,target))).slice(0,5);
  for(const enemy of pool){b.hit.add(enemy);g.hit(enemy,b.damage*(enemy===target?1:.8),false,{...b});}
  g.fx(target.x,target.y,radius,def.color,'burst',.35,skillCue(def,'impact',{sprite:'flame-burst'}));
 }else{
  const hp=target.hp;g.hit(target,b.damage,false,{...b});
  if(def.style==='venom'&&!b.basicEcho&&!b.returning&&target.hp<hp&&target.hp>0&&!target.worldProp){
   const origin=b.shadowBasic?{minion:true,ability:b.ability}:{},source=b.shadowBasic?'basic:shadowVenom':'basic:venom';
   const packet=g.damagePacket(b.damage*venomRatio(def),{tag:'attack',damageType:'poison',dot:true,indirect:true,...origin}),rate=g.mitigateDot(packet.total,'poison',target,origin);
   if(rate>0)addPoisonStack(target,source,{rate,rawRate:packet.total,time:g.rangerCombat.poisonDuration(venomSeconds(def))},g.s.poisonStackLimit,{source,rangerPoison:true,inherited:!!b.shadowBasic,...origin});
  }
 }
}
function turnProjectile(b,target,turnSpeed,dt){
 const speed=Math.hypot(b.vx,b.vy),angle=Math.atan2(b.vy,b.vx);
 const turn=clamp(delta(Math.atan2(target.y-b.y,target.x-b.x),angle),-turnSpeed*dt,turnSpeed*dt);
 b.vx=Math.cos(angle+turn)*speed;b.vy=Math.sin(angle+turn)*speed;
}
function home(g,dt){
 if(!g.bullets.some(b=>b.basicHoming||b.homingTarget))return;
 // Build one bounded enemy pool per frame. Targetless groups refresh their
 // candidate cache at most every 0.15s, shared by all projectiles in the volley.
 const pool=g.enemies.slice(0,96).filter(e=>e.hp>0&&!e.worldProp),members=new Set(pool),step=clamp(dt,0,.1),groups=new Set();
 for(const b of g.bullets){
  if(b.homingTarget&&b.t>0){
   const target=b.homingTarget,active=Math.min(step,b.homingLeft,b.t);
   b.homingLeft-=active;
   if(!(active>0)||!members.has(target)||b.hit.has(target)||distance(b,target)>b.homing.range)b.homingTarget=null;
   else turnProjectile(b,target,b.homing.turnSpeed,active);
   continue;
  }
  if(!b.basicHoming||!b.basicGroup||b.t<=0)continue;
  const group=b.basicGroup;if(!groups.has(group)){groups.add(group);group.homingCooldown=Math.max(0,(group.homingCooldown||0)-step);}
  if(!members.has(b.basicTarget)||b.hit.has(b.basicTarget)){
   if(group.homingCooldown<=0){group.homingCooldown=.15;group.homingCandidates=pool.filter(e=>!b.hit.has(e)&&distance(e,b)<=720&&visible(g,b,e));}
   let next=null,best=720;for(const e of group.homingCandidates||[]){if(e.hp<=0||!members.has(e)||b.hit.has(e))continue;const d=distance(e,b);if(d<best){best=d;next=e;}}b.basicTarget=next;
  }
  const target=b.basicTarget;if(!target)continue;
  const mastery=b.basicMastery,turnSpeed=mastery?.style==='homing'&&mastery.m10?5.8:mastery?.m6?5:mastery?.style==='homing'&&mastery.m3?4.2:3.6;
  turnProjectile(b,target,turnSpeed,step);
 }
}
export function installBasicAttacks(Game){
 const P=Game.prototype;if(Object.hasOwn(P,installed))return;Object.defineProperty(P,installed,{value:true});
 const original={reset:P.reset,update:P.update,attack:P.attack,hit:P.hit,updateAuto:P.updateAuto,projectileImpact:P.projectileImpact,updateProjectiles:P.updateProjectiles};
 P.reset=function(...args){this._basicFollowups=[];this._basicCursor=0;this._basicOrdinal=0;return original.reset.apply(this,args);};
 P.update=function(dt){followups(this,dt);return original.update.call(this,dt);};
 P.attack=function(...args){
  // Guard before the original attack wrapper too: it otherwise breaks stealth
  // and advances the shared cast sequence even when combat is unavailable.
  if(!ready(this)){this._basicFollowups=[];return false;}if(this.attackCD>0)return false;
  const sequence=basicSequence(this.c),index=(this._basicCursor||0)%Math.max(1,sequence.length),def=sequence[index];if(!def)return original.attack.apply(this,args);
  procHooks(this);const result=perform(this,def);if(result)this._basicCursor=(index+1)%sequence.length;return result;
 };
 P.updateAuto=function(...args){
  const sequence=basicSequence(this.c),def=sequence[(this._basicCursor||0)%Math.max(1,sequence.length)];if(!def)return original.updateAuto.apply(this,args);
  if(this.c.autoEnabled===false||!live(this)||this.gameplay.assassin.veiled())return;
  const w=this.weapon(),range=def.range||(def.style==='sweep'?Math.min(200,w.range*1.25):w.range);
  if(this.inReach(range))return this.attack();
 };
 P.hit=function(enemy,amount,skill=false,options={}){
  const group=options.basicGroup;if(!group)return original.hit.call(this,enemy,amount,skill,options);
  const previous=this._basicProcGroup;this._basicProcGroup=group;const hp=enemy?.hp;
  try{const result=original.hit.call(this,enemy,amount,false,options);if(!options.basicEcho&&!options.shadowBasic&&BASIC_ATTACKS[group.id]?.style==='counter'&&!group.counterRecovery&&options.basicMastery?.m3&&enemy?.hp<hp){group.counterRecovery=true;const state=this.gameplay.weapons;if(options.basicCounter){this.hp=this.healValue(this.s.hp*.008);if(options.basicMastery.m10)this.mana=Math.min(this.s.mana,this.mana+3);}}if(!options.basicEcho&&!options.shadowBasic&&BASIC_ATTACKS[group.id]?.style==='rage'&&!group.rage&&!enemy?.worldProp&&enemy?.hp<hp){group.rage=true;this.gameplay.blood.rage=Math.min(100,this.gameplay.blood.rage+(options.basicMastery?.m10?6:options.basicMastery?.m6?5:options.basicMastery?.m3?4:3));this.gameplay.blood.lastHit=this.gameplay.blood.time;}return result;}finally{this._basicProcGroup=previous;}
 };
 P.projectileImpact=function(b,target){return b.basicAttack?impact(this,b,target):original.projectileImpact.call(this,b,target);};
 P.updateProjectiles=function(dt){
  if(!this.gameplay?.usable())return;
  const equipped=new Set(basicSequence(this.c).map(d=>d.id));
  const cloneStamp=this.summons.some(a=>cloneKits.has(a)&&a.hp>0)?inheritedLoadoutStamp(this.c):null;
  this.bullets=this.bullets.filter(b=>{
   if(b.shadowBasic&&(!cloneStamp||b.shadowLoadout!==cloneStamp||!(b.actor?.hp>0)||!this.summons.includes(b.actor)))return false;
   return !b.basicAttack||b.basicGroup?.hero===this.c.id&&equipped.has(b.basicAttack);
  });
  home(this,dt);return original.updateProjectiles.call(this,dt);
 };
}
