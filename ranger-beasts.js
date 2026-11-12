// Pure class-data installation. Costs remain on the shared owner-resource path.
const gates=[1,6,12,18,24,30];
const pets=[
 {id:'r_wolf',name:'灰狼夥伴',reqLevel:1,icon:'heart',mana:22,color:'#a8c2a5',prevs:[],
  desc:'永久近戰灰狼，直到死亡或按 C 重召。每隻占1容量，最多2隻；快速撕咬單一敵人，可追擊獵人標記。',
  summon:{kind:'wolf',beast:true,role:'近戰追獵',count:2,maxCount:2,capacityCost:1,hpMult:.5,attackMult:.5,interval:.75,ranged:false,damageType:'physical',armor:10},
  milestones:{3:'攻擊標記目標時，召喚傷害加成提高8%',6:'撕咬間隔縮短10%',10:'對標記目標的召喚傷害加成改為16%'}},
 {id:'r_bear',name:'巨熊守衛',reqLevel:6,icon:'shield',mana:44,color:'#c0a47e',prevs:['r_wolf'],
  desc:'永久前排巨熊，直到死亡或按 C 重召。占2容量、最多1隻；受到傷害降低15%，嘲諷附近非首領敵人，每擊橫掃最多3名目標。',
  summon:{kind:'bear',beast:true,role:'前排嘲諷',count:1,maxCount:1,capacityCost:2,hpMult:1.35,attackMult:.55,interval:1.35,ranged:false,damageType:'physical',armor:28,reduce:.15,tauntRadius:140,attackRadius:75,maxTargets:3},
  milestones:{3:'嘲諷半徑提高至160',6:'橫掃最多命中4名目標',10:'自身減傷提高至20%'}},
 {id:'r_eagle',name:'巡獵鷹',reqLevel:12,icon:'target',mana:28,color:'#c6c9b0',prevs:['r_wolf'],
  desc:'永久遠程巡獵鷹，直到死亡或按 C 重召。占1容量、最多1隻；羽刃命中留下3秒獵人標記，降低護甲6%。同源標記取強，不再轉移。',
  summon:{kind:'eagle',beast:true,role:'遠程標記',count:1,maxCount:1,capacityCost:1,hpMult:.38,attackMult:.4,interval:1.15,ranged:true,damageType:'physical',armor:5,markDuration:3,markArmor:.06},
  milestones:{3:'羽刃標記持續提高至4秒',6:'羽刃標記降低護甲提高至8%',10:'羽刃攻擊間隔縮短15%'}}
];
const passives=[
 {id:'r_packfocus',name:'群獸追獵',reqLevel:18,prevs:['r_wolf','r_eagle'],desc:'動物優先追擊附近的獵人標記目標；對標記目標的召喚傷害加成提高18%。保留近距離索敵及分散站位，不產生額外命中。'},
 {id:'r_beastguard',name:'野性護伴',reqLevel:24,prevs:['r_bear'],desc:'260距離內有存活動物時，自身閃避率提高8個百分點；附近有存活巨熊時，另獲得6%減傷。同類動物不疊加，遠離或死亡立即失效。'},
 {id:'r_lifebond',name:'荒野共生',reqLevel:30,prevs:['r_packfocus','r_beastguard'],desc:'300距離內的存活動物以自身普攻傷害標記敵人時，回復自身0.5%最大生命。所有動物合計每秒一次，受共用回血上限及治療降低影響；木樁、持續傷害與次級觸發不提供回復。'}
];
const poisonIDs=new Set(['r_poisonarrow','r_burst','r_rain','r_spread','r_basic_venom','r_basic_split']);
const positions={r_pierce:[0,0],r_volley:[1,0],r_basic_pierce:[2,0],r_mark:[0,1],r_dash:[1,1],r_ricochet:[1,2],r_snipe:[0,3],r_gale:[1,4],r_precision:[0,5],r_poisonarrow:[0,0],r_basic_venom:[1,0],r_basic_split:[2,0],r_burst:[0,2],r_rain:[0,3],r_spread:[0,4]};

