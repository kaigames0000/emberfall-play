// Pure data and rank composition; live heat and paid life belong to combat.
const gates=[1,6,12,18,24,30];
const core={
 id:'b_bloodaura',name:'赤怒之息',reqLevel:1,prevs:[],icon:'heart',
 effect:'持續消耗生命，強化攻擊速度與傷害。成功維持每2秒累積一層血熱，最多5層；每層讓基礎維持耗血提高20%，另獲得1.5%傷害及0.5%攻擊速度增益；生命不足時停止。',
 synergy:'下游被動讓血熱轉為物理脈衝、速度、護盾與手動收束爆發；耗血本身不算受擊，也不產生狂怒。',
 summary:['持續耗血強化攻勢','有效付費累積血熱並提高維持耗血'],
 milestones:{3:'已學會的血熱脈衝半徑增加15',6:'已學會的血熱脈衝間隔縮短至0.9秒',10:'已學會的血誓收束爆發半徑增加20'}
};
const passives=[
 {id:'b_bloodpulse',name:'血熱脈衝',reqLevel:6,prevs:['b_bloodaura'],
  effect:'赤怒之息有效維持時，每秒對附近最多8名敵人造成一次物理脈衝；每層血熱提高脈衝傷害8%。脈衝不產生狂怒、吸血或裝備觸發。',
  summary:['血熱光環週期造成物理脈衝','血熱強化脈衝傷害']},
 {id:'b_bloodtempo',name:'沸血疾律',reqLevel:12,prevs:['b_bloodpulse'],
  effect:'赤怒之息每層血熱提供2%攻擊速度、2%施法速度與3%移動速度；關閉光環或失去血熱時立即失效。',
  summary:['血熱提高攻擊、施法與移動速度']},
 {id:'b_bloodward',name:'赤魄護身',reqLevel:18,prevs:['b_bloodtempo'],
  effect:'血熱脈衝實際傷害敵人後，獲得最大生命1.2%的短暫護盾；所有脈衝合計每秒最多一次，護盾上限為最大生命6%，持續2秒。空揮不提供護盾。',
  summary:['脈衝實際命中轉為短暫生命護盾','護盾有總量與取得頻率上限']},
 {id:'b_resonance',name:'狂血共鳴',reqLevel:24,prevs:['b_bloodaura'],
  effect:'狂怒達80點時，裂血斬、連斬或血熱脈衝可消耗10點狂怒追加一次物理後震。所有來源共用每秒一次的狂怒消耗限制；後震不產生狂怒、吸血或觸發。',
  summary:['血熱脈衝可消耗狂怒追加物理後震','與血刃共鳴共用消耗間隔']},
 {id:'b_bloodoath',name:'血誓收束',reqLevel:30,prevs:['b_bloodward','b_resonance'],
  effect:'赤怒之息至少有效付費6秒且達3層血熱後，手動關閉時釋放一次物理爆發；每層血熱提高傷害15%，最多命中12名敵人，爆發間隔6秒。生命不足、死亡或失去技能等自動停止不釋放。',
  summary:['蓄積血熱後手動關閉光環可釋放物理爆發','自動停止不觸發收束爆發']}
];
const cryMasteries={3:'戰吼持續時間增加0.5秒',6:'啟動血費降低15%',10:'戰吼持續時間再增加0.5秒'};
const warcries=[
 {id:'b_rally',name:'噬血戰吼',reqLevel:1,prevs:[],icon:'heart',duration:4,cooldown:7,lifeCost:.02,buff:{leech:.035},
  effect:'支付一次生命，使暫時提高本體傷害吸血；召喚物傷害以半效率為本體回血，回復仍受共用上限與治療降低影響。',
  summary:['戰吼提供短暫攻擊吸血','自身與召喚物共享增益']},
 {id:'b_frenzycry',name:'疾怒戰吼',reqLevel:6,prevs:['b_rally'],icon:'sword',duration:3.5,cooldown:7,lifeCost:.025,buff:{haste:.12,castSpeed:.12,speedPct:.10},
  effect:'支付一次生命，使自己與召喚物暫時提高攻擊速度、施法速度與移動速度；持續時間結束後失效。',
  summary:['戰吼提高攻擊、施法與移動速度','自身與召喚物共享增益']},
 {id:'b_ironcry',name:'鐵血戰吼',reqLevel:18,prevs:['b_frenzycry'],icon:'shield',duration:4,cooldown:8,lifeCost:.02,buff:{allResist:.10,reduce:.06},
  effect:'支付一次生命，使自己與召喚物暫時提高全元素抗性並降低受到的傷害；不抵銷自身血費。',
  summary:['戰吼提高全元素抗性與減傷','自身與召喚物共享增益']}
];
const bloodIDs=new Set([core.id,...passives.map(n=>n.id),'b_basic_rage']);
const warcryIDs=new Set(['b_leap','b_guardcry','b_dread','b_reclaim','b_ritual','b_avatar',...warcries.map(n=>n.id)]);
const warcryCells={b_rally:[0,0],b_frenzycry:[0,1],b_leap:[2,1],b_ritual:[0,2],b_guardcry:[2,2],b_ironcry:[0,3],b_dread:[2,3],b_avatar:[0,5],b_reclaim:[2,5]};
const nativeResourceText=text=>typeof text==='string'?text.replace(/血費與少量魔力/g,'血費').replace(/少量血費與魔力/g,'少量血費').replace(/血費與魔力/g,'生命').replace(/生命與魔力/g,'生命').replace(/狂怒與魔力/g,'生命與狂怒'):text;
const nodeFor=(def,max,col=1)=>({id:def.id,name:def.name,max,reqLevel:def.reqLevel,col,row:gates.indexOf(def.reqLevel),prevs:[...def.prevs],prev:def.prevs[0]??null,icon:def.icon??'heart',desc:def.effect+(def.synergy?' '+def.synergy:''),mechanicSummary:[...def.summary],synergies:[]});

