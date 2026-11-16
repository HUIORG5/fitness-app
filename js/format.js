/* 工具 / 格式化：格式化函数、单位换算、容量计算、组数文本。
   全是纯函数或只读逻辑，不含 DOM 操作，所以可以安全地从 app.js 切出来。
   主文件通过 window.Format 取别名，调用处无需改动。 */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtClock(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return h > 0 ? h + ":" + pad(m) + ":" + pad(ss) : pad(m) + ":" + pad(ss);
  }
  function fmtDur(ms) {
    const m = Math.round(ms / 60000);
    if (m < 1) return "不到 1 分钟";
    if (m < 60) return m + " 分钟";
    const h = Math.floor(m / 60), mm = m % 60;
    return mm ? h + " 小时 " + pad(mm) + " 分" : h + " 小时";
  }
  function fmtDate(d) { return d.getMonth() + 1 + "月" + d.getDate() + "日"; }
  const WD = ["日", "一", "二", "三", "四", "五", "六"];
  function fmtWD(d) { return "周" + WD[d.getDay()]; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fmtNum(n) { return Math.round(n).toLocaleString("zh-CN"); }

  /* ---------- 单位换算（内部一律存 kg） ---------- */
  const U = {
    cur() { return Store.data.settings.unit; },
    kgToDisp(kg) { return this.cur() === "lb" ? kg * 2.2046226 : kg; },
    dispToKg(v) { return this.cur() === "lb" ? v * 0.45359237 : v; },
    fmt(kg) {
      const v = this.kgToDisp(kg);
      if (this.cur() === "lb") return v.toFixed(1);
      return (Math.round(v * 10) / 10 + "").replace(/\.0$/, "");
    },
    step() { return this.cur() === "lb" ? 5 : 2.5; },
  };
  function fmtVol(kg) { return fmtNum(U.kgToDisp(kg)) + " " + U.cur(); }

  /* ---------- 计算 ---------- */
  function setVol(s) { return s.kg > 0 && s.reps > 0 ? s.kg * s.reps : 0; }
  function setE1RM(s) { return s.kg > 0 && s.reps > 0 ? s.kg * (1 + s.reps / 30) : 0; }
  function exVol(e) { return e.sets.reduce((a, s) => a + setVol(s), 0); }
  function workoutVol(w) { return w.exercises.reduce((a, e) => a + exVol(e), 0); }
  function setCount(w) { return w.exercises.reduce((a, e) => a + e.sets.length, 0); }
  // 秒数的人话格式：60 → 1 分，90 → 1 分 30 秒，45 → 45 秒
  function fmtSec(sec) {
    const t = Math.round(sec || 0);
    if (t <= 0) return "0 秒";
    if (t < 60) return t + " 秒";
    const m = Math.floor(t / 60), ss = t % 60;
    return ss ? m + " 分 " + ss + " 秒" : m + " 分";
  }
  // 动作类型标签：只有「计时」有意义要标出来，次数型是常态，不用占位置
  function typeTag(type) { return type === "time" ? "计时" : ""; }
  // 副标题拼接：部位 · 计时（次数型只显示部位）
  function catLine(cat, type) { return cat + (type === "time" ? " · 计时" : ""); }

  // 计时动作的显示单位：有氧器械按「分钟」，平板支撑 / 战绳这类短时动作按「秒」。
  // 优先看动作自带 unit，老记录没存 unit 时回内置库按 id 查；都查不到就是秒。
  function unitOf(ex) {
    if (!ex) return "sec";
    if (ex.unit) return ex.unit;
    if (ex.exerciseId) {
      const b = Store.BUILTIN.find((x) => x.id === ex.exerciseId);
      if (b && b.unit) return b.unit;
    }
    return "sec";
  }
  function setText(s, type, unit) {
    if (type === "time") {
      const sec = s.sec || 0;
      if (unit === "min") {
        const m = Math.floor(sec / 60), r = sec % 60;
        if (m && r) return m + " 分 " + r + " 秒";
        if (m) return m + " 分";
        return r + " 秒";
      }
      return sec + " 秒";
    }
    return (s.kg > 0 ? U.fmt(s.kg) + " " + U.cur() + " × " : "徒手 × ") + s.reps + " 次";
  }
  // 同一个动作里，某个重量出现了几次。返回每组的序号（1,2,3…），
  // 只出现一次的重量返回 0 不标——否则一堆互不相同的组都挂个 ×1，反而更乱。
  function repIdxOf(sets) {
    const total = {}, seen = {};
    sets.forEach((s) => { const k = s.kg || 0; total[k] = (total[k] || 0) + 1; });
    return sets.map((s) => {
      const k = s.kg || 0;
      if (total[k] < 2) return 0;
      seen[k] = (seen[k] || 0) + 1;
      return seen[k];
    });
  }

  window.Format = {
    esc: esc, pad: pad, fmtClock: fmtClock, fmtDur: fmtDur,
    fmtDate: fmtDate, WD: WD, fmtWD: fmtWD, dayKey: dayKey,
    fmtNum: fmtNum, fmtVol: fmtVol, U: U,
    setVol: setVol, setE1RM: setE1RM, exVol: exVol,
    workoutVol: workoutVol, setCount: setCount,
    fmtSec: fmtSec, typeTag: typeTag, catLine: catLine,
    unitOf: unitOf, setText: setText, repIdxOf: repIdxOf,
  };
})();
