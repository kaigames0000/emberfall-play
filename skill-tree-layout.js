// Presentation coordinates are independent of the rule tree's col/row and tiers.
// Each percentage anchors the icon centre; labels extend below that anchor.
const MAPS={
 warrior:[
  {height:440,positions:{w_cleave:[13,40],w_charge:[37,18],w_blitz:[61,18],w_whirl:[85,40],w_basic_sweep:[37,79],w_basic_thrust:[70,79]}},
  {height:340,positions:{w_guard:[24,35],w_slam:[77,35],w_basic_counter:[50,78]}},
  {height:520,positions:{w_banner:[13,48],w_haste:[37,18],w_knight:[37,78],w_warcry:[61,18],w_order:[61,78],w_renewal:[61,48],w_crit:[85,30],w_elemental:[85,78]}}
 ],
 ranger:[
  {height:560,positions:{r_pierce:[13,20],r_volley:[13,60],r_mark:[37,45],r_dash:[37,80],r_ricochet:[61,60],r_snipe:[61,20],r_gale:[85,70],r_precision:[85,20],r_basic_pierce:[13,86]}},
  {height:440,positions:{r_poisonarrow:[13,45],r_burst:[37,18],r_rain:[61,70],r_spread:[85,18],r_basic_split:[13,83],r_basic_venom:[85,82]}},
  {height:460,positions:{r_wolf:[13,48],r_bear:[37,20],r_eagle:[37,77],r_beastguard:[61,20],r_packfocus:[61,77],r_lifebond:[85,48]}}
 ],
 mage:[
  {height:500,positions:{m_fireball:[13,48],m_nova:[37,48],m_flamethrower:[61,18],m_frostarmor:[37,82],m_icecone:[85,18],m_blizzard:[85,70],m_basic_firebolt:[13,83]}},
  {height:460,positions:{m_spark:[13,43],m_aegis:[37,18],m_chain:[61,18],m_meteor:[85,43],m_basic_homing:[13,83],m_basic_volley:[48,78],m_basic_arc:[85,83]}},
  {height:640,positions:{m_golem:[13,38],m_spirit:[37,14],m_thorn:[61,14],m_warder:[85,38],m_manifest:[85,62],m_avatar:[85,85],m_invocation:[13,62],m_channel:[37,62],m_transcend:[61,62],m_icegod:[61,85],m_spiritlore:[13,85],m_sovereign:[37,85]}}
 ],
 assassin:[
  {height:640,positions:{a_stab:[13,38],a_veil:[13,14],a_blink:[37,14],a_dual:[37,38],a_mark:[13,62],a_flurry:[37,62],a_execute:[61,38],a_mirrorstrike:[61,85],a_pursuit:[85,14],a_storm:[85,62],a_basic_twin:[13,85]}},
  {height:460,positions:{a_clone:[13,30],a_relay:[37,18],a_evasion:[13,75],a_dancer:[37,75],a_counter:[61,75],a_concord:[85,37]}},
  {height:520,positions:{a_blades:[13,40],a_mine:[37,18],a_sentry:[61,40],a_network:[61,18],a_shuriken:[13,78],a_kunai:[85,78],a_basic_daggers:[37,82],a_basic_rope:[85,18]}}
 ],
 berserker:[
  {height:520,positions:{b_cleave:[13,42],b_flurry:[37,18],b_dual:[37,78],b_execute:[61,42],b_hunt:[85,18],b_titan_grip:[85,78],b_basic_alternate:[13,84],b_basic_blood:[61,84]}},
  {height:500,positions:{b_bloodaura:[13,48],b_bloodpulse:[37,20],b_bloodtempo:[61,18],b_bloodward:[85,35],b_resonance:[37,77],b_bloodoath:[85,77],b_basic_rage:[13,83]}},
  {height:560,positions:{b_rally:[13,18],b_frenzycry:[37,18],b_ironcry:[61,18],b_leap:[13,58],b_guardcry:[37,58],b_dread:[61,46],b_reclaim:[85,58],b_ritual:[37,86],b_avatar:[85,86]}}
 ]
};

function requirements(node){
 const values=Array.isArray(node?.prevs)?node.prevs:node?.prev?[node.prev]:[];
 return [...new Set(values.filter(id=>typeof id==='string'&&id))];
}

