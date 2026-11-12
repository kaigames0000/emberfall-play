const colors={white:'#d7d7cf',blue:'#78b7e7',yellow:'#e4c36c',purple:'#bd91dc',red:'#df8277',orange:'#efad65'};
export const ENEMY_RANKS=Object.freeze({
 white:{name:'普通',hp:1,damage:1,speed:1},blue:{name:'強化',hp:1.25,damage:1.06,speed:1.03},
 yellow:{name:'稀有',hp:1.8,damage:1.12,speed:1.05},purple:{name:'異變',hp:2.5,damage:1.2,speed:1.07},
 red:{name:'特化首領',hp:1,damage:1,speed:1},orange:{name:'章節首領',hp:1,damage:1,speed:1}
});
const auras={frenzy:{name:'狂襲',haste:.12},bulwark:{name:'護軍',reduce:.1},pursuit:{name:'追獵',speed:.12}};
export function decorateRank(e,rank='white',{aura,traits}={}){
 if(!Object.hasOwn(ENEMY_RANKS,rank))rank='white';
 const b=e._rankBase??={hp:e.maxHp,damage:e.damageScale,speed:e.speed,armor:e.armor,r:e.r,attackSpeed:e.attackSpeed};
 const p=e.maxHp>0?Math.max(0,e.hp/e.maxHp):1,r=ENEMY_RANKS[rank];e.enemyRank=rank;e.rankColor=colors[rank];e.rankLabel=r.name;
 e.maxHp=b.hp*r.hp;e.hp=e.maxHp*p;e.damageScale=b.damage*r.damage;e.speed=b.speed*r.speed;e.armor=b.armor+(rank==='blue'?2:rank==='purple'?5:0);e.r=b.r*(rank==='yellow'||rank==='purple'?1.12:1);
 e.rankBaseSpeed=e.speed;e.rankBaseAttackSpeed=b.attackSpeed;e.rankAura=aura?{key:aura,...auras[aura]}:null;e.rankTraits=traits||[];return e;
}
export function rankAuraSnapshot(enemies){
 const living=enemies.slice(0,48).filter(e=>e.hp>0),sources=living.filter(e=>e.rankAura),out=new Map();
 for(const e of living){const result={haste:0,reduce:0,speed:0};for(const source of sources)if(Math.hypot(source.x-e.x,source.y-e.y)<=210)for(const key of Object.keys(result))result[key]=Math.max(result[key],source.rankAura[key]||0);out.set(e,result);}return out;
}
const installed=Symbol.for('emberfall.enemy-ranks.v80');
export function installEnemyRarity(Game){
 const P=Game.prototype;if(P[installed])return;Object.defineProperty(P,installed,{value:true});
 const original=Object.fromEntries(['spawn','promoteElite','update','hit','kill','lootStats'].map(k=>[k,P[k]]));
 P.spawn=function(...args){const e=original.spawn.apply(this,args);decorateRank(e,e.type==='boss'?'orange':e.type==='miniboss'?'red':'white');if(e.type==='elite'){e.enemyRank='yellow';e.rankLabel='稀有';e.rankColor=colors.yellow;}return e;};
 P.promoteElite=function(e,key){if(!e||e.enemyRank==='yellow'||e.enemyRank==='purple'||e.summoned)return null;const previous=ENEMY_RANKS[e.enemyRank]||ENEMY_RANKS.white,base={hp:e.maxHp/previous.hp,damage:e.damageScale/previous.damage,speed:e.speed/previous.speed,armor:e.armor-(e.enemyRank==='blue'?2:0),r:e.r,attackSpeed:e.rankBaseAttackSpeed??e.attackSpeed};const result=original.promoteElite.call(this,e,key);if(!result)return result;
  e._rankBase=base;const expedition=this.expedition,purpleAllowed=(this.diff>1||this.room>=4)&&!expedition?._purpleIssued,purple=purpleAllowed&&this.rand()<.16;if(purple&&expedition)expedition._purpleIssued=true;
  const auraKeys=Object.keys(auras),aura=auraKeys[Math.min(auraKeys.length-1,Math.floor(this.rand()*auraKeys.length))],traits=purple?['堅韌','元素抗性']:['堅韌'];decorateRank(e,purple?'purple':'yellow',{aura,traits});if(purple)for(const type of ['fire','cold','lightning','poison'])e.resistances[type]=Math.min(.7,(e.resistances[type]||0)+.05);return e;
 };
 P.update=function(dt){if(this.mode==='playing'&&!this.paused&&!this.transition&&!this.training){this._rankAuraClock=(this._rankAuraClock||0)-dt;if(this._rankAuraClock<=0){this._rankAuraClock=.2;for(const[e,mods]of rankAuraSnapshot(this.enemies)){if(e.rankBaseSpeed===undefined)continue;if(e._rankLastSpeed===undefined||e.speed!==e._rankLastSpeed)e._rankDynamicSpeed=e.speed;if(e._rankLastAttackSpeed===undefined||e.attackSpeed!==e._rankLastAttackSpeed)e._rankDynamicAttackSpeed=e.attackSpeed;e.speed=e._rankDynamicSpeed*(1+mods.speed);e.attackSpeed=e._rankDynamicAttackSpeed*(1+mods.haste);e._rankLastSpeed=e.speed;e._rankLastAttackSpeed=e.attackSpeed;e.rankReduce=mods.reduce;}}}return original.update.call(this,dt);};
 P.hit=function(e,amount,...args){return original.hit.call(this,e,amount*(1-Math.min(.1,e.rankReduce||0)),...args);};
 P.kill=function(e){const before=this._rankLoot;this._rankLoot=e?.enemyRank;try{return original.kill.call(this,e);}finally{this._rankLoot=before;}};
 P.lootStats=function(...args){const s=original.lootStats.apply(this,args);return this._rankLoot==='purple'?{...s,drop:(s.drop||0)+.15,rarityFind:(s.rarityFind||0)+.15}:s;};
}
