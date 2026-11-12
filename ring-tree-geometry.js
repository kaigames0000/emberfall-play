export const ringNodeRadius=node=>node.kind==='root'?30:node.major?23:node.medium?14.5:node.kind==='passive'?7.5:node.kind==='survival'?12.5:17;

export function segmentDistance(point,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length)):0;
 return Math.hypot(point.x-a.x-dx*t,point.y-a.y-dy*t);
}
