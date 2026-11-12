import {CHAPTERS} from './chapter-data.js?v=108';
import {progressFor} from './campaign-progress.js?v=108';
// Character-scoped achievement records. Reward resources are applied by model.js.
const difficulties=[1,2,3];
const enemyTypes=new Set(['melee','shield','elite','summoner','skeleton','skirmisher','bomber','wraith','caster','archer','charger','miniboss','boss']);
const items=(materials={},gems=[])=>({materials:Object.entries(materials).map(([key,count])=>({key,count})),gems:gems.map(([key,tier,count=1])=>({key,tier,count}))});
const chapterAchievements=[2,3].flatMap(chapter=>difficulties.flatMap(difficulty=>{const def=CHAPTERS[chapter],common={chapter,difficulty};return [...Object.values(def.minis).map(mini=>({...common,id:`c${chapter}:${mini.key}:${difficulty}`,key:mini.key,title:mini.name,description:'擊敗'+mini.name,kind:'boss',target:1,reward:items({enhance:2*difficulty,reforge:difficulty})})),{...common,id:`c${chapter}:boss:${difficulty}`,key:'boss',title:def.boss.name,description:'擊敗'+def.boss.name,kind:'boss',target:1,reward:items({enhance:6*difficulty,ascend:difficulty})},{...common,id:`c${chapter}:triad:${difficulty}`,key:'triad',title:def.name+'獵手',description:'擊敗本章三種小首領',kind:'triad',target:3,reward:items({chisel:difficulty,reroll:2*difficulty},[['soul',Math.min(3,difficulty+1),1]])},{...common,id:`c${chapter}:chapter:${difficulty}`,key:'chapter',title:def.name+'拓荒者',description:'完成本章八層',kind:'chapter',target:8,reward:items({ascend:difficulty,reroll:2*difficulty})}];}));
export const ACHIEVEMENTS=Object.freeze([
 ...difficulties.flatMap(difficulty=>[
  {key:'jailer',title:'斷鎖者',description:'擊敗斷鎖獄卒',kind:'boss',target:1,reward:items({chisel:difficulty,enhance:2*difficulty})},
  {key:'priest',title:'禁書終結',description:'擊敗禁書司祭',kind:'boss',target:1,reward:items({ascend:difficulty,reroll:difficulty})},
  {key:'nest',title:'拔除腐根',description:'擊敗腐根母巢',kind:'boss',target:1,reward:items({reforge:2*difficulty})},
  {key:'boss',title:'灰燼弒王者',description:'擊敗灰燼君王',kind:'boss',target:1,reward:{skillPoints:1,...items({enhance:[0,5,10,20][difficulty],ascend:difficulty})}},
  {key:'triad',title:'修道院獵手',description:'擊敗三種不同的小首領',kind:'triad',target:3,reward:{talentPoints:1,...items({reforge:2*difficulty,chisel:difficulty},[['soul',Math.min(3,difficulty+1),difficulty===3?2:1]])}},
  {key:'chapter',title:'八層拓荒者',description:'淨化第一章全部八層',kind:'chapter',target:8,reward:items({ascend:2*difficulty,reroll:3*difficulty},[['clarity',Math.min(3,difficulty+1),difficulty===3?2:1]])},
  {key:'skill_triad',title:'狩獵心得',description:'擊敗第一章三種不同的小首領，獲得技能點',kind:'triad',target:3,reward:{skillPoints:1,...items()}},
  {key:'skill_chapter',title:'修道院征服者',description:'淨化第一章全部八層，獲得技能點',kind:'chapter',target:8,reward:{skillPoints:1,...items()}}
 ].map(def=>({...def,difficulty,id:`${def.key}:${difficulty}`}))),
 ...chapterAchievements,
 {id:'slayer_100',title:'初試鋒芒',description:'擊敗100名非召喚敵人',kind:'kills',target:100,reward:items({enhance:5})},
 {id:'slayer_1000',title:'千斬行者',description:'擊敗1000名非召喚敵人',kind:'kills',target:1000,reward:items({reforge:3,reroll:5,enhance:15})},
 {id:'elite_25',title:'菁英獵人',description:'擊敗25名非召喚菁英敵人',kind:'elites',target:25,reward:items({chisel:2,reforge:2})},
 {id:'pilgrim_5',title:'聖壇朝聖者',description:'領取5次祭壇恩賜',kind:'shrines',target:5,reward:items({reroll:3},[['wind',2]])},
 {id:'veteran_20',title:'踏入修途',description:'角色達到20級',kind:'level',target:20,reward:items({enhance:10},[['obsidian',2]])},
 {id:'veteran_50',title:'星火成器',description:'角色達到50級',kind:'level',target:50,reward:items({ascend:2,chisel:2},[['soul',3]])}
].map(def=>Object.freeze(def)));
const definitions=new Map(ACHIEVEMENTS.map(d=>[d.id,d]));
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const count=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e9;
const difficultyKeys=['1','2','3'];
const emptyKills=()=>Object.fromEntries(difficultyKeys.map(d=>[d,[]]));
export function newAchievements(){return {version:1,kills:emptyKills(),chapterKills:{'2':emptyKills(),'3':emptyKills()},elites:0,shrines:0,eligibleKills:0,claimed:[]};}
function validKills(value,chapter){const allowed=[...Object.keys(CHAPTERS[chapter].minis),'boss'];return plain(value)&&Object.keys(value).length===3&&difficultyKeys.every(d=>Array.isArray(value[d])&&value[d].length<=4&&new Set(value[d]).size===value[d].length&&value[d].every(key=>allowed.includes(key)));}
function shape(r){return plain(r)&&Object.keys(r).every(k=>['version','kills','chapterKills','elites','shrines','eligibleKills','claimed'].includes(k))&&r.version===1&&validKills(r.kills,1)&&(r.chapterKills===undefined||plain(r.chapterKills)&&Object.keys(r.chapterKills).length===2&&validKills(r.chapterKills['2'],2)&&validKills(r.chapterKills['3'],3))&&count(r.elites)&&count(r.shrines)&&count(r.eligibleKills)&&Array.isArray(r.claimed)&&r.claimed.length<=ACHIEVEMENTS.length&&new Set(r.claimed).size===r.claimed.length&&r.claimed.every(id=>typeof id==='string'&&definitions.has(id));}
function progress(c,def){const chapter=def.chapter||1,kills=(chapter===1?c.achievements?.kills:c.achievements?.chapterKills?.[chapter])?.[def.difficulty]||[];if(def.kind==='boss')return kills.includes(def.key)||def.key==='boss'&&progressFor(c,def.difficulty,chapter).includes(7)?1:0;if(def.kind==='triad')return kills.filter(k=>k!=='boss').length;if(def.kind==='chapter')return progressFor(c,def.difficulty,chapter).length;if(def.kind==='kills')return c.achievements?.eligibleKills||0;if(def.kind==='level')return c.level||1;return c.achievements?.[def.kind]||0;}
export function achievementList(c){return ACHIEVEMENTS.map(def=>{const value=Math.min(def.target,progress(c,def)),complete=value>=def.target,claimed=c.achievements?.claimed?.includes(def.id)||false;return {...def,progress:value,complete,claimed,claimable:complete&&!claimed};});}
export function validAchievements(c){return c.achievements===undefined||shape(c.achievements)&&c.achievements.claimed.every(id=>progress(c,definitions.get(id))>=definitions.get(id).target);}
export function achievementSkillPoints(c){return (c.achievements?.claimed||[]).reduce((n,id)=>n+(definitions.get(id)?.reward.skillPoints||0),0);}
export function legacyRingCredits(c){
 const claimed=new Set(c.achievements?.claimed??[]);
 return Object.fromEntries(difficulties.map(d=>[d,['boss','triad','skill_triad','skill_chapter'].filter(key=>claimed.has(key+':'+d)).length]));
}
// New characters earn ring points from chapter milestones. Conversions keep
// a snapshot of points already claimed under the former rules.
export function validRingLegacyCredits(c){
 const credit=c.ringLegacyCredit;
 if(credit===undefined)return true;
 if(!plain(credit)||Object.keys(credit).length!==3)return false;
 const earned=legacyRingCredits(c);
 return difficulties.every(d=>Number.isInteger(credit[d])&&credit[d]>=0&&credit[d]<=earned[d]);
}
export function ringAchievementPoints(c){
 const claimed=new Set(c.achievements?.claimed??[]);
 return difficulties.reduce((total,d)=>{
  const campaign=Number(claimed.has('boss:'+d))+Number(claimed.has('c2:boss:'+d))+2*Number(claimed.has('c3:boss:'+d));
  return total+Math.max(c.ringLegacyCredit?.[d]??0,campaign);
 },0);
}
export function achievementTalentPoints(c){return (c.achievements?.claimed||[]).reduce((n,id)=>n+(definitions.get(id)?.reward.talentPoints||0),0);}
export function achievementClaim(c,id){const def=definitions.get(id);if(!def||!validAchievements(c))return {ok:false,reason:'成就資料無效。'};if(c.achievements?.claimed.includes(id))return {ok:false,reason:'此角色已領取。'};if(progress(c,def)<def.target)return {ok:false,reason:'成就尚未完成。'};return {ok:true,definition:def,reward:structuredClone(def.reward)};}
export function finishAchievementClaim(c,id){const r=c.achievements||newAchievements();c.achievements={...r,claimed:[...r.claimed,id]};}
export function recordAchievementKill(c,enemy,difficulty,room,chapter=1,{campaign=true}={}){
 if(!c||!enemy||enemy.summoned||!enemyTypes.has(enemy.type)||!difficulties.includes(difficulty)||!Number.isInteger(room)||room<0||room>7||!CHAPTERS[chapter])return false;
 if(!campaign){const r=c.achievements||newAchievements();if(!shape(r))return false;c.achievements={...r,eligibleKills:Math.min(1e9,r.eligibleKills+1),elites:Math.min(1e9,r.elites+(enemy.type==='elite'||enemy.elite?1:0))};return true;}
 const allowed=Object.keys(CHAPTERS[chapter].minis);if(enemy.type==='boss'&&room!==7||enemy.type==='miniboss'&&(room!==3||!allowed.includes(enemy.minibossKey)))return false;
 const key=enemy.type==='boss'?'boss':enemy.type==='miniboss'?enemy.minibossKey:null,r=c.achievements||newAchievements();if(!shape(r))return false;
 const kills=chapter===1?r.kills:(r.chapterKills?.[chapter]||emptyKills()),existing=kills[difficulty],next={...kills,[difficulty]:key&&!existing.includes(key)?[...existing,key]:existing};
 c.achievements={...r,eligibleKills:Math.min(1e9,r.eligibleKills+1),elites:Math.min(1e9,r.elites+(enemy.type==='elite'||enemy.elite?1:0)),...(chapter===1?{kills:next}:{chapterKills:{...(r.chapterKills||newAchievements().chapterKills),[chapter]:next}})};return true;
}
export function recordAchievementShrine(c){const r=c?.achievements||newAchievements();if(!c||!shape(r))return false;c.achievements={...r,shrines:Math.min(1e9,r.shrines+1)};return true;}