export function installRangerBeasts(classes,abilities,trees,cards){
 const nodes=new Map(trees.ranger.flat().map(n=>[n.id,n]));
 for(const pet of pets){
  const {id,name,reqLevel,icon,mana,color,prevs,desc,summon,milestones}=pet;
  nodes.set(id,{id,name,max:10,reqLevel,col:1,row:gates.indexOf(reqLevel),prevs:[...prevs],prev:prevs[0]??null,icon,desc,ability:id,synergies:[]});
  abilities[id]={id,name,cls:'ranger',icon,color,desc,type:'summon',mana,cooldown:0,damageType:'physical',summon:{...summon},designV29:true,beastV80:true};
  cards[id]={id,name,level:reqLevel,category:'summon',maxRank:10,prevs:[...prevs],effect:desc,synergy:'與箭技、毒獵共用獵人標記；動物使用永久召喚編隊，按 C 重召整隊。',milestones:{...milestones}};
 }
 const mark=nodes.get('r_mark');if(mark){const effect='標記敵人並揭示箭傷弱點；不造成傷害、不提高爆傷倍率。',synergy='支援直射、彈射、毒箭與動物追獵；巡獵鷹同源標記取強，不重複降低護甲。';mark.desc=effect+' '+synergy;if(abilities.r_mark)abilities.r_mark.desc=mark.desc;cards.r_mark={...cards.r_mark,id:mark.id,name:mark.name,level:mark.reqLevel,category:'curse',maxRank:mark.max,prevs:[...mark.prevs],effect,synergy};}
 for(const p of passives){nodes.set(p.id,{...p,prevs:[...p.prevs],prev:p.prevs[0],max:1,col:1,row:gates.indexOf(p.reqLevel),icon:p.id==='r_beastguard'?'shield':'heart',mechanicSummary:[({r_packfocus:'動物優先追擊標記目標並提高傷害',r_beastguard:'附近動物增加閃避，巨熊另外提供減傷',r_lifebond:'動物命中標記目標時為本體回血，共用回復上限'})[p.id]]});cards[p.id]={id:p.id,name:p.name,level:p.reqLevel,category:'passive',maxRank:1,prevs:[...p.prevs],effect:p.desc};}
 const beastIDs=new Set([...pets,...passives].map(n=>n.id));
 for(const [id,position]of Object.entries(positions))if(nodes.has(id))Object.assign(nodes.get(id),{col:position[0],row:position[1]});
 trees.ranger=[[],[],[]];for(const node of nodes.values())trees.ranger[beastIDs.has(node.id)?2:poisonIDs.has(node.id)?1:0].push(node);
 for(const page of trees.ranger)page.sort((a,b)=>a.row-b.row||a.col-b.col);
 classes.ranger.branches=['弓術箭技','毒獵追蹤','荒野獸契'];classes.ranger.title='箭矢、毒獵與獸契';classes.ranger.skills=['穿心箭','毒牙箭','灰狼夥伴'];classes.ranger.desc='穿透狙擊與彈射箭、毒霧收割，以及灰狼、巨熊與巡獵鷹的永久獸群。';
}

export function masterBeastAbility(def,rank){
 if(!def.beastV80)return null;const pet=pets.find(p=>p.id===def.id);if(!pet)return null;
 const r=Math.max(0,Math.min(10,rank||0)),o={...def,summon:{...def.summon},masteryRank:r,m3:r>=3,m6:r>=6,m10:r>=10,masteries:[3,6,10].map(n=>({rank:n,label:pet.milestones[n],active:r>=n}))};
 if(o.id==='r_wolf'){o.summon.markedBonus=r>=10?.16:r>=3?.08:0;if(r>=6)o.summon.interval*=.9;}
 if(o.id==='r_bear'){if(r>=3)o.summon.tauntRadius=160;if(r>=6)o.summon.maxTargets=4;if(r>=10)o.summon.reduce=.2;}
 if(o.id==='r_eagle'){if(r>=3)o.summon.markDuration=4;if(r>=6)o.summon.markArmor=.08;if(r>=10)o.summon.interval*=.85;}
 return o;
}

export function beastEffectRows(def){const s=def?.summon;if(!s?.beast)return [];const rows=[];if(s.markDuration)rows.push(['羽刃標記',s.markDuration+' 秒 · 降低護甲 '+Math.round(s.markArmor*100)+'%'],['標記規則','同源取強，不再次轉移']);if(s.markedBonus)rows.push(['標記追擊','對標記目標的召喚傷害加成 +'+Math.round(s.markedBonus*100)+'%']);return rows;}
