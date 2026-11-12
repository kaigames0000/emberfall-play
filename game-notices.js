const ITEM_LIMIT=3;
const ITEM_TIME=4300;
const LEVEL_TIME=3800;

export function createGameNotices(loot,level,actions){
 const document=loot.ownerDocument,items=new Map(),messages=new Map();
 let levelTimer=0,levelPoints=0,pointLabel='';

 function removeItem(key){
  const item=items.get(key);
  clearTimeout(item.timer);
  item.node.remove();
  items.delete(key);
 }

 function pickup(name,{rarity,color,count,rarityLabel}){
  const key=rarity+':'+rarityLabel+':'+name;
  let item=items.get(key);
  if(!item){
   if(items.size>=ITEM_LIMIT){
    const oldestLowest=[...items].reduce((lowest,entry)=>entry[1].rarity<lowest[1].rarity?entry:lowest);
    if(oldestLowest[1].rarity>rarity)return;
    removeItem(oldestLowest[0]);
   }
   const node=document.createElement('div'),label=document.createElement('span'),quantity=document.createElement('b');
   node.style.color=color;
   if(rarityLabel){
    const badge=document.createElement('small');
    badge.textContent=rarityLabel;
    node.append(badge);
   }
   label.textContent='＋ '+name;
   node.append(label,quantity);
   item={node,quantity,count:0,rarity};
   items.set(key,item);
  }else{
   clearTimeout(item.timer);
   items.delete(key);
   items.set(key,item);
  }
  item.count+=count;
  item.quantity.textContent=item.count>1?'×'+item.count:'';
  loot.append(item.node);
  item.timer=setTimeout(()=>removeItem(key),ITEM_TIME);
 }

 function levelUp(value,points,label){
  if(pointLabel!==label){pointLabel=label;levelPoints=0;}
  levelPoints+=points;
  const rank=document.createElement('b'),reward=document.createElement('span');
  rank.textContent='升等 Lv.'+value;
  reward.textContent=levelPoints?label+' +'+levelPoints:'';
  level.replaceChildren(rank,reward);
  clearTimeout(levelTimer);
  levelTimer=setTimeout(()=>{
   level.replaceChildren();
   levelPoints=0;
  },LEVEL_TIME);
 }

 function notice(message){
  if(messages.has(message))return;
  if(messages.size>=2)removeNotice(messages.keys().next().value);
  const node=document.createElement('div'),label=document.createElement('span');
  label.textContent=message;
  node.append(label);
  actions.append(node);
  messages.set(message,{node,timer:setTimeout(()=>removeNotice(message),LEVEL_TIME)});
 }

 function removeNotice(message){
  const {node,timer}=messages.get(message);
  clearTimeout(timer);
  node.remove();
  messages.delete(message);
 }

 return {pickup,levelUp,notice};
}
