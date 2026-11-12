import {ringNodeRadius,segmentDistance} from './ring-tree-geometry.js?v=108';
const TAU=Math.PI*2,FIRST_RADIUS=230,STARTER_RADIUS=160,STEP_DISTANCE=96,BRANCH_RADIUS=65;
const angleFor=(sector,sectorCount)=>-Math.PI/2+TAU*(sector+.5)/sectorCount;
function placeOnCircle(node,radius,angle){
 node.x=radius*Math.cos(angle);
 node.y=radius*Math.sin(angle);
}
function position(node,sectorCount,radial,tangent=0){
 const angle=angleFor(node.sector,sectorCount),cos=Math.cos(angle),sin=Math.sin(angle);
 node.x=Math.round(cos*radial-sin*tangent);
 node.y=Math.round(sin*radial+cos*tangent);
}

/** Fill the existing wedges with short optional loops, leaving the main routes intact. */
export function placeTalentRoutes(nodes,byId,sectorCount,{currentLayout=false}={}){
 const core=nodes.filter(n=>!n.expansion&&!n.bridge&&!n.outerPosition);
 placeCoreTalentRoutes(core,byId,sectorCount,currentLayout);
 const placed=new Set(core),edges=nodes.flatMap(n=>n.neighbors
  .filter(id=>n.id<id&&(!currentLayout||n.id!=='root'&&id!=='root')).map(id=>[n,byId[id]]));
 for(const node of nodes.filter(n=>n.bridge)){
  const ends=node.neighbors.map(id=>byId[id]);node.x=Math.round((ends[0].x+ends[1].x)/2);node.y=Math.round((ends[0].y+ends[1].y)/2);placed.add(node);
 }
 const outer=nodes.filter(n=>n.outerPosition);
 if(currentLayout)for(const node of outer){
  position(node,sectorCount,...node.outerPosition);
  placed.add(node);
 }
 const groups=new Map();
 for(const node of nodes.filter(n=>n.expansion)){const id=node.sector+':'+node.pocket;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(node);}
 function overlap(a,b,c,d){
  const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,lu=Math.hypot(ux,uy),lv=Math.hypot(vx,vy);
  if(Math.abs((ux*vy-uy*vx)/(lu*lv))>.13)return false;
  const t=((c.x-a.x)*ux+(c.y-a.y)*uy)/(lu*lu),q=((d.x-a.x)*ux+(d.y-a.y)*uy)/(lu*lu),length=(Math.min(1,Math.max(t,q))-Math.max(0,Math.min(t,q)))*lu;
  return length>12&&Math.min(segmentDistance(c,a,b),segmentDistance(d,a,b),segmentDistance(a,c,d),segmentDistance(b,c,d))<3;
 }
 for(const group of groups.values()){
  const first=group[0],anchor=byId[first.neighbors.find(id=>byId[id].routeStep)],angle=-Math.PI/2+TAU*(first.sector+.5)/sectorCount,cos=Math.cos(angle),sin=Math.sin(angle),radial=FIRST_RADIUS+(first.anchorStep-1)*STEP_DISTANCE;
  const local=new Set(group),activeEdges=edges.filter(([a,b])=>placed.has(a)&&placed.has(b)),newEdges=edges.filter(([a,b])=>(local.has(a)||local.has(b))&&(placed.has(a)||local.has(a))&&(placed.has(b)||local.has(b)));
  let found=false;const rejects=new Map();const reject=why=>rejects.set(why,(rejects.get(why)||0)+1);
  const tries=[100,130,160,190,220,250,280,70,310,340].flatMap(distance=>[first.pocket%2?-1:1,first.pocket%2?1:-1].flatMap(direction=>[0,-20,20,-40,40,-60,60].map(shift=>[distance,direction,shift])));
  candidates:for(const [distance,direction,shift]of tries){
   for(const [i,node]of group.entries()){
    const t=group.length===1?.5:i/(group.length-1),r=radial+shift+STEP_DISTANCE*t,tangent=direction*(distance+Math.sin(t*Math.PI)*42);
    node.x=Math.round(cos*r-sin*tangent);node.y=Math.round(sin*r+cos*tangent);
   }
   const all=[...placed,...group];
   for(const node of group){
    if(Math.hypot(node.x,node.y)>1937){reject('bounds');continue candidates;}
    for(const other of all)if(other!==node&&Math.hypot(node.x-other.x,node.y-other.y)<ringNodeRadius(node)+ringNodeRadius(other)+8){reject('node '+other.id);continue candidates;}
    for(const [a,b]of activeEdges)if(segmentDistance(node,a,b)<ringNodeRadius(node)+6){reject('oldedge '+a.id+' '+b.id);continue candidates;}
   }
   for(const [i,[a,b]]of newEdges.entries()){
    for(const other of all)if(other!==a&&other!==b&&segmentDistance(other,a,b)<ringNodeRadius(other)+6){reject('newedge through '+other.id);continue candidates;}
    for(const [c,d]of [...activeEdges,...newEdges.slice(0,i)])if(overlap(a,b,c,d)||currentLayout&&crosses(a,b,c,d)){
     reject('intersects '+c.id+' '+d.id);continue candidates;
    }
   }
   found=true;break candidates;
  }
  if(!found)throw new Error('No clear talent pocket: '+first.sector+':'+first.pocket+' near '+anchor?.id+' '+JSON.stringify([...rejects].sort((a,b)=>b[1]-a[1]).slice(0,10)));
  for(const node of group)placed.add(node);
 }
 if(!currentLayout)for(const node of outer)position(node,sectorCount,...node.outerPosition);
 return Math.ceil(Math.max(...nodes.map(n=>Math.hypot(n.x,n.y)))+63);
}

