const store = require('../../utils/store.js');
const quiz = require('../../utils/quiz.js');

Page({
  data: {
    mode: 'learn',              // learn 学习模式 / random 随机抽题
    MERIDIANS: store.MERIDIANS,
    M_CLASS: store.M_CLASS,
    // 筛选
    meridian: '全部',
    difficulty: '全部',
    source: '全部',
    scope: 'all',
    scopes: [
      { k: 'all', t: '全部题库' },
      { k: 'unmastered', t: '未掌握' },
      { k: 'fav', t: '收藏' },
      { k: 'wrong', t: '错题' }
    ],
    showFilter: false,
    // 卡片
    pool: [],
    queue: [],
    cur: null,
    symptom: '',
    flipped: false,
    isFav: false,
    count: 0,
    poolCount: 0
  },

  onLoad(opts) {
    const mode = opts.mode || 'learn';
    const patch = { mode };
    if (opts.scope) patch.scope = opts.scope;
    if (opts.id) this._onlyId = opts.id;
    this.setData(patch);
    wx.setNavigationBarTitle({ title: mode === 'random' ? '随机抽题' : '学习模式' });
    this.rebuild();
  },

  rebuild() {
    let pool = store.filter({
      meridian: this.data.meridian,
      difficulty: this.data.difficulty,
      source: this.data.source,
      scope: this.data.scope
    });
    if (this._onlyId) pool = pool.filter(f => f.id === this._onlyId);
    this.setData({ pool, poolCount: pool.length, queue: quiz.shuffle(pool) }, () => this.next(true));
  },

  next(keepCount) {
    let q = this.data.queue;
    if (!q.length) {
      if (!this.data.pool.length) {
        this.setData({ cur: null });
        return;
      }
      q = quiz.shuffle(this.data.pool); // 一轮刷完，重新洗牌
    }
    const cur = q[0];
    this.setData({
      queue: q.slice(1),
      cur,
      symptom: quiz.randomSymptom(cur),
      flipped: false,
      isFav: store.isFav(cur.id),
      count: keepCount === true ? this.data.count : this.data.count + 1
    });
  },

  flip() { this.setData({ flipped: !this.data.flipped }); },

  markCard(e) {
    const level = e.currentTarget.dataset.level;
    store.mark(this.data.cur.id, level);
    const txt = { mastered: '已掌握', fuzzy: '已标记模糊', unknown: '已加入错题本' }[level];
    wx.showToast({ title: txt, icon: 'none', duration: 600 });
    this.next();
  },

  skip() { this.next(); },

  toggleFav() {
    const on = store.toggleFav(this.data.cur.id);
    this.setData({ isFav: on });
    wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none', duration: 600 });
  },

  goDiff(e) {
    const name = e.currentTarget.dataset.name;
    const f = store.byName(name);
    if (f) wx.navigateTo({ url: '/pages/detail/detail?id=' + f.id });
    else wx.showToast({ title: '题库中暂无该方', icon: 'none' });
  },

  toggleFilter() { this.setData({ showFilter: !this.data.showFilter }); },
  setMeridian(e) { this.setData({ meridian: e.currentTarget.dataset.v }, () => this.rebuild()); },
  setDifficulty(e) { this.setData({ difficulty: e.currentTarget.dataset.v }, () => this.rebuild()); },
  setSource(e) { this.setData({ source: e.currentTarget.dataset.v }, () => this.rebuild()); },
  setScope(e) { this.setData({ scope: e.currentTarget.dataset.v }, () => this.rebuild()); }
});
