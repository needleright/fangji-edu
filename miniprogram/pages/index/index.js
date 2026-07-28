const store = require('../../utils/store.js');

Page({
  data: { stats: {} },
  onShow() {
    this.setData({ stats: store.stats() });
  },
  goLearn() { wx.navigateTo({ url: '/pages/practice/practice?mode=learn' }); },
  goRandom() { wx.navigateTo({ url: '/pages/practice/practice?mode=random' }); },
  goTest() { wx.navigateTo({ url: '/pages/test/test' }); },
  goWrong() { wx.switchTab({ url: '/pages/wrongbook/wrongbook' }); },
  goList() { wx.navigateTo({ url: '/pages/list/list' }); },
  goAbout() { wx.navigateTo({ url: '/pages/about/about' }); }
});
