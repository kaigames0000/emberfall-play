const dayMilliseconds = 24 * 60 * 60 * 1000;
const taipeiOffset = 8 * 60 * 60 * 1000;
const DAY_LIMIT = 100_000_000;

export const WEEKLY_ORDER = Object.freeze({
  name:'前線委託',
  target:2,
  materials:[{key:'enhance',count:6}, {key:'reforge',count:1}],
});

export const DAILY_SUPPLIES = [
  [{key:'enhance',count:2}],
  [{key:'reroll',count:1}],
  [{key:'enhance',count:3}],
  [{key:'reforge',count:1}],
  [{key:'enhance',count:3}],
  [{key:'chisel',count:1}],
  [{key:'enhance',count:5}, {key:'reforge',count:1}],
];

const empty = {lastDay:null, stamps:0, week:null, cleared:[], weeklyClaimed:false};
const validDay = value => Number.isInteger(value) && value >= 0 && value < DAY_LIMIT;
const validRun = value => typeof value === 'string' && value.length > 0 && value.length <= 200;
const todayInTaipei = now => Math.floor((now + taipeiOffset) / dayMilliseconds);
const mondayOf = day => day - (day + 3) % 7;
const dayLabel = day => new Date(day * dayMilliseconds).toISOString().slice(0,10);

function progressOrEmpty(progress) {
  if (!progress || (progress.lastDay !== null && !validDay(progress.lastDay)) ||
      !Number.isInteger(progress.stamps) || progress.stamps < 0 || progress.stamps > DAILY_SUPPLIES.length ||
      (progress.lastDay === null) !== (progress.stamps === 0) ||
      (progress.week !== null && (!validDay(progress.week) || mondayOf(progress.week) !== progress.week)) ||
      !Array.isArray(progress.cleared) || progress.cleared.length > WEEKLY_ORDER.target ||
      !progress.cleared.every(validRun) || new Set(progress.cleared).size !== progress.cleared.length ||
      (progress.week === null && progress.cleared.length) || typeof progress.weeklyClaimed !== 'boolean' ||
      (progress.weeklyClaimed && progress.cleared.length !== WEEKLY_ORDER.target)) return empty;
  return progress;
}

export function boardView(progress, now = Date.now()) {
  const saved = progressOrEmpty(progress);
  const day = todayInTaipei(now), week = mondayOf(day);
  const dailyState = saved.lastDay === day ? 'claimed' : saved.lastDay > day ? 'clock' : 'ready';
  const completed = dailyState === 'ready' ? saved.stamps % DAILY_SUPPLIES.length : saved.stamps;
  const weeklyCount = saved.week === week ? saved.cleared.length : 0;
  const weeklyState = saved.week > week ? 'clock' :
    saved.week === week && saved.weeklyClaimed ? 'claimed' : weeklyCount === WEEKLY_ORDER.target ? 'ready' : 'progress';
  const nextDayAt = (day + 1) * dayMilliseconds - taipeiOffset;
  return {date:dayLabel(day), nextDayAt, resets:dayLabel(week + 7), dailyState, completed, weeklyCount, weeklyState};
}

export function recordBoardClear(progress, run, now = Date.now()) {
  if (!validRun(run)) return progress;
  const saved = progressOrEmpty(progress), week = mondayOf(todayInTaipei(now));
  if (saved.week > week) return progress;
  const cleared = saved.week === week ? saved.cleared : [];
  if (cleared.length === WEEKLY_ORDER.target || cleared.includes(run)) return progress;
  return {...saved, week, cleared:[...cleared, run], weeklyClaimed:false};
}

export function claimBoardReward(progress, kind, now = Date.now()) {
  const saved = progressOrEmpty(progress), view = boardView(saved, now);
  if (kind === 'daily' && view.dailyState === 'ready') {
    return {progress:{...saved, lastDay:todayInTaipei(now), stamps:view.completed + 1}, materials:DAILY_SUPPLIES[view.completed]};
  }
  if (kind === 'weekly' && view.weeklyState === 'ready') {
    return {progress:{...saved, weeklyClaimed:true}, materials:WEEKLY_ORDER.materials};
  }
  return null;
}
