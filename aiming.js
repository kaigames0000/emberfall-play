const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const passive=context=>context.actor||context.triggered||context.triggerKey||context.clone||context.minion||context.indirect||context.dot||context.periodic||context.aura||context.setSecondary;

// The app owns pointer visibility and world-coordinate conversion. Cursor state
// is never consulted for enemies, summons or secondary/equipment effects.
export function pointerAimPoint(g,context={},origin=g.player){
 const point=g.pointerTarget;
 if(!point||(g.pointerAimEnabled!==true&&!point.stationary)||origin!==g.player||passive(context)||g.mode!=='playing'||g.paused||g.transition||g.training?.finished)return null;
 if((point.pointerType??g.pointerType)!=='mouse'||point.active===false||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
 if(Number.isFinite(point.at)){const age=(g.now?.()??Date.now())-point.at;if(age<0||age>15000)return null;}
 return {x:point.x,y:point.y};
}

export function playerAimAngle(g,context={},origin=g.player){
 const pointer=pointerAimPoint(g,context,origin),point=pointer||g.nearest(origin);
 return point&&(!pointer||distance(origin,point)>.001)?Math.atan2(point.y-origin.y,point.x-origin.x):(origin.angle??g.player.angle??0);
}

export function playerAimTarget(g,range=Infinity,context={},origin=g.player){
 const point=pointerAimPoint(g,context,origin);
 if(!point){const enemy=g.nearest(origin);return enemy&&distance(origin,enemy)<=range+(enemy.r||0)?enemy:null;}
 let target=null,best=Infinity;
 for(const enemy of g.enemies){
  if(enemy.hp<=0||enemy.worldProp||distance(origin,enemy)>range+(enemy.r||0))continue;
  const score=distance(point,enemy);if(score<best){target=enemy;best=score;}
 }
 return target;
}

export function playerAimPlacement(g,range,context={},origin=g.player,{legal,visible}={}){
 const point=pointerAimPoint(g,context,origin);if(!point)return null;
 const d=distance(origin,point),reach=Number.isFinite(range)?Math.max(0,range):700,ratio=d>reach?reach/d:1;
 const goal={x:origin.x+(point.x-origin.x)*ratio,y:origin.y+(point.y-origin.y)*ratio};
 const canLand=legal||((x,y)=>g.canLand(x,y)),canSee=visible||((from,to)=>g.walkVisible(from,to));
 const allowed=to=>canLand(to.x,to.y)&&canSee(origin,to);
 if(allowed(goal))return goal;
 if(!canLand(origin.x,origin.y))return null;
 // Find the last reachable point on the requested segment; this also handles
 // current terrain bounds without assuming a fixed room size.
 let lo=0,hi=1;
 for(let i=0;i<18;i++){const mid=(lo+hi)/2,to={x:origin.x+(goal.x-origin.x)*mid,y:origin.y+(goal.y-origin.y)*mid};if(allowed(to))lo=mid;else hi=mid;}
 return {x:origin.x+(goal.x-origin.x)*lo,y:origin.y+(goal.y-origin.y)*lo};
}
