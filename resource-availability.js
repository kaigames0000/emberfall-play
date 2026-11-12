import {resourceCost,sumResourceCosts,summonUnitResourceCost,auraLoadout,movementSkill,skillCategory,summonPlan} from './model.js?v=140';
import {requiredSkillWeapon,skillWeaponFailure} from './skill-weapon-rules.js?v=129';
const empty=()=>({mana:0,life:0,rage:0});
export function installResourceAvailability(Game){
 const P=Game.prototype;
 P.resourceFailure=function(cost,floor=1){const s=this.s;if(cost.mana>(s.mana||0)+1e-8)return '最大魔力不足，需要 '+Math.ceil(cost.mana)+' MP。';if(cost.life>Math.max(0,s.hp-floor)+1e-8)return '生命成本超過可支付上限。';if(cost.rage>100)return '狂怒成本超過上限。';if((this.mana||0)+1e-8<cost.mana)return '魔力不足，需要 '+Math.ceil(cost.mana)+' MP。';if(this.hp-cost.life<floor-1e-8)return '生命不足，需要 '+Math.ceil(cost.life)+' HP，須保留 '+Math.ceil(floor)+' HP。';if((this.gameplay?.blood.rage||0)+1e-8<cost.rage)return '狂怒不足，需要 '+Math.ceil(cost.rage)+'。';return '';};
 P.canPayResourceCost=function(cost,floor=1){return !this.resourceFailure(cost,floor);};
 P.payResourceCost=function(cost,metadata={}){if(!this.canPayResourceCost(cost,metadata.floor??1))return null;if(this.gameplay?.blood)return this.gameplay.blood.payCost(cost,metadata.castId??++this.gameplay.sequence,metadata);this.hp-=cost.life;this.mana=Math.max(0,this.mana-cost.mana);return {...cost,id:metadata.castId??0,spent:cost.rage};};
 P.skillCooldown=function(def){if(typeof def==='string')def=this.ability(def);if(!def)return 0;if(def.id==='a_blink')return Math.max(1,2.5/(1+(this.s.movementRecovery||0)));if(def.type==='channel'||def.type==='aura')return 0;const seconds=(def.cooldown||0)*(1-this.s.cdr);return def.designV29?Math.max(.08,seconds/(def.type==='dash'?1+(this.s.movementRecovery||0):(def.cooldown||0)<=.65?Math.max(.25,this.s.haste):1)):seconds;};
 P.abilityInterval=function(def){if(typeof def==='string')def=this.ability(def);if(!def)return 0;if(def.type==='aura')return this.auraPulseInterval(def);if(def.type==='channel')return def.designV29?this.gameplay.channelInterval(def):Math.max(.08,def.interval/Math.max(.25,this.s[def.speedStat]||1));if(def.type==='charge')return Math.max(.35,(def.chargeTime||.9)/Math.max(.25,this.s.haste||1)*(this.gameplay?.quickCharge?.6:1));if(def.combo)return Math.max(.06,def.combo.interval/Math.max(.25,this.s.haste));return def.interval||0;};
 P.auraResourceCost=function(def,seconds=1){if(typeof def==='string')def=this.ability(def);if(!def)return empty();return resourceCost({...def,resourceDrain:true,mana:def.drain||0,lifeCost:undefined,lifePerSecond:def.lifePerSecond||0,rageCost:0},this.s,seconds);};
 P.summonResourceCost=function(plan=summonPlan(this.c,this.s)){return sumResourceCosts((plan?.rows||[]).map(row=>{const unit=summonUnitResourceCost(this.ability(row.id),this.s);return {mana:unit.mana*row.count,life:unit.life*row.count,rage:unit.rage*row.count};}));};
 P.actionStateFailure=function(camp=false,{ignorePause=false}={}){if(this.training?.finished)return '訓練已結束。';if(this.mode==='dead')return '角色已死亡。';if(!(camp?['camp','playing']:['playing']).includes(this.mode))return camp?'目前無法執行此操作。':'需進入戰鬥區域。';if(this.transition)return '正在切換區域。';if(this.paused&&!ignorePause)return '遊戲已暫停。';return '';};
 P.skillAvailability=function(id,{source='manual',ignorePause=source==='preview'}={}){
  const def=this.ability(id),base={usable:false,reason:'尚未學會或裝備此技能。',cost:empty(),cooldown:0,interval:0};if(!def)return base;
  const interval=this.abilityInterval(def),cost=resourceCost(def,this.s,def.type==='channel'&&def.designV29?interval:1),category=skillCategory(def),active=this.auraIds.has(id),stopping=active||this.channel?.id===id&&source!=='auto',assassinState=this.gameplay?.assassin;let cooldown=def.id==='a_blink'&&assassinState?(assassinState.charges?assassinState.lock:Math.max(0,Math.max(1,2.5/(1+(this.s.movementRecovery||0)))-assassinState.recharge)):Math.max(0,this.skillCooldowns[id]||0);const drain=def.type==='aura'?this.auraResourceCost(def):empty(),result={...base,cost,cooldown,interval,cooldownDuration:this.skillCooldown(def),active,action:stopping?(def.type==='charge'?'release':'stop'):'cast',drain,lifeFloor:drain.life>0?this.s.hp*.2:1};
  const requiredWeapon=requiredSkillWeapon(id),weaponFailure=skillWeaponFailure(this.c,id);
  Object.assign(result,{requiredWeapon,weaponCompatible:!weaponFailure});
  if(stopping&&!weaponFailure)return {...result,usable:true,reason:'',cost:empty()};
  let reason=weaponFailure||this.actionStateFailure(category==='aura'||category==='summon',{ignorePause});if(!reason&&category==='aura'&&!auraLoadout(this.c).includes(id))reason='請先在光環配置選擇此技能。';
  if(!reason&&cooldown>1e-8)return {...result,reason:'技能尚在冷卻（'+cooldown.toFixed(1)+' 秒）。',blockedByCooldown:true};
  const assassin=this.gameplay?.assassin;if(!reason&&assassin){const error=this.skillError;if(!assassin.canStart(def))reason=this.skillError||'技能目前無法使用。';this.skillError=error;if(!reason&&id==='a_blink'&&!assassin.landing(def))reason='找不到安全落點。';}
  if(!reason)reason=this.resourceFailure(cost,def.type==='aura'&&result.drain.life>0?this.s.hp*.2:1);return {...result,usable:!reason,reason};
 };
 P.actionAvailability=function(action,options={}){
  const base={usable:false,reason:'操作無效。',cost:empty(),cooldown:0};
  if(action==='dodge'){
   const id=movementSkill(this.c);if(id)return this.skillAvailability(id,options);
   const cooldown=Math.max(0,this.dodgeCD||0),failure=this.actionStateFailure(false,options),blockedByCooldown=!failure&&cooldown>1e-8;
   const reason=failure||(blockedByCooldown?'翻滾尚在冷卻（'+cooldown.toFixed(1)+' 秒）。':'');
   return {...base,usable:!reason,reason,cooldown,blockedByCooldown,cooldownDuration:1.6*(1-this.s.cdr)*(this.s.dodgeCDMultiplier??1)};
  }
  if(action==='auras'){const ids=auraLoadout(this.c),cost=sumResourceCosts(ids.map(id=>resourceCost(this.ability(id),this.s))),drain=sumResourceCosts(ids.map(id=>this.auraResourceCost(id))),lifeFloor=drain.life>0?this.s.hp*.2:1;if(this.auraIds.size)return {...base,usable:true,reason:'',active:true,action:'stop',drain,lifeFloor};let reason=this.actionStateFailure(true,options);if(!reason&&!ids.length)reason='請先在光環配置選擇技能。';if(!reason)reason=this.resourceFailure(cost,lifeFloor);return {...base,usable:!reason,reason,cost,drain,lifeFloor,active:false};}
  if(action==='summon'){
   const plan=summonPlan(this.c,this.s),cost=this.summonResourceCost(plan),cooldown=Math.max(0,this.summonCD||0);
   let reason=this.actionStateFailure(true,options);
   const blockedByCooldown=!reason&&cooldown>1e-8;
   if(blockedByCooldown)reason='召喚編隊正在準備中（'+cooldown.toFixed(1)+' 秒）。';
   if(!reason&&!plan.valid)reason=plan.reason;
   if(!reason&&!plan.count&&!this.summons.length)reason='請先在召喚編隊配置數量。';
   if(!reason)reason=this.resourceFailure(cost);
   return {...base,usable:!reason,reason,cost,cooldown,blockedByCooldown,cooldownDuration:1,plan};
  }
  return base;
 };
}
