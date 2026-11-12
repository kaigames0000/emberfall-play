import {chapterDefinition} from './chapter-data.js?v=108';
import {equipmentDropBand} from './campaign-rules.js?v=108';
export function campaignContext({runId,difficulty=1,chapter=1,room=0,seed=''}){if(!chapterDefinition(chapter)?.available||![1,2,3].includes(difficulty)||!Number.isInteger(room)||room<0||room>7)throw Error('遭遇上下文無效');return {kind:'campaign',runId:String(runId||seed||'campaign'),difficulty,chapter,room,seed:String(seed)};}
export function contextBand(context,baseBand){if(context?.kind==='endgame'){if(context.difficulty!==3||context.chapter!==3)throw Error('終局區域無效');return {min:context.room>=3?97:96,max:context.room>=3?99:98,monsterLevel:context.room>=3?99:97,chapter:3};}return baseBand;}

export function lootLevelBand(difficulty,room,chapter,context){
 if(context?.kind==='endgame')return contextBand({...context,room});
 return equipmentDropBand(difficulty,context?.kind==='rift'?4+Number(room):room,chapter);
}
