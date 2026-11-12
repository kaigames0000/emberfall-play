// Expedition effects are derived from the route, never a second character ledger.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const RIFT_MODIFIERS=Object.freeze({
 vitality:Object.freeze({name:'厚血軍勢',effect:'敵人生命 +24%',enemyHp:1.24}),
 ferocity:Object.freeze({name:'殘暴軍勢',effect:'敵人傷害 +16%',enemyDamage:1.16}),
 pursuit:Object.freeze({name:'疾行追獵',effect:'敵人移動速度 +18%',enemyMove:1.18}),
 alacrity:Object.freeze({name:'迅捷攻勢',effect:'敵人行動速度 +16%；預警時間保留',enemyAction:1.16}),
 legion:Object.freeze({name:'密集敵群',effect:'一般敵群數量 +20%，場上最多 48 名',packSize:1.2}),
 death_embers:Object.freeze({name:'殞落餘燼',effect:'非召喚敵人死亡留下 1.4 秒預警爆焰',hazardGroup:'ground',deathEmbers:true}),
 storm_ground:Object.freeze({name:'裂隙雷暴',effect:'戰鬥中每 7 秒出現兩處 1.5 秒預警落雷',hazardGroup:'ground',stormGround:true})
});
const CURSES={
 welfare:{name:'福利代價',effect:'敵人生命 +16%、傷害 +10%',enemyHp:1.16,enemyDamage:1.1},
 mystery:{name:'秘室追咒',effect:'敵人傷害 +12%、移動速度 +8%',enemyDamage:1.12,enemyMove:1.08}
};
function randomFrom(seed){let s=2166136261;for(const c of String(seed))s=Math.imul(s^c.charCodeAt(0),16777619);return ()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export function rollRiftModifiers(seed,challenge=1){
 const random=randomFrom(String(seed)+':expedition-modifiers:1'),pool=Object.keys(RIFT_MODIFIERS),chosen=[],count=clamp(Math.floor(challenge)||1,1,3)+1;
 while(chosen.length<count&&pool.length){const id=pool.splice(Math.floor(random()*pool.length),1)[0],group=RIFT_MODIFIERS[id].hazardGroup;if(group&&chosen.some(old=>RIFT_MODIFIERS[old].hazardGroup===group))continue;chosen.push(id);}
 return chosen;
}
export function validRiftModifiers(modifiers,challenge,seed){
 if(![1,2,3].includes(challenge)||!Array.isArray(modifiers)||modifiers.length!==challenge+1||new Set(modifiers).size!==modifiers.length||modifiers.some(id=>typeof id!=='string'||!Object.hasOwn(RIFT_MODIFIERS,id)))return false;
 const groups=modifiers.map(id=>RIFT_MODIFIERS[id].hazardGroup).filter(Boolean);if(new Set(groups).size!==groups.length)return false;
 return seed===undefined||JSON.stringify(modifiers)===JSON.stringify(rollRiftModifiers(seed,challenge));
}
export function modifierDescriptions(modifiers){return (Array.isArray(modifiers)?modifiers:[]).filter(id=>Object.hasOwn(RIFT_MODIFIERS,id)).map(id=>({id,name:RIFT_MODIFIERS[id].name,effect:RIFT_MODIFIERS[id].effect,duration:'本次遠征'}));}
export function mysteryOutcome(graph,node){
 if(!graph||!node||node.type!=='mystery')return null;
 return randomFrom(graph.seed+':mystery:'+node.id+':1')()<.5
  ?{kind:'curse',name:'秘室追咒',effect:'下一個起的 2 個戰鬥房間：敵人傷害 +12%、移速 +8%'}
  :{kind:'boon',name:'秘室恩惠',effect:'本房敵人生命 -15%、傷害 -10%；裝備掉落 +12%、稀有度 +4%'};
}
export function roomRiskPreview(graph,nodeID){const node=graph?.nodes?.find(n=>n.id===nodeID);return node?.type==='welfare'?'本房敵人生命／傷害 65%；之後 2 個戰鬥房間：敵人生命 +16%、傷害 +10%':node?.type==='mystery'?'未知風險：進入後揭露本房恩惠或之後 2 個戰鬥房間的追咒。':'';}
function emptyConditions(){return {enemyHp:1,enemyDamage:1,enemyMove:1,enemyAction:1,packSize:1,lootMultiplier:1,rarityBonus:0,deathEmbers:false,stormGround:false,curses:[],modifiers:[],mystery:null,combat:false};}
function validatedPath(expedition){
 const graph=expedition?.graph,path=expedition?.path,nodes=graph?.nodes;
 if(!Array.isArray(nodes)||nodes.length>32||!Array.isArray(path)||!path.length||path.length>8||path[0]!==graph.startID||path.at(-1)!==expedition.currentID||new Set(path).size!==path.length||new Set(nodes.map(n=>n.id)).size!==nodes.length)return null;
 const visited=path.map(id=>nodes.find(n=>n.id===id));
 if(visited.some((n,i)=>!n||n.layer!==i||!['normal','elite','welfare','recovery','treasure','trial','miniboss','boss','mystery'].includes(n.type)||i>0&&!visited[i-1].next?.includes(n.id)))return null;
 return visited;
}
export function currentConditions(g){
 const out=emptyConditions();if(!g||g.training||g.mode!=='playing')return out;const visited=validatedPath(g.expedition);if(!visited)return out;
 const graph=g.expedition.graph,current=visited.at(-1),context=g.runContext;out.combat=current.type!=='recovery';
 if(context?.riskVersion===1&&validRiftModifiers(context.modifiers,context.challenge,context.seed))out.modifiers=modifierDescriptions(context.modifiers);
 const curses=[];
 for(let i=0;i<visited.length-1;i++){
  const source=visited[i],key=source.type==='welfare'?'welfare':source.type==='mystery'&&mysteryOutcome(graph,source)?.kind==='curse'?'mystery':null;if(!key)continue;
  const consumed=visited.slice(i+1,-1).filter(n=>n.type!=='recovery').length,remaining=2-consumed;
  if(remaining>0)curses.push({id:key,sourceID:source.id,...CURSES[key],remaining,duration:'之後 2 個戰鬥房間'});
 }
 out.curses=curses.slice(-2);out.mystery=mysteryOutcome(graph,current);
 if(!out.combat)return out;
 for(const entry of [...out.modifiers.map(m=>RIFT_MODIFIERS[m.id]),...out.curses])for(const key of ['enemyHp','enemyDamage','enemyMove','enemyAction','packSize'])out[key]*=entry[key]||1;
 for(const m of out.modifiers){const def=RIFT_MODIFIERS[m.id];if(def.deathEmbers)out.deathEmbers=true;if(def.stormGround)out.stormGround=true;}
 out.lootMultiplier=1+Math.min(.16,out.modifiers.length*.035);out.rarityBonus=Math.min(.07,out.modifiers.length*.015);
 if(out.mystery?.kind==='boon'){out.enemyHp*=.85;out.enemyDamage*=.9;out.lootMultiplier*=1.12;out.rarityBonus+=.04;}
 out.enemyHp=clamp(out.enemyHp,.65,1.6);out.enemyDamage=clamp(out.enemyDamage,.65,1.5);out.enemyMove=clamp(out.enemyMove,.7,1.35);out.enemyAction=clamp(out.enemyAction,1,1.3);out.packSize=clamp(out.packSize,1,1.4);
 return out;
}

export class ExpeditionRisk{
 constructor(g){this.g=g;this.conditions=emptyConditions();this.nodeID=null;this.stormTimer=7;this.deathBudget=0;this.scaled=new WeakMap();this.dead=new WeakSet();this.lootBaselines=new WeakMap();}
 enterRoom(){this.conditions=currentConditions(this.g);const id=this.g.expedition?.currentID;if(this.nodeID!==id){this.nodeID=id;this.stormTimer=7;this.deathBudget=0;}return this.conditions;}
 active(){return !this.g.training&&this.g.mode==='playing'&&this.g.expedition?.graph&&this.g.expedition.currentID===this.nodeID;}
 decorate(enemy){
  if(!enemy||!this.active()||!this.conditions.combat||this.scaled.get(enemy)===this.nodeID)return enemy;
  const c=this.conditions;enemy.hp*=c.enemyHp;enemy.maxHp*=c.enemyHp;enemy.damageScale*=c.enemyDamage;enemy.speed*=c.enemyMove;enemy.attackSpeed=(enemy.attackSpeed||1)*c.enemyAction;this.scaled.set(enemy,this.nodeID);return enemy;
 }
 packCount(base,limit=48){const count=Number.isFinite(base)?Math.max(0,Math.floor(base)):0;return Math.min(limit,this.active()?Math.ceil(count*this.conditions.packSize):count);}
 lootStats(out){
  if(!this.active()||!this.conditions.combat)return out;let baseline=this.lootBaselines.get(out);if(!baseline){baseline={mult:out.roomLootMultiplier??1,rarity:out.roomRarityBonus??0};this.lootBaselines.set(out,baseline);}
  out.roomLootMultiplier=Math.min(1.6,baseline.mult*this.conditions.lootMultiplier);out.roomRarityBonus=Math.min(.35,baseline.rarity+this.conditions.rarityBonus);return out;
 }
 warning(x,y,r,damage,delay,type){
  const g=this.g;if(g.hazards.length>=64||g.hazards.filter(h=>h.expeditionRisk).length>=12||g.hazards.filter(h=>!h.friendly).length>=16)return false;
  const before=g.hazards.length;g.hazard(x,y,r,Math.min(40,damage),Math.max(1.2,delay),type);if(g.hazards.length===before)return false;g.hazards.at(-1).expeditionRisk=true;return true;
 }
 onKill(enemy){
  if(!enemy||!this.active()||this.g.cleared||enemy.summoned||enemy.trainingDummy||this.dead.has(enemy)||!this.conditions.deathEmbers||this.deathBudget>=8)return false;
  this.dead.add(enemy);if(!this.warning(enemy.x,enemy.y,52,14*Math.min(2,enemy.damageScale||1),1.4,'fire'))return false;this.deathBudget++;return true;
 }
 update(dt){
  const g=this.g;if(!this.active()||g.paused||g.transition||g.cleared||!g.enemies.length||!this.conditions.stormGround)return;
  this.stormTimer-=Math.max(0,Math.min(20,Number.isFinite(dt)?dt:0));if(this.stormTimer>0)return;this.stormTimer=7;
  const damage=14*(1+(clamp(g.diff||1,1,3)-1)*.3);for(const offset of [-70,70])this.warning(g.player.x+offset,g.player.y+(offset<0?-45:45),58,damage,1.5,'lightning');
 }
}
