const store = require('../../utils/store.js');
const quiz = require('../../utils/quiz.js');

Page({
  data: {
    phase: 'setup',              // setup / quiz / result
    MERIDIANS: store.MERIDIANS,
    M_CLASS: store.M_CLASS,
    // setup
    meridian: '全部',
    countOpts: [5, 10, 20],
    count: 10,
    poolCount: 0,
    // quiz
    paper: [],
    idx: 0,
    q: null,
    step: 1,                     // 1 选六经 / 2 选方剂 / 3 看解析
    selM: [],
    selName: '',
    judged: null,                // {mOk, fOk, ok}
    detail: null,
    // result
    result: null
  },

  onLoad() { this.refreshPool(); },

  refreshPool() {
    const pool = store.filter({ meridian: this.data.meridian });
    this.setData({ poolCount: pool.length });
    this._pool = pool;
  },
  setMeridian(e) {
    this.setData({ meridian: e.currentTarget.dataset.v }, () => this.refreshPool());
  },
  setCount(e) { this.setData({ count: Number(e.currentTarget.dataset.v) }); },

  start() {
    if (!this._pool.length) return;
    const n = Math.min(this.data.count, this._pool.length);
    const paper = quiz.makePaper(this._pool, n);
    this._answers = [];
    this.setData({ phase: 'quiz', paper, idx: 0 }, () => this.loadQ());
  },

  loadQ() {
    this.setData({
      q: this.data.paper[this.data.idx],
      step: 1, selM: [], selName: '', judged: null, detail: null
    });
  },

  toggleM(e) {
    if (this.data.step !== 1) return;
    const m = e.currentTarget.dataset.v;
    const sel = this.data.selM.slice();
    const i = sel.indexOf(m);
    if (i > -1) sel.splice(i, 1); else sel.push(m);
    this.setData({ selM: sel });
  },
  confirmM() {
    if (!this.data.selM.length) {
      wx.showToast({ title: '请先选择六经归属', icon: 'none' });
      return;
    }
    this.setData({ step: 2 });
  },

  pickName(e) {
    if (this.data.step !== 2) return;
    const name = e.currentTarget.dataset.v;
    const q = this.data.q;
    const mSet = this.data.selM.slice().sort().join(',');
    const ansSet = q.meridians.slice().sort().join(',');
    const mOk = mSet === ansSet;
    const fOk = name === q.answer;
    const ok = mOk && fOk;
    store.recordAnswer(q.id, ok);
    this._answers.push({ id: q.id, ok, mOk, fOk, meridians: q.meridians });
    this.setData({
      selName: name,
      judged: { mOk, fOk, ok },
      detail: store.byId(q.id),
      step: 3
    });
  },

  nextQ() {
    if (this.data.idx + 1 < this.data.paper.length) {
      this.setData({ idx: this.data.idx + 1 }, () => this.loadQ());
    } else {
      this.finish();
    }
  },

  finish() {
    const ans = this._answers;
    const correct = ans.filter(a => a.ok).length;
    // 薄弱六经分布：答错题目所属六经计数
    const weak = {};
    store.MERIDIANS.forEach(m => { weak[m] = 0; });
    ans.filter(a => !a.ok).forEach(a => a.meridians.forEach(m => { if (weak[m] !== undefined) weak[m]++; }));
    const maxWeak = Math.max(1, ...Object.keys(weak).map(k => weak[k]));
    const weakBars = store.MERIDIANS.map(m => ({
      m, n: weak[m], pct: Math.round(weak[m] / maxWeak * 100)
    }));
    const wrongItems = ans.filter(a => !a.ok).map(a => {
      const f = store.byId(a.id);
      return { id: a.id, name: f.name, subPattern: f.subPattern, mOk: a.mOk, fOk: a.fOk };
    });
    const result = {
      total: ans.length, correct,
      acc: Math.round(correct / ans.length * 100),
      weakBars, wrongItems
    };
    store.saveTest({ at: Date.now(), total: ans.length, correct, wrongIds: wrongItems.map(w => w.id) });
    this.setData({ phase: 'result', result });
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },
  restart() { this.setData({ phase: 'setup' }, () => this.refreshPool()); },
  goWrong() { wx.switchTab({ url: '/pages/wrongbook/wrongbook' }); }
});
