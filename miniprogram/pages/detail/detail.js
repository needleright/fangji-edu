const store = require('../../utils/store.js');

Page({
  data: { f: null, isFav: false, M_CLASS: store.M_CLASS, statusText: '' },
  onLoad(opts) {
    const f = store.byId(opts.id);
    if (!f) {
      wx.showToast({ title: '未找到方剂', icon: 'none' });
      return;
    }
    wx.setNavigationBarTitle({ title: f.name });
    this.setData({ f });
  },
  onShow() {
    if (!this.data.f) return;
    const e = store.getEntry(this.data.f.id);
    const stMap = { new: '未学习', learning: '学习中', mastered: '已掌握', weak: '需加强' };
    this.setData({ isFav: store.isFav(this.data.f.id), statusText: stMap[e.status] });
  },
  toggleFav() {
    const on = store.toggleFav(this.data.f.id);
    this.setData({ isFav: on });
  },
  goDiff(e) {
    const f = store.byName(e.currentTarget.dataset.name);
    if (f) wx.navigateTo({ url: '/pages/detail/detail?id=' + f.id });
    else wx.showToast({ title: '题库中暂无该方', icon: 'none' });
  },
  practice() {
    wx.navigateTo({ url: '/pages/practice/practice?mode=learn&id=' + this.data.f.id });
  }
});
