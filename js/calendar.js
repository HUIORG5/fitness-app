/* 训练日历 + 月度小结：只负责「给定年月，生成一段 HTML」。
   从 app.js 切出来的原因：这两块是纯字符串拼接（100+ 行模板），
   数据只读 Store.data.workouts，不碰 DOM，翻月份的逻辑（calCursor）仍留在主文件。
   依赖 window.Format（格式化）和 window.Icons（图标 / 部位配色）。 */
(function () {
  "use strict";
  const F = window.Format;
  const fmtVol = F.fmtVol, fmtMins = F.fmtMins, workoutVol = F.workoutVol, exVol = F.exVol;
  const workoutSec = F.workoutSec, esc = F.esc;
  const icon = window.Icons.icon;
  const CAT_ICON = window.Icons.CAT_ICON;
  const CAT_COLORS = window.Icons.CAT_COLORS;
  const CAT_COLOR_FALLBACK = window.Icons.CAT_COLOR_FALLBACK;

  function dayRings(cats, vols) {
    const R = 12.4, cx = 18, cy = 18, C = 2 * Math.PI * R;
    const n = Math.min(cats.length, 3);
    const list = cats.slice(0, n);
    const vals = (vols || []).slice(0, n).map((v) => (v > 0 ? v : 0.01));
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    // 给个下限，否则「胸 4800 vs 肩 120」这种比例下，肩只剩一条几乎看不见的细线
    const weights = vals.map((v) => Math.max(v / total, 0.12));
    const wsum = weights.reduce((a, b) => a + b, 0);
    const gapDeg = n === 1 ? 48 : 22;
    // 缝看着要比算出来的宽：stroke-linecap:round 让每段两端各鼓起半个线宽，
    // 10 度在半径 12.4 的圈上只有 2px，被两个圆头一吃掉就贴在一起了，所以给到 22 度
    const usable = 360 - gapDeg * n;
    let out = "", at = -90 + gapDeg / 2;
    for (let i = 0; i < n; i++) {
      const sweep = usable * (weights[i] / wsum);
      const len = (C * sweep) / 360;
      const color = CAT_COLORS[list[i]] || CAT_COLOR_FALLBACK;
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + color +
        '" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="' + len.toFixed(1) + " " +
        (C - len).toFixed(1) + '" transform="rotate(' + at.toFixed(1) + " " + cx + " " + cy + ')"/>';
      at += sweep + gapDeg;
    }
    return out;
  }
  function calendarHtml(y, m) {
    const dayInfo = {};   // 日 -> { total, vol, cats }
    let total = 0;
    Store.data.workouts.forEach((w) => {
      const d = new Date(w.startedAt);
      if (d.getFullYear() !== y || d.getMonth() !== m) return;
      total++;
      const info = dayInfo[d.getDate()] || (dayInfo[d.getDate()] = { total: 0, vol: {}, cats: [] });
      info.total++;
      w.exercises.forEach((e) => {
        if (!e.cat) return;
        // 计时动作按分钟算，次数动作按容量算；同一天通常同类，混着排也够用
        const amount = e.type === "time"
          ? e.sets.reduce((a, s) => a + (s.sec || 0), 0) / 60
          : exVol(e);
        info.vol[e.cat] = (info.vol[e.cat] || 0) + amount;
      });
    });
    Object.keys(dayInfo).forEach((k) => {
      const info = dayInfo[k];
      info.cats = Object.keys(info.vol).sort((a, b) => info.vol[b] - info.vol[a]);
    });
    const days = new Date(y, m + 1, 0).getDate();
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7;   // 周一开头
    const today = new Date();
    const isThisMonth = today.getFullYear() === y && today.getMonth() === m;
    let cells = "";
    for (let i = 0; i < startDow; i++) cells += '<span class="cal-cell"></span>';
    for (let d = 1; d <= days; d++) {
      const info = dayInfo[d];
      const cats = info ? info.cats : [];
      const vols = info ? info.cats.map((c) => info.vol[c]) : [];
      const isToday = isThisMonth && today.getDate() === d;
      cells += '<span class="cal-cell' + (cats.length ? " on" : "") + (isToday ? " today" : "") + '">' +
        (cats.length ? '<svg class="cal-ring" viewBox="0 0 36 36" aria-hidden="true">' + dayRings(cats, vols) + "</svg>" : "") +
        '<span class="cal-num">' + d + "</span></span>";
    }
    const trainedDays = Object.keys(dayInfo).length;
    // 还没过完的月份只统计到今天，"休息多少天"才不会算上未来
    const elapsed = isThisMonth ? today.getDate() : days;
    const restDays = Math.max(0, elapsed - trainedDays);
    const sum = trainedDays
      ? "练了 " + trainedDays + " 天 · 休息 " + restDays + " 天" + (total > trainedDays ? " · 共 " + total + " 次" : "")
      : "这个月还没有训练记录";
    // 本月出现过的部位做个色标，按固定顺序排（胸背腿肩臂核心有氧），不然一堆颜色看不懂
    const seen = [];
    Object.keys(dayInfo).forEach((k) => dayInfo[k].cats.forEach((c) => { if (seen.indexOf(c) < 0) seen.push(c); }));
    seen.sort((a, b) => {
      const ia = Store.CATS.indexOf(a), ib = Store.CATS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const legend = seen.length
      ? '<div class="cal-legend">' + seen.map((c) =>
        '<span>' + (CAT_ICON[c] ? icon(CAT_ICON[c], 13, CAT_COLORS[c] || CAT_COLOR_FALLBACK) : "") + esc(c) + "</span>").join("") + "</div>"
      : "";
    return '<div class="cal-box">' +
      '<div class="cal-head"><button class="cal-nav" data-act="cal-prev" aria-label="上个月">‹</button>' +
      "<b>" + y + " 年 " + (m + 1) + " 月</b>" +
      '<button class="cal-nav" data-act="cal-next" aria-label="下个月"' + (isThisMonth ? " disabled" : "") + ">›</button></div>" +
      '<div class="cal-grid">' +
      ["一", "二", "三", "四", "五", "六", "日"].map((x) => '<span class="cal-dow">' + x + "</span>").join("") +
      cells + "</div>" +
      legend +
      '<div class="cal-sum">' + sum + "</div></div>";
  }

  /* ---------- 月度小结：接在日历下面，不额外占入口 ---------- */
  function monthSummary(y, m) {
    const inMonth = (w, yy, mm) => {
      const d = new Date(w.startedAt);
      return d.getFullYear() === yy && d.getMonth() === mm;
    };
    const ws = Store.data.workouts.filter((w) => inMonth(w, y, m));
    const vol = ws.reduce((a, w) => a + workoutVol(w), 0);
    const sec = ws.reduce((a, w) => a + workoutSec(w), 0);
    const mins = ws.reduce((a, w) => a + Math.max(0, (w.endedAt - w.startedAt) / 60000), 0);
    // 部位按「练过几次」算，同一次训练里同一个部位只记一次
    const catN = {};
    ws.forEach((w) => {
      const seen = {};
      w.exercises.forEach((e) => {
        if (!e.cat || seen[e.cat]) return;
        seen[e.cat] = 1;
        catN[e.cat] = (catN[e.cat] || 0) + 1;
      });
    });
    const topCat = Object.keys(catN).sort((a, b) => catN[b] - catN[a])[0] || "";
    const pm = m === 0 ? { y: y - 1, m: 11 } : { y: y, m: m - 1 };
    const prev = Store.data.workouts.filter((w) => inMonth(w, pm.y, pm.m));
    return {
      count: ws.length, vol, sec,
      avgMin: ws.length ? Math.round(mins / ws.length) : 0,
      topCat, topCatN: catN[topCat] || 0,
      prevVol: prev.reduce((a, w) => a + workoutVol(w), 0),
    };
  }
  function deltaHtml(cur, prev) {
    if (!prev) return cur > 0 ? '<span class="ms-delta">本月新增</span>' : "";
    const pct = Math.round(((cur - prev) / prev) * 100);
    if (!pct) return '<span class="ms-delta flat">跟上月持平</span>';
    return '<span class="ms-delta ' + (pct > 0 ? "up" : "down") + '">' +
      (pct > 0 ? "↑ " : "↓ ") + Math.abs(pct) + "%</span>";
  }
  function summaryHtml(y, m) {
    const s = monthSummary(y, m);
    const now = new Date();
    const isThisMonth = now.getFullYear() === y && now.getMonth() === m;
    if (!s.count) {
      return '<div class="ms-box"><div class="ms-head">' + (m + 1) + ' 月小结</div>' +
        '<p class="ms-empty">这个月还没有训练记录</p></div>';
    }
    // 有重量看容量，纯有氧看时长
    const main = s.vol > 0 ? fmtVol(s.vol) : fmtMins(Math.round(s.sec / 60));
    const line = [s.count + " 次训练",
      s.avgMin ? "平均 " + s.avgMin + " 分钟" : "",
      s.topCat ? "最常练 " + esc(s.topCat) + " ×" + s.topCatN : ""].filter(Boolean).join(" · ");
    // 最近 7 天只在当前月有意义，翻到历史月份就不显示
    let week = "";
    if (isThisMonth) {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).setHours(0, 0, 0, 0);
      const ws = Store.data.workouts.filter((w) => w.startedAt >= from);
      const wv = ws.reduce((a, w) => a + workoutVol(w), 0);
      week = '<div class="ms-week">最近 7 天：' + ws.length + " 次" +
        (wv > 0 ? " · " + fmtVol(wv) : "") + "</div>";
    }
    return '<div class="ms-box">' +
      '<div class="ms-head">' + (m + 1) + " 月小结" + deltaHtml(s.vol, s.prevVol) + "</div>" +
      '<div class="ms-main">' + main + "</div>" +
      '<div class="ms-line">' + line + "</div>" +
      week + "</div>";
  }

  window.Calendar = {
    html: (y, m) => calendarHtml(y, m) + summaryHtml(y, m),
    calendar: calendarHtml,
    summary: summaryHtml,
  };
})();
