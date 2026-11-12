import * as M from './model.js?v=140';
import * as B from './basic-attacks.js?v=129';
import {skillWeaponCompatible} from './skill-weapon-rules.js?v=129';
import {ACTIVE_SKILL_LABELS,DODGE_LABEL} from './scene-input.js?v=108';

const catalogGroups=[
 ['active','主動',['damage','movement','curse','basic']],
 ['summon','召喚',['summon']],
 ['aura','光環',['aura']],
 ['warcry','戰吼',['warcry']],
 ['passive','被動',['passive']]
];

export function skillCatalog(c,known=M.availableSkills(c)){
 const passives=Object.entries(c.talents||{}).filter(([,rank])=>rank>0).map(([id,rank])=>{const node=M.skillNode(c.cls,id);return node&&!node.ability&&!node.basicAttack?{...node,level:rank,category:'passive',description:(node.mechanicSummary||[node.desc||'被動增益']).join(' · ')}:null;}).filter(Boolean);
 return [...known.map(id=>({...M.abilityFor(c,id),category:M.skillCategory(id)})),...B.basicAttackOptions(c).map(d=>({...B.effectiveBasicAttack(c,d.id),category:'basic',icon:d.requiresShield?'shield':d.tag==='spell'?'rune':'sword'})),...passives];
}

