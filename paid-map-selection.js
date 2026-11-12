import {pixelMapArt} from './pixel-map-art.js?v=108';
import {ENDGAME_UNLOCK_REASON,RIFT_THEMES,GEAR_FAMILIES,riftPreview,riftChapterTier} from './rift-model.js?v=140';
import {DIFFICULTIES,UNIQUES} from './model.js?v=140';
import {GUARDIANS} from './endgame-combat.js?v=108';
import {hordeDensity} from './horde-trial.js?v=108';
import {lootLevelBand} from './encounter-context.js?v=108';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emblemNames={1:'燼冠',2:'潮鐐',3:'雷鏡'};
const features={vault:'菁英守衛與寶藏分岔，首領掉落較多。',forge:'試煉路線與鍛造素材，集中取得強化石與重鑄石。',contract:'菁英獵場，配合掉落偏向追尋流派裝備。',royal:'守衛與秘庫寶藏，首領額外掉裝，結算給 T3 寶石。',hunt:'菁英圍剿與挑戰守衛，取得破界所需徽記。',sanctum:'星冠守衛與風險詞條，追尋套裝或獨特裝備。'};
function mapArt(theme,name){
 return pixelMapArt(theme,esc(name)+'場景示意');
}

function option(draft,key,values,label){
 return `<div class="paid-option-row"><span>${label}</span><div class="rift-options" role="group" aria-label="${label}">${values.map(([value,text])=>`<button type="button" data-rift-option="${key}" data-value="${value}" aria-pressed="${draft[key]===value}" class="${draft[key]===value?'selected':''}">${esc(text)}</button>`).join('')}</div></div>`;
}

function rewardText(theme){
 const count=theme==='final'?4:['vault','royal'].includes(theme)?3:2;
 const stones=theme==='forge'?6:theme==='final'?8:2,reforges=theme==='forge'?3:1;
 return `首領掉落 ×${count}（黃色以上）<span>強化石 ×${stones} · 重鑄石 ×${reforges}${theme==='royal'?' · T3 清明寶石 ×1':''}</span>`;
}

function mapCard(profile,c,draft,theme,{end,levels,challenge}){
 const final=theme==='final',kind=final?'final':end?'endgame':'rift',d=end?3:c.difficulty;
 const name=final?'界隙之心':RIFT_THEMES[theme].name,preview=riftPreview(profile,c.id,{...draft,kind,theme:final?'hunt':theme,difficulty:d,challenge});
 const cost=final?'燼冠、潮鐐、雷鏡徽記各 ×1':end?'破界鑰匙 ×1':`${DIFFICULTIES[d].name}門票 ×1`;
 const condition=end?`通關${DIFFICULTIES[3].name}第三章`:`通關${DIFFICULTIES[d].name}第一章`;
 const feature=final?'三階段融合守衛，隨生命階段切換火環、潮線與雷陣。':features[theme];
 let reason=preview.ok?'':preview.reason.replace(/^此角色/, '').replace(/。$/,'');
 if(!preview.ok){
  if(preview.reason==='入場道具不足。')reason=final?'缺少'+[1,2,3].filter(id=>profile.rifts.emblems[id]<1).map(id=>emblemNames[id]+'徽記').join('、'):end?'破界鑰匙不足':DIFFICULTIES[d].name+'門票不足';
  else if(preview.reason==='此角色尚未通關對應難度第一章。'||preview.reason===ENDGAME_UNLOCK_REASON)reason='尚未'+condition;
 }
 const emblem=end&&!final?`<span class="map-emblem-reward">${emblemNames[draft.guardian]}徽記 ×1</span>`:'';
 return `<article class="campaign-chapter-card paid-map-card ${!preview.ok?'locked':''} ${final?'final-map-card':''}" data-map-card="${theme}"><div class="chapter-card-picture">${mapArt(theme,name)}<span class="chapter-card-number">${final?'最終試煉':end?'終局守衛':DIFFICULTIES[d].name+'裂隙'}</span><span class="chapter-card-lock">裝等 ${levels}</span></div><div class="chapter-card-content"><div class="chapter-card-title"><h3>${name}</h3><small>4 層</small></div><p class="map-feature">${feature}</p><dl class="map-card-facts"><div><dt>進入</dt><dd>${condition}<span>${cost}</span></dd></div><div><dt>獎勵</dt><dd>${rewardText(theme)}${emblem}</dd></div></dl><footer class="paid-map-action"><small class="map-entry-state ${reason?'blocked':'ready'}">${esc(reason||'可進入')}</small><button type="button" class="gold-btn" data-rift-enter="${theme}" aria-label="進入${name}" ${preview.ok?'':'disabled'}>進入</button></footer></div></article>`;
}

