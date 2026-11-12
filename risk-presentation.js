import {roomRiskPreview} from './expedition-risk.js?v=108';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function riskEntries(conditions){
 if(!conditions)return [];
 const entries=[...(conditions.modifiers||[]).map(m=>({...m,kind:'map'})),...(conditions.curses||[]).map(c=>({...c,kind:'curse',name:c.name+' · '+c.remaining+'房'}))];
 if(conditions.mystery)entries.push({...conditions.mystery,kind:conditions.mystery.kind==='boon'?'boon':'deferred',name:conditions.mystery.name+(conditions.mystery.kind==='curse'?' · 下2房':'')});
 return entries;
}
export function riskChips(conditions){return riskEntries(conditions).map(entry=>`<span class="risk-chip ${entry.kind}" title="${esc(entry.effect)}" aria-label="${esc(entry.name+'：'+entry.effect)}">${esc(entry.name)}</span>`).join('');}
export function routeCostText(graph,nodeID){return roomRiskPreview(graph,nodeID);}
