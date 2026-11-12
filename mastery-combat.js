const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class MasteryCombat{
 constructor(r){this.r=r;this.g=r.g;this.collectAfterBlink=false;this.harvestTarget=null;this.harvestCount=0;}
 prepare(def){const g=this.g;
  if(def.id==='a_execute'&&this.collectAfterBlink&&g.ability('a_blink')?.m10){this.collectAfterBlink=false;const t=g.nearest();if(t&&dist(t,g.player)<140){const n=dist(t,g.player)||1,x=t.x+(t.x-g.player.x)/n*50,y=t.y+(t.y-g.player.y)/n*50;if(this.r.assassin.legal(x,y)){g.player.x=x;g.player.y=y;}}}
  if(def.id==='a_blades'&&def.m6)def={...def,trap:{...def.trap,range:400}};
  return def;
 }
 beforeHit(e,amount,o){const g=this.g,id=o.id||o.ability;if(o.indirect||o.dot||o.minion||o.triggered||o.periodic)return amount;
  const daggerOpening=g.c.cls==='wanderer'&&(id==='a_shuriken'||id==='a_execute'||o.basicAttack&&g.c.equipment.weapon?.weaponType==='dagger');
  if((id==='a_stab'||daggerOpening)&&g.ability('a_blink')?.m3&&this.r.assassin.backstabUntil>this.r.assassin.time){this.r.assassin.backstabUntil=0;o.backstab=true;amount*=1.2;}
  if(id==='r_snipe'&&o.fullCharge)e.arrowChargedUntil=this.r.time+2;if(id==='a_execute'){const def=g.ability(id);if(def?.m6)e.transferShadowOnKill=true;const marks=Math.max(e.shadowMarks||0,g.c.cls==='wanderer'?this.r.assassin.pins(e):0);if(marks>=3&&g.ability('a_mark')?.m10){e.auraDebuffs??={};e.auraDebuffs['execute-residue']={armorShred:.06,weaken:.08,t:2};}}
  if(e.arrowFragment&&id?.startsWith('r_')){e.arrowFragment=false;this.r.secondary(e,g.s.atk*.2,'physical','r_ricochet');}
  return amount;
 }
 afterHit(e,o,harvest=false){const g=this.g,id=o.id||o.ability,def=g.ability(id);
  if(!o.indirect&&!o.dot&&!o.minion&&!o.triggered&&!o.periodic&&o.backstab&&g.ability('a_mark')?.m6&&e.auraDebuffs?.['curse:a_mark']){
   const mark=e.auraDebuffs['curse:a_mark'];mark.t=Math.min(8,mark.t+.8);
  }
  if(!def)return;
  if(id==='r_rain'&&o.periodic&&!o.setSecondary){if(def.m3&&e.arrowMarkUntil>this.r.time)e.arrowMarkUntil=Math.min(this.r.time+4,e.arrowMarkUntil+.25);if(def.m6&&o.remaining<1.1&&!o.residual&&g.rangerCombat.clouds.some(c=>dist(c,e)<=c.r)&&this.r.oncePer('rain-residue',o.castId)&&g.hazards.length<60)g.hazards.push({...o,x:e.x,y:e.y,r:80,t:.5,max:.5,remaining:1,interval:.5,damage:g.s.atk*.12,friendly:true,periodic:true,residual:true,indirect:true,setSecondary:true,noCrit:true,color:def.color});return;}
  if(o.indirect||o.dot||o.minion||o.triggered||o.periodic)return;
  const ritualStrike=id==='b_cleave'||g.c.cls==='wanderer'&&id!=='b_execute'&&!o.vx&&o.tag==='attack'&&g.weapon().kind==='melee';
  if(ritualStrike&&g.ability('b_ritual')?.m6&&g.skillEffects.some(b=>b.id==='b_ritual'&&b.t>0))e.harvestBlood=true;
  if(id==='b_execute'&&e.harvestBlood){e.harvestBlood=false;this.r.blood.recovery=Math.min(g.s.hp*.02,this.r.blood.recovery+g.s.hp*.005);this.r.blood.recover();}
  if(id==='b_execute'){
   if(def.m6&&e.hp<=0&&!g.training){
    if(g.c.cls==='wanderer'){if(this.r.oncePer('execute-rage',o.castId))this.r.blood.rage=Math.min(100,this.r.blood.rage+6);}
    else this.r.comboUntil=this.r.time+2;
   }
   if(harvest){
    if(def.m10&&this.r.oncePer('harvest-streak',o.castId)){
     if(this.harvestTarget!==e){this.harvestTarget=e;this.harvestCount=0;}
     if(e.type==='boss'&&++this.harvestCount%3===0)this.r.secondary(e,g.s.atk*.35,'physical',id);
    }
    const dread=e.auraDebuffs?.['curse:b_dread'];
    if(dread?.t>0&&g.ability('b_dread')?.m6)dread.t=Math.min(8,dread.t+.5);
   }
   if(g.ability('b_leap')?.m10&&o.rageSpent&&this.r.oncePer('leap-refund',o.castId))g.skillCooldowns.b_leap=Math.max(0,(g.skillCooldowns.b_leap||0)-.8);
  }
  if(id==='b_leap'){if(def.m3)for(const t of this.r.targets(def.radius,g.player,8))if(!['boss','miniboss'].includes(t.type)){const n=dist(t,g.player)||1;g.moveActor(t,(t.x-g.player.x)/n*20,(t.y-g.player.y)/n*20,false);}if(g.ability('b_avatar')?.m6&&this.r.avatarWas&&!this.avatarLanding){this.avatarLanding=true;for(const t of this.r.targets(140,g.player,6))this.r.secondary(t,g.s.atk*.3,'physical',id);}}
  if(id==='r_snipe'&&o.fullCharge)e.arrowChargedUntil=this.r.time+2;
  if(id==='r_ricochet'&&def.m10&&o.chain?.jumps===0)e.arrowFragment=true;
  if(id==='r_pierce'&&def.m10&&o.pierce===0&&this.r.oncePer('arrow-fragments',o.castId)){const a=Math.atan2(o.vy||0,o.vx||1);for(const sign of [-1,1])g.shoot(e.x,e.y,a+sign*.5,450,g.s.atk*.15,def.color,0,4,false,{ability:id,damageType:'physical',skill:true,indirect:true,setSecondary:true,noCrit:true,hit:new Set(o.hit||[e])});}
 }
 onKill(e){
  const g=this.g;
  if(e.transferShadowOnKill){const other=this.r.targets(160,e,1)[0];if(other)other.shadowMarks=Math.min(3,(other.shadowMarks||0)+1);}
  const hit=g._identityHit,markedPierce=g.c.cls==='wanderer'&&e.auraDebuffs?.['curse:r_mark']?.t>0&&hit?.enemy===e&&hit.direct&&(hit.options.id||hit.options.ability)==='r_pierce';
  if(g.ability('r_mark')?.m10&&(e.arrowChargedUntil>this.r.time||markedPierce)){
   const nearby=this.r.targets(180,e,2),other=markedPierce?nearby[1]??nearby[0]:nearby[0];
   if(other){other.auraDebuffs??={};other.auraDebuffs['curse:r_mark:residue']={armorShred:.06,t:2,transferred:true};}
  }
 }
 projectileImpact(b,e){const g=this.g,id=b.id||b.ability;if(b.triggered||b.indirect)return;if(id==='r_volley'&&g.ability(id)?.m3&&e.arrowMarkUntil>this.r.time&&!b.volleyPierced){b.volleyPierced=true;b.pierce++;}if(id==='r_poisonarrow'&&g.ability(id)?.m10&&!b.poisonPierced&&Object.values(e.dots||{}).some(d=>d.rangerPoison)){b.poisonPierced=true;b.pierce++;}}
 projectileEnd(b){this.g.gameplay?.talents.projectileEnd(b);if(b.endEffectDone||b.triggered||b.indirect||b.hostile)return;b.endEffectDone=true;const id=b.id||b.ability;if(id==='r_poisonarrow'&&this.g.ability(id)?.m10&&b.hit?.size)this.g.rangerCombat.cloud(b,id,this.g.s.atk*.08,{t:1,max:1,r:45});}
 afterPerform(def){if(def.id==='b_dread'&&def.m10)for(const e of this.g.enemies)if(e.auraDebuffs?.['curse:b_dread'])e.dreadAuraWas=true;}
 trap(t){const g=this.g;if(t.source==='a_blades'&&t.def.m10&&g.c.talents.a_mine)for(const e of this.r.targets(t.r+60,t,8))if(dist(t,e)>t.r+e.r)this.r.secondary(e,g.s.atk*.2,'physical',t.source);if(t.mode==='proximity')for(const turret of g.rangerCombat.traps)if(turret.source==='a_sentry'&&turret.def.m6&&dist(t,turret)<250)turret.tick=0;}
 update(){const g=this.g;if(!this.r.avatarWas)this.avatarLanding=false;for(const e of g.enemies)if(e.dreadAuraWas&&!e.auraDebuffs?.['curse:b_dread']){e.dreadAuraWas=false;e.auraDebuffs??={};e.auraDebuffs['dread-residue']={armorShred:.06,t:1.5};g.aggregateAuraDebuffs(e);}}

}
