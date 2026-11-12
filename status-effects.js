const status = (name, icon, color, detail) => ({name, icon, color, detail});

export const ACTOR_STATUSES = {
 frozen: status('凍結','snow','#c1edff','暫時無法移動或攻擊。'),
 slow: status('緩速','wind','#9bd4e0','移動速度降低。'),
 pin: status('釘刃','pin','#d3b4ed','可疊層。苦無與部分機關可消耗層數來加強傷害。'),
 shock: status('感電','lightning','#e3c777','更容易被暴擊，且受到的暴擊傷害提高。'),
 burn: status('燃燒','flame','#f3a36d','持續受到火焰傷害，各層獨立計時。'),
 poison: status('中毒','potion','#b2d76f','持續受到毒素傷害。毒箭造成的中毒可疊層。'),
 bleed: status('流血','drop','#ef8c88','持續受到物理傷害。'),
 shadow: status('破綻','pin','#bda4e3','部分匕首攻擊可累積並消耗破綻。'),
 curse: status('詛咒','rune','#d8a4ee','顯示同時作用的詛咒與剩餘時間。'),
 armor: status('護甲削弱','shield','#e7b77c','護甲降低，更容易受到物理傷害。'),
 weaken: status('傷害削弱','down','#c4a1df','目標造成的傷害降低。'),
 shield: status('召喚物庇護','shield','#98d5ef','召喚物有護盾，或正受到護燈靈的減傷保護。'),
 aura: status('召喚物增益光環','flag','#b6d7a1','召喚物正在享有光環加成。其他暫時增益會用對應技能的圖示。')
};

export const PLAYER_STATUSES = {
 slow: {...ACTOR_STATUSES.slow,detail:'移動速度降低，離開緩速區域後解除。'},
 bloodDebt: status('延遲承傷','drop','#f29784','戰吼延後的傷害會在倒數期間逐步扣除生命。'),
 difficulty: status('抗性壓制','rune','#dba2e5','高難度遠征會降低火焰、冰霜、閃電與毒素抗性，影響整趟遠征。'),
 summonWard: {...ACTOR_STATUSES.shield,name:'護燈靈的庇護',detail:'待在護燈靈的光環內可減少承傷。'},
 supportShield: {...ACTOR_STATUSES.shield,name:'召喚守護',detail:'召喚物提供的護盾會先吸收一部分傷害。'},
 proc: status('裝備觸發','rune','#d0abe2','提示裝備剛自動施放技能，這次施放無須付費。'),
 rage: status('狂怒','flame','#dd847c','付出生命施放並直接命中可累積狂怒，部分技能會消耗狂怒。')
};

const ground = (name, {icon,color}) => status(name,icon,color,'站在區域內會持續受到傷害，離開即可解除。倒數表示地面效果的剩餘時間。');
export const GROUND_STATUSES = {
 fire: ground('火焰地面',ACTOR_STATUSES.burn),
 cold: ground('寒霜地面',ACTOR_STATUSES.frozen),
 lightning: ground('雷電區域',ACTOR_STATUSES.shock),
 poison: ground('毒池侵蝕',ACTOR_STATUSES.poison),
 physical: ground('危險地面',{icon:'target',color:'#d6d9d4'})
};

const aliveTime=entry=>entry?.time??entry?.t??0;
function timedLayers(layers){
 let first,stacks=0;
 for(const layer of layers)if(aliveTime(layer)>0){
  stacks++;
  if(!first||aliveTime(layer)<aliveTime(first))first=layer;
 }
 return {stacks,remaining:first?aliveTime(first):undefined,timerKey:first};
}
function mostTime(layers,key){
 let longest;
 for(const layer of layers)if(layer[key]>0&&aliveTime(layer)>aliveTime(longest))longest=layer;
 return longest?{remaining:aliveTime(longest),timerKey:longest}:{};
}

export function enemyStatusEffects(enemy,assassinClock=0){
 const badges=[],push=(id,detail)=>badges.push({...ACTOR_STATUSES[id],id,...detail});
 const debuffs=Object.values(enemy.auraDebuffs||{});
 if(enemy.frozen>0)push('frozen',{remaining:enemy.frozen});
 else if(Math.max(enemy.auraSlow||0,enemy.slow||0)>0)push('slow',mostTime(debuffs,'slow'));
 if(enemy.arsenalPins>0&&enemy.arsenalPinUntil>assassinClock)
  push('pin',{stacks:enemy.arsenalPins,remaining:enemy.arsenalPinUntil-assassinClock,duration:4});
 if(enemy.shadowMarks>0)push('shadow',{stacks:enemy.shadowMarks});
 if(enemy.shock>0){
  const shock=timedLayers(enemy.shockLayers||[]);
  push('shock',{...shock,remaining:shock.remaining??enemy.shock});
 }
 const burn=timedLayers(enemy.burnStacks||[]);
 if(burn.stacks)push('burn',burn);
 const poison=[],doses=[],bleeds=[];
 for(const [key,dot] of Object.entries(enemy.dots||{})){
  if(aliveTime(dot)<=0)continue;
  if(key==='poison'||dot.damageType==='poison'){
   doses.push(dot);
   if(dot.stacks)poison.push(...dot.stacks);
  }else if(key.includes('bleed')||dot.bleed)bleeds.push(dot);
 }
 if(doses.length){
  const poisonTime=timedLayers(poison),doseTime=timedLayers(doses);
  push('poison',poisonTime.stacks?poisonTime:{...doseTime,stacks:0});
 }
 if(bleeds.length)push('bleed',timedLayers(bleeds));
 if(enemy.auraArmorShred>0)push('armor',mostTime(debuffs,'armorShred'));
 if(enemy.auraWeaken>0)push('weaken',mostTime(debuffs,'weaken'));
 const curses=timedLayers(debuffs.filter(layer=>layer.ringCurseId));
 if(curses.stacks)push('curse',curses);
 return badges;
}