export function skillConfigurationMarkup({hero:c,game:g,target=null,icon,esc,costText,summary,incrementReason}){
 const known=M.availableSkills(c),slots=M.skillLoadout(c),movement=M.movementSkill(c),selectedAuras=M.auraLoadout(c),plan=M.summonPlan(c,g.s),basicIds=B.basicLoadout(c);
 const all=skillCatalog(c,known);
 const names={basic:'普攻',damage:'傷害',movement:'位移',summon:'召喚',aura:'光環',curse:'詛咒',warcry:'戰吼',passive:'被動'};
 function assigned(id){return basicIds.includes(id)?'普攻 '+(basicIds.indexOf(id)+1):slots.includes(id)?ACTIVE_SKILL_LABELS[slots.indexOf(id)]:id===movement?DODGE_LABEL:selectedAuras.includes(id)?'啟用':plan.rows.find(r=>r.id===id)?.count?plan.rows.find(r=>r.id===id).count+' 隻':'';}
 function tile(d,action='',extra='',disabled=false){const support=d.summon?.support,label=support?d.summon.role+' · '+Math.round(support.strength*100)+'%':(names[d.category]||'')+' · Lv.'+(d.level||d.rank||1);return `<${action?'button':'article'} class="compact-skill-tile ${assigned(d.id)?'is-equipped':''}" ${action} ${disabled?'disabled':''} title="${esc(d.name+' · '+summary(d))}" ${action?`aria-label="${esc(d.name+'，'+(assigned(d.id)||names[d.category]||''))}"`:''}><span class="compact-skill-icon" style="color:${d.color||'#b9cce5'}">${icon(d.icon)}</span><b>${esc(d.name)}</b><small>${esc(label)}</small>${extra||`<em>${assigned(d.id)||' '}</em>`}</${action?'button':'article'}>`;}
 function grid(defs,action,picker=false){return `<div class="compact-skill-grid">${defs.map(d=>tile(d,action(d),'',picker&&(d.category==='basic'?!B.basicAttackCompatible(c,d.id):!skillWeaponCompatible(c,d)))).join('')||'<p class="compact-skills-empty">尚無適用技能</p>'}</div>`;}
 const targets=[...ACTIVE_SKILL_LABELS.map((label,i)=>['active:'+i,label,slots[i]]),['active:movement',DODGE_LABEL,movement]];
 let content=`<section id="skill-section-active"><div class="compact-config-row"><b>快捷技能</b></div><div class="compact-targets">${targets.map(([key,label,id])=>`<button data-config-target="${key}" aria-pressed="${target===key}" class="${target===key?'selected':''}"><kbd>${label}</kbd>${icon(id?M.ABILITIES[id].icon:key.endsWith('movement')?'wind':'plus')}<b>${id?M.ABILITIES[id].name:key.endsWith('movement')?'閃避':'配置技能'}</b></button>`).join('')}</div>`;
 if(target?.startsWith('active:')){const eligible=all.filter(d=>target==='active:movement'?d.category==='movement':['damage','curse','warcry'].includes(d.category));content+=`<div class="compact-config-row"><b>${targets.find(t=>t[0]===target)?.[1]||''} · 選擇技能</b><button class="compact-text-action" data-assign-skill="">清空</button></div>${grid(eligible,d=>`data-assign-skill="${d.id}"`,true)}`;}
 content+='</section>';
 content+=`<section id="skill-section-basic"><div class="compact-config-row"><b>普攻技能 <small>輪替 · 攻速加成</small></b><span>${basicIds.filter(Boolean).length}／${basicIds.length}</span><label class="compact-auto-toggle"><input type="checkbox" data-auto-enabled ${c.autoEnabled!==false?'checked':''}>自動普攻</label></div><div class="compact-targets basic-targets">${basicIds.map((id,i)=>`<button data-config-target="basic:${i}" aria-pressed="${target==='basic:'+i}" class="${target==='basic:'+i?'selected':''}"><kbd>${i+1}</kbd>${icon(id?(B.BASIC_ATTACKS[id].tag==='spell'?'rune':'sword'):'plus')}<b>${id?B.BASIC_ATTACKS[id].name:'配置普攻'}</b></button>`).join('')}</div>`;
 if(target?.startsWith('basic:'))content+=`<div class="compact-config-row"><b>普攻 ${Number(target.split(':')[1])+1} · 選擇技能</b><button class="compact-text-action" data-assign-basic="">清空</button></div>${grid(all.filter(d=>d.category==='basic'),d=>`data-assign-basic="${d.id}"`,true)}`;
 content+='</section>';
 const armyState=g.actionAvailability('summon',{ignorePause:true});
 content+=`<section id="skill-section-summon"><div class="compact-config-row"><b>召喚</b><span class="compact-family-summary">容量 <b>${plan.count}／${plan.capacity}</b><span>重召 ${costText(g.summonResourceCost())}</span><span>存活 ${(g.summons||[]).length}</span></span></div><div class="compact-skill-grid">${all.filter(d=>d.category==='summon').map(d=>{const cost=M.summonUnitResourceCost(d,g.s),row=plan.rows.find(r=>r.id===d.id)||{id:d.id,count:0,limit:d.summon.count,capacityCost:d.summon.capacityCost??1,unitResourceCost:cost,unitMana:cost.mana,unitLife:cost.life},reason=incrementReason(plan,row);return tile(d,'',`<small>${costText(cost)}／隻 · 上限 ${row.limit}${row.capacityCost>1?' · 容量 '+row.capacityCost:''}</small><div class="compact-summon-stepper"><button data-summon-step="${d.id}" data-count="${row.count-1}" ${row.count?'':'disabled'} aria-label="減少${d.name}">−</button><output>${row.count}</output><button data-summon-step="${d.id}" data-count="${row.count+1}" ${reason?'disabled':''} title="${esc(reason||'增加1名')}" aria-label="增加${d.name}">＋</button></div>`);}).join('')||'<p class="compact-skills-empty">尚無召喚技能</p>'}</div>${known.some(id=>M.skillCategory(id)==='summon')?`<p class="compact-skills-note ${armyState.usable?'':'blocked'}">${armyState.usable?'C 重召整隊':esc(armyState.reason)}</p>`:''}</section>`;
 const drain=selectedAuras.reduce((n,id)=>{const cost=g.auraResourceCost(id);n.mana+=cost.mana;n.life+=cost.life;return n;},{mana:0,life:0,rage:0});
 content+=`<section id="skill-section-aura"><div class="compact-config-row"><b>光環</b><span class="compact-family-summary">啟用 <b>${selectedAuras.filter(id=>g.auraIds.has(id)).length}</b><span>${costText(drain)}／秒</span></span></div><div class="compact-skill-grid">${all.filter(d=>d.category==='aura').map(d=>tile(d,`data-toggle-aura="${d.id}" aria-pressed="${selectedAuras.includes(d.id)}"`,`<small>${costText(g.auraResourceCost(d))}／秒</small><em>${selectedAuras.includes(d.id)?'✓ 啟用':'關閉'}</em>`)).join('')||'<p class="compact-skills-empty">尚無光環技能</p>'}</div></section>`;
 const openDetails=d=>`data-view-skill="${d.id}" aria-haspopup="dialog" aria-controls="skill-catalog-dialog"`;
 const grouped=catalogGroups.map(([id,label,categories])=>{
  const entries=all.filter(d=>categories.includes(d.category));
  return entries.length?`<section class="skill-catalog-group" aria-labelledby="skill-group-${id}"><h3 id="skill-group-${id}">${label} <small>${entries.length}</small></h3>${grid(entries,openDetails)}</section>`:'';
 }).join('');
 content+=`<section id="skill-section-all" aria-labelledby="skill-catalog-heading"><div class="compact-config-row"><h2 id="skill-catalog-heading">所有技能</h2><span>${all.length}</span></div>${grouped||'<p class="compact-skills-empty">尚無可查看的技能</p>'}</section>`;
 return `<section class="compact-skills">${content}</section>`;
}
