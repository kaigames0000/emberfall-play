const CROSSING_STEPS=[2,4,8,10,16];

// Each column is one depth of the shared route. These are real stat pairings,
// not cosmetic names on top of the same ring-wide formula.
const FRONTIERS={
 blade:[['披鋒入陣',{haste:.017,armor:2}],['卸力斬回',{physicalReduce:.013,skillLeech:.004}],['長刃立足',{skillArea:.032,hpPct:.016}],['握刃生息',{basicLeech:.005,lifeRegenPct:.0006}],['連斬展勢',{haste:.017,skillArea:.03}]],
 bastion:[['鍛脊立身',{armor:4,hpPct:.018}],['披甲禦術',{armor:4,allResist:.015}],['承擊復元',{physicalReduce:.015,lifeRegenPct:.0006}],['不退之勢',{reduce:.009,slowResistance:.035}],['深陣護體',{hpPct:.022,reduce:.01}]],
 domain:[['儀式護持',{manaRegen:.26,allResist:.013}],['祈息養身',{manaCost:.014,lifeRegenPct:.0006}],['廣域調律',{skillArea:.033,manaCost:.012}],['久祝禦術',{skillDuration:.031,allResist:.015}],['餘音回流',{manaRegen:.22,skillDuration:.034}]],
 legion:[['行軍儲備',{mana:9,hpPct:.016}],['軍陣補整',{lifeRegen:.35,armor:3}],['減荷行軍',{manaCost:.015,slowResistance:.03}],['後備補給',{mana:10,lifeRegenPct:.00065}],['整隊換息',{manaRegen:.26,hpPct:.018}]],
 pact:[['締約存息',{mana:10,manaRegen:.21}],['共生立足',{hpPct:.018,lifeRegenPct:.00065}],['護契儲能',{allResist:.018,mana:8}],['固契節流',{physicalReduce:.015,manaCost:.013}],['守契養元',{lifeRegenPct:.0007,allResist:.018}]],
 arcane:[['術脈蓄勢',{mana:10,castSpeed:.017}],['秘泉調和',{mana:8,manaRegen:.22}],['展域施法',{skillArea:.033,castSpeed:.02}],['循環節流',{manaCost:.016,manaRegen:.24}],['秘術整備',{mana:12,cdr:.014}]],
 affliction:[['留痕蓄咒',{skillDuration:.029,mana:6}],['展咒調息',{manaRegen:.23,skillArea:.028}],['廣域蝕痕',{skillArea:.032,ailmentDuration:.03}],['長咒節流',{manaCost:.013,skillDuration:.031}],['餘咒續接',{cdr:.014,skillDuration:.032}]],
 venom:[['定距散霧',{projectileRange:.035,skillArea:.025}],['淬毒走位',{ailmentDuration:.033,speedPct:.013}],['餘毒收能',{ailmentDuration:.033,manaOnHit:.35}],['霧中生息',{lifeRegenPct:.0007,skillArea:.029}],['毒矢留痕',{projectileDamage:.029,ailmentDuration:.035}]],
 ballistics:[['舒弦定距',{haste:.017,projectileRange:.035}],['卸步勁射',{projectileDamage:.025,evasion:.012}],['遠矢追步',{projectileRange:.038,speedPct:.013}],['箭勢回收',{haste:.017,manaOnHit:.35}],['射穿王陣',{projectileDamage:.03,bossDamage:.024}]],
 precision:[['弱點節拍',{crit:.007,haste:.016}],['連擊回收',{manaOnHit:.35,basicLeech:.004}],['攻勢間奏',{haste:.016,cdr:.014}],['定息尋隙',{crit:.007,lifeRegenPct:.0006}],['獵王眼力',{bossDamage:.026,crit:.008}]],
 devices:[['佈陣踏步',{cdr:.014,speedPct:.013}],['陣地退路',{skillArea:.03,evasion:.012}],['器械周轉',{cdr:.014,mana:8}],['撤線廣佈',{movementRecovery:.03,skillArea:.027}],['大陣節能',{manaCost:.015,skillArea:.035}]],
 celerity:[['起步換位',{movementRecovery:.027,speedPct:.013}],['卸滯閃步',{evasion:.014,slowResistance:.032}],['穿陣護身',{evasion:.014,hpPct:.018}],['換位養息',{movementRecovery:.032,lifeRegenPct:.00055}],['快步重整',{speedPct:.014,cdr:.014}]],
 blood:[['血脈養元',{hpPct:.02,lifeRegenPct:.00065}],['堅軀止血',{physicalReduce:.012,lifeRegenPct:.0006}],['血刃雙回',{basicLeech:.005,skillLeech:.004}],['赤鋒節奏',{hpPct:.021,haste:.014}],['持勢血脈',{hpPct:.022,skillDuration:.029}]]
};

