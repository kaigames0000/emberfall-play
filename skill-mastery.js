import {masterClassAbility} from './class-design.js?v=108';
import {BOW_SKILL_MASTERY} from './bow-skills.js?v=123';
// Hard investments unlock mechanics. Equipment ranks never purchase these milestones.
export const SUPPORTS={
 m_spiritlore:{name:'雙生契約',description:'土傀儡、霧冰精靈與霧雷雲各可多配置1名；仍受角色容量與最大魔力限制。',summary:['增加初階召喚編隊名額']},
 m_invocation:{name:'喚靈護符',description:'C重新召喚後，新單位獲得最大生命10%的護盾，持續6秒。',summary:['重新召喚提供短暫護盾']},
 m_channel:{name:'軍令疾行',description:'C重新召喚後，全隊獲得5秒攻速+10%、移速+20%的軍令。',summary:['重新召喚提供全隊疾行']},
 m_manifest:{name:'岩核甦醒',description:'土傀儡普通攻擊改為半徑120的範圍震擊，最多命中5名敵人。',summary:['哥雷姆普通攻擊變成範圍震擊']},
 m_transcend:{name:'靈魂庇護',description:'召喚物受到致死傷害時回復12%生命、免傷1秒，全隊共用8秒冷卻；命中同時冰冷與感電的敵人追加8%閃電傷害，同敵冷卻1.5秒，不連鎖。',summary:['救援瀕死召喚物','冰雷狀態觸發協同傷害']},
 m_sovereign:{name:'協同弧光',description:'召喚物每第4次攻擊追加15%基準傷害的弧光，不再觸發；同源集中同一目標每次疊加2%傷害，最多5層，換目標清空。',summary:['週期追加協同弧光','連續集火逐步增傷']}
};
const row=(rank,label,apply)=>({rank,label,apply});
function rules(a){
 if(Object.hasOwn(BOW_SKILL_MASTERY,a.id))return BOW_SKILL_MASTERY[a.id];
 if(a.type==='summon'){
  if(a.summon.support){
   const ward=a.summon.support.kind==='ward';
   return [
    row(3,'支援領域半徑增加20',o=>{o.summon.support={...o.summon.support,radius:Math.min(ward?260:240,o.summon.support.radius+20)};}),
    row(6,ward?'降低護燈靈的召喚耗魔12%':'對首領的衰弱效果提升至一般敵人的60%',o=>{
     if(ward)o.mana*=.88;
     else o.summon.support={...o.summon.support,bossMultiplier:.6};
    }),
    row(10,ward?'每6秒為領域內友軍提供4%最大生命的護盾，持續3秒':'領域內的敵人緩速10%，對首領減半',o=>{
     if(ward)Object.assign(o.summon,{shieldRatio:.04,shieldRadius:o.summon.support.radius,shieldDuration:3});
     else o.summon.support={...o.summon.support,slow:.1};
    }),
   ];
  }
  if(a.id==='r_clone')return [row(3,'分身取得較完整的技能繼承',o=>{o.summon.inheritance=Math.min(1.3,o.summon.inheritance+.06);}),row(6,'分身施法自帶回魔支援',o=>{o.summon.manaRegenBonus=(o.summon.manaRegenBonus||0)+.2;}),row(10,'分身完整繼承本體傷害',o=>{o.summon.inheritance=Math.min(1.3,o.summon.inheritance+.18);})];
  return [row(3,(a.summon.maxCount??8)>1?'增加召喚技能可配置數量':'召喚攻擊擴展形態',o=>{if((o.summon.maxCount??8)>1)o.summon.count=Math.min(o.summon.maxCount??8,o.summon.count+1);else if(o.summon.chain)o.summon.chain={...o.summon.chain,jumps:Math.min(6,o.summon.chain.jumps+1)};else if(o.summon.projectiles)o.summon.projectiles=Math.min(8,o.summon.projectiles+1);else {o.summon.attackRadius=Math.max(o.summon.attackRadius||0,90);o.summon.maxTargets=Math.max(o.summon.maxTargets||1,2);}}),row(6,'召喚攻擊附加緩速',o=>{o.summon.slow=Math.min(.6,(o.summon.slow||0)+.12);o.summon.slowDuration=Math.max(o.summon.slowDuration||0,2);}),row(10,'擴展召喚物範圍或連鎖攻擊',o=>{if(o.summon.chain)o.summon.chain={...o.summon.chain,jumps:Math.min(6,o.summon.chain.jumps+1)};else if(o.summon.projectiles)o.summon.projectiles=Math.min(9,o.summon.projectiles+2);else {o.summon.attackRadius=Math.min(150,Math.max((o.summon.attackRadius||0)+30,90));o.summon.maxTargets=Math.min(5,Math.max(o.summon.maxTargets||1,3));}})];
 }
 if(a.type==='aura')return [
  row(3,'擴展光環領域',o=>{o.radius=Math.min(300,o.radius+25);}),
  row(6,a.damage?'光環附加敵方護甲削弱':'光環追加生命恢復',o=>{if(a.damage)o.debuff={...o.debuff,armorShred:Math.max(o.debuff?.armorShred||0,.08)};else o.lifeRestorePct=Math.min(.035,(o.lifeRestorePct||0)+.003);}),
  row(10,a.damage?'加快光環傷害脈衝':'光環追加魔力回復',o=>{if(a.damage)o.interval=Math.max(.4,o.interval*.85);else o.manaRestore=Math.min(10,(o.manaRestore||0)+1);})
 ];
 if(a.type==='guard')return [row(3,'延長增益時間',o=>{o.duration+=1;}),row(6,'施放時附加護盾',o=>{o.shield=Math.min(.4,(o.shield||0)+.05);}),row(10,'施放時立即回復生命',o=>{o.heal=Math.max(o.heal||0,.08);})];
 if(a.type==='curse')return [row(3,'詛咒擴散至更大範圍',o=>{o.radius=Math.min(400,o.radius+30);}),row(6,'詛咒附加緩速',o=>{o.debuff={...o.debuff,slow:Math.max(o.debuff?.slow||0,.18)};}),row(10,'延長敵方詛咒',o=>{o.duration=Math.min(25,o.duration+3);})];
 if(a.type==='dash')return [row(3,'位移沿路命中範圍擴大',o=>{o.radius=Math.min(180,o.radius+20);}),row(6,'位移命中暈眩敵人',o=>{o.freeze=Math.min(3,(o.freeze||0)+.4);}),row(10,'位移後取得護身減傷',o=>{o.duration=Math.max(o.duration||0,3);o.buff={...o.buff,reduce:Math.min(.3,(o.buff?.reduce||0)+.08)};})];
 if(a.type==='trap')return [row(3,'陷阱留存更久',o=>{o.trap.duration=Math.min(20,o.trap.duration+2);}),row(6,'陷阱增加單種類部署上限',o=>{o.trap.maxCount=Math.min(5,(o.trap.maxCount||3)+1);}),row(10,'陷阱更快啟動',o=>{o.trap.armTime=Math.max(.1,(o.trap.armTime??.4)*.5);})];
 if(a.type==='channel')return [row(3,'引導命中附加緩速',o=>{o.slow=Math.min(.6,(o.slow||0)+.15);o.slowDuration=2;}),row(6,'延伸持續攻擊範圍',o=>{if(o.mode==='whirl')o.radius=Math.min(280,o.radius+25);else o.length=Math.min(o.maxLength??460,o.length+50);}),row(10,a.mode==='whirl'?'旋風引導增加吸血':'冰霜引導機率冰凍',o=>{if(o.mode==='whirl')o.leech=Math.min(.15,(o.leech||0)+.02);else {o.freezeChance=Math.max(o.freezeChance||0,.08);o.freezeDuration=Math.max(o.freezeDuration||0,.4);}})];
 if(a.id==='m_blizzard')return [row(3,'延長風暴留存',o=>{o.duration=Math.min(o.maxDuration,o.duration+.65);}),row(6,'風暴的緩速效果加深',o=>{o.slow+=.1;}),row(10,'風暴更容易凍結敵人',o=>{o.freezeChance+=.07;})];
 if(a.type==='ground')return [row(3,'延長地面技能留存',o=>{o.duration+=1;}),row(6,'擴展地面覆蓋範圍',o=>{o.radius=Math.min(400,o.radius+25);}),row(10,'擴大持續攻擊領域',o=>{o.radius=Math.min(400,o.radius+40);})];
 if(a.chain)return [row(3,'增加連鎖跳躍',o=>{o.chain.jumps=Math.min(10,o.chain.jumps+1);}),row(6,'連鎖命中附加緩速',o=>{o.slow=Math.min(.6,(o.slow||0)+.15);o.slowDuration=2;}),row(10,'再次增加連鎖跳躍',o=>{o.chain.jumps=Math.min(10,o.chain.jumps+1);})];
 if(a.explosionRadius)return [row(3,'擴大爆破濺射',o=>{o.explosionRadius=Math.min(o.maxExplosionRadius??280,o.explosionRadius+20);}),row(6,'冰爆命中機率冰凍',o=>{o.freezeChance=Math.max(o.freezeChance||0,.12);o.freezeDuration=Math.max(o.freezeDuration||0,.6);}),row(10,'追加一枚爆破投射物',o=>{o.extraProjectiles=Math.min(6,(o.extraProjectiles||0)+1);})];
 if(a.type==='projectile')return [row(3,'投射物額外穿透',o=>{o.pierce=Math.min(10,(o.pierce||0)+1);}),row(6,'追加一枚投射物',o=>{o.arrows=Math.min(10,(o.arrows||1)+1);}),row(10,'追加兩枚投射物',o=>{o.arrows=Math.min(10,(o.arrows||1)+2);})];
 return [row(3,'命中附加緩速',o=>{o.slow=Math.min(.6,(o.slow||0)+.15);o.slowDuration=2;}),row(6,'命中暈眩敵人',o=>{o.freeze=Math.min(3,(o.freeze||0)+.4);}),row(10,'命中獲得技能吸血',o=>{o.leech=Math.min(.12,(o.leech||0)+.02);})];
}
export function applyMastery(def,hardRank,investments={},rankedRing=false){
 const custom=masterClassAbility(def,hardRank,investments,rankedRing);if(custom)return custom;
 const o={...def,...(def.summon?{summon:{...def.summon}}:{}),...(def.chain?{chain:{...def.chain}}:{}),...(def.trap?{trap:{...def.trap}}:{})},rank=Math.max(0,Math.min(10,hardRank||0));
 o.masteryRank=rank;o.masteries=rules(def).map(({rank:required,label,apply})=>{const active=rank>=required;if(active)apply(o);return {rank:required,label,active};});
 if(o.summon&&['m_golem','m_spirit','m_thorn'].includes(o.id)&&investments.m_spiritlore>0)o.summon.count=Math.min(o.summon.maxCount??8,o.summon.count+1);
 return o;
}
