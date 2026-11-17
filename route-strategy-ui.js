import {ABBEY_ENCOUNTERS,ROOM_TYPES,ROUTE_TRACKS,routeChoices,routeNode} from './route-model.js?v=158';
import {escapeHtml as esc} from './ui-controls.js?v=152';
import {ALL_MINIBOSSES} from './chapter-data.js?v=108';
import {EXPANDED_MINIBOSSES} from './campaign-expansion-enemies.js?v=158';

const rewards={
 normal:'一般戰鬥掉落',elite:'裝備掉落 ×1.15',welfare:'掉落 ×1.35 · 稀有度 +20%',
 mystery:'恩惠或追咒',recovery:'生命、魔力與藥水補滿',treasure:'藍裝保底 · 鍛造材料',
 trial:'掉落 ×1.4 · 稀有度 +25%',miniboss:'黃裝保底 · 鍛造材料',boss:'黃裝保底 · 君王印記'
};

export function roomPreviewLabel(node) {
 const encounter=ABBEY_ENCOUNTERS[node.encounter];
 return encounter?.label||(node.track?ROUTE_TRACKS[node.track]+' · ':'')+ROOM_TYPES[node.type].label;
}

export function routePlanMarkup(graph,id,expedition,riskText='') {
 const node=routeNode(graph,id);
 if(!node)return '';
 const encounter=ABBEY_ENCOUNTERS[node.encounter],connections=routeChoices(graph,id);
 const earned=expedition.path
  .filter(step=>expedition.clearedNodes.has(step))
  .map(step=>ABBEY_ENCOUNTERS[routeNode(graph,step)?.encounter]?.boon)
  .filter(Boolean);
 const next=connections.map(nextNode=>roomPreviewLabel(nextNode)).join(' ／ ');
 const waves=node.waves&&(!encounter||node.type==='boss')?` · ${node.waves} 波`:'';
 const summary=graph.routeVersion===3&&node.waves>0&&!encounter&&!node.bossKey?ROOM_TYPES[node.type].desc.replace(/[1-4] 波/,node.waves+' 波'):ROOM_TYPES[node.type].desc;
 const challenge=node.encounter==='abbey-seals'?
  ['','', '盾衛會攔截進路。','召援與火線各有一座祭壇。'][graph.difficulty]:'';
 return `<div class="route-plan-main"><strong>${esc(node.name+waves)}</strong>
 <p>${esc((encounter?.goal||riskText||EXPANDED_MINIBOSSES[node.bossKey]?.desc||ALL_MINIBOSSES[node.bossKey]?.desc||summary)+challenge)}</p></div>
 <div class="route-plan-path"><p><b>收益</b> ${esc(encounter?.loot||rewards[node.type])}${encounter?.boon?' · '+esc(encounter.boon):''}${node.campfire?' · 戰後可在營火休息並存下進度':''}</p>
 ${next?`<p><b>下一層</b> ${esc(next)}</p>`:''}
 ${earned.length?`<p class="route-plan-boon"><b>已取得</b> ${esc(earned.join(' ／ '))}</p>`:''}</div>`;
}
