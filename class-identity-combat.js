import {dualState} from './model.js?v=140';
const installed=Symbol.for('emberfall.class-identity.v80');
const time=g=>g.gameplay?.time??g.clock??0;
const direct=o=>!['indirect','minion','clone','dot','periodic','triggered','aura','setSecondary','dualFollowup','shadowEcho','worldProp'].some(k=>o[k]);
const bloodSkills=new Set(['b_cleave','b_flurry','b_execute','b_leap']);
const rhythmSkills=new Set(['b_cleave','b_execute','b_leap']);
const paidLife=(g,options)=>!options.triggerKey&&!options.freeResource&&g.gameplay.blood.receipts.get(options.castId)?.life>0;
const types={physical:'物理',fire:'火焰',cold:'冰霜',lightning:'閃電',poison:'毒素'};
const names={volley:'彈幕',melee:'近戰',heavy:'重擊',hazard:'地面攻擊',deferred:'延期承傷'};
function state(g){return g._identityState??={events:[],recovery:g.s.hp*.02,lastBlock:-99,casts:new Map()};}
function record(g,event){if(!Number.isFinite(event.amount)||event.amount<=1e-8)return;const s=state(g),now=time(g);s.events.push({time:now,...event});s.events=s.events.filter(e=>now-e.time<=6).slice(-64);}
function recoverBloodHit(g,skill,options,def,lost){
 const legacy=g.c.cls==='berserker';
 if(!legacy&&(g.c.cls!=='wanderer'||options.actor||options.triggerKey||options.freeResource))return;
 const talents=g.c.talents,id=options.id||options.ability,rank=talents[id]||0,basic=!skill;
 const stance=dualState(g.c),dualBlood=stance.dual&&!stance.spellDual&&!!talents.b_dual;
 const paid=paidLife(g,options);
 if(skill&&(!bloodSkills.has(id)||rank<=0||!legacy&&(!def?.bloodSkill||!paid)))return;
 if(basic){
  if(legacy&&!talents.b_cleave&&!talents.b_dual)return;
  if(!legacy&&(!dualBlood||options.tag==='spell'||options.basicAttack==='b_basic_blood'&&!paid))return;
 }
 const s=state(g),key=options.castId??options.basicGroup?.castId??`basic:${g.gameplay.sequence}`;
 if(s.casts.has(key))return;
 s.casts.set(key,time(g));
 if(s.casts.size>64)s.casts.delete(s.casts.keys().next().value);
 const rate=(basic?(legacy?.008:0):rank>=3?.006:.0025)+(dualBlood?.004:0);
 const heal=Math.min(s.recovery,g.s.hp*rate+lost*(basic?.02:.03));
 s.recovery-=heal;
 g.hp=g.healValue(heal);
 const finishedRhythm=legacy?g.gameplay.weapons.rhythm===0:options.bloodRhythmFinisher;
 if(stance.titan&&talents.b_titan_grip&&id==='b_execute'&&finishedRhythm){
  const shield=g.skillEffects.find(effect=>effect.id==='b_titan_guard'),amount=g.s.hp*.04;
  if(shield){shield.shield=Math.max(shield.shield||0,amount);shield.t=2;}
  else g.skillEffects.push({id:'b_titan_guard',t:2,shield:amount,buff:{}});
 }
}
function attach(g){
 if(!g.gameplay)return;const blood=g.gameplay.blood;if(blood._identityLog)return;blood._identityLog=true;
 for(const method of ['payCost']){const original=blood[method];blood[method]=function(...args){const before=g.hp,result=original.apply(this,args);record(g,{kind:'lifePaid',source:args[0]?.name||args[0]?.id||'技能血費',type:'life',amount:result?args[0]?.life||0:0,hpBefore:before,hpAfter:g.hp});return result;};}
 const update=blood.update;blood.update=function(dt){const debt=this.debts.filter(d=>!d.ally&&d.t>0).reduce((n,d)=>n+d.remaining*Math.min(dt,d.t)/d.t,0),type=this.debts.find(d=>!d.ally&&d.t>0)?.type||'physical';g._pendingIdentityDebt=debt>0?{kind:'deferred',type,source:'延期承傷',amount:Math.min(g.hp,debt),hpBefore:g.hp,hpAfter:Math.max(0,g.hp-debt)}:null;const result=update.call(this,dt);if(g._pendingIdentityDebt)record(g,g._pendingIdentityDebt);g._pendingIdentityDebt=null;return result;};
 const weapons=g.gameplay.weapons,block=weapons.onBlock;weapons.onBlock=function(...args){const result=block.apply(this,args),s=state(g);if(g.c.cls==='warrior'&&time(g)-s.lastBlock>=1&&g.c.equipment.offhand?.weaponType?.toLowerCase().includes('shield')){s.lastBlock=time(g);if(g.hp<g.s.hp)g.hp=g.healValue(g.s.hp*.008);g.mana=Math.min(g.s.mana,g.mana+2);}return result;};
 const strike=weapons.strike;
 weapons.strike=function(def,options,...args){
  const talents=g.c.talents;
  if(g.c.cls!=='wanderer'||!talents.b_dual||!rhythmSkills.has(def.id))return strike.call(this,def,options,...args);
  const stance=dualState(g.c);
  if(!stance.dual)return strike.call(this,def,options,...args);
  if(!stance.spellDual&&direct(options)&&paidLife(g,options)){
   const finisher=def.id==='b_execute'&&talents.b_titan_grip&&this.rhythm>=3&&stance.titan;
   return strike.call(this,def,finisher?{...options,bloodRhythmFinisher:true}:options,...args);
  }
  // Unpaid or equipment-triggered attacks use neither the stored rhythm nor its slot.
  const {rhythm,rhythmUntil}=this;
  this.rhythm=0;
  try{return strike.call(this,def,options,...args);}
  finally{this.rhythm=rhythm;this.rhythmUntil=rhythmUntil;}
 };
}
export function installClassIdentityCombat(Game){
 const P=Game.prototype;if(P[installed])return;Object.defineProperty(P,installed,{value:true});
 const original=Object.fromEntries(['reset','refresh','update','applyBuffs','damage','hit','emit','healValue'].map(k=>[k,P[k]]));
 P.reset=function(...args){this._identityState=null;this.deathSummary=null;const result=original.reset.apply(this,args);state(this);attach(this);return result;};
 P.refresh=function(...args){const result=original.refresh.apply(this,args);attach(this);state(this).recovery=Math.min(state(this).recovery,this.s.hp*.02);return result;};
 P.applyBuffs=function(...args){const result=original.applyBuffs.apply(this,args);this.s.manaShield=Math.max(0,Math.min(.35,this.s.manaShield||0));return result;};
 P.update=function(dt){const s=state(this);s.recovery=Math.min(this.s.hp*.02,s.recovery+this.s.hp*.02*Math.max(0,Math.min(.1,dt)));for(const[k,t]of s.casts)if(time(this)-t>4)s.casts.delete(k);return original.update.call(this,dt);};
 P.healValue=function(amount){const next=original.healValue.call(this,amount);record(this,{kind:'healed',source:'生命回復',type:'life',amount:Math.max(0,next-this.hp),hpBefore:this.hp,hpAfter:next});return next;};
 P.hit=function(e,amount,skill=false,options={}){
  const previous=this._identityHit,before=e?.hp,own=direct(options),skillId=options.id||options.ability,def=this.ability(skillId);if(skill&&(own||options.primarySkill&&!options.triggered&&!options.minion&&!options.setSecondary)&&['m_fireball','m_nova','m_flamethrower','m_chain','m_spark'].includes(skillId)&&def?.m3&&this.enemies.filter(x=>x.hp>0&&!x.worldProp&&Math.hypot(x.x-this.player.x,x.y-this.player.y)<750).length===1)amount*=def.m10?1.25:1.2;this._identityHit={enemy:e,options,skill,direct:own};
  try{const result=original.hit.call(this,e,amount,skill,options),lost=Math.max(0,(before||0)-(e?.hp||0));
   if(own&&lost>0&&!e.worldProp&&this.mode==='playing')recoverBloodHit(this,skill,options,def,lost);
   return result;
  }finally{this._identityHit=previous;}
 };
 P.damage=function(amount,type='physical',kind=null,attacker=null,contact=null){const before=this.hp,pending={kind:'enemy',type:type===true?'fire':type===false?'physical':type,source:names[kind]||kind||'敵方攻擊',hpBefore:before,resistance:type==='physical'?this.s.physicalReduce||0:this.s.resistances?.[type]||0};this._pendingIdentityDamage=pending;try{const result=original.damage.call(this,amount,type,kind,attacker,contact);if(result&&!pending.recorded)record(this,{...pending,amount:Math.max(0,before-this.hp),hpAfter:this.hp});return result;}finally{this._pendingIdentityDamage=null;}};
 P.recentCombat=function(){return state(this).events.filter(e=>time(this)-e.time<=6).map(e=>({...e}));};
 P.emit=function(name,...args){if(name==='dead'){
  if(this._pendingIdentityDebt){record(this,this._pendingIdentityDebt);this._pendingIdentityDebt=null;}const pending=this._pendingIdentityDamage;if(pending&&!pending.recorded){record(this,{...pending,amount:Math.max(0,pending.hpBefore-this.hp),hpAfter:this.hp});pending.recorded=true;}
  const events=this.recentCombat(),last=[...events].reverse().find(e=>e.kind==='enemy'||e.kind==='deferred'),sum=kind=>events.filter(e=>e.kind===kind).reduce((n,e)=>n+e.amount,0);
  this.deathSummary={source:last?.source||'生命耗盡',type:last?.type||'physical',typeName:types[last?.type]||'物理',resistance:last?.resistance||0,hpBefore:last?.hpBefore||0,hpAfter:this.hp,enemyDamage:sum('enemy'),lifePaid:sum('lifePaid'),deferred:sum('deferred'),healed:sum('healed'),window:6,events};
 }return original.emit.call(this,name,...args);};
}
