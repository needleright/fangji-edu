// 数据访问与学习记录（本地存储版，后续可平滑迁移到云开发）
const formulas = require('../data/formulas.js');

const P_KEY = 'jf_progress';   // { [id]: {status, wrong, streak, inWrong, lastAt} }
const F_KEY = 'jf_fav';        // [id]
const S_KEY = 'jf_settings';   // { removeN }
const T_KEY = 'jf_tests';      // 测试历史 [{at, total, correct, wrongIds}]

const MERIDIANS = ['太阳', '阳明', '少阳', '太阴', '少阴', '厥阴'];
const M_CLASS = { '太阳': 'm-taiyang', '阳明': 'm-yangming', '少阳': 'm-shaoyang', '太阴': 'm-taiyin', '少阴': 'm-shaoyin', '厥阴': 'm-jueyin' };

function all() { return formulas; }
function byId(id) { return formulas.find(f => f.id === id); }
function byName(name) { return formulas.find(f => f.name === name); }

/* ---------- 学习进度 ---------- */
function getProgress() { return wx.getStorageSync(P_KEY) || {}; }
function setProgress(p) { wx.setStorageSync(P_KEY, p); }
function getEntry(id) {
  return getProgress()[id] || { status: 'new', wrong: 0, streak: 0, inWrong: false, lastAt: 0 };
}
function update(id, patch) {
  const p = getProgress();
  p[id] = Object.assign({}, getEntry(id), patch, { lastAt: Date.now() });
  setProgress(p);
  return p[id];
}

// 学习模式主观标记：mastered已掌握 / fuzzy模糊 / unknown不会
function mark(id, level) {
  const e = getEntry(id);
  if (level === 'mastered') {
    update(id, { status: 'mastered', inWrong: false, streak: e.streak + 1 });
  } else if (level === 'fuzzy') {
    update(id, { status: 'learning', inWrong: true, wrong: e.wrong + 1, streak: 0 });
  } else {
    update(id, { status: 'weak', inWrong: true, wrong: e.wrong + 1, streak: 0 });
  }
}

// 测试模式作答：连续答对 removeN 次自动移出错题本
function recordAnswer(id, correct) {
  const s = getSettings();
  const e = getEntry(id);
  if (correct) {
    const streak = e.streak + 1;
    const out = streak >= s.removeN;
    update(id, {
      streak: streak,
      inWrong: out ? false : e.inWrong,
      status: out ? 'mastered' : (e.status === 'new' ? 'learning' : e.status)
    });
  } else {
    update(id, { wrong: e.wrong + 1, streak: 0, inWrong: true, status: 'weak' });
  }
}

function removeFromWrong(id) { update(id, { inWrong: false }); }

function wrongList() {
  const p = getProgress();
  return formulas
    .filter(f => p[f.id] && p[f.id].inWrong)
    .sort((a, b) => {
      const ea = p[a.id], eb = p[b.id];
      return (eb.wrong - ea.wrong) || (eb.lastAt - ea.lastAt);
    });
}

/* ---------- 收藏 ---------- */
function getFavs() { return wx.getStorageSync(F_KEY) || []; }
function isFav(id) { return getFavs().indexOf(id) > -1; }
function toggleFav(id) {
  const fs = getFavs();
  const i = fs.indexOf(id);
  if (i > -1) fs.splice(i, 1); else fs.push(id);
  wx.setStorageSync(F_KEY, fs);
  return i === -1;
}

/* ---------- 设置 ---------- */
function getSettings() {
  return Object.assign({ removeN: 3 }, wx.getStorageSync(S_KEY) || {});
}
function setSettings(patch) {
  wx.setStorageSync(S_KEY, Object.assign(getSettings(), patch));
}
function resetAll() {
  wx.removeStorageSync(P_KEY);
  wx.removeStorageSync(F_KEY);
  wx.removeStorageSync(T_KEY);
}

/* ---------- 测试历史 ---------- */
function saveTest(rec) {
  const t = wx.getStorageSync(T_KEY) || [];
  t.unshift(rec);
  wx.setStorageSync(T_KEY, t.slice(0, 50));
}
function getTests() { return wx.getStorageSync(T_KEY) || []; }

/* ---------- 筛选 ---------- */
// opts: { meridian:'全部'|六经, difficulty:'全部'|…, source:'全部'|…, scope:'all'|'unmastered'|'fav'|'wrong' }
function filter(opts) {
  const o = Object.assign({ meridian: '全部', difficulty: '全部', source: '全部', scope: 'all' }, opts);
  const p = getProgress();
  const favs = getFavs();
  return formulas.filter(f => {
    if (o.meridian !== '全部' && f.meridians.indexOf(o.meridian) === -1) return false;
    if (o.difficulty !== '全部' && f.difficulty !== o.difficulty) return false;
    if (o.source !== '全部') {
      if (o.source === '其他') {
        if (f.source.indexOf('伤寒论') > -1 || f.source.indexOf('金匮') > -1) return false;
      } else if (f.source.indexOf(o.source) === -1) return false;
    }
    const e = p[f.id];
    if (o.scope === 'unmastered' && e && e.status === 'mastered') return false;
    if (o.scope === 'fav' && favs.indexOf(f.id) === -1) return false;
    if (o.scope === 'wrong' && !(e && e.inWrong)) return false;
    return true;
  });
}

/* ---------- 统计 ---------- */
function stats() {
  const p = getProgress();
  const total = formulas.length;
  let mastered = 0, learning = 0, weak = 0;
  const byM = {};
  MERIDIANS.forEach(m => { byM[m] = { total: 0, mastered: 0 }; });
  formulas.forEach(f => {
    const e = p[f.id];
    const st = e ? e.status : 'new';
    if (st === 'mastered') mastered++;
    else if (st === 'learning') learning++;
    else if (st === 'weak') weak++;
    f.meridians.forEach(m => {
      if (byM[m]) {
        byM[m].total++;
        if (st === 'mastered') byM[m].mastered++;
      }
    });
  });
  return { total, mastered, learning, weak, unseen: total - mastered - learning - weak, byM, wrongCount: wrongList().length };
}

module.exports = {
  MERIDIANS, M_CLASS,
  all, byId, byName,
  getEntry, mark, recordAnswer, removeFromWrong, wrongList,
  getFavs, isFav, toggleFav,
  getSettings, setSettings, resetAll,
  saveTest, getTests,
  filter, stats
};
