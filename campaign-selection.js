import {pixelMapArt} from './pixel-map-art.js?v=108';
import {DIFFICULTIES,canDifficulty,canChapter,chapterDefinition,progressFor,equipmentDropBand} from './model.js?v=140';
import {HERO_RESISTANCE_PENALTY} from './elemental-rules.js?v=108';
import {HORDE_RULES,hordeDensity} from './horde-trial.js?v=108';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>Number((n*100).toFixed(1))+'%';
const threats={
 1:['標準攻擊節奏，先熟悉預警與走位。','敵人依種類具備不同抗性；一般狀態控制可正常運作。'],
 2:['敵人增加扇射與轉角後續，章節後段元素傷害提高；大型預警保留走位時間。','特定敵人與首領開始免疫冰凍或感電，元素抗性提高。'],
 3:['分道、留缺口環射與二段攻勢；後段元素重擊大幅扣血，終局以四種有效抗性75%為基準。','部分敵人會免疫對應元素傷害，需準備破免效果或其他傷害來源。']
};
const lockIcon='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5zM12 15v3"/></svg>';
export function difficultySelector(c){
 const selected=c.difficulty,d=DIFFICULTIES[selected]||DIFFICULTIES[1],penalty=HERO_RESISTANCE_PENALTY[selected]||0,normalDrop=d.loot.normal*HORDE_RULES.equipment;
 const description=`<p>${threats[selected]?.join(' ')||threats[1].join(' ')}</p><small>敵人從地圖各處分批增援，怪量依房型與樓層調整。掉裝為未加成基礎機率，裝等區間見下方卡片。</small>`;
 return `<section class="campaign-difficulty" aria-label="出發難度與差異"><nav class="expedition-difficulties" aria-label="出發難度">${[1,2,3].map(id=>{const rule=DIFFICULTIES[id],unlocked=canDifficulty(c,id);return `<button type="button" data-difficulty="${id}" class="${id===selected?'selected':''}" aria-pressed="${id===selected}" ${unlocked?'':'disabled'} title="${unlocked?'切換至'+rule.name:'完成上一難度全部章節後解鎖'} · 基礎生命×${rule.hp}／傷害×${rule.damage}">${unlocked?'':lockIcon}<span>${rule.name}</span><small>怪量 ×${hordeDensity(id)}</small></button>`;}).join('')}</nav><div class="difficulty-overview" data-difficulty-overview="${selected}"><dl><div><dt>敵人生命／傷害</dt><dd>×${d.hp}／×${d.damage}</dd></div><div><dt>每波怪量</dt><dd>×${hordeDensity(selected)}</dd></div><div><dt>玩家全元素抗性</dt><dd class="${penalty?'difficulty-penalty':''}">${penalty?'−'+Math.round(penalty*100)+' 百分點':'無額外懲罰'}</dd></div><div><dt>一般怪／菁英掉裝</dt><dd>${pct(normalDrop)}／${pct(d.loot.elite)}</dd></div></dl><div class="difficulty-description">${description}</div><details class="difficulty-disclosure"><summary>難度詳情</summary>${description}</details></div></section>`;
}

function chapterArt(id){
 return pixelMapArt(['abbey','port','court'][id-1],esc(chapterDefinition(id).name)+'場景示意');
}
export function chapterCards(c,selected){
 const descriptions={1:'殘破迴廊與禁術火海',2:'水道、棧橋與潮汐伏擊',3:'浮空平台、斷橋與冰雷交錯'};
 return `<div class="campaign-chapter-grid" role="group" aria-label="選擇大關卡">${[1,2,3].map(id=>{const chapter=chapterDefinition(id),unlocked=canChapter(c,c.difficulty,id),progress=progressFor(c,c.difficulty,id).length,first=equipmentDropBand(c.difficulty,0,id),last=equipmentDropBand(c.difficulty,7,id);return `<button type="button" data-chapter="${id}" class="campaign-chapter-card chapter-theme-${id} ${selected===id?'selected':''} ${unlocked?'':'locked'}" aria-pressed="${selected===id}" ${unlocked?'':'disabled'} title="${unlocked?'選擇'+chapter.name:'完成前一章後解鎖'}"><div class="chapter-card-picture">${chapterArt(id)}<span class="chapter-card-number">第${['','一','二','三'][id]}章</span>${!unlocked?`<span class="chapter-card-lock">${lockIcon}未解鎖</span>`:selected===id?'<span class="chapter-card-selected">已選擇</span>':''}</div><div class="chapter-card-content"><div class="chapter-card-title"><b>${esc(chapter.name)}</b><small>${progress}/8</small></div><p>${descriptions[id]}</p><div class="chapter-card-meta"><span>敵人 Lv.${first.monsterLevel}–${last.monsterLevel}</span><strong>裝等 Lv.${first.min}–${last.max}</strong></div><small class="chapter-card-boss">${unlocked?'首領 · '+esc(chapter.boss.name):'通關'+esc(chapterDefinition(id-1)?.name||'前一章')+'後解鎖'}</small><span class="chapter-card-progress" aria-hidden="true"><i style="width:${progress/8*100}%"></i></span></div></button>`;}).join('')}</div>`;
}
