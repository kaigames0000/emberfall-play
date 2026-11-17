import {ABBEY_ENCOUNTERS} from './route-model.js?v=158';

const sealId = 'abbey-reinforcement';
const fireId = 'abbey-fire';
const guardId = 'abbey-stand';
const bossAdds = 'boss-adds';
const bossFire = 'boss-fire';
const guardRadius = 166;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

export function abbeyObjectiveIds(encounter,difficulty) {
 if(encounter==='abbey-seals')return difficulty===3?[sealId,fireId]:[sealId];
 return encounter==='abbey-guard'?[guardId]:[];
}

export class AbbeyCombat {
 constructor(game) {
  this.g=game;
  this.enter(null);
 }

 enter(encounter,combatDone=false) {
  this.encounter=encounter;
  this.leaderDown=false;
  this.guardRemaining=10+2*this.g.diff;
  this.addIn=3.5;
  this.fireIn=5;
  this.added=0;
  this.phase=false;
  this.chosenWard=null;
  if(encounter==='abbey-seals') {
   this.addObjective(sealId,'召援祭壇',this.g.diff===3?360:460,465,'關閉',combatDone);
   if(this.g.diff===3)this.addObjective(fireId,'火線祭壇',760,465,'關閉',combatDone);
  }
  if(encounter==='abbey-guard')this.addObjective(guardId,'封印石碑',560,440,'啟動',combatDone);
 }

 addObjective(id,name,x,y,verb,used=false) {
  const objective={id,kind:'crystal',name,x,y,verb,used,usedLabel:verb==='啟動'?'已啟動':'已封閉'};
  this.g.objectives.push(this.g.placeActor(objective,x,y));
  return objective;
 }

 get roomTrial() {return this.encounter==='abbey-seals'||this.encounter==='abbey-guard';}
 get king() {return this.encounter==='abbey-boss';}
 objective(id) {return this.g.objectives.find(entry=>entry.id===id);}
 isActive(id) {const altar=this.objective(id);return !!altar&&!altar.used;}

 spawn() {
  const g=this.g,guard=this.encounter==='abbey-guard',difficulty=g.diff;
  const leader=g.addEnemy(guard?'shield':'caster',560,300);
  if(!leader)return false;
  leader.abbeyLeader=true;
  leader.name=guard?'封印隊長':'守印祭司';
  leader.hp*=guard?1.8:2.8;
  leader.maxHp=leader.hp;
  for(let i=0;i<3+difficulty*2;i++) {
   const left=i%2===0;
   const type=i===2&&difficulty>=2?'shield':i%3===1?'archer':'melee';
   g.addEnemy(type,(left?320:800)+(left?1:-1)*Math.floor(i/2)*45,390+Math.floor(i/2)*38);
  }
  return true;
 }

 onActivate(objective) {
  if(objective.id===bossAdds||objective.id===bossFire) {
   this.chosenWard=objective.id;
   const other=this.objective(objective.id===bossAdds?bossFire:bossAdds);
   if(other)other.locked=true;
  }
  if(objective.id===fireId||objective.id===bossFire) {
   this.g.hazards=this.g.hazards.filter(hazard=>hazard.abbeyWard!==objective.id);
  }
 }

 onKill(enemy) {
  if(!this.roomTrial||!enemy.abbeyLeader||this.leaderDown)return;
  this.leaderDown=true;
  if(this.encounter==='abbey-guard')this.guardRemaining=Math.max(0,this.guardRemaining-5);
  this.g.expedition.onRoomCleared();
 }

 get canClear() {
  return this.encounter==='abbey-seals'?this.leaderDown:
   this.encounter==='abbey-guard'&&!!this.objective(guardId)?.used&&this.guardRemaining<=0;
 }

 finishRoom() {
  const g=this.g;
  for(const enemy of g.enemies)g.enemyCombat.cancel(enemy);
  g.enemies=[];
  g.bullets=g.bullets.filter(bullet=>!bullet.hostile);
  g.hazards=g.hazards.filter(hazard=>hazard.friendly);
  g.enemyFields=[];
  for(const objective of g.objectives)objective.used=true;
 }

 checkpoint() {
  if(this.king&&this.chosenWard)return {bossWard:this.chosenWard};
  if(!this.roomTrial)return undefined;
  return {leaderDown:this.leaderDown,remaining:this.guardRemaining,added:this.added};
 }

 restore(state) {
  if(this.king&&state?.bossWard)this.chosenWard=state.bossWard;
  if(!this.roomTrial||!state)return;
  this.leaderDown=state.leaderDown;
  this.guardRemaining=state.remaining;
  this.added=state.added;
  if(this.leaderDown)this.g.enemies=this.g.enemies.filter(enemy=>!enemy.abbeyLeader);
 }