/** Return fresh presentation data, retaining every supplied node and real edge. */
export function skillAtlasLayout(nodes=[],{cls,page=0}={}){
 const valid=nodes.filter(node=>node&&typeof node.id==='string'),ids=new Set(valid.map(node=>node.id));
 const designed=MAPS[cls]?.[page],known=designed&&valid.every(node=>Object.hasOwn(designed.positions,node.id));
 const height=known?designed.height:Math.max(340,Math.ceil(valid.length/4)*140+40);
 const primary=valid.find(node=>node.ability&&!requirements(node).some(id=>ids.has(id)))||valid.find(node=>node.ability)||valid[0];
 const edges=[],external=[];
 for(const node of valid)for(const from of requirements(node))(ids.has(from)?edges:external).push({from,to:node.id});
 return {
  nodes:valid.map((node,index)=>{
   const[x,y]=known?designed.positions[node.id]:[[13,37,61,85][index%4],(60+Math.floor(index/4)*140)/height*100];
   return{id:node.id,x,y,core:node===primary,kind:node.basicAttack?'basic':node.category==='passive'||!node.ability?'passive':'active'};
  }),
  edges,external,density:valid.length<=4?'sparse':valid.length>=10?'dense':'normal',height
 };
}

/** Walk ancestors iteratively so malformed future data cannot recurse forever. */
export function skillAtlasRelated(nodes=[],id){
 const byId=new Map(nodes.map(node=>[node.id,node])),related=new Set(),pending=id==null?[]:[id];
 while(pending.length){const next=pending.pop();if(related.has(next))continue;related.add(next);pending.push(...requirements(byId.get(next)));}
 return related;
}

