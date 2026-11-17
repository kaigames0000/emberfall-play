import {createRoute,routeNode,EXPANDED_ROUTE_VERSION} from './route-model.js?v=158';
import {abbeyObjectiveIds} from './abbey-combat.js?v=158';
import {canChapter,expandedProgressFor,progressFor} from './campaign-progress.js?v=158';
import {validWorldObjects} from './rift-model.js?v=158';
import {terrainFor,terrainForExpanded} from './room-terrain.js?v=158';
import {ROOM_SCALE} from './world-space.js?v=108';
import {SHRINES,auraLoadout} from './model.js?v=158';
import {migrateFlaskCheckpoint,restoreFlaskBelt,snapshotFlaskBelt,validFlaskCheckpoint} from './flask-belt.js?v=108';

const finite=(value,max)=>Number.isFinite(value)&&value>=0&&value<=max;
const withinWorld=value=>Number.isFinite(value)&&Math.abs(value)<3000;
const counters=['elapsed','runKills','runGold','runLoot'];
const watergates=['gate-a','gate-b'];
const campfireID='campfire';

function objectiveIds(node,difficulty,routeVersion){
 if(node.campfire)return [campfireID];
 if(node.chapter===2&&node.layer===(routeVersion===EXPANDED_ROUTE_VERSION?9:5)&&node.type!=='recovery')return watergates;
 return abbeyObjectiveIds(node.encounter,difficulty);
}

function campaignRoom(hero,checkpoint){
 if(!hero||!checkpoint||checkpoint.version!==1||typeof checkpoint.seed!=='string'||
   !checkpoint.seed.length||checkpoint.seed.length>160||
   ![1,2,3].includes(checkpoint.difficulty)||![1,2,3].includes(checkpoint.chapter)||
   !canChapter(hero,checkpoint.difficulty,checkpoint.chapter))return null;
 const routeVersion=checkpoint.routeVersion??1;
 if(![1,2,EXPANDED_ROUTE_VERSION].includes(routeVersion))return null;
 const graph=createRoute(checkpoint.seed,checkpoint.difficulty,checkpoint.chapter,routeVersion),{path}=checkpoint;
 if(!Array.isArray(path)||path.length<1||path.length>graph.layers.length||path[0]!==graph.startID||
    Array.from(path).some((id,index)=>index>0&&!routeNode(graph,path[index-1])?.next.includes(id)))return null;
 const node=routeNode(graph,path.at(-1)),progress=routeVersion===EXPANDED_ROUTE_VERSION?expandedProgressFor:progressFor;
 const completed=progress(hero,checkpoint.difficulty,checkpoint.chapter);
 if(!node||path.slice(0,-1).some((_,index)=>!completed.includes(index)))return null;
 return {node,completed,routeVersion};
}

export function campaignCheckpoint(hero,checkpoint=hero?.campaignCheckpoint){
 if(!checkpoint||typeof checkpoint.repeat!=='boolean'||typeof checkpoint.cleared!=='boolean'||
    typeof checkpoint.combatDone!=='boolean'||checkpoint.cleared&&!checkpoint.combatDone)return null;
 const saved=campaignRoom(hero,checkpoint);
 if(!saved)return null;
 const {node,completed,routeVersion}=saved;
 if(checkpoint.cleared&&(!completed.includes(node.layer)||node.type==='boss'))return null;
 if(!finite(checkpoint.hp,1e8)||checkpoint.hp===0||!finite(checkpoint.mana,1e8)||!counters.every(key=>finite(checkpoint[key],1e12)))return null;
 if(!validFlaskCheckpoint(checkpoint.flasks))return null;
 if(!Array.isArray(checkpoint.auras)||checkpoint.auras.length>64||checkpoint.auras.some(id=>typeof id!=='string'||id.length>80))return null;
 if(!Array.isArray(checkpoint.shrines)||checkpoint.shrines.length>2||checkpoint.shrines.some(shrine=>!shrine||
   !Object.hasOwn(SHRINES,shrine.type)||!withinWorld(shrine.x)||!withinWorld(shrine.y)||
   typeof shrine.used!=='boolean'||typeof shrine.recoveryChoice!=='boolean'))return null;
 const validIds=objectiveIds(node,checkpoint.difficulty,routeVersion),trial=['abbey-seals','abbey-guard'].includes(node.encounter),abbey=checkpoint.abbey;
 if(!Array.isArray(checkpoint.objectives)||checkpoint.objectives.length>validIds.length||
   new Set(checkpoint.objectives).size!==checkpoint.objectives.length||
   checkpoint.objectives.some(id=>!validIds.includes(id))||!validWorldObjects(checkpoint.worldObjects))return null;
 if(trial&&(!abbey||typeof abbey.leaderDown!=='boolean'||!finite(abbey.remaining,10+2*checkpoint.difficulty)||
   !Number.isInteger(abbey.added)||!finite(abbey.added,4+2*checkpoint.difficulty)||
   checkpoint.cleared!==checkpoint.combatDone||node.encounter==='abbey-seals'&&abbey.leaderDown!==checkpoint.cleared||
   node.encounter==='abbey-guard'&&checkpoint.cleared!==(abbey.remaining===0&&checkpoint.objectives.length===1)))return null;
 if(!trial&&abbey!==undefined&&(node.encounter!=='abbey-boss'||!['boss-adds','boss-fire'].includes(abbey?.bossWard)))return null;
 return {checkpoint,node};
}

