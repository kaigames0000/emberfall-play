// Class rules live in the resource/equipment model. These nodes add mechanics,
// rather than making a player spend a point to unlock their class identity.
export function installClassIdentities(classes,abilities,trees,cards){
 classes.berserker.desc='以生命支付技能、光環與召喚，可單持或雙持所有近戰武器；靠命中回血與血費回收維持攻勢。';
 classes.assassin.desc='天生雙持匕首、敏捷與閃避；近身追殺、影分身與暗器機關。';
 classes.mage.hp=150;
 classes.mage.desc='生命較低、魔力充沛；冰雷法術、元素召喚與魔力防護。';
 const revise=(cls,id,desc,summary)=>{const node=trees[cls].flat().find(n=>n.id===id);if(!node)return;node.desc=desc;node.mechanicSummary=summary;if(cards[id])Object.assign(cards[id],{effect:desc,synergy:summary.join(' ')});};
 revise('berserker','b_dual','雙持時，本體近戰命中恢復生命；連續裂血斬累積三層節奏，斷頭重擊消耗節奏強化傷害。回血與其他血刃命中回復共用每秒上限。',['雙持近戰命中回血','三次裂血斬強化斷頭重擊']);
 revise('berserker','b_titan_grip','雙持重型武器時，三層節奏的斷頭重擊追加十字震波，命中後獲得短暫生命護盾。雙持重型武器不需學習此技能，白值、詞條、移速與傷害代價仍保留。',['重型雙持終結技追加十字震波','終結命中提供短暫護盾']);
 revise('assassin','a_dual','雙匕首第三次影刺命中追加一次短距追刺。追刺不能再次觸發、吸取或累積追刺。雙持匕首為職業內建能力。',['第三次影刺追加追刺']);
 revise('assassin','a_pursuit','本體近戰擊殺後，瞬移至附近另一名敵人並追刺一次；每1.2秒最多一次，追刺不再觸發追殺。擊殺自身破綻目標或斬喉消耗滿層，另回復影躍充能。',['近戰擊殺瞬移追刺','破綻收割回復影躍充能']);
 revise('berserker','b_reclaim','本體直接命中取回近四秒支付而未回收的部分血費，最多實付一半，每秒最多2%生命。命中回血與血費回收分開計算。',['直接命中回收近期實付血費']);
 for(const id of ['b_cleave','b_flurry'])if(abilities[id]){
  abilities[id].desc+=' 本體有效命中回復生命，同次施放只回復一次，與血刃命中回復共用每秒2%最大生命上限。';
  if(cards[id])cards[id].effect=abilities[id].desc;
 }
 if(abilities.m_frostarmor){
  abilities.m_frostarmor.buff={...abilities.m_frostarmor.buff,manaShield:.2};
  abilities.m_frostarmor.desc='凝結霜甲，提供生命護盾、護甲與減傷；期間20%剩餘承傷改由目前魔力支付。魔力不足的部分仍扣生命，魔力抵傷總上限35%。';
 }
 if(abilities.m_aegis){
  abilities.m_aegis.buff={...abilities.m_aegis.buff,manaShield:.15};
  abilities.m_aegis.desc+=' 啟用時15%剩餘承傷改由目前魔力支付，所有來源合計上限35%；魔力耗盡後不再抵傷。';
 }
 for(const id of ['m_fireball','m_nova','m_flamethrower','m_chain','m_spark'])if(abilities[id])abilities[id].desc+=' 熟練後對附近孤立目標提高命中傷害，不增加敵群傷害。';
 for(const id of ['m_fireball','m_nova','m_flamethrower','m_chain','m_spark','m_frostarmor','m_aegis']){const n=trees.mage.flat().find(n=>n.ability===id);if(n)n.desc=abilities[id].desc;}
}
