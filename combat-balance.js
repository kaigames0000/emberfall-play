import {restoreSiphonedMana} from './mana-economy.js?v=108';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
const pressureBands={1:[[1,2.5],[3.5,8],[8,18]],2:[[5,9],[9,15],[15,22]],3:[[8,14],[14,20],[20,28]]};
export const normalAbbey=(g)=>g.diff===1&&g.chapter===1&&(!g.runContext||g.runContext.kind==='campaign');

export function enemyElementalPressure(g){
 if(g.training)return 1;
 const diff=clamp(g.diff||1,1,3),chapter=clamp(g.chapter||1,1,3),paid=['rift','endgame'].includes(g.runContext?.kind),end=g.runContext?.kind==='endgame';
 const [from,to]=end?[24,32]:pressureBands[diff][chapter-1],progress=clamp((g.room||0)/(paid?3:7),0,1);
 return from+(to-from)*progress;
}
export function enemyImpactDamage(g,amount,type,kind){
 if(!['fire','cold','lightning','poison'].includes(type)||!['burst','projectile','field'].includes(kind))return amount;
 const pressure=enemyElementalPressure(g);
 const weight=kind==='burst'?1:kind==='projectile'?(normalAbbey(g)&&g.room===7?.13:.48):.25;
 return amount*(1+(pressure-1)*weight);
}
export const summonBossHitMultiplier=(g,target,options)=>
 !g.training&&g.diff===1&&(!g.runContext||g.runContext.kind==='campaign')&&target.type==='boss'&&options.minion&&!options.clone&&!options.dot&&!options.periodic&&
 !options.triggered&&!options.indirect&&!options.setSecondary&&['m_golem','m_spirit'].includes(options.ability)?1.35:1;
export function enemyWarningTime(g,radius,requested){
 const speed=clamp((g.s?.speed||210)*(g.playerSlow??1),80,210);
 return Math.max(requested,.35+(Math.max(0,radius)+16)/speed);
}
export function hostileProjectileSpeed(g,speed){return Math.min(speed,[0,200,210,220][clamp(g.diff||1,1,3)]);}
export function enemySkillTier(g){
 if(g.runContext?.kind==='endgame')return 3;
 const base=clamp((g.diff||1)-1,0,2),late=(g.chapter||1)===3&&(g.room||0)>=4;
 return Math.min(3,base+(late?1:0));
}
export function lowHealthActive(g){return g.mode==='playing'&&!g.paused&&!g.transition&&Number.isFinite(g.hp)&&g.hp>0&&g.s?.hp>0&&g.hp/g.s.hp<.2;}

// Actual life lost is the input. All targets, pets and DoT stacks spend the same owner budget.
export function recoverOwnedResources(g,lifeLost,skill,options={},target,periodic=false){
 if(g.mode!=='playing'||g.training||!Number.isFinite(lifeLost)||lifeLost<=0||options.triggered||options.triggerKey||options.setSecondary||options.inherited||options.talentInherited||options.rotcycleInherited)return;
 const proxy=!!(periodic||options.minion||options.clone||options.dot||options.aura||options.periodic);
 if(options.indirect&&!proxy)return;
 const efficiency=proxy?.5:1,boss=target?.type==='boss'||target?.type==='miniboss',elite=target?.elite||target?.type==='elite';
 const passive=proxy?0:(skill?g.s.skillLeech||0:g.s.basicLeech||0)*(boss?.25:elite?.5:1);
 const rate=Math.max(0,(g.s.leech||0)*efficiency+(proxy?0:options.leech||0)+passive),allowance=g.passiveLeechAllowance??g.s.hp*.1;
 const cost=Math.max(0,Math.min(g.s.hp-g.hp,lifeLost*rate,allowance));
 if(cost>0){g.hp=g.healValue(cost);g.passiveLeechAllowance=Math.max(0,allowance-cost);}
 const wanted=lifeLost*Math.max(0,g.s.manaLeech||0)*efficiency+(proxy?0:Math.max(0,g.s.manaOnHit||0));
 restoreSiphonedMana(g,wanted);
}
