import {createRoute,routeNode} from './route-model.js?v=140';
import {canChapter,progressFor} from './campaign-progress.js?v=108';
import {validWorldObjects} from './rift-model.js?v=140';
import {terrainFor} from './room-terrain.js?v=108';
import {ROOM_SCALE} from './world-space.js?v=108';
import {SHRINES,auraLoadout} from './model.js?v=140';
import {migrateFlaskCheckpoint,restoreFlaskBelt,snapshotFlaskBelt,validFlaskCheckpoint} from './flask-belt.js?v=108';

const finite=(value,max)=>Number.isFinite(value)&&value>=0&&value<=max;
const withinWorld=value=>Number.isFinite(value)&&Math.abs(value)<3000;
const counters=['elapsed','runKills','runGold','runLoot'];
const objectiveNames=['gate-a','gate-b'];

export function campaignCheckpoint(hero,checkpoint=hero?.campaignCheckpoint){
 if(!checkpoint||checkpoint.version!==1||typeof checkpoint.seed!=='string'||!checkpoint.seed.length||checkpoint.seed.length>160||
   ![1,2,3].includes(checkpoint.difficulty)||![1,2,3].includes(checkpoint.chapter)||
   !canChapter(hero,checkpoint.difficulty,checkpoint.chapter)||typeof checkpoint.repeat!=='boolean'||
   typeof checkpoint.cleared!=='boolean'||typeof checkpoint.combatDone!=='boolean'||checkpoint.cleared&&!checkpoint.combatDone)return null;
 const graph=createRoute(checkpoint.seed,checkpoint.difficulty,checkpoint.chapter),{path}=checkpoint;
 if(!Array.isArray(path)||path.length<1||path.length>8||path[0]!==graph.startID||
    path.some((id,index)=>index>0&&!routeNode(graph,path[index-1])?.next.includes(id)))return null;
 const node=routeNode(graph,path.at(-1)),completed=progressFor(hero,checkpoint.difficulty,checkpoint.chapter);
 if(!node||path.slice(0,-1).some((_,index)=>!completed.includes(index))||checkpoint.cleared&&(!completed.includes(node.layer)||node.type==='boss'))return null;
 if(!finite(checkpoint.hp,1e8)||checkpoint.hp===0||!finite(checkpoint.mana,1e8)||!counters.every(key=>finite(checkpoint[key],1e12)))return null;
 if(!validFlaskCheckpoint(checkpoint.flasks))return null;
 if(!Array.isArray(checkpoint.auras)||checkpoint.auras.length>64||checkpoint.auras.some(id=>typeof id!=='string'||id.length>80))return null;
 if(!Array.isArray(checkpoint.shrines)||checkpoint.shrines.length>2||checkpoint.shrines.some(shrine=>!shrine||
   !Object.hasOwn(SHRINES,shrine.type)||!withinWorld(shrine.x)||!withinWorld(shrine.y)||
   typeof shrine.used!=='boolean'||typeof shrine.recoveryChoice!=='boolean'))return null;
 if(!Array.isArray(checkpoint.objectives)||checkpoint.objectives.length>2||
   checkpoint.objectives.some(id=>!objectiveNames.includes(id))||!validWorldObjects(checkpoint.worldObjects))return null;
 return {checkpoint,node};
}

export function normalizeCampaignCheckpoints(profile){
 const paidHero=profile.rifts?.activeRun?.checkpoint?.hero;
 for(const hero of [...Object.values(profile.characters),paidHero].filter(Boolean)){
  if(hero.campaignCheckpoint!==undefined&&!campaignCheckpoint(hero))delete hero.campaignCheckpoint;
  else migrateFlaskCheckpoint(hero.campaignCheckpoint);
 }
 return profile;
}

export function clearCampaignCheckpoints(profile){
 const checkpointHero=profile.rifts?.activeRun?.checkpoint?.hero;
 let changed=false;
 for(const hero of [...Object.values(profile.characters),checkpointHero]){
  if(hero&&Object.hasOwn(hero,'campaignCheckpoint')){
   delete hero.campaignCheckpoint;
   changed=true;
  }
 }
 return changed;
}