export function normalizeCampaignCheckpoints(profile){
 const paidHero=profile.rifts?.activeRun?.checkpoint?.hero;
 for(const hero of [...Object.values(profile.characters),paidHero].filter(Boolean)){
  if(hero.campaignCheckpoint!==undefined&&!campaignCheckpoint(hero))delete hero.campaignCheckpoint;
  else migrateFlaskCheckpoint(hero.campaignCheckpoint);
  if(hero.campaignCampfire!==undefined&&!campaignCampfire(hero))delete hero.campaignCampfire;
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
 const abbey=g.chapterCombat.abbey.checkpoint(),validIds=objectiveIds(expedition.currentNode(),g.diff,expedition.graph.routeVersion);
 const combatDone=g.cleared||!abbey&&lastWave&&(!g.enemies.length||
   room.type==='miniboss'&&!g.enemies.some(enemy=>enemy.type==='miniboss'));
 hero.campaignCheckpoint={
  version:1,routeVersion:expedition.graph.routeVersion,seed:expedition.graph.seed,chapter:g.chapter,difficulty:g.diff,repeat:!!repeat,
  path:[...expedition.path],cleared:!!g.cleared,combatDone,hp:g.hp,mana:g.mana,
  ...Object.fromEntries(counters.map(key=>[key,g[key]])),
  flasks:snapshotFlaskBelt(g.flasks),
  auras:[...g.auraIds],shrines:g.shrines.map(({type,x,y,used,recoveryChoice})=>({type,x,y,used:!!used,recoveryChoice:!!recoveryChoice})),
  objectives:g.objectives.filter(o=>o.used&&validIds.includes(o.id)).map(o=>o.id),
  ...(abbey?{abbey}:{}),worldObjects:g.worldObjects.snapshot()
 };
}

function restoreCampaignRoom(g,checkpoint,node,cleared,combatDone){
 g.chapter=checkpoint.chapter;g.diff=checkpoint.difficulty;g.c.difficulty=checkpoint.difficulty;
 g.restoreTrainingArmy();g.runContext=null;g.mode='playing';g.reset(true);
 g.expedition.start(checkpoint.seed,checkpoint.chapter,checkpoint.routeVersion??1);
 g.expedition.currentID=node.id;g.expedition.path=[...checkpoint.path];g.room=node.layer;
 g.expedition.clearedNodes=new Set(cleared?checkpoint.path:checkpoint.path.slice(0,-1));
 // Protected loot stays accessible in the resumed room even with a full bag.
 const protectedDrops=g.drops;g.drops=[];
 if(combatDone){
  const room=g.currentRoom();
  g.terrain=checkpoint.routeVersion===EXPANDED_ROUTE_VERSION?terrainForExpanded(g.chapter,g.room):terrainFor(g.chapter,g.room,ROOM_SCALE);
  g.placeActor(g.player,560,650);
  for(const ally of g.summons)g.placeFollower(ally);
  g.expedition.enteredNodes.add(node.id);g.expeditionRisk.enterRoom();g.chapterCombat.enterRoom({combatDone:true});
  g.horde.enterRoom(room);g.encounter={name:room.name,desc:room.desc};
  g.cleared=cleared;g.wave=room.waves;
  placeCampaignCampfire(g);
 }else g.enterRoom();
 g.drops.push(...protectedDrops.map(drop=>g.placeActor(drop,560,650)));
 for(const key of counters)g[key]=checkpoint[key];
}

export function restoreCampaignCheckpoint(g,checkpoint){
 const saved=campaignCheckpoint(g.c,checkpoint);
 if(!saved)return false;
 restoreCampaignRoom(g,checkpoint,saved.node,checkpoint.cleared,checkpoint.combatDone);
 for(const objective of g.objectives)objective.used=checkpoint.objectives.includes(objective.id);
 g.chapterCombat.abbey.restore(checkpoint.abbey);
 g.worldObjects.restore(checkpoint.worldObjects);
 g.shrines=checkpoint.shrines.map(shrine=>({...shrine}));
 restoreFlaskBelt(g.flasks,checkpoint.flasks);
 const selected=auraLoadout(g.c);
 g.auraIds=new Set(checkpoint.auras.filter(id=>selected.includes(id)));
 g.applyBuffs();
 g.hp=Math.max(1,Math.min(g.s.hp,checkpoint.hp));g.mana=Math.min(g.s.mana,checkpoint.mana);
 return true;
}

export function placeCampaignCampfire(g){
 if(!g.cleared||!g.expedition?.currentNode()?.campfire)return null;
 const existing=g.objectives.find(objective=>objective.id===campfireID);
 if(existing)return existing;
 const campfire=g.placeActor({id:campfireID,kind:'campfire',name:'遠征營火',used:false},560,650);
 g.objectives.push(campfire);
 return campfire;
}

function validatedCampfire(hero,checkpoint,chapter,difficulty){
 if(!checkpoint||checkpoint.routeVersion!==EXPANDED_ROUTE_VERSION||
    chapter!==undefined&&checkpoint.chapter!==chapter||difficulty!==undefined&&checkpoint.difficulty!==difficulty||
    !counters.every(key=>finite(checkpoint[key],1e12)))return null;
 const saved=campaignRoom(hero,checkpoint);
 if(!saved||saved.node.type!=='miniboss'||!saved.node.campfire||checkpoint.layer!==saved.node.layer||
    !saved.completed.includes(saved.node.layer))return null;
 return {checkpoint,node:saved.node};
}

export function campaignCampfire(hero,chapter,difficulty){
 return validatedCampfire(hero,hero?.campaignCampfire,chapter,difficulty)?.checkpoint??null;
}

export function saveCampaignCampfire(g){
 const expedition=g.expedition,graph=expedition?.graph,node=expedition?.currentNode();
 if(g.mode!=='playing'||g.training||g.runContext&&g.runContext.kind!=='campaign'||
    graph?.routeVersion!==EXPANDED_ROUTE_VERSION||!g.cleared||!node?.campfire||
    !expedition.clearedNodes.has(node.id)||expedition.path.at(-1)!==node.id)return false;
 const checkpoint={
  version:1,routeVersion:graph.routeVersion,seed:String(graph.seed),chapter:g.chapter,difficulty:g.diff,
  layer:node.layer,path:[...expedition.path],...Object.fromEntries(counters.map(key=>[key,g[key]]))
 };
 if(!validatedCampfire(g.c,checkpoint))return false;
 g.c.campaignCampfire=checkpoint;
 return true;
}

export function resumeCampaignCampfire(g,chapter,difficulty){
 if(g.mode!=='camp'&&(g.mode!=='dead'||g.runContext&&g.runContext.kind!=='campaign'))return false;
 const saved=validatedCampfire(g.c,g.c.campaignCampfire,chapter,difficulty);
 if(!saved)return false;
 if(g.mode==='dead'){
  g.collectAll();
  g.persistSummons();
 }
 g.paused=false;
 restoreCampaignRoom(g,saved.checkpoint,saved.node,true,true);
 // The refreshed hero may have already collected props after reaching this campfire.
 g.worldObjects.restore(null);
 g.hp=g.s.hp;
 g.mana=g.s.mana;
 g.refillFlasks(Infinity);
 for(const flask of g.flasks)flask.cooldown=0;
 for(const ally of g.summons)ally.hp=ally.maxHp;
 g.persistSummons();
 return true;
}

export function discardCampaignCampfire(hero,chapter,difficulty){
 const checkpoint=hero?.campaignCampfire;
 if(!checkpoint||checkpoint.chapter!==chapter||checkpoint.difficulty!==difficulty)return false;
 delete hero.campaignCampfire;
 return true;
}
