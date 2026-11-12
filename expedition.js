import {decorateRank} from './enemy-rarity.js?v=108';
import {ROOM_SCALE,expandPoint} from './world-space.js?v=108';
import {setEnemyDefense} from './elemental-rules.js?v=108';
import {terrainFor} from './room-terrain.js?v=108';
import {createRiftRoute,seededRng} from './rift-model.js?v=140';
import {chapterDefinition,ALL_MINIBOSSES} from './chapter-data.js?v=108';
import * as WorldModel from './model.js?v=140';
import {ROOM_TYPES,MINIBOSSES3,createRoute,routeNode,routeChoices} from './route-model.js?v=140';

const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const POOLS=[['melee','skirmisher','charger','archer','bomber','shield'],['shield','archer','melee','skirmisher','bomber','charger'],['caster','wraith','summoner','archer','bomber','melee'],['shield','wraith','caster','charger','summoner','skirmisher','bomber','melee']];

export class Expedition{
 constructor(g){this.g=g;this.graph=null;this.currentID=null;this.selectedID=null;this.path=[];this.clearedNodes=new Set();this.enteredNodes=new Set();this.hazardTimer=4;}
 start(seed,chapter=1){this.chapter=chapter;this.graph=this.g.runContext&&this.g.runContext.kind!=='campaign'?createRiftRoute(this.g.runContext):createRoute(seed,this.g.diff,chapter);this.currentID=this.graph.startID;this.selectedID=null;this.path=[this.currentID];this.clearedNodes.clear();this.enteredNodes.clear();return this.graph;}
 currentNode(){return routeNode(this.graph,this.currentID);}
 currentRoom(){
  const chapter=chapterDefinition(this.g.chapter||1),rooms=chapter.rooms,node=this.currentNode(),layer=node?.layer??clamp(this.g.room||0,0,7),type=node?.type??(layer===7?'boss':layer===3?'miniboss':'normal'),meta=ROOM_TYPES[type],boss=node?.bossKey?ALL_MINIBOSSES[node.bossKey]:null;
  const bossRoom=type==='boss'||type==='miniboss';
  const waves=type==='recovery'?0:type==='trial'?3:type==='treasure'||bossRoom&&!this.g.hordeTrialEnabled?1:2;
  return {...rooms[layer],...meta,type,layer,nodeID:node?.id??null,name:this.g.runContext?.kind&&this.g.runContext.kind!=='campaign'?node.name:boss?.name??(type==='boss'?rooms[7].name:rooms[layer].name),sub:boss?`${meta.label} · ${boss.name}`:meta.label,desc:boss?.desc??meta.desc,waves,count:type==='treasure'?8:bossRoom?1:type==='trial'?Math.min(24,rooms[layer].count+4):rooms[layer].count,bossKey:node?.bossKey??null,element:boss?.element??null};
 }
 choices(){return routeChoices(this.graph,this.currentID);}
 choose(id){
  const fail=reason=>({ok:false,reason}),g=this.g,node=routeNode(this.graph,id),current=this.currentNode();
  if(g.training||g.mode!=='playing'||!g.cleared)return fail('請先完成目前房間。');
  if(g.transition||this.selectedID)return fail('正在前往下一個房間。');
  if(!current||!node||node.layer!==current.layer+1||!current.next.includes(id))return fail('請選擇目前房間連接的下一層路線。');
  this.selectedID=id;return {ok:true,to:node.layer};
 }
 enterRoom(){
  if(!this.graph)return false;
  if(this.selectedID){this.currentID=this.selectedID;this.selectedID=null;if(this.path.at(-1)!==this.currentID)this.path.push(this.currentID);}
  if(this.enteredNodes.has(this.currentID))return false;
  const g=this.g,room=this.currentRoom();if(g.runContext&&g.runContext.kind!=='campaign'){g.runContext.room=room.layer;g.rand=seededRng(g.runContext.seed+':'+this.currentID);}this.enteredNodes.add(this.currentID);g.room=room.layer;g.wave=0;g.waveWait=0;g.cleared=false;g.bossRage=false;g.eventTimer=5;g.bossAdds=9;g.shrines=[];g.objectives=[];this.hazardTimer=3.8;this._eliteRoomIssued=0;this._purpleIssued=false;g.expeditionRisk?.enterRoom();
  g.terrain=!g.runContext||g.runContext.kind==='campaign'?terrainFor(g.chapter||1,room.layer,ROOM_SCALE):terrainFor(0,0,ROOM_SCALE);
  if(g.terrain){
   g.placeActor(g.player,g.player.x,g.player.y);
   for(const ally of g.summons)g.placeFollower(ally);
  }
  g.encounter={name:room.name,desc:room.desc,extra:room.layer<2?'charger':'caster',hazard:room.type==='trial'?'trial':room.layer===1?'cross':room.layer===2?'runes':room.layer===5?'pulse':null};
  g.horde?.enterRoom(room);
  if(room.type==='recovery'){
   g.hp=g.s.hp;g.mana=g.s.mana;g.refillFlasks(Infinity);for(const flask of g.flasks)flask.cooldown=0;
   const keys=Object.keys(WorldModel.SHRINES).filter(key=>WorldModel.SHRINES[key].buff);for(let i=0;i<2&&keys.length;i++){const index=this.roll(keys.length),type=keys.splice(index,1)[0];g.shrines.push(g.placeActor({type,used:false,recoveryChoice:true},460+i*200,550));}
   this.onRoomCleared();
  }else{
   this.spawnWave();if(room.layer>0&&room.type!=='miniboss'&&room.type!=='boss'&&g.rand()<.4){const keys=Object.keys(WorldModel.SHRINES),type=keys[this.roll(keys.length)];g.shrines=[g.placeActor({type,used:false},560,580)];}
  }
  if(room.type!=='recovery')g.chapterCombat?.enterRoom();for(const objective of g.objectives??[])g.placeActor(objective,objective.x,objective.y);return true;
 }
 roll(length){return Math.min(length-1,Math.max(0,Math.floor(this.g.rand()*length)));}
 spawnWave(){
  const g=this.g,room=this.currentRoom(),bossRoom=room.type==='boss'||room.type==='miniboss';
  if(g.training||g.cleared||g.wave>=room.waves||g.enemies.length||g.horde?.pending)return false;
  if(this._eliteBudgetNode!==this.currentID){this._eliteBudgetNode=this.currentID;this._eliteRoomIssued=0;this._purpleIssued=false;}
  g.wave++;g.beginLootWave();
  if(g.horde?.active&&(!bossRoom||g.wave<room.waves))return g.horde.beginWave();
  if(bossRoom)g.encounter={...g.encounter,name:room.name,desc:room.desc};
  if(room.type==='boss')g.addEnemy('boss',560,230);
  else if(room.type==='miniboss')this.spawnMiniBoss(room.bossKey??'jailer');
  else{
   const pool=(this.chapter>1?chapterDefinition(this.chapter).enemies.map(e=>e.type):POOLS[Math.min(3,room.layer)]),offset=(g.wave-1+this.roll(pool.length))%pool.length,spawned=[],count=g.expeditionRisk?.packCount(room.count)??room.count;
   for(let i=0;i<count&&g.enemies.length<48;i++){
    const a=i/count*Math.PI*2+g.wave*.2,point=expandPoint(560+Math.cos(a)*(310+g.rand()*65),370+Math.sin(a)*220),enemy=g.addEnemy(pool[(i+offset)%pool.length],point.x,point.y);if(enemy)spawned.push(enemy);
   }
   const requested=room.type==='elite'?2+this.roll(2):room.layer===0&&g.wave===1?0:this.roll(4),budget=room.type==='elite'?requested:Math.min(requested,Math.max(0,3-(this._eliteRoomIssued||0))),candidates=spawned.filter(enemy=>enemy.type!=='skeleton'&&enemy.type!=='elite'&&!enemy.elite);
   for(let i=0;i<budget&&candidates.length;i++){const enemy=candidates.splice(this.roll(candidates.length),1)[0];if(g.promoteElite(enemy))this._eliteRoomIssued=(this._eliteRoomIssued||0)+1;if(enemy.eliteCD)enemy.eliteCD+=i*1.5;}
   const normals=spawned.filter(e=>!e.elite&&e.type!=='elite'&&e.type!=='skeleton');if(normals.length&&g.rand()<.22){const count=Math.min(normals.length,2+this.roll(3));for(const enemy of normals.slice(0,count)){enemy._rankBase={hp:enemy.maxHp,damage:enemy.damageScale,speed:enemy.speed,armor:enemy.armor,r:enemy.r,attackSpeed:enemy.attackSpeed};decorateRank(enemy,'blue');}}
   for(const enemy of spawned)this.scaleEnemy(enemy);
   const elites=spawned.filter(e=>e.elite);if(elites.length)g.emit('elites',{names:elites.map(e=>e.name),traits:elites.map(e=>e.elite.trait)});
  }
  g.emit('wave');return true;
 }
 scaleEnemy(enemy){
  if(!enemy||!this.currentID||enemy._routeScaleNode===this.currentID)return enemy;
  const type=this.currentRoom().type,hp=type==='welfare'?.65:type==='trial'?1.15:1,damage=type==='welfare'?.65:type==='trial'?1.25:1;
  enemy.hp*=hp;enemy.maxHp*=hp;enemy.damageScale*=damage;enemy._routeScaleNode=this.currentID;return this.g.expeditionRisk?.decorate(enemy)??enemy;
 }
 spawnMiniBoss(key){
  const g=this.g,def=ALL_MINIBOSSES[key]??MINIBOSSES3.jailer;if(g.enemies.length>=48)return null;const enemy=g.spawn('elite',560,250);
  Object.assign(enemy,{type:'miniboss',minibossKey:def.key,name:def.name,elite:null,r:38,speed:def.speed,cd:2,specialCD:5,phase:0,addsSpawned:0,halfTriggered:false,charge:null,color:def.color});enemy.hp*=def.hpMultiplier;enemy.maxHp=enemy.hp;enemy.damageScale*=1.1;enemy.armor+=8;setEnemyDefense(enemy,g.diff,def.element);enemy.enemyRank='red';enemy.rankLabel='特化首領';enemy.rankColor='#df8277';enemy.rankAura=null;enemy.rankTraits=[];this.scaleEnemy(enemy);g.enemies.push(enemy);return enemy;
 }
 roomLoot(){const room=this.currentRoom();return {roomLootMultiplier:room.lootMultiplier,roomRarityBonus:room.rarityBonus};}
 onRoomCleared(){
  const g=this.g,room=this.currentRoom();if(!g.chapterCombat?.roomReady()||!this.currentID||this.clearedNodes.has(this.currentID)||g.enemies.length||g.horde?.pending||g.wave<room.waves)return false;
  this.clearedNodes.add(this.currentID);g.cleared=true;if(!g.runContext||g.runContext.kind==='campaign')WorldModel.completeZone(g.c,g.diff,room.layer,g.chapter||1);
  if(room.type==='treasure'){const keys=['reforge','reroll','chisel','ascend'],key=keys[this.roll(keys.length)];g.emit('resourceLoot',{gold:0,materials:[{key,count:1}],gems:[]});g.fx(560,340,90,'#e4c16e','shock',.8);}
  g.horde?.flushGold();g.collectAll();g.emit('clear');return true;
 }
 onShrineActivated(shrine){if(this.currentRoom().type!=='recovery'||!this.g.shrines.includes(shrine)||!shrine.recoveryChoice)return false;for(const choice of this.g.shrines)if(choice.recoveryChoice)choice.used=true;return true;}
 update(dt){
  const g=this.g,room=this.currentRoom();if(g.training||g.mode!=='playing'||g.cleared||!g.enemies.length||room.type!=='trial')return;this.hazardTimer-=dt;if(this.hazardTimer>0)return;this.hazardTimer=4.2;
  const scale=(WorldModel.DIFFICULTIES[g.diff]?.damage??1)*(1+room.layer*.1)*1.25;
  for(let i=0;i<3;i++)this.warning(g.player.x+(i-1)*115,g.player.y+(i%2?90:-60),65,21*scale,1.25+i*.2,i%2?'lightning':'fire');
 }
 warning(x,y,r,damage,delay,type,field){
  const g=this.g,count=g.hazards.length;g.hazard(x,y,r,damage,delay,type);if(g.hazards.length>count&&field)g.hazards.at(-1).fieldOnExpire=field;
 }
 spawnAdds(enemy,count,type){
  const g=this.g;for(let i=0;i<count&&enemy.addsSpawned<4&&g.enemies.length<48;i++){
   const angle=enemy.addsSpawned/4*Math.PI*2,add=g.addEnemy(type,enemy.x+Math.cos(angle)*65,enemy.y+Math.sin(angle)*65,true);if(add){enemy.addsSpawned++;add.name=enemy.minibossKey==='priest'?'禁書僕從':'孢子僕從';add.damageScale*=.7;}
  }
 }
 updateMiniBoss(enemy,target,dt){
  const g=this.g,def=ALL_MINIBOSSES[enemy.minibossKey];if(!def||enemy.hp<=0||enemy.charge)return;
  const d=distance(enemy,target)||1,angle=enemy.tactics?.releaseOrigin?.angle??Math.atan2(target.y-enemy.y,target.x-enemy.x),scale=enemy.damageScale*(1-(enemy.auraWeaken||0)),desired=enemy.minibossKey==='jailer'?95:270;
  enemy.angle=angle;if(d>desired){const speed=enemy.speed*(1-(enemy.auraSlow||0));g.approachActor(enemy,target,speed*dt,desired);Object.assign(enemy,g.clampWorldPoint(enemy.x,enemy.y));}
  if(enemy.hp<enemy.maxHp*.5&&!enemy.halfTriggered){enemy.halfTriggered=true;if(enemy.minibossKey==='priest')this.spawnAdds(enemy,4,'caster');else if(enemy.minibossKey==='nest')this.spawnAdds(enemy,2,'skirmisher');g.fx(enemy.x,enemy.y,110,def.color,'ring',.8);}
  if(enemy.cd>0)return;enemy.phase++;enemy.cd=enemy.minibossKey==='jailer'?3.8:enemy.minibossKey==='priest'?3.1:3.5;enemy.eliteIntent={label:enemy.minibossKey==='jailer'?(enemy.phase%2?'斷鎖衝鋒':'三段地裂'):enemy.minibossKey==='priest'?(enemy.phase%2?'禁書落焰':'雷火扇射'):(enemy.phase%2?'腐根毒池':'毒刺扇射'),t:1.6,max:1.6};
  if(enemy.minibossKey==='jailer'){
   if(enemy.phase%2){enemy.charge={x:target.x,y:target.y,t:1.1,r:76,damage:28*scale,remaining:enemy.halfTriggered?2:1};}
   else for(let i=1;i<=3;i++)this.warning(enemy.x+Math.cos(angle)*i*95,enemy.y+Math.sin(angle)*i*95,60,25*scale,.85+i*.3,'physical');
  }else if(enemy.minibossKey==='priest'){
   if(enemy.phase%2){this.warning(target.x,target.y,80,29*scale,1.35,'fire');if(enemy.halfTriggered)this.warning(target.x+90,target.y-70,60,22*scale,1.7,'lightning');}
   else for(let i=0;i<7;i++){const type=i%2?'fire':'lightning';g.shoot(enemy.tactics?.releaseOrigin?.x??enemy.x,enemy.tactics?.releaseOrigin?.y??enemy.y,angle+(i-3)*.18,175,19*scale,type==='fire'?'#e4a06e':'#c4a4ee',0,7,true,{damageType:type});}
  }else{
   if(enemy.phase%2){
    const pools=g.enemyFields.filter(field=>field.damageType==='poison').length+g.hazards.filter(h=>h.fieldOnExpire?.damageType==='poison').length;
    if(pools<4)this.warning(target.x,target.y,87,15*scale,1.4,'poison',{duration:5,damage:5*scale,damageType:'poison',color:def.color,slow:.2});
    if(!enemy.halfTriggered)this.spawnAdds(enemy,2,'skirmisher');
   }else for(let i=0;i<5;i++)g.shoot(enemy.tactics?.releaseOrigin?.x??enemy.x,enemy.tactics?.releaseOrigin?.y??enemy.y,angle+(i-2)*.22,155,18*scale,def.color,0,7,true,{damageType:'poison'});
  }
 }
}
