export const EARLY_UNIQUES=[
 {id:'bellbreaker',name:'鐘裂斧',slot:'weapon',weaponType:'axe',itemLevel:5,minLevel:4,affixes:['physicalDamage','attackDamage','haste','manaLeech','procCleave'],description:'命中有機會觸發裂地斬。攻速與吸魔讓開荒時更容易連續進攻。'},
 {id:'mire_bow',name:'霧枝幼弓',slot:'weapon',weaponType:'bow',itemLevel:8,minLevel:6,affixes:['poisonDamage','flatPoison','haste','manaLeech','procPoisonArrow'],description:'箭矢追加毒素傷害，命中有機會觸發毒箭。'},
 {id:'keeper_lantern',name:'喚靈燈墜',slot:'charm',itemLevel:10,minLevel:8,affixes:['summonDamage','summonLife','summonCapacity','summonManaCost','manaRegen'],description:'召喚容量 +1。提升召喚物傷害與生命，降低重召耗魔。'},
 {id:'rime_scribe',name:'灰霜導典',slot:'offhand',weaponType:'tome',itemLevel:13,minLevel:10,affixes:['coldDamage','mana','castSpeed','manaRegen','procFrostArmor'],description:'提高冰霜傷害、魔力與回魔速度，受傷有機會觸發霜甲術。'},
 {id:'pilgrim_treads',name:'拾火短靴',slot:'feet',armorWeight:'light',itemLevel:16,minLevel:12,affixes:['speedPct','hpPct','cdr','fireResist','armor'],description:'輕甲靴提高移速與火抗，縮短技能與閃避的冷卻。'},
 {id:'ash_buckler',name:'守門圓盾',slot:'offhand',weaponType:'shield',itemLevel:20,minLevel:14,affixes:['block','blockReduction','hpPct','allResist','procGuard'],description:'提高格擋率與格擋減傷，受傷有機會觸發鋼鐵戰吼。'}
];

export const NEW_UNIQUES=[
 {id:'lone_core',name:'孤峰之核',slot:'charm',itemLevel:66,minLevel:55,affixes:['summonDamage','summonLife','mana','summonHaste','manaCost'],description:'僅有一名土傀儡時，每第四次普攻追加120範圍震擊，至多4敵、30%召喚攻擊基準。適合集中養成單體，不能靠多隻同時觸發。'},
 {id:'poison_bow',name:'潮痕獵弓',slot:'weapon',weaponType:'bow',itemLevel:50,minLevel:45,affixes:['poisonDamage','attackDamage','haste','manaLeech','crit'],description:'自身毒霧改成半徑40的移動毒徑；沿射擊方向每秒漂移45。自身毒素命中及中毒對毒素免疫敵人仍保留30%效力。'},
 {id:'tide_shield',name:'誓潮盾',slot:'offhand',weaponType:'shield',itemLevel:77,minLevel:40,affixes:['armor','hpPct','block','blockReduction','manaRegen'],description:'格擋儲存50%阻止傷害，上限為攻擊基準60%。4秒內下一次主動直接命中釋放一次物理反擊，不爆擊、吸取或觸發。'},
 {id:'echo_seal',name:'殘響聖印',slot:'charm',itemLevel:61,minLevel:55,affixes:['skillArea','mana','auraEffect','manaCost','manaRegen'],description:'維持光環時，每2秒在傷害提高6%與減傷4%之間輪替。沒有光環便停止；兩種增益不會同時存在。'},
 {id:'mist_tome',name:'霧行秘典',slot:'offhand',weaponType:'tome',itemLevel:98,minLevel:65,affixes:['spellDamage','summonDamage','summonHaste','castSpeed','manaCost'],description:'霧冰精靈每第二次攻擊，從敵人處射回一枚25%基準冰錐，最多穿透2敵。回錐不觸發召喚連鎖效果。'},
 {id:'thunder_wand',name:'逐電短杖',slot:'weapon',weaponType:'wand',itemLevel:84,minLevel:65,affixes:['lightningDamage','flatSpellLightning','crit','castSpeed','manaOnHit'],description:'本體連鎖閃電少跳1次，首擊提高18%；首次命中追加一次25%基準雷擊。追加雷擊不爆擊、吸取或再連鎖。'},
 {id:'reaver_hands',name:'回鋒護手',slot:'hands',itemLevel:64,minLevel:60,affixes:['attackDamage','physicalDamage','haste','crit','movementRecovery'],description:'使用位移後3秒內，下一次直接近戰技能提高20%傷害。一次施放只消耗一次，雙持兩段共用加成。'},
 {id:'shadow_mantle',name:'影縫披衣',slot:'chest',itemLevel:88,minLevel:65,affixes:['hpPct','summonLife','summonDamage','summonHaste','manaCost'],description:'本體與影分身交替命中同一敵人，追加一次12%平均武器基準物理合擊。每敵每0.5秒至多一次，不遞迴。'},
 {id:'blood_furnace',name:'血煉爐心',slot:'chest',itemLevel:97,minLevel:55,affixes:['hpPct','armor','lifeCostReduction','haste','lowLifeDamage'],description:'維持赤怒之息且狂怒至少40時，每2秒消耗5狂怒，對140範圍至多6敵造成20%攻擊基準火焰脈衝。脈衝不產生狂怒或觸發。'},
 {id:'blood_loop',name:'償血之環',slot:'ring',itemLevel:52,minLevel:50,affixes:['hpPct','physicalDamage','manaOnHit','lifeCostReduction'],description:'實際支付生命後，無魔力的角色回復實付生命的10%，每秒最多0.5%最大生命；其他角色回復同量魔力，每次最多2%最大魔力。未付血費不生效。'},
 {id:'mirror_dagger',name:'雙影縫刃',slot:'weapon',weaponType:'dagger',itemLevel:86,minLevel:55,affixes:['physicalDamage','summonDamage','haste','crit','manaLeech'],description:'影分身自主普攻傷害降低30%，指令影擊傷害提高35%。偏向本體與分身合作，並非兩個獨立全額施法者。'},
 {id:'device_mail',name:'機括旅衣',slot:'chest',itemLevel:55,minLevel:45,affixes:['armor','hpPct','trapDamage','trapSetup','movementRecovery'],description:'使用位移後，下一個付費機關於0.1秒武裝，但存在時間降低25%。僅作用一次，不強制啟動未就緒的其他機關。'}
];
