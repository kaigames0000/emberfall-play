import {chapterDefinition} from './chapter-data.js?v=108';
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
function seededRandom(seed){let state=2166136261;for(const c of String(seed))state=Math.imul(state^c.charCodeAt(0),16777619);return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function routeNode(graph,id){return graph?.nodes?.find(n=>n.id===id)??null;}
export function routeChoices(graph,currentID){return (routeNode(graph,currentID)?.next??[]).map(id=>routeNode(graph,id)).filter(Boolean);}
export function createRoute(seed,diff=1,chapter=1){
 const def=chapterDefinition(chapter);if(!def)throw Error('未知章節');const chapterRooms=def.rooms,chapterMinis=def.minis;
 const random=seededRandom(seed),widths=[1,3,3,1,3,3,3,1],nodes=[],layers=[];
 for(let layer=0;layer<widths.length;layer++){
  const choices=['normal','elite','welfare','treasure','trial','mystery'];for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  const types=choices.slice(0,3);if(layer===4||layer===6)types[Math.floor(random()*3)]='recovery';
  const ids=[];for(let index=0;index<widths[layer];index++){
   const col=widths[layer]===1?1:index,type=layer===0?'normal':layer===3?'miniboss':layer===7?'boss':types[index],bossKey=type==='miniboss'?Object.keys(chapterMinis)[Math.floor(random()*3)]:null;
   const node={id:`${chapter===1?'':'C'+chapter+'-'}L${layer+1}C${col+1}`,chapter,layer,col,type,name:bossKey?chapterMinis[bossKey].name:type==='boss'?def.boss.name:`${chapterRooms[layer].name}・${ROOM_TYPES[type].label}`,...(bossKey?{bossKey}:{}),next:[]};nodes.push(node);ids.push(node.id);
  }layers.push(ids);
 }
 const graph={seed,chapter,difficulty:[1,2,3].includes(diff)?diff:1,nodes,layers,startID:layers[0][0]};
 for(const node of nodes)if(node.layer<7)node.next=layers[node.layer+1].filter(id=>widths[node.layer]===1||widths[node.layer+1]===1||Math.abs(routeNode(graph,id).col-node.col)<=1);
 return graph;
}