 addPack(origin,count,cap) {
  const g=this.g;
  for(let index=0;index<count&&this.added<cap;index++) {
   const side=(this.added%2===0?-1:1);
   const enemy=g.addEnemy(this.added%3===2?'archer':'melee',origin.x+side*(110+index*40),origin.y-70,true);
   if(!enemy)break;
   enemy.name='灰燼援軍';
   enemy.damageScale*=.65;
   enemy.cd=Math.max(enemy.cd,1);
   this.added++;
  }
 }

 fire(ward,delay) {
  const g=this.g;
  if(g.hazards.filter(hazard=>!hazard.friendly).length>=10)return;
  const bounds=g.worldBounds(),y=g.player.y;
  const center=Math.max(bounds.left+228,Math.min(bounds.right-228,g.player.x));
  const source=g.enemies.find(enemy=>this.king?enemy.type==='boss':enemy.abbeyLeader);
  const damage=(16+4*g.diff)*(source?.damageScale??1);
  for(const dx of [-210,-105,0,105,210]) {
   const point=g.clampWorldPoint(center+dx,y,18),before=g.hazards.length;
   g.hazard(point.x,point.y,51,damage,delay,'fire',source);
   if(g.hazards.length>before)g.hazards.at(-1).abbeyWard=ward;
  }
 }

 hasBoon(room) {
  const expedition=this.g.expedition;
  return expedition.path.slice(0,-1).some(id=>expedition.clearedNodes.has(id)&&
   expedition.graph.nodes.find(node=>node.id===id)?.encounter===room);
 }

 update(dt) {
  const g=this.g;
  if(!this.encounter||g.cleared||g.mode!=='playing'||g.training||g.transition)return;
  if(this.king) {
   const boss=g.enemies.find(enemy=>enemy.type==='boss'&&enemy.hp>0);
   if(!boss)return;
   if(!this.phase&&boss.hp<=boss.maxHp*.5) {
    this.phase=true;
    this.addObjective(bossAdds,'召援祭壇',340,445,'關閉');
    this.addObjective(bossFire,'火線祭壇',780,445,'關閉');
    const saved=this.objective(this.chosenWard);
    if(saved){saved.used=true;this.onActivate(saved);}
    g.emit('objective');
   }
   if(!this.phase)return;
   this.addIn-=dt;
   this.fireIn-=dt;
   if(this.addIn<=0) {
    this.addIn=7;
    if(this.isActive(bossAdds))this.addPack(this.objective(bossAdds),Math.max(1,(g.diff===1?2:3)-Number(this.hasBoon('abbey-seals'))),8);
   }
   if(this.fireIn<=0) {
    this.fireIn=7;
    if(this.isActive(bossFire))this.fire(bossFire,this.hasBoon('abbey-guard')?2.1:1.6);
   }
   return;
  }

  const guarding=this.guardZone();
  if(guarding?.used&&distance(g.player,guarding)<=guardRadius)this.guardRemaining=Math.max(0,this.guardRemaining-dt);
  if(this.canClear) {
   g.expedition.onRoomCleared();
   return;
  }
  this.addIn-=dt;
  if(this.addIn<=0) {
   this.addIn=5;
   const origin=this.isActive(sealId)?this.objective(sealId):guarding?.used?guarding:null;
   if(origin)this.addPack(origin,g.diff===1?2:3,4+g.diff*2);
  }
  if(this.isActive(fireId)) {
   this.fireIn-=dt;
   if(this.fireIn<=0) {
    this.fireIn=7;
    this.fire(fireId,1.6);
   }
  }
 }

 guardZone() {
  const seal=this.objective(guardId);
  return seal&&!this.g.cleared?{...seal,radius:guardRadius}:null;
 }

 status() {
  if(this.g.cleared)return '';
  if(this.encounter==='abbey-seals')return this.g.objectives.some(entry=>!entry.used)?
   '可先關祭壇 · 擊倒祭司開門':'祭壇已封閉 · 擊倒守印祭司';
  if(this.encounter==='abbey-guard') {
   const zone=this.guardZone();
   if(!zone?.used)return '啟動封印石碑';
   const countdown=Math.ceil(this.guardRemaining)+' 秒';
   return distance(this.g.player,zone)<=zone.radius?'守印 '+countdown:'回到印圈 · '+countdown;
  }
  if(this.king&&this.phase) {
   const chosen=this.g.objectives.find(entry=>entry.used);
   return chosen?(chosen.id===bossFire?'火線已封閉 · 召援持續':'召援已封閉 · 火線持續'):'擇一封閉 · 召援或火線';
  }
  return '';
 }

 reward() {return ABBEY_ENCOUNTERS[this.encounter]?.material;}
}
