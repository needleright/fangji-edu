const store = require('../../utils/store.js');

Page({
  data: {
    MERIDIANS: store.MERIDIANS,
    M_CLASS: store.M_CLASS,
    meridian: '全部',
    kw: '',
    onlyFav: false,
    list: []
  },
  onLoad(opts) {
    if (opts.fav) this.setData({ onlyFav: true });
    if (opts.fav) wx.setNavigationBarTitle({ title: '收藏方剂' });
  },
  onShow() { this.refresh(); },
  refresh() {
    const kw = this.data.kw.trim();
    const favs = store.getFavs();
    const p = {};
    const list = store.all().filter(f => {
      if (this.data.onlyFav && favs.indexOf(f.id) === -1) return false;
      if (this.data.meridian !== '全部' && f.meridians.indexOf(this.data.meridian) === -1) return false;
      if (kw && f.name.indexOf(kw) === -1 && f.subPattern.indexOf(kw) === -1 && f.tags.join(',').indexOf(kw) === -1) return false;
      return true;
    }).map(f => {
      const e = store.getEntry(f.id);
      const stMap = { new: '未学习', learning: '学习中', mastered: '已掌握', weak: '需加强' };
      return {
        id: f.id, name: f.name, meridians: f.meridians,
        subPattern: f.subPattern, difficulty: f.difficulty,
        status: stMap[e.status] || '未学习', st: e.status
      };
    });
    this.setData({ list });
  },
  onKw(e) { this.setData({ kw: e.detail.value }, () => this.refresh()); },
  setMeridian(e) { this.setData({ meridian: e.currentTarget.dataset.v }, () => this.refresh()); },
  goDetail(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }); }
});
