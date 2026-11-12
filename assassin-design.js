const definitions=[
 ['a_veil','隱身術',1,0,0,1,[],{type:'guard',mana:22,cooldown:6,duration:3},'隱身3秒：閃避+15%、承傷降低20%，暫停自動攻擊。手動攻擊破隱，下一次本體直接命中傷害+25%；不是無敵，已發動攻擊仍會命中，首領可看穿隱身。破隱後2秒內無法再次隱身。',{3:'隱身延長1秒',6:'破隱使附近敵人緩速25%，持續2秒',10:'破隱後殘留12%閃避，持續2秒'}],
 ['a_evasion','幻步本能',6,0,1,1,['a_veil'],null,'閃避率+18%；未閃避的敵方攻擊使適應閃避+3%，最多3層、持續3秒，成功閃避後清空。總閃避上限80%。'],
 ['a_flurry','斷脈連襲',12,2,2,0,['a_stab'],{type:'nova',mana:26,cooldown:1.8,damage:.42,radius:170,combo:{mode:'flurry',hits:6,interval:.11}},'對近身單一敵人快速連擊6次，每擊42%物理傷害。每擊削甲與降攻2%，最多各10%、持續4秒；攻速加快連擊。',{3:'最後一擊施加1層破綻，銜接影刺與斬喉',6:'連擊增加至8次，總施放時間有下限',10:'最後一擊把降攻提高至20%，持續4秒'}],
 ['a_dancer','殘影光環',18,1,3,1,['a_evasion'],{type:'aura',mana:8,drain:5,radius:250,buff:{evasion:.08,reduce:.06}},'配置光環即啟用，持續每秒消耗5魔力。閃避率+8%、承傷降低6%；同時庇護自身召喚盟友。保留普通攻擊與技能施放，不進入隱身。',{3:'光環同時提高自身召喚物攻速10%',6:'成功閃避回復4魔力，最多每0.75秒一次',10:'成功閃避提供0.8秒額外8%閃避，同源刷新'}],
 ['a_counter','借隙反擊',24,0,4,1,['a_dancer'],null,'成功閃避後回復1%最大生命，並反擊140範圍內最多3敵、各45%物理傷害；每秒最多一次。反擊不爆擊、不吸取、不觸發裝備技能。'],
 ['a_storm','萬影瞬殺',30,2,5,0,['a_flurry','a_blink'],{type:'nova',mana:34,cooldown:3.2,damage:.9,radius:260,combo:{mode:'blink',hits:5,interval:.14,perTarget:3}},'依序閃現攻擊最多5次，優先不同敵人，每次90%物理傷害；單一敵人最多3擊。逐次檢查合法落點，施放期間並非無敵。',{3:'每次瞬殺命中施加1層破綻，強化早期斬喉收割',6:'瞬殺總次數增加至7次，單敵仍最多3擊',10:'完成瞬殺獲得2秒15%閃避；與殘影光環共用上限'}]
];
export function installShadowData(classes,abilities,trees,cards){
 classes.assassin.branches=['瞬影連殺','幽幕影衛','機關伏擊'];classes.assassin.desc='隱身伏擊、瞬移連擊、閃避反擊，混搭永久影分身與物理機關。';
 for(const[id,name,reqLevel,col,row,page,prevs,raw,description,milestones]of definitions){
  const node={id,name,reqLevel,col,row,prevs,prev:prevs[0]??null,max:raw?10:1,icon:raw?.combo?'sword':id==='a_counter'?'shield':'eye',desc:description,...(raw?{ability:id}:{mechanicSummary:id==='a_evasion'?['增加閃避','受擊累積適應，成功閃避清空']:['閃避後反擊','回復生命']})};trees.assassin[page].push(node);
  cards[id]={id,name,level:reqLevel,category:raw?raw.type==='aura'?'aura':raw.type==='guard'?'warcry':'damage':'passive',maxRank:node.max,prevs,effect:description,synergy:id==='a_storm'?'瞬殺建立破綻，斬喉收割並回充影躍。':id==='a_flurry'?'末擊建立破綻，支援影刺與斬喉。':'隱身、殘影與閃避反擊可混搭分身或盾牌。',milestones:milestones??{}};
  if(raw)abilities[id]={...raw,id,name,cls:'assassin',icon:node.icon,color:'#baa0df',damageType:'physical',desc:description,designV29:true,shadowV70:true};
 }
}
export function masterShadowAbility(def,rank){
 if(!def.shadowV70)return null;const r=Math.max(0,Math.min(10,rank||0)),data=definitions.find(row=>row[0]===def.id),o={...def,masteryRank:r,m3:r>=3,m6:r>=6,m10:r>=10,masteries:[3,6,10].map(n=>({rank:n,label:data[9]?.[n]??'',active:r>=n}))};
 if(o.combo)o.combo={...o.combo,hits:o.combo.hits+(o.m6?2:0)};if(o.id==='a_veil'){if(o.m3)o.duration++;o.duration=Math.min(5,o.duration);}if(o.id==='a_dancer'&&o.m3)o.buff={...o.buff,summonHaste:.1};return o;
}
