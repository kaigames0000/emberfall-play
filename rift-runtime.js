import {terrainFor} from './room-terrain.js?v=108';
import {ROOM_SCALE} from './world-space.js?v=108';
import {runContext,seededRng} from './rift-model.js?v=140';
import {restoreFlaskBelt,snapshotFlaskBelt} from './flask-belt.js?v=108';
const resourceKeys=['materials','gems','marks','weaponChoices','rewards'];
function debtSnapshot(b,army){const groups=new Map();for(const d of b.debts){if(d.ally&&!army.includes(d.ally))continue;const ally=d.ally?army.indexOf(d.ally):null,key=ally+':'+d.type+':'+!!d.extended,old=groups.get(key)||{ally,type:d.type,extended:!!d.extended,remaining:0,rate:0};old.remaining+=d.remaining;old.rate+=d.t>0?d.remaining/d.t:0;groups.set(key,old);}return [...groups.values()].filter(d=>d.remaining>0&&d.rate>0).map(({rate,...d})=>({...d,t:Math.min(4,d.remaining/rate)}));}
function combatSnapshot(g){const b=g.gameplay.blood,a=g.gameplay.assassin,army=g.summons.filter(s=>s.hp>0);return {blood:{rage:b.rage,sinceHit:Math.max(0,b.time-b.lastHit),debts:debtSnapshot(b,army)},blink:{charges:a.charges,recharge:a.recharge,lock:a.lock}};}
function restoreCombat(g,c){if(!c)return;const b=g.gameplay.blood,a=g.gameplay.assassin;b.rage=c.blood.rage;b.lastHit=b.time-c.blood.sinceHit;b.debts=c.blood.debts.map(d=>({...d,ally:d.ally===null?null:g.summons[d.ally]})).filter(d=>d.ally!==undefined);a.charges=c.blink.charges;a.recharge=c.blink.recharge;a.lock=c.blink.lock;}
function snapshot(profile,g){g.persistSummons();return {nodeId:g.expedition.currentID,path:[...g.expedition.path],clearedNodes:[...g.expedition.clearedNodes],cleared:!!g.cleared,hero:structuredClone(g.c),resources:Object.fromEntries(resourceKeys.map(k=>[k,structuredClone(profile[k])])),hp:g.hp,mana:g.mana,flasks:snapshotFlaskBelt(g.flasks),auras:[...g.auraIds],cooldowns:{...g.skillCooldowns},elapsed:g.elapsed,runKills:g.runKills,runGold:g.runGold,runLoot:g.runLoot,combat:combatSnapshot(g),worldObjects:g.worldObjects.snapshot()};}
export function paidSaveCandidate(profile,g){const p=structuredClone(profile),run=p.rifts?.activeRun;if(!run||run.heroId!==g.c.id)return p;const previous=run.checkpoint,newRoom=!previous||previous.nodeId!==g.expedition.currentID;
 if(newRoom||g.cleared||g.mode==='victory'){run.checkpoint=snapshot(profile,g);p.characters[g.c.id]=structuredClone(g.c);if(g.mode==='victory')run.status='won';}
 else {
  const hero=p.characters[run.heroId]=structuredClone(previous.hero);
  // Time spent in the expedition survives a reload, while unbanked progress rolls back.
  if(g.c.expeditionSeconds!==undefined)hero.expeditionSeconds=g.c.expeditionSeconds;
  for(const[k,v]of Object.entries(previous.resources))p[k]=structuredClone(v);
 }
 return p;
}
export function refreshPaidCheckpoint(profile,g){
 const run=profile.rifts?.activeRun,checkpoint=run?.checkpoint,camp=g.mode==='camp';
 if(!checkpoint||!(g.cleared||camp&&run.status==='won'))return;
 checkpoint.hero=structuredClone(profile.characters[run.heroId]);
 if(!camp)checkpoint.worldObjects=g.worldObjects.snapshot();
 checkpoint.resources=Object.fromEntries(resourceKeys.map(key=>[key,structuredClone(profile[key])]));
}
export function restorePaidRun(g,profile){const run=profile.rifts?.activeRun;if(!run||run.heroId!==g.c.id)return false;const cp=run.checkpoint;g.chapter=run.chapterTier;g.diff=run.difficulty;g.runContext=runContext(run);g.mode='playing';g.reset();g.expedition.start(run.seed,run.chapterTier);if(cp){g.expedition.currentID=cp.nodeId;g.expedition.path=[...cp.path];g.expedition.clearedNodes=new Set(cp.clearedNodes);g.room=g.expedition.currentNode().layer;g.rand=seededRng(run.seed+':'+cp.nodeId);if(cp.cleared){g.terrain=terrainFor(0,0,ROOM_SCALE);g.cleared=true;g.wave=g.currentRoom().waves;g.expedition.enteredNodes.add(cp.nodeId);g.expeditionRisk?.enterRoom();g.chapterCombat.enterRoom();g.enemies=[];g.worldObjects.restore(cp.worldObjects);}else g.enterRoom();g.hp=Math.min(g.s.hp,cp.hp);g.mana=Math.min(g.s.mana,cp.mana);g.elapsed=cp.elapsed||0;g.runKills=cp.runKills||0;g.runGold=cp.runGold||0;g.runLoot=cp.runLoot||0;restoreFlaskBelt(g.flasks,cp.flasks);g.auraIds=new Set((cp.auras||[]).filter(id=>g.ability(id)));g.buffs=[];g.skillEffects=[];g.skillCooldowns={...(cp.cooldowns||{})};g.applyBuffs();restoreCombat(g,cp.combat);}else g.enterRoom();g.emit('paidResume');return true;}
