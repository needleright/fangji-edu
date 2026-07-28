const store = require('../../utils/store.js');

Page({
  data: { list: [], M_CLASS: store.M_CLASS, removeN: 3 },
  onShow() { this.refresh(); },
  refresh() {
    const p = {};
    const list = store.wrongList().map(f => {
      const e = store.getEntry(f.id);
      return { id: f.id, name: f.name, meridians: f.meridians, subPattern: f.subPattern, wrong: e.wrong, streak: e.streak };
    });
    this.setData({ list, removeN: store.getSettings().removeN });
  },
  review() {
    if (!this.data.list.length) return;
    wx.navigateTo({ url: '/pages/practice/practice?mode=learn&scope=wrong' });
  },
  reviewOne(e) {
    wx.navigateTo({ url: '/pages/practice/practice?mode=learn&scope=wrong&id=' + e.currentTarget.dataset.id });
  },
  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '移出错题本',
      content: '确定已掌握该方证，将其移出错题本？',
      success: res => {
        if (res.confirm) {
          store.removeFromWrong(id);
          this.refresh();
        }
      }
    });
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  }
});
