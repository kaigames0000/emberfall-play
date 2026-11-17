import {DAILY_SUPPLIES, WEEKLY_ORDER} from './event-board.js?v=155';
import {choiceButtons, iconMarkup} from './ui-controls.js?v=152';
import {MATERIALS} from './model.js?v=157';

export const EVENT_TABS = [
  ['news','公告'], ['weekly','活動'], ['daily','每日簽到'], ['feedback','意見回饋'],
];

export function eventBoardTabs(active, view) {
  const tabs = EVENT_TABS.map(([id,label]) => {
    const ready = id === 'daily' ? view.dailyState === 'ready' : id === 'weekly' && view.weeklyState === 'ready';
    return [id,label,ready ? {ariaLabel:label+'，可領取',after:'<i class="event-ready-dot" aria-hidden="true"></i>'} : {}];
  });
  return choiceButtons(tabs, active, 'data-event-tab');
}

const materialList = materials => materials.map(({key,count}) =>
  `<span class="event-material">${iconMarkup('item-'+key)}<span>${MATERIALS[key].name} ×${count}</span></span>`
).join('');

export function weeklyOrderMarkup(view, locked) {
  const {target, materials, name} = WEEKLY_ORDER;
  const available = !locked && view.weeklyState === 'ready';
  const hint = locked ? '請先完成裂隙結算。' : view.weeklyState === 'clock' ? '本機日期早於已記錄的活動週期。' : '每週一 00:00 更新（台北時間）';
  const button = view.weeklyState === 'claimed' ? '本週已領取' : '領取獎勵';
  return `<article class="event-card event-weekly">
    <header class="event-heading"><h3>${name}</h3><time datetime="${view.resets}">${view.resets.replaceAll('-','/')} 00:00 結算</time></header>
    <p>在任一難度完成兩次章節遠征，擊倒章節首領即可累計。</p>
    <div class="event-progress"><progress value="${view.weeklyCount}" max="${target}" aria-label="本週完成遠征"></progress><b data-event-count>${view.weeklyCount} / ${target}</b></div>
    <footer class="event-actions"><div class="event-rewards">${materialList(materials)}</div><button type="button" class="gold-btn" data-event-claim="weekly"${available ? '' : ' disabled'}>${button}</button></footer>
    <small>${hint}</small>
  </article>`;
}

export function dailySuppliesMarkup(view, locked) {
  const hint = locked ? '請先完成裂隙結算。' : view.dailyState === 'clock' ? '本機日期早於上次簽到。' : '台北時間 00:00 更新 · 漏簽保留累計';
  const button = view.dailyState === 'claimed' ? '今日已簽到' : '領取今日補給';
  return `<section class="event-card event-daily">
    <header class="event-heading"><h3>七日營地補給</h3><time datetime="${view.date}">${view.date.replaceAll('-','/')}</time></header>
    <ol class="event-stamp-grid">${DAILY_SUPPLIES.map((materials,index) => {
      const state = index < view.completed ? 'done' : index === view.completed && view.dailyState === 'ready' ? 'next' : '';
      return `<li class="${state}"><b>第 ${index+1} 天</b>${materialList(materials)}${state === 'done' ? '<span class="stamp-state">已領取</span>' : state === 'next' ? '<span class="stamp-state">今日</span>' : ''}</li>`;
    }).join('')}</ol>
    <footer class="event-actions"><small>${hint}</small><button type="button" class="gold-btn" data-event-claim="daily"${locked || view.dailyState !== 'ready' ? ' disabled' : ''}>${button}</button></footer>
  </section>`;
}
