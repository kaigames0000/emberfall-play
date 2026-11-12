import {expandRing} from './ring-expansion.js?v=133';
import {PASSIVE_MOD_NAMES} from './passive-tree.js?v=108';
import {placeTalentRoutes} from './ring-tree-layout.js?v=133';

const LEGACY_ORBITS = [
  [0, 1], [148, 1], [240, 1], [350, 10], [460, 10],
  [580, 30], [695, 50], [820, 50], [945, 80], [1080, 100]
];

const ORBITS = [
  [0, 1], [158, 1], [338, 1], [458, 10], [590, 10],
  [724, 30], [860, 50], [988, 50], [1116, 80], [1244, 100]
];

// Nearby themes share routes around the orbit and across the adjoining rings.
const THEMES = [
  ['blade', '#e0b996', 'w_cleave w_whirl w_basic_sweep w_basic_thrust b_flurry b_dual b_titan_grip b_basic_alternate a_dual'],
  ['bastion', '#dfc593', 'w_guard w_slam w_basic_counter b_guardcry b_ironcry b_dread'],
  ['domain', '#ddad6b', 'w_banner w_haste w_warcry w_order w_renewal w_crit w_elemental b_rally b_frenzycry'],
  ['legion', '#8ac7af', 'w_knight r_wolf r_eagle r_packfocus m_golem m_spiritlore m_spirit m_warder m_sovereign'],
  ['pact', '#79bbb4', 'r_bear r_beastguard r_lifebond m_invocation m_thorn m_channel m_manifest m_transcend m_avatar m_icegod'],
  ['arcane', '#8caee2', 'm_fireball m_nova m_frostarmor m_icecone m_blizzard m_spark m_aegis m_chain m_meteor m_basic_homing m_basic_volley m_basic_arc'],
  ['affliction', '#a7b987', 'm_flamethrower m_basic_firebolt r_poisonarrow r_burst r_rain r_spread r_basic_venom'],
  ['ballistics', '#a3c77f', 'r_pierce r_volley r_ricochet r_snipe r_gale r_basic_pierce r_basic_split'],
  ['precision', '#c0b0df', 'r_mark r_precision a_mark a_flurry a_execute a_mirrorstrike a_storm a_concord'],
  ['devices', '#ac9bc6', 'a_shuriken a_blades a_mine a_sentry a_network a_kunai a_basic_rope'],
  ['celerity', '#84bccc', 'w_charge w_blitz r_dash a_stab a_veil a_blink a_pursuit a_clone a_evasion a_relay a_dancer a_counter a_basic_twin a_basic_daggers b_leap'],
  ['blood', '#d99398', 'b_cleave b_execute b_hunt b_basic_blood b_bloodaura b_bloodpulse b_bloodtempo b_bloodward b_resonance b_bloodoath b_basic_rage b_ritual b_avatar b_reclaim']
];

const STARTERS = new Set((
  'w_cleave w_basic_counter w_banner r_wolf m_golem m_fireball m_spark r_poisonarrow ' +
  'r_pierce r_volley r_basic_pierce a_shuriken a_stab a_veil a_blades b_cleave b_bloodaura'
).split(' '));

const STARTER_SKILLS = new Set([
  'w_cleave', 'm_golem', 'm_fireball', 'm_spark', 'r_poisonarrow',
  'r_pierce', 'a_shuriken', 'a_stab'
]);

const STARTER_BRANCHES = {
  w_cleave: ['blood', 'bastion', 'domain'],
  m_golem: ['domain', 'pact'],
  m_fireball: ['pact'],
  m_spark: ['affliction'],
  r_poisonarrow: ['affliction', 'ballistics'],
  r_pierce: ['precision', 'devices'],
  a_shuriken: ['celerity', 'blood']
};

// Retain distinct effects. Retired IDs remain readable for verified v83 builds.
const DISTINCT_SKILLS = new Set((
  'w_basic_sweep w_basic_thrust r_basic_split r_basic_pierce m_basic_firebolt m_basic_arc a_basic_twin a_basic_daggers w_cleave w_whirl w_charge w_guard w_slam w_basic_counter w_banner w_renewal w_knight w_elemental ' +
  'r_pierce r_volley r_mark r_poisonarrow r_burst r_spread r_wolf r_bear r_eagle r_beastguard r_packfocus r_lifebond r_basic_venom ' +
  'm_fireball m_nova m_flamethrower m_frostarmor m_spark m_aegis m_basic_homing m_blizzard m_golem m_spirit m_thorn m_icegod m_manifest m_invocation m_transcend ' +
  'a_stab a_veil a_blink a_dual a_mark a_execute a_clone a_pursuit a_relay a_dancer a_counter a_shuriken a_mine a_network a_basic_rope ' +
  'b_execute b_dual b_titan_grip b_basic_blood b_bloodaura b_bloodpulse b_bloodtempo b_bloodward b_resonance b_bloodoath b_rally b_ritual b_dread b_reclaim'
).split(' '));

const KEYSTONES = new Set([
  's:w_whirl', 'x:blockreflect', 's:w_renewal', 'x:summonarmy', 'x:summonelite',
  'x:manashield', 'x:cursetriple', 's:r_poisonarrow', 's:r_pierce', 'x:basicchorus',
  's:a_mine', 'x:phasecast', 'x:bloodzero'
]);

const FORMER_PERMISSIONS = {
  shield: true, towershield: true, tome: true, quiver: true
};

const VENOM_SKILLS = new Set(['r_poisonarrow', 'r_burst', 'r_spread', 'r_basic_venom']);
const THEME_TITLES = {
  blade: '近戰兵器', bastion: '護甲與格擋', domain: '光環與戰吼', legion: '召喚軍勢',
  pact: '召喚守契', arcane: '元素與施法', affliction: '詛咒與異常', venom: '毒箭與毒素',
  ballistics: '弓箭與投射物', precision: '精準與普攻', devices: '暗器與機關',
  celerity: '位移與閃避', blood: '血費與回復'
};