export const ACTOR_DEFENSES = {
 fire:{icon:'flame',color:ACTOR_STATUSES.burn.color},
 cold:{icon:'snow',color:ACTOR_STATUSES.slow.color},
 lightning:{icon:'lightning',color:ACTOR_STATUSES.shock.color},
 poison:{icon:'potion',color:ACTOR_STATUSES.poison.color},
 freeze:{icon:'snow',color:ACTOR_STATUSES.slow.color},
 shock:{icon:'lightning',color:ACTOR_STATUSES.shock.color}
};

const stroke = (points, width=1.4, closed=false) => ({points,width,closed});
const outline = points => [stroke(points,1.4,true)];
const glyphs = {
 snow:Array.from({length:3},(_,branch)=>{
  const angle=branch*Math.PI/3,x=Math.cos(angle)*7,y=Math.sin(angle)*7;
  return stroke([[-x,-y],[x,y]],1.5);
 }),
 flame:outline([[-4,6],[-6,1],[-2,-3],[0,-7],[4,-3],[5,2],[3,6]]),
 lightning:outline([[1,-7],[-5,1],[0,0],[-1,7],[6,-2],[2,-1]]),
 potion:[...outline([[-2,-7],[2,-7],[2,-3],[6,3],[4,7],[-4,7],[-6,3],[-2,-3]]),stroke([[-4,2],[4,2]])],
 shield:outline([[-6,-5],[0,-7],[6,-5],[5,3],[0,7],[-5,3]]),
 wind:[stroke([[-7,-3],[3,-3],[6,-5]]),stroke([[-7,1],[7,1]]),stroke([[-5,5],[3,5],[5,3]])],
 pin:[stroke([[-5,-5],[5,5]],2),stroke([[-2,-6],[-6,-2]],2),stroke([[2,6],[6,2]],2)],
 down:[stroke([[-5,-5],[0,1],[5,-5]],2),stroke([[-5,1],[0,7],[5,1]],2)],
 heart:outline([[0,6],[-6,0],[-6,-4],[-2,-6],[0,-3],[2,-6],[6,-4],[6,0]]),
 drop:outline([[0,-7],[5,-1],[6,3],[3,7],[-3,7],[-6,3],[-5,-1]]),
 flag:[stroke([[-5,7],[-5,-7],[5,-5],[3,1],[-5,0]])],
 rune:outline([[0,-7],[6,0],[0,7],[-6,0]]),
 eye:[...outline([[-7,0],[-3,-4],[3,-4],[7,0],[3,4],[-3,4]]),...outline([[0,-2],[2,0],[0,2],[-2,0]])],
 ring:outline([[0,-6],[4,-4],[6,0],[4,4],[0,6],[-4,4],[-6,0],[-4,-4]]),
 sword:[...outline([[6,-7],[7,-3],[-1,4],[-4,1]]),stroke([[-6,-1],[1,6]]),stroke([[-3,3],[-7,7]])],
 meteor:[...outline([[-6,1],[-3,-2],[1,-2],[5,2],[3,6],[-3,7],[-6,5]]),stroke([[0,-4],[4,-8]]),stroke([[4,-2],[8,-6]])]
};
glyphs.target=[...glyphs.ring,stroke([[0,-8],[0,-4]]),stroke([[0,4],[0,8]]),stroke([[-8,0],[-4,0]]),stroke([[4,0],[8,0]])];
const aliases={flask:'potion','flask-life':'heart','flask-mana':'drop','flask-hybrid':'potion','flask-speed':'wind','flask-iron':'shield','flask-diamond':'target','flask-fortune':'rune'};
export function actorStatusShape(icon){return glyphs[aliases[icon]??icon]||glyphs.rune;}

export function actorStatusIconMarkup({icon,immune,resistant}){
 const shape=actorStatusShape(icon).map(({points,width,closed})=>{
  const tag=closed?'polygon':'polyline';
  return `<${tag} points="${points.map(([x,y])=>x+','+y).join(' ')}" stroke-width="${width}"/>`;
 }).join('');
 const mark=immune?'<path d="M-8 8 8-8" stroke="#f0dfce" stroke-width="2"/>':resistant?'<rect x="-6" y="5" width="12" height="2" fill="currentColor" stroke="none"/>':'';
 return `<svg class="guide-actor-icon" viewBox="-10 -10 20 20" aria-hidden="true">${shape}${mark}</svg>`;
}
