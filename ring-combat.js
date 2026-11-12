import {playerAimPlacement} from './aiming.js?v=108';
import {restoreSiphonedMana} from './mana-economy.js?v=108';
import {skillCue} from './combat-vfx.js?v=123';

const curseWeights=[1,.5,.25];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const direct=o=>!o.actor&&!o.dot&&!o.minion&&!o.clone&&!o.indirect&&!o.triggered&&!o.triggerKey&&!o.aura&&!o.periodic&&!o.setSecondary&&!o.dualFollowup;
const directHit=o=>direct(o)||o.primarySkill&&direct({...o,periodic:false});
const spell=def=>(def.attackTag??def.tag??(def.cls==='mage'?'spell':'attack'))==='spell';
const damageSpell=def=>spell(def)&&def.damage>0&&['nova','projectile','chain','ground','channel'].includes(def.type);

export class RingCombat {
 constructor(game){this.g=game;this.curseOrder=0;this.spellHand=0;this.clear();}
 get time(){return this.g.gameplay?.time??0;}
 owns(id){return this.g.c.cls==='wanderer'&&this.g.c.ring?.['x:'+id]===1;}
 clear(){this.phaseUntil=0;this.phasePending=false;this.counterPending=false;this.poisonUntil=0;this.lastSpell=null;this.echo=null;this.spellCenter=null;this.lifeFees=[];this.auraRecoveryAt=0;this.guardSiphonAt=0;this.hexSiphonAt=0;this.evadeHealAt=0;}
 reconcile(){
  const g=this.g,limit=this.curseLimit();
  if(!this.owns('phasecast')){this.phaseUntil=0;this.phasePending=false;}
  if(!this.owns('evadecounter'))this.counterPending=false;
  if(!this.owns('stealthpoison'))this.poisonUntil=0;
  if(!this.owns('bloodzero'))this.lifeFees=[];
  if(!this.owns('doubleecho')){this.lastSpell=null;this.echo=null;this.spellCenter=null;}
  if(!g.s.spellDual)this.spellHand=0;
  for(const enemy of g.enemies){
   let count=0;
   const layers=Object.entries(enemy.auraDebuffs||{}).filter(([,entry])=>entry.ringCurseOrder).sort((a,b)=>a[1].ringCurseOrder-b[1].ringCurseOrder);
   for(const [key,entry] of layers){
    if(!g.ability(entry.ringCurseId)||++count>limit)delete enemy.auraDebuffs[key];
   }
   if(layers.length)g.aggregateAuraDebuffs(enemy);
  }
 }

 evaded(){
  if(this.owns('evadecounter'))this.counterPending=true;
  const g=this.g;if(this.owns('evasivebreath')&&g.mode==='playing'&&this.time>=this.evadeHealAt){this.evadeHealAt=this.time+1.5;g.hp=g.healValue(g.s.hp*.01);}
 }
 siphon(rate){
  return restoreSiphonedMana(this.g,this.g.s.mana*rate);
 }
 incomingMultiplier(){
  const g=this.g,auras=this.owns('aurabulwark')?[...g.auraIds].filter(id=>{const def=g.ability(id),cost=def&&g.auraResourceCost(def);return cost&&cost.mana+cost.life>0;}).length:0;
  const allies=this.owns('packward')?g.summons.filter(a=>a.hp>0&&a.kind!=='mirror_clone'&&!['a_clone','r_clone'].includes(a.source)).length:0;
  return 1-Math.min(.12,Math.min(4,auras)*.02+Math.min(4,allies)*.02);
 }
 reflected(enemy,blocked,type){
  if(blocked>0&&this.owns('guardreservoir')&&this.time>=this.guardSiphonAt){this.guardSiphonAt=this.time+1;this.siphon(.02);}
  if(!this.owns('blockreflect')||!enemy||enemy.hp<=0||!this.g.enemies.includes(enemy))return;
  const amount=Math.floor(Math.min(blocked*.5,this.g.s.atk*.75));
  this.secondary(enemy,amount,type,'blockreflect');
 }
 shieldMana(){const g=this.g;return Math.max(0,g.mana-(this.owns('manareserve')?g.s.mana*.2:0));}

 beforeHit(amount,skill,options){
  if(!(amount>0)||!directHit(options))return amount;
  if(skill&&!options.basicAttack&&this.owns('manaoverdrive')&&this.g.mana>this.g.s.mana*.5&&damageSpell(this.g.ability(options.id||options.ability)||{}))amount*=1.14;
  if(this.owns('evadecounter')&&this.counterPending)amount*=1.25;
  if(skill&&this.owns('bloodzero')){
   const paid=this.lifeFees.reduce((total,fee)=>total+(this.time-fee.time<3?fee.amount:0),0);
   amount*=1+Math.min(.15,paid/Math.max(1,this.g.s.hp));
  }
  return amount;
 }
 lifePaid(amount){
  if(!this.owns('bloodzero')||!(amount>0))return;
  const bucket=Math.floor(this.time*10),last=this.lifeFees.at(-1);
  if(last?.bucket===bucket)last.amount+=amount;
  else this.lifeFees.push({bucket,time:this.time,amount});
  if(this.lifeFees.length>31)this.lifeFees.shift();
 }
 revealed(){if(this.owns('stealthpoison'))this.poisonUntil=this.time+1.5;}
 afterHit(enemy,options){
  if(!directHit(options))return;
  if(this.owns('hexsiphon')&&this.time>=this.hexSiphonAt&&Object.entries(enemy.auraDebuffs||{}).some(([key,entry])=>entry.t>0&&!entry.triggerKey&&(key.startsWith('curse:')||entry.ringCurseOrder))){this.hexSiphonAt=this.time+1;this.siphon(.015);}
  this.counterPending=false;
  if(!this.owns('stealthpoison')||this.poisonUntil<=this.time)return;
  this.poisonUntil=0;
  if(enemy.hp<=0)return;
  const g=this.g,source='ring:stealthpoison',rawRate=g.damagePacket(g.s.atk*.25,{damageType:'poison',dot:true,indirect:true,skill:true}).total;
  const rate=g.mitigateDot(rawRate,'poison',enemy);
  if(!(rate>0))return;
  enemy.dots??={};
  enemy.dots[source]={source,damageType:'poison',rawRate,rate,time:3,indirect:true,setSecondary:true};
 }