const PADDING=8,ARROW_GAP=7,TURN_COST=12;
function validRect(rect){return rect&&['left','top','right','bottom'].every(key=>Number.isFinite(rect[key]))&&rect.left<rect.right&&rect.top<rect.bottom;}
function padded(rect){return{left:rect.left-PADDING,top:rect.top-PADDING,right:rect.right+PADDING,bottom:rect.bottom+PADDING};}
function inside(point,rect){return point.x>rect.left+.001&&point.x<rect.right-.001&&point.y>rect.top+.001&&point.y<rect.bottom-.001;}
function clearSegment(a,b,obstacles){
 if(Math.abs(a.y-b.y)<.001)return !obstacles.some(r=>a.y>r.top+.001&&a.y<r.bottom-.001&&Math.max(a.x,b.x)>r.left+.001&&Math.min(a.x,b.x)<r.right-.001);
 if(Math.abs(a.x-b.x)<.001)return !obstacles.some(r=>a.x>r.left+.001&&a.x<r.right-.001&&Math.max(a.y,b.y)>r.top+.001&&Math.min(a.y,b.y)<r.bottom-.001);
 return false;
}
function ports(rect,width,height){
 const{bounds,icon}=rect,x=(icon.left+icon.right)/2,y=(icon.top+icon.bottom)/2;
 // Labels sit below icons: the three other sides give them a clear approach.
 return [
  {point:{x:icon.right+ARROW_GAP,y},outer:{x:bounds.right+PADDING,y}},
  {point:{x:icon.left-ARROW_GAP,y},outer:{x:bounds.left-PADDING,y}},
  {point:{x,y:icon.top-ARROW_GAP},outer:{x,y:bounds.top-PADDING}}
 ].filter(port=>[port.point,port.outer].every(p=>p.x>=1&&p.x<=width-1&&p.y>=1&&p.y<=height-1));
}
function manhattan(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
function pushHeap(heap,item){
 let index=heap.length;heap.push(item);
 while(index){const parent=(index-1)>>1;if(heap[parent].priority<=item.priority)break;heap[index]=heap[parent];index=parent;}
 heap[index]=item;
}
function popHeap(heap){
 const first=heap[0],last=heap.pop();if(!heap.length)return first;
 let index=0;
 while(index*2+1<heap.length){let child=index*2+1;if(child+1<heap.length&&heap[child+1].priority<heap[child].priority)child++;if(heap[child].priority>=last.priority)break;heap[index]=heap[child];index=child;}
 heap[index]=last;return first;
}
function gridPath(start,end,obstacles,width,height,budget){
 const xs=[1,width-1,start.x,end.x],ys=[1,height-1,start.y,end.y];
 for(const r of obstacles){xs.push(r.left,r.right);ys.push(r.top,r.bottom);}
 const unique=(values,max)=>[...new Set(values.filter(n=>n>=1&&n<=max-1))].sort((a,b)=>a-b);
 const xx=unique(xs,width),yy=unique(ys,height),cols=xx.length,startX=xx.indexOf(start.x),startY=yy.indexOf(start.y),endX=xx.indexOf(end.x),endY=yy.indexOf(end.y);
 if(startX<0||startY<0||endX<0||endY<0)return null;
 const points=yy.flatMap(y=>xx.map(x=>({x,y}))),blocked=points.map(p=>obstacles.some(r=>inside(p,r)));
 const startIndex=startY*cols+startX,endIndex=endY*cols+endX;
 if(blocked[startIndex]||blocked[endIndex])return null;
 const heap=[],costs=new Map(),parents=new Map(),startState=startIndex*3;
 costs.set(startState,0);pushHeap(heap,{state:startState,cost:0,priority:manhattan(start,end)});
 let visited=0;
 while(heap.length&&visited++<points.length*3){
  const current=popHeap(heap),index=Math.floor(current.state/3),direction=current.state%3;
  if(current.cost!==costs.get(current.state))continue;
  if(index===endIndex){
   const path=[];let state=current.state;
   while(state!=null){path.push(points[Math.floor(state/3)]);state=parents.get(state);}
   return{points:path.reverse(),cost:current.cost};
  }
  const col=index%cols,row=Math.floor(index/cols),neighbors=[];
  if(col)neighbors.push([index-1,1]);if(col+1<cols)neighbors.push([index+1,1]);if(row)neighbors.push([index-cols,2]);if(row+1<yy.length)neighbors.push([index+cols,2]);
  for(const[next,nextDirection]of neighbors){
   if(blocked[next]||!clearSegment(points[index],points[next],obstacles))continue;
   const cost=current.cost+manhattan(points[index],points[next])+(direction&&direction!==nextDirection?TURN_COST:0),priority=cost+manhattan(points[next],end),state=next*3+nextDirection;
   if(priority>=budget||cost>=(costs.get(state)??Infinity))continue;
   costs.set(state,cost);parents.set(state,current.state);pushHeap(heap,{state,cost,priority});
  }
 }
 return null;
}
function simplify(points){
 const out=[];
 for(const point of points){
  if(out.length&&manhattan(out.at(-1),point)<.001)continue;
  while(out.length>1){const a=out.at(-2),b=out.at(-1);if(Math.abs(a.x-b.x)<.001&&Math.abs(b.x-point.x)<.001||Math.abs(a.y-b.y)<.001&&Math.abs(b.y-point.y)<.001)out.pop();else break;}
  out.push(point);
 }
 return out;
}
function roundedPath(points){
 const n=value=>Number(value.toFixed(2)),point=p=>`${n(p.x)} ${n(p.y)}`;
 let d=`M ${point(points[0])}`;
 for(let i=1;i<points.length-1;i++){
  const before=points[i-1],corner=points[i],after=points[i+1],radius=Math.min(6,manhattan(before,corner)/2,manhattan(corner,after)/2);
  const inLength=manhattan(before,corner),outLength=manhattan(corner,after);
  const approach={x:corner.x+(before.x-corner.x)*radius/inLength,y:corner.y+(before.y-corner.y)*radius/inLength};
  const departure={x:corner.x+(after.x-corner.x)*radius/outLength,y:corner.y+(after.y-corner.y)*radius/outLength};
  d+=` L ${point(approach)} Q ${point(corner)} ${point(departure)}`;
 }
 return `${d} L ${point(points.at(-1))}`;
}

/** Route real on-page dependencies through measured free space, in SVG pixels. */
export function routeAtlasConnections(layout,rects,{width,height}={}){
 if(!(width>0&&height>0)||!Number.isFinite(width+height))return[];
 const entries=rects instanceof Map?[...rects]:Object.entries(rects||{}),valid=new Map(entries.filter(([,rect])=>validRect(rect?.bounds)&&validRect(rect?.icon)));
 const obstacles=[...valid.values()].map(rect=>padded(rect.bounds)),routes=[];
 for(const edge of layout?.edges||[]){
  const from=valid.get(edge.from),to=valid.get(edge.to);if(!from||!to||edge.from===edge.to)continue;
  const candidates=ports(from,width,height).flatMap(source=>ports(to,width,height).map(target=>({source,target,distance:manhattan(source.point,source.outer)+manhattan(source.outer,target.outer)+manhattan(target.outer,target.point)}))).sort((a,b)=>a.distance-b.distance);
  let best=null;
  for(const{source,target,distance}of candidates){
   if(distance>=(best?.cost??Infinity))continue;
   const stubCost=manhattan(source.point,source.outer)+manhattan(target.outer,target.point),path=gridPath(source.outer,target.outer,obstacles,width,height,(best?.cost??Infinity)-stubCost);
   if(!path)continue;
   const cost=path.cost+stubCost;if(cost>=(best?.cost??Infinity))continue;
   best={cost,points:simplify([source.point,source.outer,...path.points,target.outer,target.point])};
  }
  if(best)routes.push({from:edge.from,to:edge.to,d:roundedPath(best.points),points:best.points});
 }
 return routes;
}