// Keyed by the region on the left of the border. No effect requires a weapon,
// minion type, specific skill, or the equipment permission of either region.
const BORDERS={
 blade:[['鐵脊步',{armor:5,hpPct:.021},'近身攻擊與前線防禦都需要承受物理命中。'],['卸勢回身',{physicalReduce:.018,lifeRegen:.45},'減少連續物理傷害，並在換位時補回生命。']],
 bastion:[['護陣共鳴',{allResist:.02,hpPct:.017},'增加守線與維持近身光環時的生存空間。'],['久守餘威',{reduce:.012,skillDuration:.033},'減傷可常駐，持續時間則支援防護與戰吼。']],
 domain:[['供能共契',{manaCost:.018,manaRegen:.26},'維持光環與重召軍隊共用同一份魔力，減耗與回復都能派上用場。'],['護持補給',{mana:10,allResist:.017},'多留一點施法資源，也提高領隊的元素防護。']],
 legion:[['軍陣儲備',{mana:11,lifeRegen:.42},'留出重召空間，讓本體能在軍勢掩護下恢復。'],['共陣承勢',{hpPct:.022,physicalReduce:.016},'本體在召喚陣線後仍需要能承受漏過的攻擊。']],
 pact:[['靈脈匯流',{mana:12,manaRegen:.26},'施法、補召與魔力護盾都能使用較大的魔力儲備。'],['蓄能護持',{mana:11,manaCost:.017},'同時擴大可支付的編隊，降低連續施法與補召的成本。']],
 arcane:[['展咒術脈',{skillArea:.04,manaCost:.013},'區域法術與主動詛咒都能擴大覆蓋並降低耗魔。'],['咒式循環',{cdr:.017,skillDuration:.036},'加快主動技能輪轉，延長具持續時間的術式與咒印。']],
 affliction:[['霧域蝕刻',{skillArea:.038,ailmentDuration:.033},'增加詛咒與毒霧覆蓋，延長可支援的異常狀態。'],['餘咒續航',{skillDuration:.037,manaRegen:.23},'延長咒印和區域效果，留出魔力支援後續施放。']],
 venom:[['淬箭定距',{projectileRange:.045,haste:.017},'延長箭矢飛行距離；攻速也支援弓系普攻與受攻速影響的攻擊。'],['蔓射擴散',{projectileDamage:.03,skillArea:.034},'強化投射命中，並拓展毒霧與可放大的技能範圍。']],
 ballistics:[['引弦瞄準',{crit:.008,haste:.019},'提高箭技與武器普攻的出手頻率及爆擊機會。'],['獵王定標',{bossDamage:.029,manaOnHit:.45},'用直接命中對付首領，並回收可用於下一次技能的魔力。']],
 precision:[['攻佈交替',{haste:.019,cdr:.016},'攻速支援普攻與暗器，冷卻縮減縮短下一次佈置的等待。'],['走打補給',{speedPct:.016,manaOnHit:.45},'用移動維持距離，讓直接命中補回部署機關所需的魔力。']],
 devices:[['佈撤節奏',{movementRecovery:.034,cdr:.016},'加快位移恢復與佈置循環，方便放下機關後撤離。'],['迴身護腳',{evasion:.017,slowResistance:.035},'減少被緩速留在原地的時間，維持迴避空間。']],
 celerity:[['避鋒養息',{evasion:.016,lifeRegenPct:.0008},'閃避減少失血，生命再生同時補上戰鬥損耗與血費。'],['疾行續血',{movementRecovery:.034,hpPct:.021},'留出支付血費的生命空間，也更容易撤出危險區域。']],
 blood:[['刃上生息',{basicLeech:.006,skillLeech:.005},'普攻與主動技能分別提供吸血，讓輪替出手也能維持生命。'],['血鋒節拍',{hpPct:.022,haste:.018},'多留一點近戰或血費的容錯，並加快武器出手。']]
};
const COMPLEMENTS={legion:['整隊護行',{armor:3,manaRegen:.22}],affliction:['持印後撤',{skillDuration:.03,speedPct:.012}],venom:['毒徑防身',{evasion:.013,ailmentDuration:.028}],devices:['佈後急行',{speedPct:.014,movementRecovery:.029}]};

function iconFor(mods){
 if(mods.armor||mods.allResist||mods.reduce||mods.physicalReduce)return 'shield';
 if(mods.projectileRange||mods.projectileDamage)return 'bow';
 if(mods.speedPct||mods.evasion||mods.movementRecovery)return 'wind';
 if(mods.lifeRegenPct||mods.basicLeech||mods.hpPct)return 'heart';
 if(mods.haste||mods.crit||mods.bossDamage)return 'sword';
 return 'rune';
}
function apply(node,[name,mods,note],describe){
 Object.assign(node,{name,mods:Object.freeze(mods),description:describe(mods,note),effectDescription:note??''});
}

export function specializeRingNeighborhoods({themes,routes,bySector,borders,describe}){
 const count=themes.length;
 for(const [sector,[theme]]of themes.entries()){
  const front=FRONTIERS[theme],right=BORDERS[theme],left=BORDERS[themes[(sector+count-1)%count][0]];
  for(const [i,step]of CROSSING_STEPS.entries())apply(routes[sector][step-1],front[i],describe);
  const recipes=[front[0],left[0],right[0],front[1],front[2],left[1],right[1],front[3],front[4],COMPLEMENTS[theme]];
  bySector[sector].filter(n=>n.expansion&&n.shared).forEach((node,i)=>{
   const [name,mods]=recipes[i],scale=node.medium?.9:.78;
   const tuned=Object.fromEntries(Object.entries(mods).map(([key,value])=>[key,['mana','armor'].includes(key)?Math.max(1,Math.round(value*scale)):Number((value*scale).toFixed(5))]));
   apply(node,[name+'・支脈',tuned],describe);
  });
 }
 for(const node of borders){
  const [a,b]=node.bridgeBetween,recipe=BORDERS[themes[a][0]][node.anchorStep===10?0:1];
  apply(node,recipe,describe);node.themeName=bySector[a][0].themeName+' ↔ '+bySector[b][0].themeName;node.icon=iconFor(node.mods);
 }
}