export function paidMapChoices(profile,c,draft,{end=false,optionsOpen=false}={}){
 const r=profile.rifts,kind=end?'endgame':'rift',d=end?3:c.difficulty,cost=end?10:3;
 const chapter=end?3:riftChapterTier(c,d)||1;
 const context={kind,difficulty:d,chapter},first=lootLevelBand(d,0,chapter,context),last=lootLevelBand(d,3,chapter,context);
 const levels=first.min+'–'+last.max;
 const challenge=end?Math.min(3,Math.max(1,Math.floor(draft.challenge)||1)):1,mods=challenge+1;
 const target=GEAR_FAMILIES[draft.target]||GEAR_FAMILIES.physical,guardian=GUARDIANS[draft.guardian]||GUARDIANS[1];
 const wallet=`<div class="paid-map-wallet"><span>${DIFFICULTIES[d].name}碎片 <b>${r.fragments[d]}</b></span><span>${end?'破界鑰匙':'門票'} <b>${end?r.endKeys:r.tickets[d]}</b></span><button type="button" class="outline-btn" data-rift-craft="${kind}" ${r.fragments[d]<cost?'disabled':''} title="消耗${cost}枚${DIFFICULTIES[d].name}碎片，製作${end?'一把破界鑰匙':'一張門票'}">${cost} 碎片製${end?'鑰':'票'}</button>${end?`<span class="paid-emblems" aria-label="持有守衛徽記">${[1,2,3].map(id=>`<span>${emblemNames[id]} <b>${r.emblems[id]}</b></span>`).join('')}</span>`:''}</div>`;
 const hasTargetUnique=target.uniques.some(id=>UNIQUES[id].itemLevel>=last.min&&UNIQUES[id].itemLevel<=last.max);
 const uniqueHint=hasTargetUnique?`符合結算裝等 Lv.${last.min}–${last.max} 的獨特裝備會進入偏向候選。`:'這個流派在本區結算沒有符合裝等的獨特裝備。';
 const targeting=`<details class="paid-map-options" ${optionsOpen?'open':''}><summary>掉落偏向 <b>${esc(target.name)} · ${draft.targetType==='unique'?'獨特':'套裝'}</b></summary><div>${option(draft,'target',Object.entries(GEAR_FAMILIES).map(([id,f])=>[id,f.name]),'流派')}${option(draft,'targetType',[['set','套裝'],['unique','獨特']],'偏向')}<small>${draft.targetType==='unique'?uniqueHint:'提高符合條件的紅／橘套裝部件機率。'}</small></div></details>`;
 const density=Number(hordeDensity(d,challenge).toFixed(2));
 const setup=end?`<div class="paid-map-setup">${option(draft,'challenge',[[1,'Ⅰ'],[2,'Ⅱ'],[3,'Ⅲ']],'挑戰')}${option(draft,'guardian',[[1,'燼冠'],[2,'潮鐐'],[3,'雷鏡']],'守衛')}<p class="paid-challenge-facts">敵人生命 ×${[0,1.1,1.4,1.75][challenge]} · 傷害 ×${[0,1.05,1.18,1.32][challenge]} · 每波怪量 ×${density}<span>${guardian.name} · ${guardian.counter}</span></p></div>`:'';
 return `<div class="paid-map-controls">${wallet}${targeting}${setup}<small class="risk-ticket-note">${end?'':'每波怪量 ×'+density+' · '}入場時固定 ${mods} 條隨機地圖詞條，強化敵人或改變戰場機制。</small></div><div class="campaign-chapter-grid paid-map-grid${end?' endgame-map-grid':''}">${(end?['royal','hunt','sanctum','final']:['vault','forge','contract']).map(theme=>mapCard(profile,c,draft,theme,{end,levels,challenge})).join('')}</div>`;
}