export function writeCampaignCheckpoint(profile,g,repeat){
 const hero=profile.characters[g.c.id],expedition=g.expedition;
 if(!hero||profile.active!==hero.id||g.training||g.runContext&&g.runContext.kind!=='campaign'||!expedition?.graph)return;
 if(g.mode==='victory'||g.mode==='dead'){delete hero.campaignCheckpoint;return;}
 if(g.mode!=='playing')return;
 const room=g.currentRoom();
 const lastWave=g.wave>=room.waves&&!g.horde.pending;
 // A miniboss can leave summoned adds behind. Its loot is already banked.
 const combatDone=g.cleared||lastWave&&(!g.enemies.length||
   room.type==='miniboss'&&!g.enemies.some(enemy=>enemy.type==='miniboss'));
 hero.campaignCheckpoint={
  version:1,seed:expedition.graph.seed,chapter:g.chapter,difficulty:g.diff,repeat:!!repeat,
  path:[...expedition.path],cleared:!!g.cleared,combatDone,hp:g.hp,mana:g.mana,
  ...Object.fromEntries(counters.map(key=>[key,g[key]])),
  flasks:snapshotFlaskBelt(g.flasks),
  auras:[...g.auraIds],shrines:g.shrines.map(({type,x,y,used,recoveryChoice})=>({type,x,y,used:!!used,recoveryChoice:!!recoveryChoice})),
  objectives:g.objectives.filter(o=>o.used).map(o=>o.id),worldObjects:g.worldObjects.snapshot()
 };
}

export function restoreCampaignCheckpoint(g,checkpoint){
 const saved=campaignCheckpoint(g.c,checkpoint);
 if(!saved)return false;
 const {node}=saved;
 g.chapter=checkpoint.chapter;g.diff=checkpoint.difficulty;g.c.difficulty=checkpoint.difficulty;
 g.restoreTrainingArmy();g.runContext=null;g.mode='playing';g.reset(true);
 g.expedition.start(checkpoint.seed,checkpoint.chapter);
 g.expedition.currentID=node.id;g.expedition.path=[...checkpoint.path];g.room=node.layer;
 g.expedition.clearedNodes=new Set(checkpoint.cleared?checkpoint.path:checkpoint.path.slice(0,-1));
 // Protected loot stays accessible in the resumed room even with a full bag.
 const protectedDrops=g.drops;g.drops=[];
 if(checkpoint.combatDone){
  const room=g.currentRoom();
  g.terrain=terrainFor(g.chapter,g.room,ROOM_SCALE);
  g.placeActor(g.player,560,650);
  for(const ally of g.summons)g.placeFollower(ally);
  g.expedition.enteredNodes.add(node.id);g.expeditionRisk.enterRoom();g.chapterCombat.enterRoom({combatDone:true});
  g.horde.enterRoom(room);g.encounter={name:room.name,desc:room.desc};
  g.cleared=checkpoint.cleared;g.wave=room.waves;
 }else g.enterRoom();
 g.drops.push(...protectedDrops.map(drop=>g.placeActor(drop,560,650)));
 for(const objective of g.objectives)objective.used=checkpoint.objectives.includes(objective.id);
 g.worldObjects.restore(checkpoint.worldObjects);
 g.shrines=checkpoint.shrines.map(shrine=>({...shrine}));
 for(const key of counters)g[key]=checkpoint[key];
 restoreFlaskBelt(g.flasks,checkpoint.flasks);
 const selected=auraLoadout(g.c);
 g.auraIds=new Set(checkpoint.auras.filter(id=>selected.includes(id)));
 g.applyBuffs();
 g.hp=Math.max(1,Math.min(g.s.hp,checkpoint.hp));g.mana=Math.min(g.s.mana,checkpoint.mana);
 return true;
}

