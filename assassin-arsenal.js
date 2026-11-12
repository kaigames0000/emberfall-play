const thrown=[
 {id:'a_shuriken',name:'飛蝗刃',reqLevel:1,col:0,row:0,prevs:[],mana:8,cooldown:.55,damage:.5,arrows:3,pierce:0,speed:600,spread:.16,
  desc:'扇射3枚物理飛刃，同一次施放對同一敵人只命中一次。命中留下1層釘刃，最多3層、維持4秒；自身機關命中消耗釘刃，每層令該次陷阱傷害提高10%。',
  milestones:{3:'飛刃穿透增加1次',6:'額外投射物增加2枚，維持同敵單次命中',10:'命中已達3層釘刃的敵人，降低其傷害10%，持續2秒'}},
 {id:'a_kunai',name:'追魂苦無',reqLevel:30,col:0,row:5,prevs:['a_shuriken'],mana:18,cooldown:1.2,damage:1.65,arrows:1,pierce:2,speed:650,spread:.13,
  desc:'投擲穿透2名敵人的物理苦無，消耗目標釘刃，每層使本次命中傷害提高10%。已學連鎖佈防時，消耗釘刃可遠端啟動附近一個已武裝的自身機關，與飛蝗刃共用每0.8秒一次上限。',
  milestones:{3:'額外穿透1次',6:'消耗滿3層釘刃回復4魔力，每次施放一次',10:'消耗滿3層時施加3秒流血，每秒30%攻擊基準'}}
];

export function installAssassinArsenal(classes,abilities,trees,cards){
 classes.assassin.branches=['匕首近戰','鏡影支援','暗器機關'];
 classes.assassin.desc='匕首伏擊與瞬移連殺、分身光環支援、暗器釘刃與陷阱連鎖。';
 const nodes=new Map(trees.assassin.flat().map(n=>[n.id,n]));
 for(const spec of thrown){
  const {id,name,reqLevel,col,row,prevs,desc,milestones,...raw}=spec;
  const node={id,name,reqLevel,col,row,prevs,prev:prevs[0]??null,max:10,ability:id,icon:id==='a_shuriken'?'target':'sword',desc,synergies:[]};
  nodes.set(id,node);abilities[id]={...raw,id,name,cls:'assassin',type:'projectile',damageType:'physical',icon:node.icon,color:'#bdaddb',desc,designV29:true,arsenalV79:true};
  cards[id]={id,name,level:reqLevel,category:'damage',maxRank:10,prevs,effect:desc,synergy:'暗器建立釘刃，機關或苦無收割；分身可透過鏡影合擊呼應。',milestones};
 }
 nodes.set('a_relay',{id:'a_relay',name:'影契回流',reqLevel:12,col:1,row:2,prevs:['a_clone'],prev:'a_clone',max:1,icon:'rune',desc:'附近300距離內的存活影分身以自身普攻命中後，3秒內每秒回復自身1%最大生命與1%最大魔力。同源刷新，不疊加；影擊呼應、裝備觸發與木樁不提供回流。',mechanicSummary:['分身普攻帶動生命與魔力回復','需分身存活並保持近距離']});
 cards.a_relay={id:'a_relay',name:'影契回流',level:12,category:'passive',maxRank:1,prevs:['a_clone'],effect:nodes.get('a_relay').desc,milestones:{}};
 const shadowDescription='召喚一名永久影分身。分身使用角色目前的武器，依配置順序輪替相容的普攻技能，空欄時使用武器普攻。雙持時分身自行交替主副手，並可呼應有限的影擊指令。';
 Object.assign(nodes.get('a_clone'),{reqLevel:1,col:1,row:0,desc:shadowDescription});
 Object.assign(cards.a_clone,{level:1,effect:shadowDescription});
 abilities.a_clone.desc=shadowDescription;
 const placements={a_veil:[2,0],a_mark:[2,1],a_flurry:[0,2],a_mirrorstrike:[2,3],a_storm:[0,5],a_clone:[1,0],a_evasion:[0,1],a_dancer:[1,3],a_counter:[0,4],a_concord:[1,5]};
 for(const [id,[col,row]]of Object.entries(placements))Object.assign(nodes.get(id),{col,row});
 nodes.get('a_network').desc+=' 飛蝗刃建立滿3層釘刃，或苦無消耗釘刃時，可遠端啟動附近180距離內一個自身機關；每0.8秒一次，沿用最多兩個後續連鎖。';
 nodes.get('a_network').mechanicSummary=['暗器可遠端啟動已武裝機關','單鏈最多兩個後續，不會循環引爆'];
 cards.a_network.effect=nodes.get('a_network').desc;
 nodes.get('a_concord').desc+=' 學習後，飛蝗刃與追魂苦無亦可呼應一次弱化影擊，同一次施放僅一次。';cards.a_concord.effect=nodes.get('a_concord').desc;
 trees.assassin=[
  ['a_stab','a_veil','a_blink','a_dual','a_mark','a_flurry','a_execute','a_mirrorstrike','a_pursuit','a_storm'],
  ['a_clone','a_evasion','a_relay','a_dancer','a_counter','a_concord'],
  ['a_shuriken','a_blades','a_mine','a_sentry','a_network','a_kunai']
 ].map(ids=>ids.map(id=>nodes.get(id)));
}

export function masterArsenalAbility(def,rank){
 if(!def.arsenalV79)return null;
 const r=Math.max(0,Math.min(10,rank||0)),spec=thrown.find(x=>x.id===def.id),out={...def,masteryRank:r,m3:r>=3,m6:r>=6,m10:r>=10,masteries:[3,6,10].map(n=>({rank:n,label:spec.milestones[n],active:r>=n}))};
 if(out.m3)out.pierce++;
 if(out.id==='a_shuriken'&&out.m6)out.arrows+=2;
 return out;
}

// Shape-only pre-validation migration. Normal validation still rejects unknown skills and malformed arrays.
export function migrateShadowAura(hero){
 if(hero?.buildVersion!==7||!Array.isArray(hero.skillSlots)||hero.skillSlots.length!==3||!Array.isArray(hero.auraSkills)||hero.skillSlots.filter(id=>id==='a_dancer').length!==1)return;
 hero.skillSlots=hero.skillSlots.map(id=>id==='a_dancer'?null:id);
 if(!hero.auraSkills.includes('a_dancer'))hero.auraSkills.push('a_dancer');
}
