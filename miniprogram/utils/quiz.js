// 出题与随机工具
const store = require('./store.js');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// 从方剂的（标准症状 + 已审核变式）中随机取一条症状描述
function randomSymptom(f) {
  const pool = [f.standardSymptom].concat(f.variants || []);
  return pool[Math.floor(Math.random() * pool.length)];
}

// 生成一道测试题：症状 + 六经答案 + 4个方剂选项（同经优先做干扰项）
function makeQuestion(f, allPool) {
  const names = {};
  names[f.name] = true;
  // 干扰项：优先同主经、名称不同的方剂
  const sameM = shuffle(allPool.filter(x => x.name !== f.name && x.meridians[0] === f.meridians[0]));
  const others = shuffle(allPool.filter(x => x.name !== f.name && x.meridians[0] !== f.meridians[0]));
  const distractors = [];
  sameM.concat(others).forEach(x => {
    if (distractors.length < 3 && !names[x.name]) {
      names[x.name] = true;
      distractors.push(x.name);
    }
  });
  return {
    id: f.id,
    symptom: randomSymptom(f),
    meridians: f.meridians,
    answer: f.name,
    options: shuffle([f.name].concat(distractors))
  };
}

// 生成一组测试
function makePaper(pool, count) {
  const picked = shuffle(pool).slice(0, count);
  const allPool = store.all();
  return picked.map(f => makeQuestion(f, allPool));
}

module.exports = { shuffle, randomSymptom, makeQuestion, makePaper };
