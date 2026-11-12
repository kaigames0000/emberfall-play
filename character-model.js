import {drawBplusHero} from './bplus-hero.js?v=127';
import {resolveAppearance} from './character-appearance.js?v=108';
import {applyHeroBodyPose} from './hero-motion.js?v=127';
const PI=Math.PI;
function polygon(c,points,fill,stroke){c.beginPath();for(const [i,[x,y]] of points.entries())i?c.lineTo(x,y):c.moveTo(x,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function line(c,points,color,width=1){c.beginPath();for(const [i,[x,y]] of points.entries())i?c.lineTo(x,y):c.moveTo(x,y);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function diamond(c,x,y,r,color,stroke){polygon(c,[[x-r,y],[x,y-r*1.35],[x+r,y],[x,y+r*1.35]],color,stroke);}
// Weapons point along local +X; the actor's aim rotates this shared geometry.
export function paintWeapon(c,weapon){
 if(!weapon)return;const {type,color,trim,gem}=weapon;
 if(['sword','greatsword','dagger'].includes(type)){
  const length=type==='dagger'?20:type==='greatsword'?44:32,width=type==='greatsword'?4.5:type==='dagger'?2.4:3;
  line(c,[[-5,0],[6,0]],'#70583e',3);line(c,[[5,-6],[5,6]],trim,2.5);polygon(c,[[7,-width],[length-6,-width],[length,0],[length-6,width],[7,width]],color,trim);line(c,[[10,0],[length-4,0]],'#f0f0da');
 }else if(type==='axe'||type==='greataxe'){
  const length=type==='greataxe'?38:27;line(c,[[-6,0],[length+3,0]],'#9b7c54',3);
  polygon(c,[[length-8,-2],[length-11,-12],[length+4,-15],[length+10,-6],[length+5,-2]],'#bfc4bf',trim);
  if(type==='greataxe')polygon(c,[[length-8,2],[length-11,12],[length+4,15],[length+10,6],[length+5,2]],'#bfc4bf',trim);
 }else if(type==='wand'||type==='staff'){
  const length=type==='staff'?43:24;line(c,[[type==='staff'?-13:-4,0],[length,0]],color,type==='staff'?3.5:2.5);line(c,[[length-11,-4],[length-5,4]],trim,2);diamond(c,length+2,0,type==='staff'?6:4,gem,'#e3dfdb');if(type==='staff'){line(c,[[length-7,-8],[length+6,-10]],trim,1.5);line(c,[[length-7,8],[length+6,10]],trim,1.5);}
 }else if(type==='bow'){
  c.beginPath();c.arc(-4,0,20,-PI/2,PI/2);c.strokeStyle=color;c.lineWidth=3;c.stroke();line(c,[[-4,-20],[-4,20]],'#d0cfb0');line(c,[[-11,0],[28,0]],'#d4d6b5',1.4);polygon(c,[[28,0],[21,-3],[21,3]],trim);
 }else if(type==='shield'||type==='towerShield'){
  const big=type==='towerShield',w=big?12:9,h=big?22:14;polygon(c,[[-w,-h],[0,-h-4],[w,-h],[w-1,h-5],[0,h+1],[-w+1,h-5]],'#566774',trim);polygon(c,[[-w+3,-h+4],[0,-h+1],[w-3,-h+4],[w-4,h-7],[0,h-3],[-w+4,h-7]],'#354956',trim);line(c,[[0,-h+5],[0,h-4]],trim,2);if(!big)circle(c,0,-1,4,'#8b9691',trim);
 }else if(type==='tome'){
  polygon(c,[[-13,-10],[-1,-13],[0,-9],[1,-13],[13,-10],[13,9],[1,6],[0,9],[-1,6],[-13,9]],'#d9d0b0',trim);line(c,[[0,-9],[0,8]],'#716b69',1.5);for(const side of [-1,1])for(const yy of [-5,0,5])line(c,[[side*3,yy],[side*10,yy+1]],'#8e839b',1);
 }else if(type==='quiver'){
  polygon(c,[[-7,-13],[7,-10],[6,17],[-6,15]],'#725e42',trim);for(const xx of [-4,0,4]){line(c,[[xx,0],[xx-3,-27]],'#c7b591',1.5);polygon(c,[[xx-3,-27],[xx-6,-31],[xx-1,-29]],trim);}
 }
}
function paintHead(c,v,back){
 const outline='#211d2a',bone=v.head==='bone',shaded=v.head==='shade',hair=v.hair||'#4d394e';
 const skin=bone?'#ded0b5':shaded?'#625067':'#eec4aa';
 polygon(c,[[-12,-39],[-9,-46],[6,-47],[12,-40],[12,-28],[7,-21],[-5,-21],[-12,-28]],back?hair:skin,outline);
 if(!back){
  polygon(c,[[-10,-34],[-5,-36],[-1,-27],[7,-27],[4,-23],[-5,-23],[-10,-28]],bone?'#a88e83':shaded?'#302735':'#d99887');
  c.fillStyle=v.eye||(bone?'#a04d61':'#302844');c.fillRect(-6,-34,4,5);c.fillRect(3,-34,4,5);
  c.fillStyle=shaded?'#ffc293':'#ffefe4';c.fillRect(-5,-34,2,2);c.fillRect(4,-34,2,2);
  c.fillStyle=bone?'#54404e':'#975e65';c.fillRect(bone?-3:1,-26,bone?8:4,2);
 }
 if(v.helmet==='hood'){
  polygon(c,[[-15,-28],[-16,-42],[-11,-50],[4,-54],[15,-47],[17,-34],[11,-27],[10,-40],[4,-45],[-6,-43],[-10,-29]],v.helmetColor,outline);
  polygon(c,[[-13,-43],[-8,-49],[4,-52],[11,-46],[0,-48],[-8,-43]],v.helmetTrim);
 }else if(['visor','horns','crown'].includes(v.helmet)){
  polygon(c,[[-13,-25],[-15,-43],[-9,-50],[8,-50],[15,-42],[13,-25],[7,-20],[-7,-20]],v.helmetColor,outline);
  polygon(c,[[-11,-42],[-7,-47],[7,-47],[12,-42],[5,-44],[-6,-42]],v.helmetTrim);
  if(!back){
   polygon(c,[[-12,-37],[12,-37],[9,-30],[2,-30],[0,-25],[-2,-30],[-9,-30]],'#211c2a');
   line(c,[[-7,-34],[-3,-34]],v.eye||'#e7d1b0',2);line(c,[[3,-34],[7,-34]],v.eye||'#e7d1b0',2);
   line(c,[[0,-47],[0,-39]],v.helmetTrim,2);
  }
  if(v.helmet==='crown')polygon(c,[[-13,-43],[-18,-62],[-8,-56],[-4,-64],[0,-56],[7,-65],[10,-54],[18,-60],[13,-43]],'#c99360',outline);
  if(v.helmet==='horns')for(const side of [-1,1])polygon(c,[[side*9,-45],[side*20,-60],[side*19,-45],[side*12,-35]],'#e0bb91',outline);
 }else if(v.helmet==='hat'){
  polygon(c,[[-20,-39],[-11,-43],[-4,-59],[3,-64],[13,-57],[8,-54],[13,-43],[20,-40],[19,-36],[-16,-35]],v.helmetColor,outline);
  polygon(c,[[-12,-42],[-7,-47],[10,-47],[13,-42]],v.helmetTrim);diamond(c,1,-44,3,'#b5e4f4',outline);
 }else if(v.helmet==='cap'){
  polygon(c,[[-15,-38],[-12,-46],[-4,-51],[9,-50],[15,-43],[18,-39],[13,-34],[-13,-34]],v.helmetColor,outline);
  line(c,[[-12,-37],[15,-37]],v.helmetTrim,3);
 }else if(!bone){
  polygon(c,[[-13,-34],[-15,-41],[-21,-44],[-13,-47],[-17,-53],[-6,-50],[-4,-56],[5,-51],[10,-54],[12,-48],[18,-46],[14,-42],[15,-34],[11,-28],[10,-37],[6,-42],[2,-36],[-2,-42],[-7,-33],[-8,-41]],hair,outline);
  polygon(c,[[-14,-46],[-6,-47],[-5,-51],[4,-48],[11,-49],[9,-45],[2,-44],[-3,-46],[-9,-40]],v.hairLight||'#826170');
  if(back)polygon(c,[[-11,-37],[11,-40],[9,-26],[4,-22],[-4,-23],[-12,-28]],hair);
 }
}
export function drawCharacter(c,v,{x=0,y=0,angle=.35,time=0,moving=false,scale=1,alpha=1,pose}={}){
 const facing=Math.cos(angle)<-.001?-1:1,back=Math.sin(angle)<-.45,aim=facing<0?PI-angle:angle,step=moving?Math.sin(time*9)*3.8:0;
 c.save();c.translate(x,y);c.scale(scale,scale);c.globalAlpha*=alpha;c.lineJoin='round';c.lineCap='round';c.scale(facing,1);
 c.save();c.scale(1,.35);circle(c,0,27,24,'rgba(0,0,0,.4)');c.restore();
 applyHeroBodyPose(c,pose);
 if(v.cloak.visible){polygon(c,[[-9,-26],[-15,-18],[-22,13],[0,21],[22,13],[15,-18],[9,-26]],v.cloak.color,v.cloak.trim);line(c,[[-6,-14],[-11,12]],v.dark,2);line(c,[[6,-14],[11,12]],v.dark,2);}
 if(v.off?.type==='quiver'){c.save();c.translate(-15,-18);c.rotate(-.25);paintWeapon(c,v.off);c.restore();}
 line(c,[[-6,3],[-7,14+step]],v.dark,6);line(c,[[6,3],[7,14-step]],v.dark,6);line(c,[[-7,13+step],[-10,17+step]],v.boots,6);line(c,[[7,13-step],[11,17-step]],v.boots,6);
 const heavy=v.armor==='heavy',robe=v.armor==='robe',medium=v.armor==='medium';
 const outline=medium?[[-10,-23],[-15,-14],[-12,-2],[-17,15],[-5,12],[0,16],[5,12],[17,15],[12,-2],[15,-14],[10,-23]]:[[-9,-23],[-(heavy?17:12),-8],[-(robe?18:13),robe?15:7],[0,robe?20:13],[robe?18:13,robe?15:7],[heavy?17:12,-8],[9,-23]];
 polygon(c,outline,v.body,'#211d2a');
 polygon(c,[[-10,-18],[-3,-21],[8,-19],[7,-13],[-3,-10],[-9,-6]],v.cloth);
 line(c,[[-9,-20],[0,-22],[10,-20]],v.trim,2);
 if(heavy){polygon(c,[[-12,-19],[0,-23],[12,-19],[10,-5],[0,0],[-10,-5]],'#8b9699',v.trim);polygon(c,[[-12,-20],[-21,-16],[-19,-7],[-11,-9]],v.body,v.trim);polygon(c,[[12,-20],[21,-16],[19,-7],[11,-9]],v.body,v.trim);}
 else {line(c,[[0,-19],[0,9]],v.cloth,3);if(robe)for(const side of [-1,1])line(c,[[side*5,-4],[side*11,13]],v.trim,1);else if(medium){for(const side of [-1,1]){polygon(c,[[side*9,-21],[side*17,-17],[side*14,-10],[side*8,-13]],v.cloth,v.trim);line(c,[[side*6,4],[side*12,12]],v.trim,1);}}else line(c,[[-7,-17],[7,-3]],v.cloth,3);}
 line(c,[[-12,1],[12,1]],v.dark,4);polygon(c,[[-3,-1],[3,-1],[3,3],[-3,3]],v.trim);
 if(v.amulet){line(c,[[-5,-21],[0,-12],[5,-21]],v.trim);diamond(c,0,-11,2.5,v.trim);}
 line(c,[[-12,-16],[-17,-6]],v.body,6);line(c,[[12,-16],[17,-7]],v.body,6);circle(c,-17,-6,3,v.gloves);circle(c,17,-7,3,v.gloves);
 paintHead(c,v,back);
 if(!back&&v.helmet==='none'&&v.head!=='bone'){
  polygon(c,[[-12,-22],[-6,-24],[9,-23],[13,-18],[7,-14],[-9,-16]],v.cloth,'#262034');
  line(c,[[-7,-21],[7,-19]],v.trim,1.4);
 }
 if(v.off&&v.off.type!=='quiver'){c.save();c.translate(-19,-7);const support=['shield','towerShield','tome'].includes(v.off.type);c.rotate(['shield','towerShield'].includes(v.off.type)?aim*.12:support?aim-.2:aim+PI-.25);paintWeapon(c,v.off);c.restore();}
 if(v.main){c.save();c.translate(18,-8);c.rotate(aim);paintWeapon(c,v.main);c.restore();}
 c.restore();
}
export function drawHero(ctx,hero,options={}){
 if(options.alpha<=0)return;
 const visual=resolveAppearance(hero);
 if(!drawBplusHero(ctx,visual,options,paintWeapon))drawCharacter(ctx,visual,options);
}
export function paintHeroPreview(canvas,hero,{angle=.35}={}){
 const c=canvas.getContext('2d');if(!c)return;const width=canvas.width,height=canvas.height;c.clearRect(0,0,width,height);drawHero(c,hero,{x:width/2,y:height*.86,scale:Math.min(width/125,height/111),angle});
}
