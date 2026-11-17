import {chapterDefinition} from './chapter-data.js?v=108';
import {EXPANDED_MINIBOSSES} from './campaign-expansion-enemies.js?v=158';
import {EXPANDED_CAMPAIGN_LAYERS} from './campaign-progress.js?v=158';
// Route generation is pure: previewing a route never consumes combat randomness.
export const CHAPTER_ROOMS8=[
 {name:'荒蕪外庭',sub:'破門與伏擊',waves:2,count:12,desc:'混合步卒與疾行敵人，突破外庭。',layout:0},
 {name:'骸骨迴廊',sub:'亡者軍列',waves:2,count:13,desc:'盾衛與射手駐守的迴廊。',layout:1},
 {name:'禁書庫',sub:'禁術與火海',waves:2,count:14,desc:'禁術法師與亡者在書庫集結。',layout:2},
 {name:'斷誓囚庭',sub:'小首領之門',waves:1,count:1,desc:'擊敗本次遠征的小首領及其僕從。',layout:3},
 {name:'灰根庭園',sub:'餘火之路',waves:2,count:16,desc:'深入灰根庭園，選擇整備或戰鬥。',layout:0},
 {name:'封印長廊',sub:'禁衛集結',waves:2,count:17,desc:'禁衛與法師封鎖通往王座的道路。',layout:1},
 {name:'王座前廳',sub:'最後整備',waves:2,count:18,desc:'越過最後防線，或整備後挑戰君王。',layout:3},
 {name:'灰燼王座',sub:'灰燼君王 · 莫爾迦',waves:1,count:1,desc:'擊敗灰燼君王，完成八層遠征。',layout:4}
];
export const CHAPTER_ROOMS=CHAPTER_ROOMS8;
export const ROOM_TYPES={
 normal:{label:'普通',color:'#bdb7a5',icon:'sword',desc:'2 波混合敵群。',lootMultiplier:1,rarityBonus:0},
 elite:{label:'菁英',color:'#d7b97d',icon:'shield',desc:'2 波戰鬥，每波至少 2 名菁英；裝備掉落 ×1.15。',lootMultiplier:1.15,rarityBonus:0},
 miniboss:{label:'小首領',color:'#d78568',icon:'eye',desc:'黃裝以上 1 件與額外抽選；必掉材料，不給君王印記。',lootMultiplier:1,rarityBonus:0},
 welfare:{label:'福利',color:'#a3c99a',icon:'heart',desc:'本房敵人血量／傷害 65%；掉落 ×1.35、稀有度 +20%。之後 2 個戰鬥房間敵人生命 +16%、傷害 +10%；回復房不計次。',lootMultiplier:1.35,rarityBonus:.2},
 mystery:{label:'秘室',color:'#b6a0d2',icon:'eye',desc:'未知風險：進入後揭露本房恩惠，或之後 2 個戰鬥房間的追咒。',lootMultiplier:1,rarityBonus:0},
 recovery:{label:'回復',color:'#91c8c9',icon:'flask',desc:'補滿血魔與藥水；兩個狀態祭壇選一。',lootMultiplier:1,rarityBonus:0},
 treasure:{label:'寶庫',color:'#e4c16e',icon:'chest',desc:'1 波守衛；最後一名守衛掉落 1 件藍裝以上，清房後獲得材料。',lootMultiplier:1,rarityBonus:0},
 trial:{label:'試煉',color:'#c79cd5',icon:'rune',desc:'3 波危險敵群；傷害 ×1.25、血量 ×1.15、掉落 ×1.4、稀有度 +25%。',lootMultiplier:1.4,rarityBonus:.25},
 boss:{label:'最終首領',color:'#e08d60',icon:'flame',desc:'黃裝以上 1 件與 2 次額外抽選；獲得君王印記。',lootMultiplier:1,rarityBonus:0}
};
export const MINIBOSSES3={
 jailer:{key:'jailer',name:'斷鎖獄卒',element:'physical',color:'#d9ba76',desc:'物理衝鋒與三段地裂；半血後雙段衝鋒。',hpMultiplier:7.5,speed:72},
 priest:{key:'priest',name:'禁書司祭',element:'fire',elements:['fire','lightning'],color:'#d798c4',desc:'點名落焰、雷火扇射；半血召喚有限禁書僕從。',hpMultiplier:6.5,speed:52},
 nest:{key:'nest',name:'腐根母巢',element:'poison',color:'#a2b95a',desc:'預警毒池與毒刺扇射；召喚有限孢子僕從。',hpMultiplier:8,speed:34}
};
export const MINIBOSSES=MINIBOSSES3;
export const CAMPAIGN_ROUTE_VERSION=2;
export const EXPANDED_ROUTE_VERSION=3;
const expandedAreas={
 1:'荒蕪外庭 斷柱回廊 禁書庫 斷誓囚庭 灰根苗圃 枯井下層 焚香地庫 焚香祭場 舊鐘塔 灰雨長廊 風蝕禱間 裂鐘大殿 封印階梯 封印長廊 石棺密道 守燼地宮 火種藏室 失落唱詩席 熔痕橋 斷牆觀火臺 君王近道 誓衛廊道 王座前廳 灰燼門庭 灰燼王座',
 2:'礁岸登陸 破帆碼頭 鹽霧街巷 港務大廳 船骸小徑 黑鹽倉庫 沉錨工坊 船錨吊臺 逆潮堤防 潮汐水門 漫水暗巷 鎖流機房 沉船墓道 腐纜下層 舊港祭室 駁船祭壇 風暴瞭望臺 斜桅渡口 破浪棧橋 雷索高架 深水運渠 湧潮閘道 領主泊位 深港防線 吞潮船塢',
 3:'星落城道 禁衛庭 裂晶迴廊 三相聖所 凍星泉 分光長廊 鏡界花園 星鏡大廳 失重側廊 墜晶塔臺 折光哨站 裂星演武場 碎月天井 銀冠禮拜堂 斷界階梯 月弓露臺 倒影長廊 星紋囚室 無聲密道 星鐵監牢 空座前庭 銀白王道 星核門廊 王座外環 裂星王座'
};
const expandedTracks=[['normal','welfare'],['normal','elite'],['treasure','mystery','trial','elite']];
function createExpandedRoute(seed,diff,chapter,definition){
 const length=EXPANDED_CAMPAIGN_LAYERS,random=seededRandom(`${seed}:campaign-3:${chapter}`),nodes=[],layers=[],areas=expandedAreas[chapter].split(' ');
 const minis=[...Object.values(definition.minis),...Object.values(EXPANDED_MINIBOSSES).filter(boss=>boss.chapter===chapter)];
 for(let i=minis.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[minis[i],minis[j]]=[minis[j],minis[i]];}
 for(let layer=0;layer<length;layer++){
  const final=layer===length-1,miniboss=layer%4===3,sector=Math.floor(layer/4),cols=layer===0||final||miniboss?[1]:[0,1,2],mirrored=sector%2===0&&random()<.5;
  layers.push(cols.map(col=>{
   const lane=mirrored?2-col:col,deck=expandedTracks[lane],boss=miniboss?minis[sector]:null;
   const encounter=chapter===1?(final?'abbey-boss':lane===1&&layer===2?'abbey-seals':lane===1&&layer===13?'abbey-guard':null):null;
   const type=final?'boss':miniboss?'miniboss':layer===0||encounter?'normal':lane===0&&[6,14,22].includes(layer)?'recovery':deck[Math.floor(random()*deck.length)];
   const name=final?definition.boss.name:boss?.name??ABBEY_ENCOUNTERS[encounter]?.name??areas[layer];
   const waves=type==='recovery'?0:type==='treasure'?2:type==='trial'?4:encounter&&!final?1:!final&&!miniboss&&(layer%4===2||chapter===2&&[9,17].includes(layer))?4:3;
   const node={id:`${chapter===1?'':'C'+chapter+'-'}L${layer+1}C${col+1}`,chapter,layer,depth:Math.floor(layer*7/(length-1)),col,type,name,waves,next:[],...(encounter?{encounter}:{}),...(boss?{bossKey:boss.key,campfire:true}:{}),...(cols.length===3?{track:['supply','seal','loot'][lane]}:{})};
   nodes.push(node);
   return node.id;
  }));
 }
 const byID=new Map(nodes.map(node=>[node.id,node]));
 for(const node of nodes){
  const next=layers[node.layer+1]??[];
  node.next=next.filter(id=>{
   const candidate=byID.get(id);
   return !(node.encounter==='abbey-guard'&&candidate.type==='recovery')&&(next.length===1||layers[node.layer].length===1||Math.abs(candidate.col-node.col)<=1);
  });
 }
 return {seed,chapter,difficulty:[1,2,3].includes(diff)?diff:1,routeVersion:EXPANDED_ROUTE_VERSION,nodes,layers,startID:layers[0][0]};
}
export const ABBEY_ENCOUNTERS=Object.freeze({
 'abbey-seals':{label:'破印',name:'禁書庫 · 封印祭壇',goal:'關閉祭壇停止增援，擊倒守印祭司即可開門。',loot:'重塑砂 ×1',boon:'王座的每波召援減少 1 名',material:'reroll'},
 'abbey-guard':{label:'守印',name:'封印長廊 · 守住封印',goal:'啟動石碑後留在印圈內。擊倒封印隊長減少 5 秒。',loot:'強化石 ×1',boon:'王座火線預警延長 0.5 秒',material:'enhance'},
 'abbey-boss':{label:'最終首領',name:'灰燼王座',goal:'君王半血時可關閉召援或火線祭壇，餘下的一座會持續生效。',loot:'君王印記 · 黃裝保底'}
});
const abbeyTracks={
 1:[['welfare'],['elite'],['treasure']],
 2:[['normal','welfare'],['normal'],['trial','mystery']],
 4:[['recovery'],['elite','normal'],['trial','treasure']],
 5:[['normal','welfare'],['normal'],['elite','trial']],
 6:[['recovery'],['elite'],['treasure']]
};
export const ROUTE_TRACKS={supply:'整備',seal:'封印',loot:'奪寶'};
function seededRandom(seed){let state=2166136261;for(const c of String(seed))state=Math.imul(state^c.charCodeAt(0),16777619);return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function routeNode(graph,id){return graph?.nodes?.find(n=>n.id===id)??null;}
export function routeChoices(graph,currentID){return (routeNode(graph,currentID)?.next??[]).map(id=>routeNode(graph,id)).filter(Boolean);}
export function createRoute(seed,diff=1,chapter=1,routeVersion=CAMPAIGN_ROUTE_VERSION){
 const def=chapterDefinition(chapter);if(!def)throw Error('未知章節');
 if(routeVersion===EXPANDED_ROUTE_VERSION)return createExpandedRoute(seed,diff,chapter,def);
 const chapterRooms=def.rooms,chapterMinis=def.minis;
 const random=seededRandom(seed),widths=[1,3,3,1,3,3,3,1],nodes=[],layers=[];
 const abbey=chapter===1&&routeVersion>=2,strategy=seededRandom(String(seed)+':abbey-route-v2');
 const mirrored=abbey&&strategy()<.5;
 for(let layer=0;layer<widths.length;layer++){
  const choices=['normal','elite','welfare','treasure','trial','mystery'];for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  const types=choices.slice(0,3);if(layer===4||layer===6)types[Math.floor(random()*3)]='recovery';
  const ids=[];for(let index=0;index<widths[layer];index++){
   const col=widths[layer]===1?1:index,track=mirrored?2-index:index,deck=abbey?abbeyTracks[layer]?.[track]:null;
   const type=layer===0?'normal':layer===3?'miniboss':layer===7?'boss':deck?deck[Math.floor(strategy()*deck.length)]:types[index];
   const bossKey=type==='miniboss'?Object.keys(chapterMinis)[Math.floor(random()*3)]:null;
   const encounter=abbey&&(layer===7?'abbey-boss':track===1&&layer===2?'abbey-seals':track===1&&layer===5?'abbey-guard':null);
   const name=encounter&&encounter!=='abbey-boss'?ABBEY_ENCOUNTERS[encounter].name:bossKey?chapterMinis[bossKey].name:type==='boss'?def.boss.name:`${chapterRooms[layer].name}・${ROOM_TYPES[type].label}`;
   const node={id:`${chapter===1?'':'C'+chapter+'-'}L${layer+1}C${col+1}`,chapter,layer,col,type,name,...(bossKey?{bossKey}:{}),...(deck?{track:['supply','seal','loot'][track]}:{}),...(encounter?{encounter}:{}),next:[]};nodes.push(node);ids.push(node.id);
  }layers.push(ids);
 }
 const graph={seed,chapter,routeVersion,difficulty:[1,2,3].includes(diff)?diff:1,nodes,layers,startID:layers[0][0]};
 for(const node of nodes)if(node.layer<7)node.next=layers[node.layer+1].filter(id=>{
  const next=routeNode(graph,id);
  if(node.encounter==='abbey-guard'&&next.type==='recovery')return false;
  return widths[node.layer]===1||widths[node.layer+1]===1||Math.abs(next.col-node.col)<=1;
 });
 return graph;
}
