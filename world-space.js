export const ROOM_SCALE=1.45;
export const LEGACY_BOUNDS={left:76,top:126,right:1044,bottom:728};
export const expandPoint=(x,y,scale=ROOM_SCALE)=>({x:560+(x-560)*scale,y:430+(y-430)*scale});
export function expandedBounds(scale=ROOM_SCALE){const a=expandPoint(76,126,scale),b=expandPoint(1044,728,scale);return {left:a.x,top:a.y,right:b.x,bottom:b.y};}
export function roomView(terrain){const s=terrain?.scale??1;return {left:560-560*s,top:430-430*s,width:1120*s,height:800*s};}
