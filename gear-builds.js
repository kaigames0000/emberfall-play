// Main- and off-hand bases match the playstyle supported by each set.
export const SET_EQUIPMENT_BASES={
 wrath:[['axe','greatsword','greataxe'],[]],
 iron:[['sword','axe'],['shield','towerShield']],
 wind:[['bow'],['quiver']],
 hunt:[['bow','dagger'],['quiver']],
 flame:[['wand','staff'],['tome']],
 frost:[['wand','staff'],['tome']],
 soul:[['wand','staff'],['tome']],
 codex:[['wand','staff'],['tome']],
 covenant:[['wand','sword'],['tome','shield']],
 court:[['wand','staff'],['tome']],
 evolution:[['wand','staff'],['tome']],
 fate:[['dagger','axe','wand'],['tome']],
 drift:[['dagger','sword','bow'],['shield','quiver']],
 rotcycle:[['bow'],['quiver']],
 huntmark:[['bow','wand'],['quiver','tome']],
 manavessel:[['wand','staff'],['tome']],
 convergence:[['wand','staff'],['tome']],
 singularity:[['sword','wand'],['shield','tome']],
 rifts:[['sword','greatsword','greataxe'],[]],
 galeguard:[['dagger','sword'],['shield']],
 bastion:[['sword','axe'],['shield','towerShield']],
 fletcher:[['bow'],['quiver']],
 chorus:[['wand','sword'],['tome','shield']],
 faultguard:[['sword','axe','greatsword'],['shield','towerShield']],
 frostmirror:[['wand','staff'],['tome']],
 twinvanguard:[['wand','axe'],['tome','shield']],
};

export const ARCHETYPE_SETS=[
 {id:'galeguard',name:'疾風戰陣',rarity:4,effects:['移動速度 +6%','攻擊、施法速度 +5%','疾掠：位移或閃避後3秒攻擊、施法速度 +22%；同源刷新，不疊加。'],bonuses:[{speedPct:.06},{haste:.05,castSpeed:.05}]},
 {id:'bastion',name:'鐵城誓約',rarity:4,effects:['護甲 +15%','持盾格擋率 +4%','守城：格擋後獲得最大生命12%的護盾，持續3秒，冷卻4秒；不會疊盾。'],bonuses:[{armorPct:.15},{shieldBlock:.04}]},
 {id:'fletcher',name:'群星箭契',rarity:5,effects:['投射物傷害 +10%','額外投射物 +1','分星：持弓每4次本體投射物直接命中，射出2枚30%攻擊基準追擊箭；冷卻0.8秒，不觸發衍生效果。'],bonuses:[{projectileDamage:.1},{extraProjectiles:1}]},
 {id:'chorus',name:'共鳴織界',rarity:5,effects:['裝備光環效果 +15%','最大魔力 +10%','織界：披風的固有光環等級 +1，最高3級；同源光環只取最高等級。'],bonuses:[{auraEffect:.15},{manaPct:.1}]},
 {id:'faultguard',name:'斷岩軍陣',rarity:4,effects:['物理傷害 +10%','最大生命 +9%','裂地斬首次命中時，對命中點周圍最多4敵追加35%未爆擊傷害的物理震波，自身獲得最大生命7%的護盾，持續3秒。每4秒一次。'],bonuses:[{physicalDamage:.10},{hpPct:.09}]},
 {id:'frostmirror',name:'霜鏡法陣',rarity:5,effects:['冰霜傷害 +12%','回魔速度 +14%','霜晶爆球撞到已受冰冷緩速或冰凍的敵人時，折射一次冰爆，對周圍最多4敵造成40%未爆擊傷害。每2秒一次。'],bonuses:[{coldDamage:.12},{manaRegenPct:.14}]},
 {id:'twinvanguard',name:'雙脈儀仗',rarity:5,effects:['召喚物傷害 +12%','召喚耗魔降低12% · 光環耗魔降低8%','物理與元素召喚物在4秒內先後直接命中同一受詛咒敵人，造成各20%召喚攻擊基準的物理與該元素傷害。全隊每2秒一次；啟用技能光環時另回復3%最大魔力，最多8點。'],bonuses:[{summonDamage:.12},{summonManaCost:.12,auraManaCost:.08}]}
];
export const ARCHETYPE_UNIQUES=[
 {id:'dawn_standard',name:'黎明戰旌',slot:'cloak',itemLevel:57,minLevel:35,implicitAura:'war',auraLevelBonus:1,affixes:['attackDamage','summonDamage','crit','auraEffect','manaOnHit'],description:'戰意固有光環等級 +1，最高3級。以披風維持本體、召喚物共同進攻的常駐光環。'},
 {id:'pilgrim_shroud',name:'巡星法衣',slot:'cloak',itemLevel:44,minLevel:35,implicitAura:'clarity',auraLevelBonus:1,affixes:['mana','manaRegen','manaCost','auraEffect','spellDamage'],description:'靜心固有光環等級 +1，最高3級。與同源回魔光環只取較高等級。'},
 {id:'night_sail',name:'夜航斗篷',slot:'cloak',itemLevel:82,minLevel:50,implicitAura:'hunt',affixes:['speedPct','crit','movementRecovery','hpPct','attackDamage'],description:'位移或閃避後3秒移動速度 +12%、投射物傷害 +15%；重複位移只刷新時間。'},
 {id:'storm_quiver',name:'裂雲箭囊',slot:'offhand',weaponType:'quiver',itemLevel:99,minLevel:55,affixes:['projectileDamage','attackDamage','crit','extraProjectiles','physicalDamage'],description:'持弓時投射物額外穿透1次。箭袋必須與弓配對，不能搭配其他武器。'},
 {id:'duelist_buckler',name:'回刃小圓盾',slot:'offhand',weaponType:'shield',itemLevel:47,minLevel:40,affixes:['block','blockReduction','haste','physicalDamage','hpPct'],description:'成功格擋後2秒攻擊與施法速度 +18%。同源增益刷新，不疊加。'},
 {id:'mountain_heart',name:'山岳之心',slot:'chest',armorWeight:'heavy',itemLevel:93,minLevel:60,affixes:['armor','hpPct','physicalReduce','allResist','lifeRegen'],description:'穿戴時，護甲重量造成的移速、攻速、法速與閃避冷卻代價降低35%；大盾代價不受影響。'},
 {id:'silkstep',name:'無痕絲履',slot:'feet',armorWeight:'light',itemLevel:96,minLevel:50,affixes:['speedPct','movementRecovery','physicalDamage','manaOnHit','hpPct'],description:'基本閃避冷卻額外降低15%，但格擋機率上限改為35%。不縮短位移技能的冷卻。'},
 {id:'fault_axe',name:'斷層戰斧',slot:'weapon',weaponType:'axe',itemLevel:34,minLevel:30,affixes:['physicalDamage','attackDamage','haste','manaLeech','leech'],description:'格擋後3秒內，下一次裂地斬的直接命中提高20%傷害；同次施放共用，準備效果不疊加。'},
 {id:'frost_well',name:'冰泉秘典',slot:'offhand',weaponType:'tome',itemLevel:37,minLevel:30,affixes:['coldDamage','mana','castSpeed','manaRegen','manaCost'],description:'霜晶爆球撞到已冰凍的敵人時回復5%最大魔力，每次最多8點，每2秒一次。'},
 {id:'stone_vow',name:'荒石誓墜',slot:'charm',itemLevel:35,minLevel:30,affixes:['summonDamage','summonLife','summonHaste','summonManaCost','manaRegen'],description:'物理召喚物直接命中受詛咒的敵人時，命中傷害提高20%。'},
 {id:'choir_standard',name:'巡靈戰旌',slot:'cloak',implicitAura:'ward',itemLevel:74,minLevel:35,affixes:['summonDamage','hpPct','summonHaste','auraManaCost','manaRegen'],description:'啟用技能光環時，元素召喚物直接命中使你回復1.5%最大生命。全隊每2秒一次。'}
];

