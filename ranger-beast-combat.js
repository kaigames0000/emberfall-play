const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const isBeast=ally=>!!ally?.summonSpec?.beast&&['r_wolf','r_bear','r_eagle'].includes(ally.source);
const eagleMark='curse:r_mark:eagle';
const hunterMarks=['curse:r_mark',eagleMark,'curse:r_mark:rotcycle','curse:r_mark:residue'];
export const hasHunterMark=enemy=>hunterMarks.some(key=>enemy?.auraDebuffs?.[key]?.t>0);

// No extra attacks or proc chains: animal attacks use the normal minion pipeline.
export class RangerBeastCombat{
 constructor(game){this.g=game;this.time=0;this.recoveryAt=-Infinity;this.defenseKey='0:0';this.refresh();}
 refresh(){const t=this.g.c?.talents||{};this.focus=!!t.r_packfocus;this.guard=!!t.r_beastguard;this.bond=!!t.r_lifebond;}
 nearby(radius){return (this.g.summons||[]).filter(a=>a.hp>0&&isBeast(a)&&distance(a,this.g.player)<=radius);}
 defense(){if(!this.guard)return {evasion:0,reduce:0};const army=this.nearby(260);return {evasion:army.length?.08:0,reduce:army.some(a=>a.source==='r_bear')?.06:0};}
 applyOwnerBonuses(stats){const mods=this.defense();stats.evasion=(stats.evasion||0)+mods.evasion;stats.reduce=(stats.reduce||0)+mods.reduce;}
 syncDefense(){const mods=this.defense(),key=mods.evasion+':'+mods.reduce;if(key===this.defenseKey)return;this.defenseKey=key;this.g.applyBuffs?.();}
 targetPreference(ally,enemy){return this.focus&&isBeast(ally)&&hasHunterMark(enemy)?90:0;}
 beforeAttack(ally,target,options){if(isBeast(ally))options.beastActor=ally;}
 prepareHit(enemy,options){const ally=options.beastActor;if(!options.minion||options.dot||options.periodic||options.indirect||options.setSecondary||options.triggered||options.triggerKey||!isBeast(ally))return options;const bonus=hasHunterMark(enemy)?(this.focus?.18:0)+(ally.summonSpec.markedBonus||0):0;return {...options,summonFocusBonus:(options.summonFocusBonus||0)+bonus};}
 onHit(enemy,options,lifeLost){
  if(!options.minion||options.dot||options.periodic||options.indirect||options.setSecondary||options.triggered||options.triggerKey||!(lifeLost>0))return;
  const g=this.g,ally=options.beastActor;if(!isBeast(ally)||ally.hp<=0||!g.summons.includes(ally))return;
  const wasMarked=hasHunterMark(enemy),spec=ally.summonSpec;
  if(ally.source==='r_eagle'&&spec.markDuration&&enemy.hp>0){
   const debuffs=enemy.auraDebuffs??={},old=debuffs[eagleMark],armorShred=spec.markArmor||0;
   if(!old||old.t<=0||old.armorShred<=armorShred){
    const t=old?.armorShred===armorShred?Math.max(old.t,spec.markDuration):spec.markDuration;
    debuffs[eagleMark]={t,armorShred,transferred:true,beastMark:true};
    g.aggregateAuraDebuffs(enemy);
   }
  }
  if(!wasMarked||!this.bond||g.mode!=='playing'||g.training||enemy.trainingDummy||distance(ally,g.player)>300||this.time-this.recoveryAt<1-1e-8)return;
  const heal=Math.max(0,Math.min(g.s.hp*.005,g.s.hp-g.hp,g.passiveLeechAllowance??0));if(!heal)return;this.recoveryAt=this.time;g.hp=g.healValue(heal);g.passiveLeechAllowance=Math.max(0,(g.passiveLeechAllowance??0)-heal);
 }
 update(dt){this.time+=Math.max(0,dt);this.syncDefense();}
}
