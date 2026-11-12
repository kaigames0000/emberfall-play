export const BOW_SKILLS=[
 {id:'r_icearrow',name:'冰箭',icon:'snow',desc:'射出冰霜箭矢，命中使敵人移動速度降低 32%，持續 2.4 秒，並有 22% 基礎機率凍結 0.68 秒。凍結受目標抗性影響。',
  routeStep:2,position:[281,-35],mana:10,cooldown:2.35,
  projectile:{damage:1.65,damageType:'cold',color:'#a8e7ff',arrows:1,pierce:0,speed:760,radius:5,slow:.32,slowDuration:2.4,freezeChance:.22,freezeDuration:.68}},
 {id:'r_explosivearrow',name:'爆裂箭',icon:'flame',desc:'火箭撞上敵人時爆炸。直擊承受完整火焰傷害，周圍敵人承受 64% 濺射傷害。箭矢在爆炸後消失。',
  routeStep:4,position:[543,50],mana:15,cooldown:3.1,
  projectile:{damage:2.05,damageType:'fire',color:'#ffad65',arrows:1,pierce:0,speed:640,radius:6,explosionRadius:84,maxExplosionRadius:160,splashFactor:.64}},
 {id:'r_homingarrow',name:'追蹤箭',icon:'target',desc:'在瞄準方向鎖定 500 距離內的一名敵人，箭矢於飛行首 1.05 秒持續修正方向。目標離開追蹤範圍後沿當前方向飛行，命中後停止。',
  routeStep:5,position:[619,-55],mana:13,cooldown:2.65,
  projectile:{damage:1.85,damageType:'physical',color:'#e3c4ff',arrows:1,pierce:0,speed:615,radius:5,homing:Object.freeze({range:500,turnSpeed:4.6,duration:1.05})}}
];

const row=(rank,label,apply)=>({rank,label,apply});
export const BOW_SKILL_MASTERY={
 r_icearrow:[
  row(3,'緩速提高至 40%',o=>{o.slow=.4;}),
  row(6,'凍結基礎機率提高至 34%，凍結持續 0.85 秒',o=>{o.freezeChance=.34;o.freezeDuration=.85;}),
  row(10,'追加一支冰箭，同次施放每名敵人最多命中一次',o=>{o.arrows+=1;})
 ],
 r_explosivearrow:[
  row(3,'爆炸半徑增加 18',o=>{o.explosionRadius=Math.min(o.maxExplosionRadius,o.explosionRadius+18);}),
  row(6,'濺射傷害提高至 78%',o=>{o.splashFactor=.78;}),
  row(10,'火焰爆炸附加 2 秒灼燒',o=>{o.burn=.12;o.burnDuration=2;})
 ],
 r_homingarrow:[
  row(3,'可鎖定 560 距離內的敵人',o=>{o.homing={...o.homing,range:560};}),
  row(6,'提高飛行中轉向速度',o=>{o.homing={...o.homing,turnSpeed:6.2};}),
  row(10,'追蹤時間延長至 1.4 秒並追加一支箭',o=>{o.homing={...o.homing,duration:1.4};o.extraProjectiles=Math.min(6,(o.extraProjectiles||0)+1);})
 ],
};