// Extra weighting for campaign blue/yellow pieces. All candidates still pass the regular affix rules.
const meleeStarter = ['physicalDamage','attackDamage','haste','manaLeech','leech'];
const spellStarter = ['coldDamage','spellDamage','manaRegen','manaCost','castSpeed','summonDamage','summonManaCost'];
const earlyAffixFocus = {
 sword:meleeStarter,axe:meleeStarter,greatsword:meleeStarter,greataxe:meleeStarter,
 wand:spellStarter,staff:spellStarter,tome:spellStarter,
 shield:['block','blockReduction','armor','hpPct'],towerShield:['block','blockReduction','armor','hpPct'],
 helm:['hpPct','manaRegen','summonDamage','summonLife','summonManaCost','auraManaCost'],
 chest:['armor','hpPct','allResist','physicalReduce'],
 hands:['haste','castSpeed','summonHaste','manaLeech','manaOnHit'],
 feet:['speedPct','hpPct','fireResist','coldResist','lightningResist','poisonResist'],
 charm:['hpPct','manaRegen','manaCost','summonLife','summonDamage','summonManaCost','auraManaCost'],
 ring:['hpPct','mana','manaRegen','manaLeech','fireResist','coldResist','lightningResist','poisonResist']
};
export function campaignAffixWeight(item,key){
 return (item.rarity===1||item.rarity===2)&&item.level<=50&&earlyAffixFocus[item.weaponType??item.slot]?.includes(key)?3.5:1;
}

export function hasGearCurse(enemy){
 return Object.entries(enemy.auraDebuffs??{}).some(([id,entry])=>id.startsWith('curse:')&&entry.t>0);
}