export function installBerserkerBloodData(classes,abilities,trees,cards){
 const nodes=new Map(trees.berserker.flat().map(node=>[node.id,node]));
 const aura=nodeFor(core,10);aura.ability=core.id;nodes.set(core.id,aura);
 abilities[core.id]={...abilities[core.id],id:core.id,name:core.name,cls:'berserker',icon:core.icon,color:classes.berserker.color,desc:aura.desc,designV29:true,bloodBuildV81:true,type:'aura',toggle:true,cooldown:0,lifePerSecond:.015,heatRules:{max:5,secondsPerStack:2,drainPerStack:.2,damagePerStack:.015,hastePerStack:.005},buff:{haste:.10,damageBonus:.08}};
 cards[core.id]={id:core.id,name:core.name,level:1,category:'aura',maxRank:10,prevs:[],effect:core.effect,synergy:core.synergy,milestones:{...core.milestones}};
 for(const passive of passives){
  nodes.set(passive.id,nodeFor(passive,1));
  cards[passive.id]={id:passive.id,name:passive.name,level:passive.reqLevel,category:'passive',maxRank:1,prevs:[...passive.prevs],effect:passive.effect};
 }
 for(const cry of warcries){
  const node=nodeFor(cry,10,0);node.ability=cry.id;nodes.set(cry.id,node);
  abilities[cry.id]={id:cry.id,name:cry.name,cls:'berserker',icon:cry.icon,color:classes.berserker.color,desc:cry.effect,designV29:true,bloodBuildV81:true,type:'guard',team:true,mana:0,cooldown:cry.cooldown,duration:cry.duration,lifeCost:cry.lifeCost,buff:{...cry.buff}};
  cards[cry.id]={id:cry.id,name:cry.name,level:cry.reqLevel,category:'warcry',maxRank:10,prevs:[...cry.prevs],effect:cry.effect,milestones:{...cryMasteries}};
 }
 // Legacy learned skills move without changing identity, rank cap or prerequisites.
 for(const node of nodes.values()){
  node.desc=nativeResourceText(node.desc);
  if(node.id==='b_basic_rage')Object.assign(node,{col:2,row:1});
  if(warcryCells[node.id])Object.assign(node,{col:warcryCells[node.id][0],row:warcryCells[node.id][1]});
  const ability=abilities[node.ability];if(ability)ability.desc=nativeResourceText(ability.desc);
  const card=cards[node.id];if(card){card.effect=nativeResourceText(card.effect);if(card.synergy)card.synergy=nativeResourceText(card.synergy);}
 }
 trees.berserker=[[],[],[]];
 for(const node of nodes.values())trees.berserker[bloodIDs.has(node.id)?1:warcryIDs.has(node.id)?2:0].push(node);
 for(const page of trees.berserker)page.sort((a,b)=>a.row-b.row||a.col-b.col);
 Object.assign(classes.berserker,{title:'裂血、血熱與戰吼',branches:['裂血狂攻','血怒焚身','不屈戰吼'],skills:['裂血斬','赤怒之息','噬血戰吼'],desc:'以生命支付技能；以血刃近戰、持續血熱或各式戰吼維持攻勢，管理狂怒與命中回復。'});
}