 moved(){
  if(!this.owns('phasecast'))return;
  this.phasePending=true;
  this.landed();
 }
 landed(){
  if(!this.phasePending||this.g.dashTime>0)return;
  this.phasePending=false;
  this.phaseUntil=this.time+2;
 }
 spellStats(def,context){
  const g=this.g,s=context.actorStats||g.s;
  if(!s.spellDual||!(s.offhandAtk>0)||!damageSpell(def)||!direct(def)||!direct(context))return s;
  const atk=(this.spellHand?s.offhandAtk:s.atk)*(s.spellDualDamageScale??1);
  this.spellHand=1-this.spellHand;
  return {...s,atk};
 }
 placeSpell(def,context,normal){
  if(!damageSpell(def)||!direct(def)||!direct(context))return normal;
  const g=this.g;
  this.landed();
  if(def.type==='ground'&&this.owns('phasecast')&&this.phaseUntil>this.time&&!(g.dashTime>0)){
   this.phaseUntil=0;
   normal={x:g.player.x,y:g.player.y};
  }
  if(this.owns('doubleecho'))this.spellCenter={id:context.castId??def.castId,x:normal.x,y:normal.y};
  return normal;
 }
 paidSpell(def,receipt){
  if(!this.owns('doubleecho')||!def||!receipt||!(receipt.mana>0||receipt.life>0||receipt.rage>0)||def.ringSkipEcho||!damageSpell(def)||!direct(def))return;
  const g=this.g,last=this.lastSpell;
  this.lastSpell={id:def.id,time:this.time};
  if(!last||last.id===def.id||this.time-last.time>4||this.echo)return;
  this.lastSpell=null;
  const p=g.player,center=this.spellCenter?.id===receipt.id?this.spellCenter:def.type==='nova'||def.type==='channel'?p:playerAimPlacement(g,def.range||700,def,p)||g.nearest(p)||p;
  this.echo={x:center.x,y:center.y,at:this.time+.45,ability:def.id,type:def.damageType||'physical',amount:g.s.atk*Math.min(.5,def.damage*.25)};
 }
 update(){
  if(!this.echo||this.echo.at>this.time)return;
  const echo=this.echo,g=this.g;
  this.echo=null;
  if(!this.owns('doubleecho')||g.mode!=='playing'||g.transition||g.training?.finished)return;
  for(const e of g.enemies.filter(e=>e.hp>0&&dist(e,echo)<=100+e.r).slice(0,6))this.secondary(e,echo.amount,echo.type,'doubleecho');
  g.fx(echo.x,echo.y,100,'#beabd8','ring',.25,skillCue({id:echo.ability,damageType:echo.type},'impact'));
 }
 secondary(enemy,amount,damageType,source){
  if(amount>=1)this.g.hit(enemy,amount,true,{source:'ring:'+source,damageType,preScaled:true,noCrit:true,indirect:true,setSecondary:true,ringSecondary:true,ringReflect:source==='blockreflect'});
 }
 auraRecovery(){
  if(!this.owns('bloodaura')||this.time<this.auraRecoveryAt)return;
  const g=this.g;
  if(g.mode!=='playing'||g.hp>=g.s.hp)return;
  this.auraRecoveryAt=this.time+1;
  g.hp=g.healValue(g.s.hp*.015);
 }

 curseSpec(def,context){
  const applies=direct(context)&&direct(def)&&this.owns('cursearea');
  return {radius:(def.radius||180)*(applies?1.35:1),duration:(def.duration||5)*(applies?1.3:1)};
 }
 curseLimit(){return this.owns('cursetriple')?3:this.owns('cursestack')?2:1;}
 curse(enemy,def,context,effectKey,stamp,duration){
  const key='curse:'+effectKey;
  enemy.auraDebuffs??={};
  const debuffs=enemy.auraDebuffs,limit=this.curseLimit();
  if(!direct(def)||!direct(context)||limit===1){
   debuffs[key]={...def.debuff,t:duration,...(context.triggerKey?{triggerKey:context.triggerKey,stamp}:{})};
   return;
  }
  const cast=context.castId??def.castId;
  const previous=Object.entries(debuffs).filter(([,entry])=>entry.ringCurseOrder&&entry.t>0).sort((a,b)=>a[1].ringCurseOrder-b[1].ringCurseOrder);
  if(cast!==undefined&&previous.some(([,entry])=>entry.castId===cast))return;
  while(previous.length>=limit){const [expired]=previous.shift();delete debuffs[expired];}
  if(debuffs[key]?.ringCurseOrder)debuffs['ring:curse:'+debuffs[key].ringCurseOrder]=debuffs[key];
  debuffs[key]={...def.debuff,t:duration,castId:cast,ringCurseId:def.id,ringCurseOrder:++this.curseOrder};
 }
}

export function debuffStrength(values,key){
 let strongest=0,combined=0,rank=0;
 for(const entry of values){
  if(entry.ringCurseOrder)combined+=(entry[key]||0)*(curseWeights[rank++]||0);
  else strongest=Math.max(strongest,entry[key]||0);
 }
 return Math.max(strongest,combined);
}