const TRAILS = {
  blade: [
    ['武器淬鋒', 'attackDamage', .025], ['揮刃節奏', 'haste', .018],
    ['斬擊延展', 'skillArea', .025], ['刀口回生', 'basicLeech', .004]
  ],
  bastion: [
    ['鍛甲', 'armor', 3], ['生命底力', 'hpPct', .024],
    ['偏轉盾面', 'shieldBlock', .012], ['元素護層', 'allResist', .018]
  ],
  domain: [
    ['領域延展', 'auraArea', .035], ['光環節流', 'auraManaCost', .018],
    ['共振振幅', 'skillAuraEffect', .024], ['脈衝增幅', 'auraDamage', .035]
  ],
  legion: [
    ['軍勢打擊', 'summonDamage', .035], ['協同攻速', 'summonHaste', .023],
    ['軍勢體魄', 'summonLife', .045], ['行軍步調', 'summonSpeed', .028]
  ],
  pact: [
    ['靈體韌性', 'summonLife', .045], ['契靈減傷', 'summonReduce', .014],
    ['契靈行動', 'summonSpeed', .028], ['靈體餘裕', 'summonManaCost', .022]
  ],
  arcane: [
    ['術式增幅', 'spellDamage', .029], ['施法步調', 'castSpeed', .021],
    ['秘能泉源', 'manaRegen', .3], ['秘法節流', 'manaCost', .018],
    ['元素穿透', 'coldPen', .012], ['電勢傳導', 'lightningDamage', .031]
  ],
  affliction: [
    ['異常延展', 'ailmentDuration', .035], ['詛咒覆蓋', 'skillArea', .025],
    ['餘咒延時', 'skillDuration', .032], ['蝕刻傷口', 'dotDamage', .029]
  ],
  venom: [
    ['箭鏃淬毒', 'poisonDotDamage', .037], ['投射勁道', 'projectileDamage', .027],
    ['餘毒延時', 'ailmentDuration', .041], ['毒霧增幅', 'dotDamage', .033],
    ['毒素穿透', 'poisonPen', .014], ['腐毒加深', 'poisonDamage', .031]
  ],
  ballistics: [
    ['箭勢', 'projectileDamage', .031], ['弓弦節奏', 'haste', .019],
    ['箭頭研磨', 'physicalDamage', .024], ['弓技延展', 'skillArea', .025]
  ],
  precision: [
    ['弱點辨識', 'crit', .008], ['出手淬鍊', 'basicDamage', .035],
    ['凝神瞄準', 'focusDamage', .018], ['首領破口', 'bossDamage', .024]
  ],
  devices: [
    ['機關力度', 'trapDamage', .035], ['快速裝填', 'trapSetup', .029],
    ['機關延時', 'trapDuration', .04], ['暗器勁道', 'projectileDamage', .026]
  ],
  celerity: [
    ['靈巧步伐', 'speedPct', .014], ['偏身避擊', 'evasion', .012],
    ['步法回復', 'movementRecovery', .027], ['身形穩固', 'slowResistance', .028]
  ],
  blood: [
    ['血肉根基', 'hpPct', .026], ['血費節流', 'lifeCostReduction', .023],
    ['凝血回復', 'lifeRegenPct', .0011], ['血戰意志', 'lowLifeDamage', .028]
  ]
};
const SMALL_PER_THEME = 15;
const PASSIVES_PER_THEME = SMALL_PER_THEME + 3;
const ROUTE_RINGS = [0, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
const POCKET_STEPS = [0, 1, 3, 5, 8, 11, 13, 15, 17, 18];
const OUTERMOST = new Set(['bloodzero', 'summonarmy', 'summonelite', 'cursetriple', 'staffdual', 'doubleecho', 'basicchorus']);
const SURVIVAL_CHOICES = {
  domain: [4, '護持微光', {hpPct: .025, allResist: .015}],
  legion: [4, '同袍血脈', {hpPct: .035, summonLife: .04}],
  affliction: [5, '卸咒護身', {reduce: .025, slowResistance: .06}],
  venom: [3, '毒中生息', {hpPct: .025, lifeRegenPct: .002}],
  ballistics: [4, '引弦退步', {evasion: .025, speedPct: .035}],
  precision: [5, '穩息護身', {hpPct: .035, armor: 4}],
  devices: [4, '佈陣退路', {movementRecovery: .07, speedPct: .025}]
};
// Early crossings offer useful shared stats before either neighboring specialty.
const ENTRY_MODS = {
  blade: {attackDamage:.03,hpPct:.015}, bastion: {armor:3,hpPct:.02},
  domain: {skillArea:.025,manaRegen:.25}, legion: {summonDamage:.03,hpPct:.02},
  pact: {mana:15,manaRegen:.3,summonLife:.03}, arcane: {spellDamage:.03,castSpeed:.025},
  affliction: {skillArea:.035,manaRegen:.3}, venom: {projectileDamage:.025,haste:.02},
  ballistics: {attackDamage:.025,projectileDamage:.02}, precision: {crit:.008,manaLeech:.006},
  devices: {projectileDamage:.025,speedPct:.012}, celerity: {speedPct:.015,hpPct:.015},
  blood: {hpPct:.02,lifeRegenPct:.001}
};
const SUPPORT_POCKETS = [
  ['precision','rhythm','連式節拍',3,{haste:.035,castSpeed:.035}],
  ['precision','recovery','擊中汲取',7,{basicLeech:.012,manaLeech:.012}],
  ['precision','practice','武技連綴',11,{basicDamage:.08,hpPct:.025}],
  ['precision','footwork','疾行連擊',15,{basicDamage:.07,speedPct:.025}],
  ['arcane','reach','術式延展',3,{skillArea:.08}],
  ['arcane','projectiles','術式分流',7,{extraProjectiles:1}],
  ['venom','reach','霧域延展',3,{skillArea:.08}],
  ['ballistics','projectiles','分矢',7,{extraProjectiles:1}]
];
const MEDIUMS = {
  blade: [
    ['刃上回流', {leech: .01, manaLeech: .01}],
    ['快刃架勢', {haste: .035, attackDamage: .044}],
    ['擴鋒', {skillArea: .055, physicalDamage: .045, basicDamage: .032}]
  ],
  bastion: [
    ['精鑄盾面', {shieldBlock: .024, shieldBlockReduction: .033}],
    ['不退架勢', {armor: 7, hpPct: .045}],
    ['卸力守勢', {shieldBlock: .028, shieldBlockReduction: .042, physicalReduce: .018}]
  ],
  domain: [
    ['共振節流', {auraArea: .05, auraManaCost: .026}],
    ['領域調律', {skillAuraEffect: .041, auraDamage: .055}],
    ['戰場回響', {warcryEffect: .047, skillDuration: .047, auraArea: .06}]
  ],
  legion: [
    ['協同操練', {summonDamage: .05, summonHaste: .032}],
    ['整隊補給', {summonManaCost: .04, summonSpeed: .04}],
    ['軍勢不絕', {summonDamage: .07, summonLife: .07, summonHaste: .03}]
  ],
  pact: [
    ['契靈庇佑', {summonLife: .071, summonReduce: .025}],
    ['靈體護持', {summonResist: .036, summonHealing: .05}],
    ['強靈守契', {summonLife: .09, summonReduce: .032, summonArea: .05}]
  ],
  arcane: [
    ['秘流續引', {manaRegen: .45, castSpeed: .036}],
    ['雙向術脈', {skillLeech: .008, manaLeech: .012}],
    ['術式放大', {spellDamage: .063, skillArea: .055, manaCost: .026}]
  ],
  affliction: [
    ['咒痕留存', {skillDuration: .058, ailmentDuration: .055}],
    ['廣域蝕刻', {skillArea: .055, dotDamage: .054}],
    ['咒勢深植', {skillDuration: .065, dotDamage: .054, ailmentDuration: .047}]
  ],
  venom: [
    ['箭毒調製', {poisonDotDamage: .05, projectileDamage: .045}],
    ['積毒滲透', {poisonPen: .023, ailmentDuration: .06, poisonStacks: 2}],
    ['腐毒蔓延', {poisonDotDamage: .06, skillArea: .04, poisonStacks: 2}]
  ],
  ballistics: [
    ['弦矢合拍', {haste: .034, projectileDamage: .046}],
    ['勁射調校', {projectileDamage: .055, crit: .012}],
    ['貫射調息', {projectileDamage: .05, manaLeech: .01, skillArea: .045}]
  ],
  precision: [
    ['連擊節奏', {crit: .012, basicDamage: .06}],
    ['定點狙擊', {focusDamage: .04, bossDamage: .047}],
    ['普攻精研', {basicDamage: .065, haste: .035, castSpeed: .035}]
  ],
  devices: [
    ['機關調速', {trapSetup: .05, trapDamage: .056}],
    ['伏器延展', {trapDuration: .06, skillArea: .045}],
    ['重佈機巧', {trapDamage: .062, trapSetup: .043, projectileDamage: .04}]
  ],
  celerity: [
    ['避鋒步法', {evasion: .024, speedPct: .022}],
    ['動勢收放', {movementRecovery: .044, slowResistance: .046}],
    ['輕身穿陣', {evasion: .029, movementRecovery: .046, speedPct: .021}]
  ],
  blood: [
    ['血費回補', {lifeCostReduction: .039, lifeRegenPct: .0017}],
    ['吸血秘脈', {basicLeech: .008, skillLeech: .009}],
    ['赤血逆流', {hpPct: .047, lowLifeDamage: .055, lifeCostReduction: .034}]
  ]
};

const REQUIRED_SKILLS = {
  r_gale: ['r_dash', 'r_mark'],
  r_precision: ['r_snipe', 'r_mark'],
  r_packfocus: ['r_mark'],
  r_lifebond: ['r_mark'],
  m_manifest: ['m_golem'],
  a_dual: ['a_stab'],
  a_relay: ['a_clone'],
  a_concord: ['a_clone'],
  b_hunt: ['b_execute', 'b_leap'],
  b_titan_grip: ['x:greatdual', 'b_execute'],
  b_bloodpulse: ['b_bloodaura'],
  b_bloodtempo: ['b_bloodaura'],
  b_bloodward: ['b_bloodpulse'],
  b_bloodoath: ['b_bloodaura']
};

// Each improvement still costs a single point, including those that reach an
// existing hard-rank threshold for a new skill effect.
const PRACTICE = {
  w_cleave: [3, 6, 10], w_charge: [3], w_guard: [3], w_whirl: [3],
  w_banner: [3, 6], w_basic_sweep: [3, 6],
  r_pierce: [3, 6], r_volley: [3], r_poisonarrow: [3, 6],
  r_snipe: [3], r_wolf: [3], r_bear: [3], r_basic_pierce: [3, 6],
  m_fireball: [3, 6, 10], m_spark: [3, 6], m_frostarmor: [3],
  m_golem: [3, 6], m_blizzard: [3], m_meteor: [3], m_basic_firebolt: [3, 6],
  a_stab: [3, 6], a_shuriken: [3], a_blades: [3], a_clone: [3],
  a_blink: [3], a_basic_twin: [3],
  b_cleave: [3, 6], b_bloodaura: [3, 6], b_execute: [3], b_basic_alternate: [3]
};

const CAPABILITIES = [
  ['shield', '持盾', '可在相容的單手武器旁裝備小盾。', 'bastion', 2, 'shield'],
  ['tome', '持典', '可在相容的單手武器旁裝備法典。', 'arcane', 2, 'rune'],
  ['quiver', '箭袋', '主手為弓時可裝備箭袋。', 'ballistics', 2, 'bow'],
  ['dual', '雙刃架勢', '可同時裝備兩把單手近戰武器。', 'blade', 3, 'sword'],
  ['towershield', '巨盾架勢', '可在單手近戰武器旁裝備大盾，使用大盾的格擋規則。', 'bastion', 5, 'shield', 'shield'],
  ['wanddual', '法器雙持', '可同時裝備兩把單手法器。', 'arcane', 5, 'rune'],
  ['mixed', '劍與法印', '可混合裝備單手近戰武器與單手法器。', 'precision', 6, 'sword'],
  ['greatdual', '巨兵雙持', '可同時裝備兩把雙手近戰武器，承受重型雙持的傷害與移速代價。', 'blade', 7, 'sword', 'dual'],
  ['staffdual', '長杖雙持', '可同時裝備兩把雙手法器，承受重型雙持的代價。', 'arcane', 8, 'rune']
];

const MECHANICS = [
  ['basicweave', '連式編織', '普攻技能欄位增加至3格；依配置順序輪替出手，共用一次攻擊間隔。', 'precision', 3, 'sword'],
  ['basicchorus', '百兵迴奏', '普攻技能欄位增加至4格。配置至少兩種適用普攻時，每第4次出手追加另一種普攻，造成35%傷害。不追加重血斬，不吸取或觸發其他效果。', 'precision', 9, 'sword', 'basicweave'],
  ['bloodspell', '血作法源', '原本耗魔的法術改支付生命，原生血費保留原計價規則。', 'blood', 4, 'heart'],
  ['bloodzero', '絕魔血契', '最大魔力歸零，原本耗魔的技能改支付生命。過去3秒的實付血費按最大生命比例提高直接技能傷害，上限15%。', 'blood', 8, 'heart', 'bloodspell'],
  ['bloodaura', '血潮迴流', '傷害光環改以生命維持。付費光環的傷害脈衝命中時回復生命，每秒最多回復最大生命的1.5%。', 'domain', 7, 'heart'],
  ['summonarmy', '百靈行軍', '召喚容量＋4，普通種類名額＋2，精英種類名額＋1，召喚成本降低35%。', 'legion', 8, 'heart'],
  ['summonelite', '精英靈契', '召喚物命中傷害＋35%、生命＋30%，每隻多佔1點召喚容量。', 'pact', 9, 'heart'],
  ['cursearea', '咒域擴張', '主動詛咒的範圍＋35%，持續時間＋30%。', 'affliction', 4, 'rune'],
  ['cursestack', '雙重詛咒', '敵人最多承受兩層詛咒，同一詛咒可由不同次施放疊加。第一、二層為100%、50%效果，分開計時。', 'affliction', 6, 'rune'],
  ['cursetriple', '三重詛咒', '敵人最多承受三層詛咒，同一詛咒可由不同次施放疊加。依次為100%、50%、25%效果，分開計時。', 'affliction', 9, 'rune', 'cursestack'],
  ['manashield', '秘泉護盾', '受到敵方直接傷害時，最多由魔力吸收30%。', 'arcane', 5, 'shield'],
  ['manareserve', '施法保留', '魔力護盾僅能使用超過最大魔力20%的部分。', 'arcane', 7, 'rune', 'manashield'],
  ['blockreflect', '反震盾緣', '格擋時將實際擋下傷害的50%反彈給攻擊來源，上限為攻擊基準的75%。', 'bastion', 7, 'shield'],
  ['evadecounter', '避鋒還擊', '成功閃避後，下次造成傷害的直接攻擊或法術傷害提高25%。', 'celerity', 6, 'wind'],
  ['phasecast', '相位施法', '成功使用位移後的2秒內，下一個可置地的區域法術落在自身腳下。', 'celerity', 7, 'wind'],
  ['stealthpoison', '隱鋒淬毒', '破隱後1.5秒內的首次直接命中附加毒素，每秒造成25%攻擊基準的毒傷，持續3秒。', 'devices', 6, 'eye', 's:a_veil'],
  ['doubleecho', '雙咒迴響', '4秒內成功付費施放兩種不同傷害法術，0.45秒後追加半徑100的打擊，最多命中6敵。傷害為第二個法術基礎係數的25%，上限為攻擊基準的50%。', 'arcane', 9, 'rune']
];

const STAT_LABEL = {manaOnHit:'命中回魔',dualDamage:'雙持傷害',coldDamage:'冰霜傷害',coldResist:'冰霜抗性',lightningPen:'閃電穿透',poisonResist:'毒素抗性',poisonDotDamage:'毒素持續傷害',projectileRange:'投射物射程',farDamage:'遠距傷害',poisonStacks:'毒素層數上限',
  physicalDamage: '物理傷害', spellDamage: '法術傷害', pierce: '穿透次數',
  coldPen: '冰霜穿透', poisonPen: '毒素穿透', lightningDamage: '閃電傷害',
  poisonDamage: '毒素傷害', manaRegen: '每秒魔力回復', summonManaCost: '召喚魔力減耗', evasion: '閃避率', leech: '生命吸取', manaLeech: '魔力吸取'
};
const FLAT_STATS = new Set(['manaOnHit','poisonStacks','armor', 'mana', 'manaRegen', 'pierce', 'summonCapacity', 'trapCapacity', 'extraProjectiles', 'lifeRegen']);
// These legacy stat keys have no combat reader. Keep the nodes' intended roles
// using modifiers already applied by the engine.
const PASSIVE_REVISIONS = {
  affliction_5: {name: '異常精研', description: '延長可支援的異常狀態。', mods: Object.freeze({ailmentDuration: .06})},
  devices_5: {description: '延長陷阱持續時間並加快佈置。', mods: Object.freeze({trapDuration: .05, trapSetup: .02})}
};

const ROOT = 'root';
const SHADOW_STRIKE_NODE = 's:a_stab';
const TAU = 2 * Math.PI;
const asGraphId = id => id.includes(':') ? id : 's:' + id;
const allocated = (allocation, id) => Object.hasOwn(allocation ?? {}, id) && Number.isInteger(allocation[id]) && allocation[id] > 0;

function skillDepth(skill) {
  if (STARTERS.has(skill.id)) return 1;
  if (skill.reqLevel <= 1) return 2;
  if (skill.reqLevel <= 6) return 3 + (skill.basicAttack ? 1 : 0);
  if (skill.reqLevel <= 12) return skill.ability ? 4 : 5;
  if (skill.reqLevel <= 18) return skill.ability ? 5 : 6;
  if (skill.reqLevel <= 24) return 6;
  return skill.ability ? 7 : 8;
}

function statDescription(mods, description) {
  const effects = Object.entries(mods).map(([key, value]) => {
    const unit = FLAT_STATS.has(key) ? '' : '%';
    const amount = Number((value * (unit ? 100 : 1)).toFixed(2));
    return (STAT_LABEL[key] ?? PASSIVE_MOD_NAMES[key] ?? key) + (value > 0 ? '＋' : '−') + Math.abs(amount) + unit;
  });
  return effects.join('、') + '。' + (description ?? '');
}

function placeRing(ring, nodes, orbits, themes, legacy) {
  const [radius] = orbits[ring];
  const shift = [0, 0, .025, -.04, .06, -.02, .055, -.035, .04, -.02][ring];
  const sectors = themes.length;
  if(!legacy){
    // A busy skill sector must not push its passive spine into the next sector.
    for(let sector=0;sector<sectors;sector++){
      const local=nodes.filter(n=>n.sector===sector);
      for(const pocket of [false,true]){
        const group=local.filter(n=>(n.kind!=='passive')===pocket);
        group.forEach((node,i)=>{
          const fraction=.15+.7*(i+.5)/group.length;
          const starterFan=pocket&&ring===1&&group.length>1;
          const angle=starterFan?-Math.PI/2+TAU*(sector+.5)/sectors+(i-(group.length-1)/2)*.5:
            -Math.PI/2+TAU*(sector+fraction)/sectors+shift;
          const offset=pocket?(ring===1?(starterFan?-38:-48):45+(i%2)*34):0;
          node.x=Math.round(Math.cos(angle)*(radius+offset));
          node.y=Math.round(Math.sin(angle)*(radius+offset));
          node.angle=angle;
        });
      }
    }
    return;
  }
  const themeWeight = ring === 1 ? .30 : .58;
  const minGap = Math.min(42 / (radius - 11), TAU * .94 / nodes.length);
  const freeAngle = TAU - nodes.length * minGap;
  let index = 0;
  for (let sector = 0; sector < sectors; sector++) {
    const local = nodes.filter(n => n.sector === sector);
    const passive = local.filter(n => n.kind === 'passive');
    const slots = passive.map(n => [n]);
    if (!legacy) local.filter(n => n.kind !== 'passive').forEach((node, i) => slots[i % slots.length].push(node));
    const ordered = legacy ? local : slots.flat();
    ordered.forEach((node, i) => {
      const ideal = (sector + (i + .5) / ordered.length) / sectors;
      const even = (index + .5) / nodes.length;
      const angle = -.5 * Math.PI + (legacy
        ? TAU * (ideal * themeWeight + even * (1 - themeWeight))
        : minGap * (index + .5) + freeAngle * ideal) + shift;
      const jitter = Math.sin(index * 2.43 + ring * 1.57) * (legacy ? ring === 1 ? 9 : 19 : 8);
      const pocket = !legacy && node.kind !== 'passive' ? (ring === 1 ? -39 : 47) : 0;
      const offset = jitter + pocket;
      node.x = Math.round(Math.cos(angle) * (radius + offset));
      node.y = Math.round(Math.sin(angle) * (radius + offset));
      node.angle = angle;
      index++;
    });
  }
}

const angularGap = (a, b) => {
  const gap = Math.abs(a.angle - b.angle);
  return Math.min(gap, TAU - gap);
};

function specializedThemes() {
  return THEMES.flatMap(([theme, color, ids]) => {
    const list = ids.split(' ');
    if (theme === 'affliction') return [
      [theme, color, 'a_mark b_dread'],
      ['venom', '#b1c574', list.filter(id => VENOM_SKILLS.has(id)).join(' ')]
    ];
    const retained = list.filter(id => !['a_mark', 'b_dread', 'w_knight'].includes(id));
    if (theme === 'arcane') retained.push('m_flamethrower', 'm_basic_firebolt');
    if (theme === 'ballistics') retained.push('r_rain');
    if (theme === 'domain') retained.push('w_knight');
    return [[theme, color, retained.join(' ')]];
  });
}

export function createRingTree(trees, passiveNodes, abilities, {legacy = false, previous = false, includeShadowStrike = false, economyLegacy = false, uniformUtility = false} = {}) {
  const retireShadowStrike = !legacy && !previous && !includeShadowStrike;
  const starterCircle = retireShadowStrike && !economyLegacy && !uniformUtility;
  const themes = legacy ? THEMES : specializedThemes();
  const orbits = legacy ? LEGACY_ORBITS : ORBITS;
  const nodes = [{
    id: ROOT, name: '旅人起源', description: '從起源選擇相連的天賦。每次投入消耗1點，技能最多10階。',
    kind: 'root', ring: 0, x: 0, y: 0, level: 1, color: '#f2d38d', icon: 'rune', neighbors: []
  }];
  const byId = Object.create(null);
  byId[ROOT] = nodes[0];
  const edges = [];
  const rings = orbits.map(() => []);
  const skills = new Map(Object.entries(trees).filter(([cls]) => cls !== 'wanderer')
    .flatMap(([, branches]) => branches.flat()).map(n => [n.id, n]));
  const themeIndex = new Map(themes.map(([id], index) => [id, index]));

  function add(sector, ring, data) {
    const theme = themes[sector][0];
    const node = {...data, ring, level: legacy ? orbits[ring][1] : 1, sector, color: themes[sector][1], neighbors: []};
    if (!legacy) {
      node.themeName = THEME_TITLES[theme];
      if (KEYSTONES.has(node.id)) node.major = true;
    }
    byId[node.id] = node;
    if (!node.retired) {
      nodes.push(node);
      rings[ring].push(node);
    }
  }

  for (const [sector, [theme, , skillIds]] of themes.entries()) {
    const passives = Object.values(passiveNodes)
      .filter(n => n.branch === theme && !n.condition && Object.keys(n.mods).length)
      .sort((a, b) => a.reqLevel - b.reqLevel);
    function passiveData(original) {
      const n = {...original, ...PASSIVE_REVISIONS[original.id]};
      return {
        id: 'p:' + n.id, name: n.name, description: statDescription(n.mods, n.description),
        effectDescription: n.description ?? '', kind: 'passive', icon: n.icon ?? 'rune', mods: n.mods
      };
    }
    if (legacy) {
      const passiveDepth = [2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9];
      passives.forEach((n, i) => add(sector, passiveDepth[Math.min(i, passiveDepth.length - 1)], passiveData(n)));
    } else {
      const choices = TRAILS[theme];
      const small = [];
      // Each local route opens with an immediately relevant modifier.
      for (let i = 0; i < SMALL_PER_THEME - passives.length; i++) {
        const [name, key, amount] = choices[i % choices.length];
        const mods = Object.freeze({[key]: amount});
        small.push({id: 'p:route:' + theme + ':' + (i + 1) + ':0',
          kind: 'passive', name: i < choices.length ? name : name + '・' + (i + 1),
          mods, description: statDescription(mods), effectDescription: ''});
      }
      small.push(...passives.map(passiveData));
      const former = CAPABILITIES.filter(([id, , , branch]) => branch === theme && FORMER_PERMISSIONS[id]);
      const medium = MEDIUMS[theme].map(([name, modifiers], i) => {
        const formerId = former[i]?.[0];
        const mods = Object.freeze(modifiers);
        return {id: formerId ? 'x:' + formerId : 'p:medium:' + theme + ':' + (i + 1),
          name, kind: 'passive', medium: true, mods, description: statDescription(mods), effectDescription: ''};
      });
      let i = 0;
      for (let step = 1; step <= PASSIVES_PER_THEME; step++) {
        let n = step % 6 === 0 ? medium[step / 6 - 1] : small[i++];
        if(!previous&&step===2)n={...n,...(theme==='pact'?{name:'契靈調息'}:theme==='affliction'?{name:'咒域調息'}:{}),mods:ENTRY_MODS[theme],description:statDescription(ENTRY_MODS[theme]),effectDescription:''};
        if(!previous&&theme==='affliction'&&['p:affliction_2','p:affliction_4','p:affliction_r1','p:affliction_r2','p:affliction_l4'].includes(n.id)){
          const mods={dotDamage:n.mods.poisonDotDamage??n.mods.burnDamage??n.mods.bleedDamage};
          n={...n,name:({'p:affliction_2':'蝕刻研習','p:affliction_4':'災傷研習','p:affliction_r1':'蝕能留痕','p:affliction_r2':'漫蝕餘響','p:affliction_l4':'綿延侵蝕'})[n.id],mods,description:statDescription(mods),effectDescription:''};
        }
        const choice=!previous&&step===10&&(n.mods.manaShield||n.mods.skillCostPenalty||n.mods.healingPenalty||Object.values(n.mods).some(v=>v<0));
        if(choice){
          // Keep the tradeoff and the neutral route as separate investments.
          add(sector,ROUTE_RINGS[step],{...n,optional:true,bypassStep:step});
          const [name,key,amount]=choices[0],mods={[key]:amount};
          n={id:'p:route:'+theme+':balance',kind:'passive',name:name+'・深研',mods,description:statDescription(mods),effectDescription:''};
        }
        add(sector, ROUTE_RINGS[step], {...n, routeStep: step});
      }
      if(!previous)for(const [branch,id,name,anchorStep,mods]of SUPPORT_POCKETS.filter(([branch])=>branch===theme)){
        add(sector,ROUTE_RINGS[anchorStep],{id:'p:focus:'+branch+':'+id,name,kind:'passive',supportPocket:true,anchorStep,mods,
          description:statDescription(mods),effectDescription:id==='reach'?'技能範圍同時延展光束、毒霧、光環與區域效果。':id==='projectiles'?'普通投射技能增加數量；連鎖技能改為增加跳躍上限。':'普攻輪替也能享有此加成。'});
      }
      const survival = !previous && SURVIVAL_CHOICES[theme];
      if (survival) {
        const [anchorStep, name, modifiers] = survival;
        const mods = Object.freeze(modifiers);
        add(sector, ROUTE_RINGS[anchorStep], {
          id: 'v:' + theme, kind: 'survival', name, icon: 'heart', anchorStep, mods,
          description: statDescription(mods), effectDescription: ''
        });
      }
    }

    for (const id of skillIds.split(' ')) {
      const skill = skills.get(id);
      if (!skill) continue;
      const originalDepth = skillDepth(skill);
      const depth = !legacy && originalDepth === 1 && !STARTER_SKILLS.has(id) ? 2 : originalDepth;
      const def = abilities[skill.ability];
      const requires = retireShadowStrike && ['a_dual','r_packfocus','r_lifebond'].includes(id) ? undefined :
        REQUIRED_SKILLS[id]?.filter(p=>!retireShadowStrike||id!=='b_titan_grip'||p!=='b_execute').map(asGraphId);
      let description = id === 'a_dual' || id === 'b_titan_grip'
        ? skill.mechanicSummary?.join('。') + '。'
        : skill.desc ?? def?.desc ?? skill.mechanicSummary?.join('。');
      if (retireShadowStrike && id === 'a_dual') description = '允許雙持匕首並加快交替攻擊。副手進攻詞條以70%生效。';
      if (retireShadowStrike && id === 'a_execute') description = description?.replace(' 與影刺的建立／收割循環互補。', '');
      const retired = !legacy && (!DISTINCT_SKILLS.has(id) || retireShadowStrike && id === 'a_stab');
      const skillData = {kind: legacy || skill.ability || skill.basicAttack ? 'skill' : 'mechanic', talentId: id,
        ...(retired ? {retired: true} : {}), icon: skill.icon ?? def?.icon ?? 'rune', ability: skill.ability};
      add(sector, depth, {...skillData, id: 's:' + id, name: skill.name, description, ...(requires ? {requires} : {})});

      // Only the historical graphs need the separate mastery purchases.
      if (!legacy && !previous) continue;
      let prerequisite = 's:' + id;
      let lastRank = 1;
      for (const [index, rank] of (PRACTICE[id] ?? []).entries()) {
        if (rank > skill.max) break;
        const upgradeId = 'u:' + id + ':' + rank;
        const upgradeRing = Math.min(9, Math.max(depth + 1, 4) + index * 2);
        const mastery = skill.basicMasteries?.find(m => m.rank === rank);
        add(sector, upgradeRing, {
          ...skillData, kind: legacy ? 'skill' : 'mechanic', id: upgradeId, name: skill.name + '・' + ['淬鍊', '精通', '極意'][index],
          description: '投入後使「' + skill.name + '」提高' + (rank - lastRank) + '級。' + (mastery ? mastery.label + '。' : ''),
          requires: [prerequisite], rankGain: rank - lastRank
        });
        prerequisite = upgradeId;
        lastRank = rank;
      }
    }
  }

  for (const [kind, definitions] of [['equipment', CAPABILITIES], ['mechanic', MECHANICS]]) {
    for (const [id, name, description, theme, depth, icon, prerequisite] of definitions) {
      if ((legacy || previous) && ['basicweave','basicchorus'].includes(id)) continue;
      if (!legacy && kind === 'equipment' && FORMER_PERMISSIONS[id]) continue;
      add(themeIndex.get(!legacy && id === 'stealthpoison' ? 'venom' : theme), !legacy && OUTERMOST.has(id) ? 9 : depth, {
        id: 'x:' + id, kind, name, description, icon,
        ...(prerequisite ? {requires: [prerequisite.includes(':') ? prerequisite : 'x:' + prerequisite]} : {})
      });
    }
  }

  function link(a, b) {
    if (a === b || a.neighbors.includes(b.id)) return;
    a.neighbors.push(b.id);
    b.neighbors.push(a.id);
    edges.push({a: a.id, b: b.id});
  }

  if (legacy) {
    for (let depth = 1; depth < rings.length; depth++) {
      const ring = rings[depth].sort((a, b) => a.sector - b.sector);
      if (!ring.length) continue;
      placeRing(depth, ring, orbits, themes, true);
      const inward = rings[depth - 1];
      const arcBreak = i => (i * 7 + depth * 3) % 19 < 3;
      ring.forEach((node, i) => {
        const next = ring[(i + 1) % ring.length];
        if (!arcBreak(i)) link(node, next);
        if (depth === 1) {
          link(nodes[0], node);
        } else if ((node.kind === 'equipment' && depth === 2) || i % 2 === depth % 2 ||
            arcBreak(i) || arcBreak((i + ring.length - 1) % ring.length)) {
          const nearest = inward.reduce((best, other) => !best || angularGap(node, other) < angularGap(node, best) ? other : best, null);
          if (nearest) link(node, nearest);
        }
      });
    }
  } else {
    for (let depth = 1; depth < rings.length; depth++) {
      const ring = rings[depth].sort((a, b) => a.sector - b.sector ||
        Number(b.kind === 'passive') - Number(a.kind === 'passive'));
      placeRing(depth, ring, orbits, themes, false);
    }
    const routes = themes.map((_, sector) => nodes.filter(n => n.sector === sector && n.routeStep)
      .sort((a, b) => a.routeStep - b.routeStep));
    for (const [sector, route] of routes.entries()) {
      link(nodes[0], route[0]);
      route.slice(1).forEach((node, i) => link(route[i], node));
      const next = routes[(sector + 1) % routes.length];
      // Lateral links provide alternate routes without skipping ahead in cost.
      for (const step of (previous ? [2, 4, 6, 9, 12, 15, 18] : [2, 4, 8])) link(route[step - 1], next[step - 1]);
      for(const node of nodes.filter(n=>n.sector===sector&&n.optional)){
        link(route[node.bypassStep-2],node);
        const formerExit=route[node.bypassStep];
        if(starterCircle){
          // Keep the branch inside one side of the bridge. The former exit still validates saved allocations.
          link(node,route[node.bypassStep-1]);
          node.formerBypassNeighbor=formerExit.id;
          formerExit.formerBypassNeighbor=node.id;
        }else link(node,formerExit);
      }
      for(const node of nodes.filter(n=>n.sector===sector&&n.supportPocket))link(node,route[node.anchorStep-1]);
      for (const node of nodes.filter(n => n.sector === sector && n.kind !== 'passive')) {
        if (node.ring === 1) link(nodes[0], node);
        link(node, route[(node.anchorStep ?? POCKET_STEPS[node.ring]) - 1]);
      }
    }
    if (starterCircle) {
      // Connect the first passives in sector order and fan out from each starting skill.
      const innerPassives = routes.map(route => route[0]);
      innerPassives.forEach((node, i) => link(node, innerPassives[(i + 1) % innerPassives.length]));
      for (const [id, branches] of Object.entries(STARTER_BRANCHES)) {
        for (const theme of branches) link(byId['s:' + id], innerPassives[themeIndex.get(theme)]);
      }
    }
  }

  const routePools=!legacy&&!previous&&!economyLegacy?expandRing({nodes,byId,themes,abilities,add,link,describe:statDescription,uniformUtility,includeOuter:!uniformUtility&&!includeShadowStrike}):undefined;
  const displayRadius=!legacy&&!previous?placeTalentRoutes(nodes,byId,themes.length,{currentLayout:starterCircle}):orbits.at(-1)[0]+(legacy?30:63);
  for (const node of Object.values(byId)) {
    node.maxRank = node.kind === 'skill' && !node.retired && !legacy && !previous && !economyLegacy && !uniformUtility ? 10 : 1;
    delete node.angle;
    Object.freeze(node.neighbors);
    if (node.requires) Object.freeze(node.requires);
    Object.freeze(node);
  }
  edges.forEach(Object.freeze);
  // The center remains a coordinate and a historical save-validation anchor.
  const starters = !legacy && !previous
    ? Object.freeze(rings[1].filter(node => node.kind === 'skill' && !node.requires?.length).map(node => node.id))
    : null;
  return Object.freeze({
    nodes: Object.freeze(nodes), byId: Object.freeze(byId), edges: Object.freeze(edges),
    radius: displayRadius, root: ROOT, ...(starters?{starters}:{}), ...(routePools?{routePools}:{})
  });
}

// Pre-rank saves had automatic mastery at these thresholds.
export function ringSkillMasteryRank(id) {
  return Object.hasOwn(PRACTICE, id) ? PRACTICE[id].at(-1) : 1;
}

export function ringPointBudget(hero, achievementBonus = 0) {
  const level = Math.max(1, Math.min(100, Math.floor(Number.isFinite(hero?.level) ? hero.level : 1)));
  const bonus = Math.max(0, Math.min(12, Math.floor(Number.isFinite(achievementBonus) ? achievementBonus : 0)));
  return level + 1 + Math.floor(level / 3) + bonus;
}

export function ringSpent(allocation) {
  return Object.values(allocation ?? {}).reduce((total,rank) => total + rank, 0);
}

export function ringState(tree, hero, id, achievementBonus) {
  const node = typeof id === 'string' && tree.byId[id] || null;
  const allocation = hero?.ring ?? {};
  const rank = id === tree.root && !tree.starters ? 1 : allocated(allocation, id) ? allocation[id] : 0;
  const maxRank = node?.maxRank ?? 0;
  const spent = ringSpent(allocation);
  const points = ringPointBudget(hero, achievementBonus) - spent;
  const entry = !!tree.starters?.includes(id);
  // Restrict new purchases without invalidating points bought under the old opening.
  const minLevel = tree.starters && !entry ? Math.max(2, node?.level ?? 1) : node?.level ?? 1;
  const linked = !!node && (tree.starters && spent === 0
    ? entry
    : node.neighbors.some(neighbor => neighbor === tree.root ? !tree.starters : allocated(allocation, neighbor)));
  const unmet = node?.requires?.find(prerequisite => !allocated(allocation, prerequisite));
  let reason = '';
  if (!node) reason = '未知的天賦';
  else if (id === tree.root) reason = tree.starters ? '請選擇第一圈技能' : '起源已啟用';
  else if (node.retired) reason = '舊版技能，已整併';
  else if (rank >= maxRank) reason = maxRank > 1 ? '已達 ' + maxRank + ' 階' : '已配置';
  else if (!rank && (!Number.isInteger(hero?.level) || hero.level < minLevel)) reason = '需要等級 ' + minLevel;
  else if (!rank && !linked) reason = tree.starters && spent === 0 ? '先選擇一項第一圈技能' : '先配置相連天賦';
  else if (!rank && unmet) reason = '需要「' + tree.byId[unmet].name + '」';
  else if (points < 1) reason = '天賦點不足';
  return {ok: !reason, reason, node, rank, maxRank, nextRank: rank < maxRank ? rank + 1 : null, points, linked, minLevel};
}

export function validRing(tree, hero, achievementBonus, legacyTree, previousTree, binary = false) {
  if (!hero || !Number.isInteger(hero.level) || hero.level < 1 || hero.level > 100) return false;
  const allocation = hero.ring;
  if (!allocation || typeof allocation !== 'object') return false;
  const prototype = Object.getPrototypeOf(allocation);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const entries = Object.entries(allocation);
  if (entries.length > ringPointBudget(hero, achievementBonus)) return false;
  const oldIds = hero.ringGrandfathered;
  const snapshot = hero.ringRetainedV84;
  const origin = hero.ringOrigin;
  if (origin !== undefined && (typeof origin !== 'string' || !tree.starters?.includes(origin) ||
      !allocated(allocation, origin) || binary || oldIds !== undefined || snapshot !== undefined)) return false;
  const refundedShadowStrike = tree.byId[SHADOW_STRIKE_NODE]?.retired === true;
  const retained = new Set();
  if (snapshot !== undefined) {
    if (!previousTree || oldIds !== undefined || !snapshot || Array.isArray(snapshot) ||
        !Array.isArray(snapshot.ids) || !snapshot.ids.length ||
        snapshot.ids.length > ringPointBudget(hero, achievementBonus) ||
        Object.keys(snapshot).some(key => key !== 'ids' && key !== 'inherited')) return false;
    const previous = Object.create(null);
    for (const id of snapshot.ids) {
      if (typeof id !== 'string' || Object.hasOwn(previous, id)) return false;
      previous[id] = 1;
      if (!id.startsWith('u:') && !(refundedShadowStrike && id === SHADOW_STRIKE_NODE)) {
        if (!allocated(allocation, id)) return false;
        retained.add(id);
      }
    }
    if (!validRing(previousTree, {level: hero.level, ring: previous, ringGrandfathered: snapshot.inherited},
      achievementBonus, legacyTree)) return false;
  } else if (oldIds !== undefined) {
    if (!legacyTree || !Array.isArray(oldIds) || !oldIds.length || oldIds.length > entries.length + Number(refundedShadowStrike)) return false;
    const previous = Object.create(null);
    for (const id of oldIds) {
      if (typeof id !== 'string' || Object.hasOwn(previous, id)) return false;
      previous[id] = 1;
      if (refundedShadowStrike && id === SHADOW_STRIKE_NODE) continue;
      if (!allocated(allocation, id)) return false;
      retained.add(id);
    }
    if (!validRing(legacyTree, {level: hero.level, ring: previous}, achievementBonus)) return false;
  }
  for (const [id, rank] of entries) {
    const node = tree.byId[id];
    if (!node || id === tree.root || !Number.isInteger(rank) || rank < 1 || rank > (binary ? 1 : node.maxRank ?? 1) ||
        refundedShadowStrike && id === SHADOW_STRIKE_NODE || !retained.has(id) && (node.retired || hero.level < node.level ||
        node.requires?.some(prerequisite => !allocated(allocation, prerequisite)))) return false;
  }
  if (ringSpent(allocation) > ringPointBudget(hero, achievementBonus)) return false;
  const last = hero.lastRingNode;
  if (last !== undefined && (typeof last !== 'string' || !allocated(allocation, last))) return false;
  // Older profiles retain their purchases; new routes replay from the paid entry.
  const connected = origin === undefined ? new Set([tree.root, ...retained]) : new Set([origin]);
  const expectedSize = entries.length + Number(origin === undefined);
  let previousSize;
  do {
    previousSize = connected.size;
    for (const [id] of entries) {
      const node = tree.byId[id];
      if (!connected.has(id) && (node.neighbors.some(neighbor => connected.has(neighbor)) ||
          connected.has(node.formerBypassNeighbor)) &&
          !node.requires?.some(prerequisite => !connected.has(prerequisite))) connected.add(id);
    }
  } while (connected.size > previousSize && connected.size < expectedSize);
  return connected.size === expectedSize;
}

export function ringDerived(tree, allocation) {
  const talents = {};
  const mods = {};
  for (const [id, rank] of Object.entries(allocation ?? {})) {
    const node = tree.byId[id];
    if (!node || !Number.isInteger(rank) || rank < 1 || rank > node.maxRank) continue;
    if (node.talentId) talents[node.talentId] = (talents[node.talentId] ?? 0) + rank * (node.rankGain ?? 1);
    for (const [stat, value] of Object.entries(node.mods ?? {})) mods[stat] = (mods[stat] ?? 0) + value;
  }
  return {talents, mods};
}
