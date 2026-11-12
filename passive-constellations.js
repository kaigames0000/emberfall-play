// Append-only extensions: old node IDs and investments remain valid.
export const PASSIVE_LAYOUT={size:2880,center:1440,labelRadius:1350,minScale:.08,maxScale:1.8};
export const ROLE_BRANCHES={warrior:['blade','bastion','domain','precision','affliction'],berserker:['blade','blood','bastion','celerity'],assassin:['blade','celerity','precision','devices','pact'],ranger:['ballistics','precision','affliction','celerity'],mage:['arcane','legion','pact','affliction','ballistics']};
export const CONDITION_LABELS={melee:'持近戰武器',twohand:'單把雙手近戰武器',dual:'雙持近戰武器',spell:'持短杖／長杖／法書',shield:'裝備盾牌',ranged:'持弓或法術武器',army:'已配置召喚物',singleArmy:'僅配置1個召喚物',auras:'已配置光環',blood:'狂戰士或已學血費技能',devices:'已配置機關技能',always:'無裝備限制'};
const lane=(name,condition,minors,one,two,key,title,description)=>({name,condition,minors,one,two,key,title,description});
export const CONSTELLATIONS={
 blade:[
  lane('重鋒震斬','twohand',[{physicalDamage:.02},{skillArea:.025},{attackDamage:.02},{hpPct:.02}],{attackDamage:.07},{skillArea:.1},'cleave','三擊震刃','近戰本體直接命中每3次施放，追加一次90範圍、最多4敵、18%攻擊基準的物理震擊。每0.8秒最多一次；追加傷害不再觸發。'),
  lane('左右交鋒','dual',[{haste:.015},{attackDamage:.02},{basicLeech:.005},{physicalDamage:.02}],{dualDamage:.08},{haste:.05},'alternation','交替殺勢','雙持普攻交替使用兩手累積3次後，下一次近戰主動命中傷害提高15%；需在3秒內消耗，不把雙段視為兩次施放。')],
 arcane:[
  lane('深泉循環','spell',[{mana:12},{manaRegenPct:.04},{manaCost:.015},{hpPct:.02}],{manaRegenPct:.14},{mana:50},'manaCycle','秘能回流','主動技能實際累計花費35%最大魔力後，於3秒內回復6%最大魔力。每5秒至多啟動一次；光環、免費觸發不累積。'),
  lane('符文複奏','spell',[{castSpeed:.02},{spellDamage:.02},{skillArea:.025},{manaRegenPct:.04}],{spellDamage:.07},{castSpeed:.06},'spellEcho','第四符文','每4次付費傷害法術，下一次本體法術直接命中追加18%攻擊基準的同屬性回響。一次施放只計一次，不複製完整技能。')],
 precision:[
  lane('首領追獵','always',[{crit:.004},{bossDamage:.025},{hpPct:.02},{attackDamage:.02}],{bossDamage:.08},{crit:.018},'bossHunt','獵王節拍','對同一首領以本體直接命中6次，追加35%攻擊基準的物理追擊。每秒最多一次，追加傷害不能爆擊或吸取。'),
  lane('印記傳承','always',[{markedDamage:.025},{skillDuration:.025},{crit:.004},{speedPct:.01}],{markedDamage:.08},{skillDuration:.08},'markLegacy','獵痕傳承','擊殺具有自身獵人標記或裂隙印記的敵人，將剩餘至多3秒的印記交給附近2敵。與技能轉移共用名額，傳承印記不再轉移。')],
 bastion:[
  lane('盾鋒反震','shield',[{armor:2},{shieldBlock:.008},{hpPct:.02},{shieldBlockReduction:.01}],{shieldBlock:.025},{armor:12},'blockReprisal','盾鋒反震','格擋儲存阻止傷害的15%，上限30%攻擊基準；3秒內下一次本體直接命中釋放物理反震，最多4敵。'),
  lane('絕境壁壘','always',[{hpPct:.025},{physicalReduce:.01},{allResist:.015},{lifeRegen:.5}],{hpPct:.07},{allResist:.05},'emergency','背水壁壘','生命低於35%時生成最大生命8%的短暫護盾，持續3秒，每12秒一次。不是回血或免死，不能抵消血費與傷害債。')],
 celerity:[
  lane('追影突襲','always',[{speedPct:.012},{movementRecovery:.03},{attackDamage:.02},{castSpeed:.015}],{movementRecovery:.1},{speedPct:.04},'pursuit','追影餘斬','使用位移後3秒內，下一次本體直接命中追加80範圍、最多3敵、22%攻擊基準的物理追擊。每次位移只啟動一次。'),
  lane('停步守勢','always',[{speedPct:.012},{slowResistance:.04},{hpPct:.02},{skillDuration:.025}],{slowResistance:.12},{hpPct:.06},'stopGuard','流轉守勢','連續移動1秒後停步，獲得最大生命3%護盾並使附近敵人緩速20%兩秒。每5秒一次，沒有額外無敵。')],
 legion:[
  lane('戰靈震擊','army',[{summonDamage:.025},{summonHaste:.02},{summonArea:.025},{summonLife:.04}],{summonDamage:.09},{summonArea:.1},'minionQuake','靈軍破陣','每名召喚物每4次普攻追加90範圍、最多3敵、該次基準18%的震擊。每名每秒最多一次；後震不複製召喚特效。'),
  lane('統帥集火','army',[{summonDamage:.025},{summonSpeed:.025},{summonCrit:.008},{hpPct:.02}],{summonCrit:.03},{summonHaste:.07},'command','統帥獵令','本體直接命中的敵人留下3秒獵令，召喚物對該目標傷害提高12%。獵令不造成傷害，不依賴角色職業。')],
 pact:[
  lane('共生修復','army',[{summonLife:.04},{summonHealing:.03},{manaRegenPct:.04},{summonResist:.015}],{summonHealing:.12},{summonReduce:.035},'armyMend','共生修復','主動技能實際花費至少12魔力時，治療附近至多3名受傷召喚物2%最大生命，每2秒一次。免費觸發、光環不算。'),
  lane('靈魂遺志','army',[{summonLife:.04},{summonArea:.025},{summonDamage:.025},{hpPct:.02}],{summonResist:.06},{summonLife:.12},'legacy','遺志承接','召喚物真正死亡後，其餘召喚物攻速提高10%持續4秒。每2秒一次、僅刷新不疊加；遣散／重召不觸發。')],
 domain:[
  lane('共振領域','auras',[{auraArea:.025},{auraDamage:.025},{manaRegenPct:.04},{skillArea:.025}],{auraDamage:.09},{auraArea:.1},'auraPulse','領域震盪','有技能或裝備光環時，每2秒額外支付2魔力，對領域內至多6敵造成15%攻擊基準物理共振。多光環共用一次脈衝。'),
  lane('庇護結界','auras',[{auraManaCost:.012},{hpPct:.02},{allResist:.015},{mana:12}],{skillAuraEffect:.08},{auraManaCost:.04},'auraShelter','庇護結界','有技能或裝備光環時，每8秒額外支付1%最大魔力，生成最大生命6%的護盾持續3秒。沒有足夠魔力便不生成。')],
 blood:[
  lane('鮮血蓄勢','blood',[{hpPct:.025},{lifeCostReduction:.02},{physicalDamage:.02},{lifeRegenPct:.0006}],{lifeCostReduction:.05},{lowLifeDamage:.08},'bloodCharge','血費蓄勢','主動技能實際支付生命累積達8%最大生命後，下一次血費技能直接命中追加15%攻擊基準物理血刃。持續光環血費不累積。'),
  lane('瀕血戰魂','always',[{hpPct:.025},{physicalReduce:.01},{lifeRegen:.5},{lowLifeDamage:.025}],{lowLifeDamage:.08},{hpPct:.08},'lowWard','絕境不屈','生命低於35%時，敵方直接傷害額外降低8%。不降低生命成本、既有傷害債或召喚物受到的傷害。')],
 devices:[
  lane('爆破重構','devices',[{trapDamage:.025},{trapArea:.025},{trapSetup:.025},{manaCost:.012}],{trapArea:.1},{trapDamage:.08},'trapAftershock','機關餘震','近身引爆機關觸發0.2秒後，產生25%基準的弱化物理後震，最多4敵。每機關一次，後震不通知其他機關。'),
  lane('交錯哨線','devices',[{trapRange:.025},{trapDuration:.025},{trapDamage:.025},{hpPct:.02}],{trapRange:.1},{trapDuration:.1},'crossfire','哨線交火','目標220距離內有至少2個仍存續的己方機關時，哨機／機關命中傷害提高12%。不增加部署上限或觸發次數。')],
 ballistics:[
  lane('裂矢散射','ranged',[{projectileDamage:.02},{projectileSpeed:.03},{farDamage:.02},{crit:.004}],{projectileDamage:.07},{projectileSpeed:.1},'splinter','裂矢餘鋒','主動投射物首次命中時，射出2枚14%攻擊基準的弱化同屬性碎片。每0.6秒一次；碎片不再分裂、附毒或連鎖。'),
  lane('回返彈道','ranged',[{projectileRange:.03},{projectileDamage:.02},{manaRegenPct:.04},{skillArea:.025}],{projectileRange:.1},{farDamage:.07},'returnShot','回返軌跡','曾命中的主動投射物消失時，向角色位置返回一枚22%原始基準的同屬性飛矢。一次施放最多一枚，不再回返或重播技能。')],
 affliction:[
  lane('腐毒蔓延','always',[{dotDamage:.025},{poisonDurationBonus:.04},{poisonDotDamage:.025},{poisonDurationBonus:.035}],{poisonDotDamage:.1},{poisonDurationBonus:.18},'ailmentHarvest','殘傷收割','擊殺時將最強自身持續傷害的剩餘預算分給附近至多2敵。中毒轉移30%，其他異常轉移20%。傳承不再傳播，總預算上限為5倍攻擊。'),
  lane('疊焰灼燒','always',[{burnDamage:.025},{bleedDamage:.025},{dotDamage:.025},{skillDuration:.025}],{burnFromFireHit:.12},{burnDamage:.1},'afflictionEcho','苦痛共鳴','本體直接命中已有持續傷害的敵人，追加12%攻擊基準的同屬性傷害。每0.5秒一次。疊焰專修會讓本體直接火焰命中附加2.4秒灼燒，單層基礎每秒至多16%攻擊。')]
};
export function conditionMatches(c,condition){const w=c.equipment?.weapon,off=c.equipment?.offhand,type=w?.weaponType||({warrior:'sword',berserker:'axe',assassin:'dagger',ranger:'bow',mage:'wand'}[c.cls]),dual=off?.slot==='weapon',army=Object.values(c.summonSkills||{}).reduce((n,v)=>n+v,0),skills=[c.autoSkill,...(c.skillSlots||[])];switch(condition){case 'melee':return ['sword','axe','dagger','greatsword','greataxe'].includes(type);case 'twohand':return !dual&&['greatsword','greataxe'].includes(type);case 'dual':return dual;case 'spell':return ['wand','staff'].includes(type)||off?.weaponType==='tome';case 'shield':return off?.weaponType==='shield';case 'ranged':return ['bow','wand','staff'].includes(type);case 'army':return army>0;case 'singleArmy':return army===1;case 'auras':return (c.auraSkills||[]).length>0||Object.values(c.equipment||{}).some(i=>i.affixes?.some(a=>['auraClarity','auraWar','auraWard','auraHunt'].includes(a.key)));case 'blood':return c.cls==='berserker'||Object.keys(c.talents||{}).some(id=>id.startsWith('b_'));case 'devices':return skills.some(id=>['a_blades','a_mine','a_sentry'].includes(id));default:return true;}}
export function extendPassives(nodes,branches,link){for(let index=0;index<branches.length;index++){const b=branches[index];for(const [sideIndex,spec]of CONSTELLATIONS[b.id].entries()){const side=sideIndex?'r':'l',angle=(-90+index*30+(sideIndex?8:-8))*Math.PI/180;for(let n=1;n<=7;n++){const id=`${b.id}_${side}${n}`,type=n===7?'mastery':n===3||n===5?'notable':'minor',minorIndex={1:0,2:1,4:2,6:3}[n],mods=n===7?{}:n===3?spec.one:n===5?spec.two:spec.minors[minorIndex];nodes[id]={id,name:n===7?spec.title:n===3?spec.name+'・專修':n===5?spec.name+'・精煉':spec.name+' '+({1:'Ⅰ',2:'Ⅱ',4:'Ⅲ',6:'Ⅳ'}[n]),branch:b.id,path:spec.name,type,maxRank:type==='minor'?3:1,reqLevel:[0,20,30,40,50,60,70,80][n],branchRequired:n===7?18:n===5?12:n===3?8:0,mods,condition:n===3||n===5?spec.condition:null,description:n===7?spec.description:n===3||n===5?'條件：'+CONDITION_LABELS[spec.condition]:'',mechanic:n===7?spec.key:null,exclusiveGroup:n===7?b.id:null,color:b.color,icon:b.icon,x:Math.round(Math.cos(angle)*(510+n*100)),y:Math.round(Math.sin(angle)*(510+n*100)),neighbors:[]};if(n>1)link(`${b.id}_${side}${n-1}`,id);}link(`${b.id}_${sideIndex?5:3}`,`${b.id}_${side}1`);}link(`${b.id}_l3`,`${b.id}_r3`);link(`${b.id}_l5`,`${b.id}_r5`);}for(let i=0;i<branches.length;i++)link(`${branches[i].id}_r4`,`${branches[(i+1)%branches.length].id}_l4`);}
export function passiveMechanics(c,nodes){return new Set(Object.entries(c.passives||{}).filter(([id,r])=>r>0&&nodes[id]?.mechanic&&conditionMatches(c,nodes[id].condition)).map(([id])=>nodes[id].mechanic));}
