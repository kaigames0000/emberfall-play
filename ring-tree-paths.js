import {routeAtlasConnections} from './skill-tree-layout.js?v=108';
import {ringNodeRadius,segmentDistance} from './ring-tree-geometry.js?v=108';
export {ringNodeRadius};
const cache=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function clear(points,nodes,a,b){
 for(const n of nodes){
  if(n.id===a||n.id===b)continue;
  for(let i=1;i<points.length;i++)if(segmentDistance(n,points[i-1],points[i])<n.clearance)return false;
 }
 return true;
}
function line(a,b){
 const length=distance(a,b),ux=(b.x-a.x)/length,uy=(b.y-a.y)/length,start=ringNodeRadius(a)+2,end=ringNodeRadius(b)+2;
 const points=[{x:a.x+ux*start,y:a.y+uy*start},{x:b.x-ux*end,y:b.y-uy*end}];
 return {points,d:points.map((p,i)=>(i?'L ':'M ')+Number(p.x.toFixed(2))+' '+Number(p.y.toFixed(2))).join(' ')};
}
function detour(a,b,nodes){
 const margin=210,left=Math.min(a.x,b.x)-margin,top=Math.min(a.y,b.y)-margin,width=Math.abs(a.x-b.x)+margin*2,height=Math.abs(a.y-b.y)+margin*2;
 const nearby=nodes.filter(n=>n.x+n.clearance>left&&n.x-n.clearance<left+width&&n.y+n.clearance>top&&n.y-n.clearance<top+height);
 const rects=new Map(nearby.map(n=>{const r=n.radius+2,x=n.x-left,y=n.y-top,rect={left:x-r,top:y-r,right:x+r,bottom:y+r};return [n.id,{bounds:rect,icon:rect}];}));
 const routed=routeAtlasConnections({edges:[{from:a.id,to:b.id}]},rects,{width,height})[0];
 if(!routed)return null;
 const points=routed.points.map(p=>({x:p.x+left,y:p.y+top}));
 for(const [index,node]of [[0,a],[points.length-1,b]]){
  const p=points[index],length=distance(p,node),r=ringNodeRadius(node)+2;
  points[index]={x:node.x+(p.x-node.x)*r/length,y:node.y+(p.y-node.y)*r/length};
 }
 // Keep the tested obstacle-free polyline, without rounding into a tight gap.
 const d=points.map((p,i)=>`${i?'L':'M'} ${Number(p.x.toFixed(2))} ${Number(p.y.toFixed(2))}`).join(' ');
 return {points,d};
}


/** Visible routes are cached; the center links only support historical save validation. */
export function routeRingConnections(tree){
 if(cache.has(tree))return cache.get(tree);
 const nodes=tree.nodes.map(n=>({...n,radius:ringNodeRadius(n),clearance:ringNodeRadius(n)+6})),routes=[];
 for(const edge of tree.edges){
  if(edge.a===tree.root||edge.b===tree.root)continue;
  const a=tree.byId[edge.a],b=tree.byId[edge.b];let path=line(a,b);
  if(!clear(path.points,nodes,a.id,b.id))path=detour(a,b,nodes);
  if(!path||!clear(path.points,nodes,a.id,b.id))throw new Error('Cannot route talent connection '+a.id+' → '+b.id);
  routes.push({...edge,...path});
 }
 cache.set(tree,routes);return routes;
}
