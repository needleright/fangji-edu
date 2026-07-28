const store = require('../../utils/store.js');

Page({
  data: {
    stats: {},
    bars: [],
    M_CLASS: store.M_CLASS,
    removeN: 3,
    removeOpts: [2, 3, 5],
    favCount: 0,
    testCount: 0
  },

  onShow() {
    const s = store.stats();
    const bars = store.MERIDIANS.map(m => {
      const d = s.byM[m];
      return { m, total: d.total, mastered: d.mastered, pct: d.total ? Math.round(d.mastered / d.total * 100) : 0 };
    });
    this.setData({
      stats: s, bars,
      removeN: store.getSettings().removeN,
      favCount: store.getFavs().length,
      testCount: store.getTests().length
    }, () => this.drawRadar(bars));
  },

  drawRadar(bars) {
    const query = wx.createSelectorQuery();
    query.select('#radar').fields({ node: true, size: true }).exec(res => {
      if (!res || !res[0]) return;
      const canvas = res[0].node;
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2;
      const W = res[0].width, H = res[0].height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 34;
      const n = 6;
      const pt = (i, r) => {
        const ang = -Math.PI / 2 + i * 2 * Math.PI / n;
        return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
      };
      // 网格
      ctx.strokeStyle = '#E3DCCC';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach(k => {
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const [x, y] = pt(i % n, R * k);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      for (let i = 0; i < n; i++) {
        const [x, y] = pt(i, R);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      }
      // 数据
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const v = bars[i % n].pct / 100;
        const [x, y] = pt(i % n, R * Math.max(v, 0.03));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(62, 107, 79, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#3E6B4F';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 标签
      ctx.fillStyle = '#5A4E3A';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const [x, y] = pt(i, R + 20);
        ctx.fillText(bars[i].m + ' ' + bars[i].pct + '%', x, y);
      }
    });
  },

  setRemoveN(e) {
    const n = Number(e.currentTarget.dataset.v);
    store.setSettings({ removeN: n });
    this.setData({ removeN: n });
  },
  goFav() { wx.navigateTo({ url: '/pages/list/list?fav=1' }); },
  reset() {
    wx.showModal({
      title: '重置学习数据',
      content: '将清空学习进度、错题本、收藏与测试记录，不可恢复。确定重置？',
      confirmColor: '#B04030',
      success: res => {
        if (res.confirm) {
          store.resetAll();
          this.onShow();
          wx.showToast({ title: '已重置', icon: 'none' });
        }
      }
    });
  }
});