/** Keep radial progress separate from optional skills so every link can be straight. */
function crosses(a,b,c,d){
 const side=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 return side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0;
}

function placeCoreTalentRoutes(nodes,byId,sectorCount,currentLayout){
 const radiusFor=step=>FIRST_RADIUS+(step-1)*STEP_DISTANCE;
 for(const node of nodes)if(node.routeStep){
  if(currentLayout&&node.routeStep===1)placeOnCircle(node,FIRST_RADIUS,angleFor(node.sector,sectorCount));
  else position(node,sectorCount,radiusFor(node.routeStep));
 }
 for(const node of nodes)if(node.bypassStep)position(node,sectorCount,radiusFor(node.bypassStep)-(currentLayout?STEP_DISTANCE/2:0),75);
 const branches=new Map();
 for(const node of nodes){
  if(node.kind==='root'||node.routeStep||node.bypassStep)continue;
  const anchor=node.neighbors.map(id=>byId[id]).find(n=>n.routeStep);
  if(!anchor)throw new Error('Missing talent anchor: '+node.id);
  if(!branches.has(anchor.id))branches.set(anchor.id,[]);
  branches.get(anchor.id).push(node);
 }
 const starterNodes=[];
 for(const [id,group]of branches){
  const anchor=byId[id],starters=group.filter(n=>n.neighbors.includes('root'));
  if(currentLayout)starterNodes.push(...starters);
  else for(const [i,node]of starters.entries()){
   const angle=angleFor(node.sector,sectorCount)+(starters.length===1?.21:(i-(starters.length-1)/2)*.36);
   node.x=Math.round(Math.cos(angle)*STARTER_RADIUS);node.y=Math.round(Math.sin(angle)*STARTER_RADIUS);
  }
  const leaves=group.filter(n=>!starters.includes(n));
  for(const [i,node]of leaves.entries()){
   const angle=[-Math.PI/3,Math.PI/3,-2*Math.PI/3,2*Math.PI/3][i%4],spread=BRANCH_RADIUS+Math.floor(i/4)*60;
   position(node,sectorCount,radiusFor(anchor.routeStep)+Math.cos(angle)*spread,Math.sin(angle)*spread);
  }
 }
 // Rotate the inner circle so the starting branches keep clear of neighboring links.
 const starterPhase=-66*Math.PI/180;
 starterNodes.sort((a,b)=>a.sector-b.sector).forEach((node,i)=>
  placeOnCircle(node,STARTER_RADIUS,starterPhase+TAU*i/starterNodes.length));
 // Resolve crowded pockets locally instead of stretching every outer route.
 // The immutable graph keeps the same connections and point requirements.
 const present=new Set(nodes.map(n=>n.id));
 const edges=nodes.flatMap(node=>node.neighbors.filter(id=>present.has(id)&&node.id<id).map(id=>[node,byId[id]]));
 const leaves=nodes.filter(node=>node.kind!=='root'&&!node.routeStep&&!node.bypassStep&&!node.neighbors.includes('root'));
 function crowded(node){
  const radius=ringNodeRadius(node);
  for(const other of nodes)if(other!==node&&Math.hypot(node.x-other.x,node.y-other.y)<radius+ringNodeRadius(other)+8)return true;
  for(const [a,b]of edges){
   if(a!==node&&b!==node){if(segmentDistance(node,a,b)<radius+6)return true;}
   else for(const other of nodes)if(other!==a&&other!==b&&segmentDistance(other,a,b)<ringNodeRadius(other)+6)return true;
  }
  return false;
 }
 for(let pass=0;pass<3;pass++){
  let moved=false;
  for(const node of leaves){
   if(!crowded(node))continue;
   const anchor=node.neighbors.map(id=>byId[id]).find(other=>other.routeStep),original={x:node.x,y:node.y},candidates=[];
   for(const spread of [65,78,90,104])for(const degrees of [-60,60,-120,120,-45,45,-135,135,-80,80,-100,100]){
    const angle=degrees*Math.PI/180;position(node,sectorCount,radiusFor(anchor.routeStep)+Math.cos(angle)*spread,Math.sin(angle)*spread);
    candidates.push({x:node.x,y:node.y,distance:(node.x-original.x)**2+(node.y-original.y)**2});
   }
   Object.assign(node,original);
   for(const candidate of candidates.sort((a,b)=>a.distance-b.distance)){
    node.x=candidate.x;node.y=candidate.y;
    if(!crowded(node)){moved=true;break;}
    Object.assign(node,original);
   }
  }
  if(!moved)break;
 }
 return Math.ceil(Math.max(...nodes.map(n=>Math.hypot(n.x,n.y)))+63);
}