export function masterBerserkerBloodAbility(def,rank,investments={}){
 if(!def?.bloodBuildV81)return null;
 const cry=warcries.find(cry=>cry.id===def.id),isCore=def.id===core.id;if(!cry&&!isCore)return null;
 const r=Math.max(0,Math.min(10,Math.floor(Number.isFinite(rank)?rank:0))),milestones=isCore?core.milestones:cryMasteries;
 const out={...def,buff:{...def.buff},masteryRank:r,m3:r>=3,m6:r>=6,m10:r>=10,masteries:[3,6,10].map(n=>({rank:n,label:milestones[n],active:r>=n}))};
 if(isCore){
  const scaling=def.bloodBuildScaling||{damage:1,area:1,effect:1};out.heatRules={...def.heatRules,damagePerStack:def.heatRules.damagePerStack*scaling.effect,hastePerStack:def.heatRules.hastePerStack*scaling.effect};
  // Recompose from invested passives on every preview/refresh; never retain stale state.
  for(const key of ['bloodPulse','bloodTempo','bloodWard','bloodResonance','bloodOath'])delete out[key];
  if(investments.b_bloodpulse>0)out.bloodPulse={damage:(.35+.035*(def.level||1))*scaling.damage*scaling.effect,interval:r>=6?.9:1,radius:Math.min(300,(r>=3?195:180)*scaling.area),maxTargets:8,heatDamage:.08};
  if(investments.b_bloodtempo>0)out.bloodTempo={hastePerStack:.02*scaling.effect,castPerStack:.02*scaling.effect,speedPerStack:.03*scaling.effect};
  if(investments.b_bloodward>0)out.bloodWard={perPulse:.012,cap:.06,duration:2};
  if(investments.b_resonance>0)out.bloodResonance=true;
  if(investments.b_bloodoath>0)out.bloodOath={minimumHeat:3,minimumSeconds:6,cooldown:6,radius:Math.min(400,(r>=10?240:220)*scaling.area),damage:1.25*scaling.damage*scaling.effect,heatDamage:.15,maxTargets:12};
 }else{
  out.duration=def.duration+(r>=3?.5:0)+(r>=10?.5:0);
  if(r>=6)out.lifeCost=def.lifeCost*.85;
 }
 return out;
}

const number=value=>String(Number(value.toFixed(2)));
const percent=value=>number(value*100)+'%';
export function bloodEffectRows(def){
 if(!def?.bloodBuildV81)return [];
 if(def.id!==core.id)return warcries.some(cry=>cry.id===def.id)?[['戰吼共享','自身與召喚物共享短暫增益；只有施放者支付血費']]:[];
 const heat=def.heatRules,rows=[];
 if(heat)rows.push(['血熱累積','有效付費每 '+number(heat.secondsPerStack)+' 秒一層，最多 '+heat.max+' 層'],['血熱維持費','每層基礎耗血增加 '+percent(heat.drainPerStack)+'，最高增加 '+percent(heat.max*heat.drainPerStack)]);
 if(heat?.damagePerStack)rows.push(['血熱攻勢','每層傷害 +'+percent(heat.damagePerStack)+' · 攻速 +'+percent(heat.hastePerStack)]);
 const pulse=def.bloodPulse;if(pulse)rows.push(['物理脈衝','每 '+number(pulse.interval)+' 秒 · '+percent(pulse.damage)+' 攻擊傷害 · 半徑 '+pulse.radius+' · 最多 '+pulse.maxTargets+' 名'],['血熱脈衝','每層傷害增加 '+percent(pulse.heatDamage)+'；不產生狂怒、吸血或裝備觸發']);
 const tempo=def.bloodTempo;if(tempo)rows.push(['血熱疾律','每層攻速 +'+percent(tempo.hastePerStack)+' · 施速 +'+percent(tempo.castPerStack)+' · 移速 +'+percent(tempo.speedPerStack)]);
 const ward=def.bloodWard;if(ward)rows.push(['凝血護盾','脈衝實際命中每秒最多獲得 '+percent(ward.perPulse)+' 最大生命 · 上限 '+percent(ward.cap)+' · '+number(ward.duration)+' 秒']);
 if(def.bloodResonance)rows.push(['狂怒共鳴','狂怒達 80 點可消耗 10 點追加物理後震；與血刃共用 1 秒間隔，後震不再觸發']);
 const oath=def.bloodOath;if(oath)rows.push(['手動收束',oath.minimumHeat+' 層血熱且有效付費 '+number(oath.minimumSeconds)+' 秒後手動關閉 · 間隔 '+number(oath.cooldown)+' 秒'],['物理收束爆發',percent(oath.damage)+' 攻擊傷害 · 每層增加 '+percent(oath.heatDamage)+' · 半徑 '+oath.radius+' · 最多 '+oath.maxTargets+' 名']);
 return rows;
}
