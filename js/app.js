/* ============ 练了吗 · 主逻辑 ============ */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  // 与 sw.js 的 CACHE 版本保持一致，显示在设置页底部，便于确认手机跑的是哪一版
  const APP_VERSION = "v60";
  window.APP_VERSION_HINT = APP_VERSION;   // 错误上报要用（telemetry.js 在 IIFE 外）
  // 未上传头像时使用的默认头像
  const DEFAULT_AVATAR = "icons/avatar-default.png";

  /* ---------- 图标 ---------- */
  const ICONS = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
    chart: '<path d="M4 20V12M10 20V5M16 20v-6M22 20H2"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13.5h10L18 7M10 11v5.5M14 11v5.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    trophy: '<path d="M7 4h10v4.5a5 5 0 0 1-10 0V4zM7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4M12 13.5V16M8.5 20h7l-.8-4H9.3L8.5 20z"/>',
    download: '<path d="M12 4v11M8 11.5l4 3.5 4-3.5M5 19.5h14"/>',
    upload: '<path d="M12 15.5V4M8 7.5l4-3.5 4 3.5M5 19.5h14"/>',
    repeat: '<path d="M17 2.5l4 4-4 4M3 11.5v-1a4 4 0 0 1 4-4h14M7 21.5l-4-4 4-4M21 12.5v1a4 4 0 0 1-4 4H3"/>',
    flame: '<path d="M12 3s5.5 4.8 5.5 10a5.5 5.5 0 0 1-11 0c0-2.2 1-4 2.2-5 0 2.2 1 3.2 2.3 3.2 0-3.4 1.2-5.6 1-8.2z"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.6"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/>',
    xmark: '<path d="M6 6l12 12M18 6L6 18"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.7-3.7 3.6-5.8 7.2-5.8s6.5 2.1 7.2 5.8"/>',
  };
  function icon(name, size) {
    size = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || "") + "</svg>";
  }
  function injectIcons(root) {
    $$("[data-icon]", root || document).forEach((el) => {
      el.innerHTML = icon(el.dataset.icon, el.dataset.size || 24);
    });
  }

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
    return Math.floor(m / 60) + " 小时 " + pad(m % 60) + " 分";
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

  function setText(s, type) {
    if (type === "time") return s.sec + " 秒";
    return (s.kg > 0 ? U.fmt(s.kg) + " " + U.cur() + " × " : "徒手 × ") + s.reps + " 次";
  }
  function bestMaps() {
    const e1 = {}, vol = {};
    Store.data.workouts.forEach((w) => {
      w.exercises.forEach((e) => {
        e.sets.forEach((s) => {
          const r = setE1RM(s);
          if (r > 0 && (!e1[e.name] || r > e1[e.name].val)) e1[e.name] = { val: r, set: s, date: w.startedAt };
        });
        const v = exVol(e);
        if (v > 0 && (!vol[e.name] || v > vol[e.name].val)) vol[e.name] = { val: v, date: w.startedAt };
      });
    });
    return { e1: e1, vol: vol };
  }
  function lastSets(name) {
    const ws = Store.data.workouts.slice().sort((a, b) => b.startedAt - a.startedAt);
    for (const w of ws) {
      const e = w.exercises.find((x) => x.name === name);
      if (e && e.sets.length) return { sets: e.sets, type: e.type, date: w.startedAt };
    }
    return null;
  }
  function streakDays() {
    const days = new Set(Store.data.workouts.map((w) => dayKey(new Date(w.startedAt))));
    if (!days.size) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const y = new Date(today.getTime() - 86400000);
    let cur = days.has(dayKey(today)) ? today : (days.has(dayKey(y)) ? y : null);
    if (!cur) return 0;
    let n = 0;
    while (days.has(dayKey(cur))) { n++; cur = new Date(cur.getTime() - 86400000); }
    return n;
  }
  // 某个时间区间内「有训练的天数」与总容量（同一天练两次只算一天）
  function rangeStats(fromTs, toTs) {
    const days = {};
    let vol = 0;
    Store.data.workouts.forEach((w) => {
      if (w.startedAt < fromTs || w.startedAt > toTs) return;
      days[dayKey(new Date(w.startedAt))] = 1;
      vol += workoutVol(w);
    });
    return { days: Object.keys(days).length, vol: vol };
  }
  // 首页顶部六格：本周 / 本月 / 本年，统一按「训练天数」口径（原来本周算的是次数）
  function homeStats() {
    const now = new Date();
    const end = now.getTime();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    return {
      week: rangeStats(today.getTime() - 6 * 86400000, end),
      month: rangeStats(new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end),
      year: rangeStats(new Date(now.getFullYear(), 0, 1).getTime(), end),
      streak: streakDays(),
    };
  }

  /* 首页统计条：默认只露「以前那三个」，点开才铺满六格 —— 六格一起摆太占屏幕。
   * 折叠时就是最常用的三个（本周训练 / 本周容量 / 连续天数），展开后三个新指标接在后面，
   * 前三个位置不变，展开/收起不会跳。 */
  let statsOpen = false;
  function statStripHtml() {
    const st = homeStats();
    const head = [
      { v: st.week.days, t: "本周训练" },
      { v: fmtNum(U.kgToDisp(st.week.vol)), t: "本周容量 " + U.cur() },
      { v: st.streak, t: "连续天数" },
    ];
    const more = [
      { v: st.month.days, t: "本月训练" },
      { v: fmtNum(U.kgToDisp(st.month.vol)), t: "本月容量 " + U.cur() },
      { v: st.year.days, t: "本年训练" },
    ];
    const list = statsOpen ? head.concat(more) : head;
    return '<div class="week-strip">' +
      list.map((x) => '<div class="ws-item"><b>' + x.v + "</b><small>" + x.t + "</small></div>").join("") +
      '</div><button class="strip-toggle" data-act="toggle-stats">' + (statsOpen ? "收起 ▴" : "展开更多 ▾") + "</button>";
  }
  function toggleStats() {
    statsOpen = !statsOpen;
    const wrap = $("#stat-strip");
    if (wrap) wrap.outerHTML = '<div id="stat-strip">' + statStripHtml() + "</div>";
  }

  /* ---------- 提示 ---------- */
  let toastTimer = null;
  let lastToast = { msg: "", at: 0 };
  function toast(msg) {
    // 同一条消息 2 秒内只显示一次，避免重复的异步回调把提示刷屏
    const now = Date.now();
    if (msg === lastToast.msg && now - lastToast.at < 2000) return;
    lastToast = { msg: msg, at: now };
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
  function confirmAction(title, msg, okLabel, danger, cancelLabel) {
    return new Promise((res) => {
      $("#alert-title").textContent = title;
      $("#alert-msg").textContent = msg;
      const ok = $("#alert-ok"), can = $("#alert-cancel");
      ok.textContent = okLabel || "确定";
      can.textContent = cancelLabel || "取消";
      ok.className = "alert-btn" + (danger ? " danger" : " primary");
      $("#alert-backdrop").classList.add("show");
      function done(v) {
        $("#alert-backdrop").classList.remove("show");
        ok.onclick = null; can.onclick = null;
        res(v);
      }
      ok.onclick = () => done(true);
      can.onclick = () => done(false);
    });
  }

  /* ---------- 主题 ---------- */
  function applyTheme() {
    const t = Store.data.settings.theme;
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }

  /* ---------- 弹层 ---------- */
  function showSheet() { $("#sheet-backdrop").classList.add("show"); $("#sheet").classList.add("show"); }
  function closeSheet() {
    picker.from = null;   // 面板一关就忘掉来源，避免污染下一次打开
    $("#sheet-backdrop").classList.remove("show");
    $("#sheet").classList.remove("show");
    $("#sheet").classList.remove("picker-sheet");
  }
  function openSub(title, html, footer) {
    $("#sub-title").textContent = title;
    // footer：固定在内容底部的操作按钮区（可选）
    $("#sub-body").innerHTML = html + (footer ? '<div class="sub-footer">' + footer + "</div>" : "");
    $("#sub-body").scrollTop = 0;
    injectIcons($("#sub-body"));
    $("#sub-view").classList.add("show");
  }
  function closeSub() {
    $("#sub-view").classList.remove("show");
    // 二级页里改过计划（新建/删除/改名）后，底下的今天页还是旧 DOM：
    // 返回时重绘一次，免得用户必须手动刷新才看到。保留滚动位置。
    refreshTodayIfActive();
    // 从「全部历史」点进训练详情、在里面删了训练的话，返回时列表也要更新
    refreshHistoryIfActive();
  }
  // 今天页当前可见时重绘它（别的 tab 不动，避免无谓重建）
  function refreshTodayIfActive() {
    const scr = $("#screen-today");
    if (!scr || !scr.classList.contains("active")) return;
    const st = scr.scrollTop;
    renderToday();
    scr.scrollTop = st;
  }

  /* ---------- Tab 切换 ---------- */
  function switchTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + name));
    if (name === "today") renderToday();
    if (name === "exercises") renderExercises();
    if (name === "me") renderMe();
  }

  /* ================= 今天 ================= */
  function historyRow(w) {
    const d = new Date(w.startedAt);
    return '<button class="history-row" data-act="open-workout-detail" data-id="' + w.id + '">' +
      '<span class="hr-date"><b>' + d.getDate() + '</b><small>' + fmtWD(d) + '</small></span>' +
      '<span class="hr-info"><b>' + esc(w.name) + '</b><small>' + fmtDate(d) + " · " + fmtDur(w.endedAt - w.startedAt) +
      " · " + w.exercises.length + " 动作 · " + setCount(w) + " 组</small></span>" +
      '<span class="hr-vol">' + fmtVol(workoutVol(w)) + "<small>容量</small></span></button>";
  }
  function renderToday() {
    const c = $("#today-content");
    const d = Store.data;
    let html = "";
    const active = d.activeWorkout;
    if (active) {
      html += '<div class="active-card">' +
        '<div class="ac-head"><span class="ac-badge"><span class="ac-dot"></span>训练进行中</span>' +
        '<span class="ac-time" id="today-active-time">' + fmtClock(Date.now() - active.startedAt) + "</span></div>" +
        '<div class="ac-name">' + esc(active.name) + "</div>" +
        '<div class="ac-meta">' + active.exercises.length + " 个动作 · " + setCount(active) + " 组 · 容量 " + fmtVol(workoutVol(active)) + "</div>" +
        '<div class="ac-actions">' +
        '<button class="btn" data-act="resume-workout">继续训练</button>' +
        '<button class="btn danger" style="flex:none;width:88px" data-act="cancel-workout">放弃</button>' +
        "</div></div>";
    } else {
      html += '<button class="start-card" data-act="start-workout">' +
        '<span class="start-ico">' + icon("dumbbell", 26) + "</span>" +
        '<span class="start-text"><b>开始训练</b><small>记录今天的动作、组数与容量</small></span></button>';
    }
    // 训练计划入口：有计划就列出前两个，点击直接开始
    const plans = Store.livePlans();
    if (plans.length) {
      html += '<div class="section-title">训练计划</div><div class="list">' +
        plans.slice(0, 2).map((p) =>
          '<button class="row" data-act="plan-detail" data-id="' + p.id + '">' +
          '<span class="grow"><b>' + esc(p.name) + "</b>" +
          '<small style="display:block;color:var(--text-2);font-size:13px;margin-top:2px">' +
          p.items.length + " 个动作</small></span>" +
          '<span class="val">开始</span></button>').join("") +
        '<button class="row" data-act="plan-list"><span class="grow" style="color:var(--blue)">' +
        (plans.length > 2 ? "查看全部 " + plans.length + " 个计划" : "管理计划 · 新建") + "</span>" +
        '<span class="val">＋</span></button>' +
        "</div>";
    } else {
      // 必须包一层 .list：圆角/白卡/阴影都由 .list 提供，裸 .row 会变成一个直角长条
      html += '<div class="list" style="margin-top:10px">' +
        '<button class="row" data-act="plan-list" style="border-bottom:none">' +
        '<span class="grow" style="color:var(--blue)">＋ 新建训练计划</span>' +
        '<span class="val">排好常练的组合</span></button></div>';
    }
    html += '<div id="stat-strip">' + statStripHtml() + "</div>";
    const recent = d.workouts.slice().sort((a, b) => b.startedAt - a.startedAt).slice(0, 5);
    if (recent.length) {
      html += '<div class="section-title with-more"><span>最近训练</span>' +
        '<button class="st-more" data-act="open-all-history">全部历史 ›</button></div>' +
        '<div class="list">' + recent.map(historyRow).join("") + "</div>";
    }
    c.innerHTML = html;
    injectIcons(c);
  }

  /* ================= 动作库 ================= */
  const exFilter = { q: "", cat: "全部" };
  function renderExercises() {
    $("#category-chips").innerHTML = Store.CATS.map((c) =>
      '<button class="chip' + (exFilter.cat === c ? " active" : "") + '" data-act="filter-cat" data-cat="' + c + '">' + c + "</button>").join("");
    const q = exFilter.q.trim().toLowerCase();
    const list = Store.allExercises().filter((e) => {
      if (exFilter.cat === "自定义" && !e.custom) return false;
      if (exFilter.cat !== "全部" && exFilter.cat !== "自定义" && e.cat !== exFilter.cat) return false;
      if (q && e.name.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    const box = $("#exercise-list");
    if (!list.length) {
      box.innerHTML = '<div class="empty">' + icon("dumbbell", 40) + "<b>没有找到动作</b><p>换个关键词，或点右上角自定义动作</p></div>";
      injectIcons(box);
      return;
    }
    const order = ["胸", "背", "腿", "肩", "臂", "核心", "有氧"];
    const groups = {};
    list.forEach((e) => { (groups[e.cat] = groups[e.cat] || []).push(e); });
    const keys = order.filter((k) => groups[k]).concat(Object.keys(groups).filter((k) => order.indexOf(k) < 0));
    const bests = bestMaps().e1;
    let html = "";
    keys.forEach((k) => {
      html += '<div class="section-title">' + k + "</div><div class=\"list\">" +
        groups[k].map((e) => {
          const b = bests[e.name];
          return '<button class="row" data-act="open-exercise-detail" data-id="' + e.id + '" data-ex-id="' + e.id + '">' +
            '<span class="grow">' + esc(e.name) +
            (e.custom ? ' <span class="ex-cat">自定义</span>' : "") + "</span>" +
            // 最佳 e1RM 直接标在动作后面，不用再翻统计页
            (b ? '<span class="ex-best">' + U.fmt(b.val) + "<small>" + U.cur() + "</small></span>" : "") +
            (e.type === "time" ? '<span class="val">' + typeTag(e.type) + "</span>" : "") +
            '<span class="ex-drag" aria-label="拖动排序">' + icon("list", 16).replace('stroke-width="1.8"', 'stroke-width="2.4"') + "</span>" +
            "</button>";
        }).join("") + "</div>";
    });
    // 被移除的内置动作单独列出来，仍可点进详情看历史成绩、也可单独恢复
    const hidden = Store.hiddenList();
    const showHidden = hidden.length && !q && exFilter.cat === "全部";
    if (showHidden) {
      html += '<div class="section-title">已移除的动作 · ' + hidden.length + "</div><div class=\"list\">" +
        hidden.map((e) =>
          '<button class="row" data-act="open-exercise-detail" data-id="' + e.id + '">' +
          '<span class="grow" style="color:var(--text-2)">' + esc(e.name) + "</span>" +
          '<span class="val">已移除</span></button>').join("") + "</div>";
    }
    box.innerHTML = html;
    injectIcons(box);
  }

  /* ---------- 动作库排序：按住右侧 ≡ 拖动，分类内调整会同步到「全部」的顺序 ---------- */
  const exDrag = { on: false, row: null, cat: "全部" };

  function applyExOrder(newIds, cat) {
    const globalOld = Store.allExercises().map((e) => e.id);
    const moved = {};
    newIds.forEach((id) => { moved[id] = 1; });
    let out;
    if (!cat || cat === "全部") {
      // 全部视图里拖动：新顺序就是全部顺序
      out = newIds.concat(globalOld.filter((id) => !moved[id]));
    } else {
      // 分类视图里拖动：只重排该分类那一段，其余保持原位
      out = [];
      let done = false;
      globalOld.forEach((id) => {
        if (moved[id]) {
          if (!done) { newIds.forEach((x) => out.push(x)); done = true; }
        } else out.push(id);
      });
      if (!done) newIds.forEach((x) => out.push(x));
    }
    Store.data.exOrder = out.filter((v, i, a) => a.indexOf(v) === i);
    Store.touchLib();
  }

  function endExDrag() {
    if (!exDrag.on) return;
    exDrag.on = false;
    const row = exDrag.row;
    exDrag.row = null;
    if (!row || !row.parentElement) return;
    row.classList.remove("dragging");
    row.style.transform = ""; row.style.boxShadow = ""; row.style.zIndex = "";
    // 清掉所有行的过渡/下沉残留，回到原始尺寸
    Array.prototype.forEach.call(document.querySelectorAll(".row.drag-bumping"), (r) => r.classList.remove("drag-bumping"));
    const list = row.parentElement;
    const ids = Array.prototype.slice.call(list.querySelectorAll("[data-ex-id]")).map((el) => el.dataset.exId);
    if (ids.length > 1) applyExOrder(ids, exDrag.cat);
    renderExercises();
  }

  /* ---------- 右滑返回上一级 ----------
   * iOS Safari 把「屏幕左边缘右滑」占用来回历史网页了，网页拦不住。
   * 所以这里做的是：从屏幕中间开始向右滑，由 App 自己识别并返回上一级，
   * 跟手移动、松手到位则关闭，没到位则弹回。左边缘 40px 内不接管，留给浏览器。
   */
  const swipe = { active: false, armed: false, x0: 0, y0: 0, dx: 0, layer: null };
  let swipeJustEnded = 0; // 上一次“右滑返回”结束的时间，用于吃掉同序列的 click

  // 当前最上层的可关闭浮层（不含登录页：滑掉它没有意义）
  function topLayer() {
    const sels = ["#crop-view", "#reset-view", "#sheet", "#sub-view", "#history-view", "#workout-view"];
    for (let i = 0; i < sels.length; i++) {
      const el = $(sels[i]);
      if (el && el.classList.contains("show")) return el;
    }
    return null;
  }
  // 统一的“返回上一级”
  function goBack() {
    if ($("#crop-view").classList.contains("show")) return closeCropper();
    if ($("#reset-view").classList.contains("show")) { $("#reset-view").classList.remove("show"); return showAuth(); }
    if ($("#sheet").classList.contains("show")) return closeSheet();
    if ($("#sub-view").classList.contains("show")) return closeSub();
    if ($("#history-view").classList.contains("show")) return closeHistoryView();
    if ($("#workout-view").classList.contains("show")) return backWorkout();
  }

  function bindSwipeBack() {
    // 这些区域不启用手势：输入框、开关、滑块、拖动把手、裁剪取景框
    const SKIP = "input,textarea,select,.switch,.ex-drag,.crop-stage,.crop-zoom,[data-noblur]";
    document.addEventListener("pointerdown", (e) => {
      const layer = topLayer();
      if (!layer) return;
      if (e.clientX < 40) return;                       // 左边缘留给浏览器手势
      if (e.target.closest && e.target.closest(SKIP)) return;
      swipe.active = true; swipe.armed = false;
      swipe.x0 = e.clientX; swipe.y0 = e.clientY; swipe.dx = 0; swipe.layer = layer;
    }, true);

    document.addEventListener("pointermove", (e) => {
      if (!swipe.active) return;
      const dx = e.clientX - swipe.x0;
      const dy = e.clientY - swipe.y0;
      if (!swipe.armed) {
        if (dx < 28) return;                            // 还没达到触发阈值
        if (Math.abs(dy) > Math.abs(dx) * 1.2) { swipe.active = false; return; } // 竖向滚动，放弃
        swipe.armed = true;
        swipe.layer.style.transition = "none";
      }
      swipe.dx = Math.max(0, dx);
      if (e.cancelable) e.preventDefault();             // 别跟着滚页面
      swipe.layer.style.transform = "translateX(" + (swipe.dx * 0.85) + "px)";
    }, { capture: true, passive: false });

    const finish = () => {
      if (!swipe.active) return;
      const layer = swipe.layer;
      const done = swipe.armed && swipe.dx > 150;       // 滑过 150px 才算“想返回”（调长防误触）
      swipe.active = false; swipe.armed = false; swipe.layer = null;
      if (!layer) return;
      if (done) {
        layer.classList.add("no-anim");
        layer.style.transition = "transform .2s cubic-bezier(.32,.72,.35,1)";
        layer.style.transform = "translateX(100%)";
        setTimeout(() => {
          goBack();                                     // 关闭（no-anim 让它瞬间就位，看不见）
          layer.classList.remove("no-anim");
          layer.style.transition = "";
          layer.style.transform = "";
        }, 200);
        // 已经当成返回手势用了：同一指针序列随后会派发一个 click，别让它触发按钮
        swipeJustEnded = Date.now();
      } else {
        layer.style.transition = "transform .25s cubic-bezier(.32,.72,.35,1)";
        layer.style.transform = "";
        setTimeout(() => { layer.style.transition = ""; }, 280);
      }
    };
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
    // 只吃掉“右滑返回后同一序列”的那一次点击（350ms 内），不影响之后的正常点击
    document.addEventListener("click", (ev) => {
      if (swipeJustEnded && Date.now() - swipeJustEnded < 350) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }, true);
  }

  function bindExDrag() {
    document.addEventListener("pointerdown", (e) => {
      const h = e.target.closest ? e.target.closest(".ex-drag") : null;
      if (!h) return;
      const row = h.closest("[data-ex-id]");
      if (!row) return;
      exDrag.on = true;
      exDrag.row = row;
      exDrag.cat = exFilter.cat;
      row.classList.add("dragging");
      try { h.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }, true);
    document.addEventListener("pointermove", (e) => {
      if (!exDrag.on || !exDrag.row) return;
      const list = exDrag.row.parentElement;
      if (!list) return;
      const rows = Array.prototype.slice.call(list.querySelectorAll("[data-ex-id]"));
      let target = null;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r === exDrag.row) continue;
        const b = r.getBoundingClientRect();
        if (e.clientY < b.top + b.height / 2) { target = r; break; }
      }
      if (target) list.insertBefore(exDrag.row, target);
      else list.appendChild(exDrag.row);
      // 正在被跨越的那一行轻微“下沉”，让拖动项更突出
      rows.forEach((r) => r.classList.toggle("drag-bumping", r !== exDrag.row && r === target));
    }, true);
    document.addEventListener("pointerup", endExDrag, true);
    document.addEventListener("pointercancel", endExDrag, true);
  }

  /* ================= 历史 ================= */
  // 全部历史：底部 tab 已去掉「历史」，改为从今天页「最近训练」右侧进入的独立一层
  function historyHtml() {
    const ws = Store.data.workouts.slice().sort((a, b) => b.startedAt - a.startedAt);
    if (!ws.length) {
      return '<div class="empty">' + icon("list", 40) + "<b>还没有训练记录</b><p>完成第一次训练后会出现在这里</p></div>";
    }
    const groups = {};
    ws.forEach((w) => {
      const d = new Date(w.startedAt);
      const k = d.getFullYear() + "年" + (d.getMonth() + 1) + "月";
      (groups[k] = groups[k] || []).push(w);
    });
    let html = "";
    Object.keys(groups).forEach((k) => {
      const vol = groups[k].reduce((a, w) => a + workoutVol(w), 0);
      html += '<div class="section-title">' + k + " · " + groups[k].length + " 次 · 容量 " + fmtVol(vol) + "</div>" +
        '<div class="list">' + groups[k].map(historyRow).join("") + "</div>";
    });
    return html;
  }
  function openHistoryView() {
    const box = $("#history-body");
    box.innerHTML = historyHtml();
    box.scrollTop = 0;
    injectIcons(box);
    $("#history-view").classList.add("show");
  }
  function closeHistoryView() {
    $("#history-view").classList.remove("show");
  }
  // 在历史里点进详情、删掉某条训练后返回：列表得跟着变，且保住滚动位置
  function refreshHistoryIfActive() {
    const v = $("#history-view");
    if (!v || !v.classList.contains("show")) return;
    const box = $("#history-body");
    const st = box.scrollTop;
    box.innerHTML = historyHtml();
    injectIcons(box);
    box.scrollTop = st;
  }

  /* ================= 动作趋势 ================= */
  function trendPoints(name) {
    return Store.data.workouts
      .filter((w) => w.exercises.some((e) => e.name === name))
      .sort((a, b) => a.startedAt - b.startedAt).slice(-10)
      .map((w) => {
        const e = w.exercises.find((x) => x.name === name);
        const best = e.sets.reduce((a, s) => Math.max(a, setVol(s)), 0);
        const d = new Date(w.startedAt);
        return { label: d.getMonth() + 1 + "/" + d.getDate(), value: U.kgToDisp(best) };
      });
  }

  /* ================= 训练中 ================= */
  function openWorkoutView() {
    renderWorkout(true); // 打开界面时回到顶部
    $("#workout-view").classList.add("show");
  }
  function closeWorkoutView() {
    $("#workout-view").classList.remove("show");
    renderAll();
  }
  function updateWorkoutMeta() {
    const w = Store.data.activeWorkout;
    if (!w) return;
    $("#workout-volume").textContent = "容量 " + fmtVol(workoutVol(w));
    const at = lastSetAt(w);
    const box = $("#workout-last"), t = $("#last-set-time");
    if (box && t) {
      // 中间这格**始终占位**（grid 三列），否则它会塌掉、右侧齿轮滑到中间
      //   有记录：上组完成 / 16:56
      //   没记录：等待开始训练
      const small = box.querySelector("small");
      box.classList.add("show");
      box.classList.toggle("idle", !at);
      if (at) {
        if (small) small.textContent = "上组完成";
        t.textContent = fmtSetTime(at);
        t.style.display = "";
      } else {
        if (small) small.textContent = "等待开始训练";
        t.textContent = "";
        t.style.display = "none";
      }
    }
  }
  function renderWorkout(resetScroll) {
    const w = Store.data.activeWorkout;
    if (!w) return;
    $("#workout-name").value = w.name;
    const body = $("#workout-body");
    // 重新渲染不应打断阅读位置：只有真正“打开这个界面”时才回到顶部
    const keepTop = resetScroll ? 0 : body.scrollTop;
    if (!w.exercises.length) {
      body.innerHTML = '<div class="empty">' + icon("dumbbell", 40) + "<b>还没有添加动作</b><p>点击下方「添加动作」开始记录</p></div>";
    } else {
      const old = bestMaps();
      body.innerHTML = w.exercises.map((e, i) => exCard(e, i, old)).join("");
    }
    injectIcons(body);
    body.scrollTop = keepTop;
    updateWorkoutMeta();
  }
  // 把某个元素滚到可见范围（只在不完整可见时才滚动，避免整页跳动）
  function revealEl(el) {
    if (!el || !el.scrollIntoView) return;
    try { el.scrollIntoView({ block: "nearest" }); } catch (e) { el.scrollIntoView(false); }
  }
  function exCard(e, i, old) {
    // 只在「本次最大 e1RM 的那一组」上打 PR：
    //  - 同一重量重复几组，只有第一次达到最高值的那组标，不会连着标三行
    //  - 后面又突破了更重的，最大组换人，前面轻的那组自然不再标
    const e1s = e.sets.map((s) => setE1RM(s));
    let curBest = 0, curBestIdx = -1;
    e1s.forEach((v, k) => { if (v > curBest) { curBest = v; curBestIdx = k; } });
    const prevBest = ((old.e1[e.name] || {}).val || 0);
    const isNewPR = curBest > 0 && curBest > prevBest + 0.01;

    const rows = e.sets.map((s, si) => {
      const isPR = isNewPR && si === curBestIdx;
      return '<tr><td class="set-idx">' + (si + 1) + "</td><td>" +
        '<button class="set-row-btn set-main" data-act="edit-set" data-i="' + i + '" data-si="' + si + '">' +
        setText(s, e.type) + (isPR ? '<span class="pr-tag">PR</span>' : "") + "</button></td>" +
        '<td class="set-e1rm">' + (e.type === "time" || setE1RM(s) <= 0 ? "—" : U.fmt(setE1RM(s))) + "</td></tr>";
    }).join("");
    return '<div class="ex-card">' +
      '<div class="ex-head"><span class="grow"><b>' + esc(e.name) + "</b><small>" + catLine(e.cat, e.type) + "</small></span>" +
      '<span class="ex-cat">' + fmtVol(exVol(e)) + "</span>" +
      '<button class="nav-btn" style="width:30px;height:30px;background:none;color:var(--text-3)" data-act="del-exercise" data-i="' + i + '">' + icon("trash", 18) + "</button></div>" +
      '<table class="set-table"><tr><th>组</th><th>' + (e.type === "time" ? "时长" : "重量 × 次数") + "</th><th style=\"text-align:right\">e1RM</th></tr>" +
      rows + "</table>" +
      '<button class="add-set-btn" data-act="add-set" data-i="' + i + '">' + icon("plus", 16) + " 添加组</button></div>";
  }

  function startWorkout() {
    const d = new Date();
    Store.data.activeWorkout = {
      id: Store.uid(), startedAt: Date.now(),
      name: fmtDate(d) + "训练", exercises: [],
    };
    Store.save();
    openWorkoutView();
  }
  async function cancelWorkout() {
    const w = Store.data.activeWorkout;
    if (!w) return;
    if (setCount(w) > 0) {
      const ok = await confirmAction("放弃本次训练？", "已记录的 " + setCount(w) + " 组数据将被清除，无法恢复。", "放弃", true);
      if (!ok) return;
    }
    Store.data.activeWorkout = null;
    Store.save();
    closeWorkoutView();
    toast("已放弃本次训练");
  }
  function backWorkout() {
    // 返回 = 暂时保存进度并退出训练界面，之后可从今天页「继续训练」恢复
    Store.save();
    closeWorkoutView();
    toast("进度已保存，可稍后继续");
  }

  /* ---------- 记录组 ---------- */
  let draft = null;
  function openSetSheet(entryIdx, setIdx) {
    const w = Store.data.activeWorkout;
    const e = w.exercises[entryIdx];
    const editing = setIdx != null;
    const s = editing ? e.sets[setIdx] : null;
    const prevSet = !editing && e.sets.length ? e.sets[e.sets.length - 1] : null;
    const last = lastSets(e.name);
    let kg, reps, sec;
    if (editing) {
      kg = s.kg; reps = s.reps; sec = s.sec;
    } else if (prevSet) {
      // 往后的组接着上一组的重量和次数
      kg = prevSet.kg; reps = prevSet.reps; sec = prevSet.sec || 60;
    } else {
      // 第一组：重量与次数**独立判断**
      //   重量：设了默认重量就用它，否则跟随上次训练
      //   次数：在「我的」里明确设过默认次数（repsCustom）就固定用它，否则跟随上次训练
      // 旧版把次数绑在“默认重量 > 0”上，默认重量留空时默认次数形同虚设（用户反馈的“总要调很多次”）
      const st = Store.data.settings;
      const defKg = st.defaultKg || 0;
      const lastSet = last && last.sets.length ? last.sets[last.sets.length - 1] : null;
      if (e.type === "time") {
        kg = 0; reps = 0;
      } else {
        kg = defKg > 0 ? defKg : (lastSet ? lastSet.kg : 0);
        reps = st.repsCustom ? (st.defaultReps || 10) : (lastSet ? lastSet.reps : (st.defaultReps || 10));
      }
      sec = 60;
    }
    draft = {
      i: entryIdx, si: setIdx,
      kg: kg, reps: reps, sec: sec,
    };
    const step = U.step();
    let rows = "";
    if (e.type === "time") {
      rows = '<div class="stepper-row"><span class="stepper-label">时长<small>秒</small></span>' +
        '<span class="stepper"><button data-noblur data-act="dec-sec">−</button>' +
        '<input id="in-sec" type="number" inputmode="numeric" value="' + draft.sec + '">' +
        '<button data-noblur data-act="inc-sec">+</button></span></div>' +
        '<div class="chips" style="margin:10px 0">' +
        [30, 45, 60, 90, 120].map((v) => '<button class="chip" data-noblur data-act="quick-sec" data-v="' + v + '">' + v + "秒</button>").join("") + "</div>";
    } else {
      rows = '<div class="stepper-row"><span class="stepper-label">重量<small>' + U.cur() + " · 0 = 徒手</small></span>" +
        '<span class="stepper"><button data-noblur data-act="dec-kg">−</button>' +
        '<input id="in-kg" type="number" inputmode="decimal" value="' + U.fmt(draft.kg) + '">' +
        '<button data-noblur data-act="inc-kg">+</button></span></div>' +
        '<div class="stepper-row"><span class="stepper-label">次数<small>reps</small></span>' +
        '<span class="stepper"><button data-noblur data-act="dec-reps">−</button>' +
        '<input id="in-reps" type="number" inputmode="numeric" value="' + draft.reps + '">' +
        '<button data-noblur data-act="inc-reps">+</button></span></div>';
    }
    let lastHtml = "";
    if (last && last.sets.length) {
      lastHtml = '<div class="last-sets"><b>上次（' + fmtDate(new Date(last.date)) + "）</b>" +
        last.sets.slice(-5).map((s) => '<span class="ls-item">' + setText(s, last.type) + "</span>").join("") + "</div>";
    }
    $("#sheet-content").innerHTML =
      '<div class="sheet-title">' + (editing ? "修改组" : "添加组") + " · " + esc(e.name) + "</div>" +
      '<div class="sheet-sub">' + (e.type === "time" ? "记录本组时长" : "记录本组重量与次数，容量自动计算") + "</div>" +
      rows + lastHtml +
      '<button class="btn big" style="margin-top:16px" data-act="save-set">' + (editing ? "保存修改" : "完成本组") + "</button>" +
      (editing ? '<button class="btn danger" style="margin-top:10px" data-act="delete-set">删除本组</button>' : "");
    injectIcons($("#sheet-content"));
    showSheet();
  }
  function bump(sel, delta) {
    const inp = $(sel);
    if (!inp) return;
    const v = (parseFloat(inp.value) || 0) + delta;
    inp.value = v < 0 ? 0 : Math.round(v * 10) / 10;
  }
  function saveSet() {
    const w = Store.data.activeWorkout;
    const e = w.exercises[draft.i];
    const newAt = Date.now(); // 上组完成时间
    if (e.type === "time") {
      const sec = Math.max(1, Math.round(parseFloat($("#in-sec").value) || 0));
      if (draft.si != null) e.sets[draft.si].sec = sec;
      else e.sets.push({ id: Store.uid(), kg: 0, reps: 0, sec: sec, at: newAt });
    } else {
      const kg = Math.max(0, Math.round(U.dispToKg(parseFloat($("#in-kg").value) || 0) * 10) / 10);
      const reps = Math.max(1, Math.round(parseFloat($("#in-reps").value) || 0));
      if (draft.si != null) { e.sets[draft.si].kg = kg; e.sets[draft.si].reps = reps; }
      else e.sets.push({ id: Store.uid(), kg: kg, reps: reps, sec: 0, at: newAt });
    }
    const isNew = draft.si == null;
    const cardIdx = draft.i;
    Store.save();
    closeSheet();
    const setIdx = e.sets.length - 1;
    renderWorkout(); // 内部会刷新容量与「上组完成」时间，且保留滚动位置
    draft = null;
    if (isNew) {
      // 新增的组如果落在屏幕外，轻轻带一下；已经可见则完全不动
      revealEl(document.querySelector('[data-act="edit-set"][data-i="' + cardIdx + '"][data-si="' + setIdx + '"]'));
    }
  }
  async function deleteSet() {
    const ok = await confirmAction("删除本组？", "该组成绩将被移除。", "删除", true);
    if (!ok) return;
    const w = Store.data.activeWorkout;
    w.exercises[draft.i].sets.splice(draft.si, 1);
    Store.save();
    closeSheet();
    renderWorkout();
    draft = null;
  }
  async function delExercise(i) {
    const w = Store.data.activeWorkout;
    const ok = await confirmAction("移除动作？", "「" + w.exercises[i].name + "」及其所有组数将从本次训练中移除。", "移除", true);
    if (!ok) return;
    w.exercises.splice(i, 1);
    Store.save();
    renderWorkout();
  }

  /* ---------- 上组完成时间 ---------- */
  function lastSetAt(w) {
    let at = 0;
    w.exercises.forEach((e) => e.sets.forEach((s) => { if (s.at && s.at > at) at = s.at; }));
    return at;
  }
  function fmtSetTime(at) {
    const d = new Date(at);
    const now = new Date();
    const hm = pad(d.getHours()) + ":" + pad(d.getMinutes());
    if (d.toDateString() === now.toDateString()) return hm;
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + hm;
  }

  /* ---------- 完成训练 ---------- */
  function detectPRs(w) {
    const old = bestMaps();
    const prs = [];
    w.exercises.forEach((e) => {
      const bestR = e.sets.reduce((a, s) => Math.max(a, setE1RM(s)), 0);
      const bestV = exVol(e);
      if (bestR > 0 && bestR > ((old.e1[e.name] || {}).val || 0) + 0.01)
        prs.push(e.name + " · 估算1RM " + U.fmt(bestR) + " " + U.cur());
      if (bestV > 0 && bestV > ((old.vol[e.name] || {}).val || 0) + 0.01)
        prs.push(e.name + " · 单次容量 " + fmtVol(bestV));
    });
    return prs;
  }
  function finishWorkout() {
    const w = Store.data.activeWorkout;
    if (!w || setCount(w) === 0) { toast("还没有记录任何组数"); return; }
    const prs = detectPRs(w);
    $("#sheet-content").innerHTML =
      '<div class="sheet-title">训练完成！</div>' +
      '<div class="sheet-sub">' + esc(w.name) + " · " + fmtDate(new Date(w.startedAt)) + "</div>" +
      '<div class="sum-grid">' +
      '<div class="sum-item"><b>' + fmtDur(Date.now() - w.startedAt) + "</b><small>训练时长</small></div>" +
      '<div class="sum-item"><b>' + fmtVol(workoutVol(w)) + "</b><small>总容量</small></div>" +
      '<div class="sum-item"><b>' + w.exercises.length + "</b><small>动作数</small></div>" +
      '<div class="sum-item"><b>' + setCount(w) + "</b><small>总组数</small></div></div>" +
      (prs.length ? '<div class="sum-pr"><b>本次打破 ' + prs.length + ' 项个人记录</b>' +
        prs.map((p) => "<div>" + esc(p) + "</div>").join("") + "</div>" : "") +
      '<button class="btn big" data-act="save-workout-final">保存训练</button>' +
      '<button class="btn ghost" style="margin-top:10px" data-act="discard-workout-final">丢弃本次训练</button>';
    injectIcons($("#sheet-content"));
    showSheet();
  }
  function saveWorkoutFinal() {
    const w = Store.data.activeWorkout;
    w.endedAt = Date.now();
    if (!w.name.trim()) w.name = "训练";
    Store.data.workouts.push(w);
    Store.data.activeWorkout = null;
    Store.save();
    closeSheet();
    closeWorkoutView();
    toast("训练已保存");
    if (Cloud.isLoggedIn()) {
      Cloud.sync().then((r) => {
        if (r && !r.error) toast("已同步到云端");
        else if (r && r.error) toast("云端同步失败：" + r.error + "，可稍后在设置里手动同步");
      });
    }
  }
  async function discardWorkoutFinal() {
    const ok = await confirmAction("丢弃本次训练？", "所有记录将不会保存。", "丢弃", true);
    if (!ok) return;
    Store.data.activeWorkout = null;
    Store.save();
    closeSheet();
    closeWorkoutView();
  }

  /* ---------- 选择动作弹层 ---------- */
  const picker = { q: "", cat: "全部", from: null, multi: false, sel: {} };  // from: null=训练中 | "plan"=计划编辑
  function openExercisePicker() {
    picker.q = ""; picker.cat = "全部";
    picker.from = null;   // 必须复位：否则计划编辑残留的标记会让正常训练也走进计划分支
    $("#sheet-content").innerHTML =
      '<div class="sheet-title">添加动作</div>' +
      '<div class="search-bar" style="margin:10px 0"><span class="search-ico">' + icon("search", 18) + "</span>" +
      '<input id="picker-search" type="search" placeholder="搜索动作" autocomplete="off"></div>' +
      '<div class="chips" id="picker-chips"></div>' +
      '<button class="row picker-new" data-act="picker-new"><span class="grow">新建自定义动作</span>' +
      '<span class="val">库里没有？当场新建</span></button>' +
      '<div id="picker-list"></div>';
    injectIcons($("#sheet-content"));
    renderPicker();
    showSheet();
    setTimeout(() => { const i = $("#picker-search"); if (i) i.focus(); }, 300);
  }
  function renderPicker() {
    $("#picker-chips").innerHTML = Store.CATS.map((c) =>
      '<button class="chip' + (picker.cat === c ? " active" : "") + '" data-act="picker-cat" data-cat="' + c + '">' + c + "</button>").join("");
    const q = picker.q.trim().toLowerCase();
    const list = Store.allExercises().filter((e) => {
      if (picker.cat === "自定义" && !e.custom) return false;
      if (picker.cat !== "全部" && picker.cat !== "自定义" && e.cat !== picker.cat) return false;
      if (q && e.name.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    const box = $("#picker-list");
    const inPlan = picker.from === "plan";
    box.innerHTML = list.length
      ? '<div class="list">' + list.map((e) => {
        if (inPlan && picker.multi) {
          const on = !!picker.sel[e.id];
          return '<button class="row' + (on ? " picked-on" : "") + '" data-act="pick-exercise" data-id="' + e.id + '">' +
            '<span class="pcheck">' + (on ? "✓" : "") + "</span>" +
            '<span class="grow">' + esc(e.name) + "</span>" +
            (e.type === "time" ? '<span class="val">' + typeTag(e.type) + "</span>" : "") + "</button>";
        }
        const n = inPlan ? planDraft.items.filter((it) => it.exerciseId === e.id).length : 0;
        return '<button class="row" data-act="pick-exercise" data-id="' + e.id + '">' +
          '<span class="grow">' + esc(e.name) + "</span>" +
          '<span class="val">' + (n ? "已加入 " + n + " 次" : typeTag(e.type)) + "</span></button>";
      }).join("") + "</div>"
      : '<div class="empty" style="padding:28px"><b>没有找到动作</b><p>点上面的「新建自定义动作」当场添加</p></div>';
  }
  function pickExercise(id) {
    const ex = Store.findExercise(id);
    if (!ex) return;
    // 来自计划编辑：加入草稿并回到编辑器（默认组数/次数取设置里的值，重量取默认重量）
    if (picker.from === "plan") {
      // 批量模式：只切换勾选，最后统一提交
      if (picker.multi) {
        if (picker.sel[ex.id]) delete picker.sel[ex.id];
        else picker.sel[ex.id] = 1;
        renderPicker();
        updatePickDone();
        return;
      }
      // 单选模式：点一下就加入并关闭（计划只管动作，重量次数到训练时逐组记）
      planDraft.items.push({
        id: "pi_" + Store.uid(), exerciseId: ex.id, name: ex.name, cat: ex.cat, type: ex.type,
      });
      picker.from = null;
      closeSheet();
      renderPlanEditor();
      toast("已加入「" + ex.name + "」");
      return;
    }
    const w = Store.data.activeWorkout;
    if (!ex || !w) return;
    w.exercises.push({
      id: Store.uid(), exerciseId: ex.id, name: ex.name,
      cat: ex.cat, type: ex.type, sets: [],
    });
    Store.save();
    closeSheet();
    renderWorkout();
    openSetSheet(w.exercises.length - 1, null);
  }

  /* ================= 训练详情 ================= */
  function exCardReadonly(e) {
    const rows = e.sets.map((s, si) =>
      '<tr><td class="set-idx">' + (si + 1) + '</td><td class="set-main">' + setText(s, e.type) + "</td>" +
      '<td class="set-e1rm">' + (e.type === "time" || setE1RM(s) <= 0 ? "—" : U.fmt(setE1RM(s))) + "</td></tr>").join("");
    return '<div class="ex-card"><div class="ex-head"><span class="grow"><b>' + esc(e.name) + "</b><small>" + e.cat + "</small></span>" +
      '<span class="ex-cat">' + fmtVol(exVol(e)) + "</span></div>" +
      '<table class="set-table"><tr><th>组</th><th>' + (e.type === "time" ? "时长" : "重量 × 次数") + '</th><th style="text-align:right">e1RM</th></tr>' +
      rows + "</table></div>";
  }
  function openWorkoutDetail(id) {
    const w = Store.data.workouts.find((x) => x.id === id);
    if (!w) return;
    const d = new Date(w.startedAt);
    openSub("训练详情",
      '<div class="card card-pad" style="margin-top:12px">' +
      '<div style="font-size:22px;font-weight:800">' + esc(w.name) + "</div>" +
      '<div style="color:var(--text-2);font-size:14px;margin-top:2px">' + fmtDate(d) + " " + fmtWD(d) + " · " + fmtDur(w.endedAt - w.startedAt) + "</div>" +
      '<div class="sum-grid" style="margin:14px 0 0">' +
      '<div class="sum-item"><b>' + fmtVol(workoutVol(w)) + "</b><small>总容量</small></div>" +
      '<div class="sum-item"><b>' + w.exercises.length + "</b><small>动作数</small></div>" +
      '<div class="sum-item"><b>' + setCount(w) + "</b><small>总组数</small></div>" +
      '<div class="sum-item"><b>' + fmtClock(w.endedAt - w.startedAt) + "</b><small>时长</small></div></div></div>" +
      w.exercises.map(exCardReadonly).join("") +
      '<div style="display:flex;gap:10px;margin-top:6px">' +
      '<button class="btn" data-act="share-workout" data-id="' + w.id + '">分享长图</button>' +
      '<button class="btn ghost" data-act="repeat-workout" data-id="' + w.id + '">再次训练</button></div>' +
      '<div style="display:flex;gap:10px;margin-top:10px">' +
      '<button class="btn danger" style="flex:none;width:110px" data-act="delete-workout" data-id="' + w.id + '">删除</button></div>');
  }
  /* ================= 训练计划 ================= */
  /* 计划草稿：新建/编辑时用。items 里每项 = 一个动作 + 目标组数/次数/重量 */
  const planDraft = { id: null, name: "", items: [] };

  function openPlanList() {
    const plans = Store.livePlans();
    openSub("训练计划",
      plans.length
        ? plans.map(planRow).join("")
        : '<div class="empty">' + icon("list", 40) + "<b>还没有训练计划</b><p>先把常练的安排好，之后一键开始</p></div>",
      '<button class="btn big" data-act="plan-new">新建计划</button>');
  }

  function planRow(p) {
    return '<button class="row" data-act="plan-detail" data-id="' + p.id + '">' +
      '<span class="grow"><b>' + esc(p.name) + "</b>" +
      '<small style="display:block;color:var(--text-2);font-size:13px;margin-top:2px">' +
      p.items.length + " 个动作 · " +
      p.items.slice(0, 3).map((it) => esc(it.name)).join(" /") + (p.items.length > 3 ? " …" : "") +
      "</small></span>" +
      '<span class="val">开始</span></button>';
  }

  function openPlanDetail(id) {
    const p = Store.findPlan(id);
    if (!p || p.deleted) return;
    openSub(p.name,
      '<div class="card card-pad" style="margin-top:12px">' +
      '<div class="pd-meta">' + p.items.length + " 个动作 · 训练时逐组记录重量与次数</div>" +
      '<div class="list" style="margin-top:10px">' +
      p.items.map(planItemRow).join("") + "</div></div>",
      '<button class="btn big" data-act="plan-start" data-id="' + p.id + '">按这个计划开始训练</button>' +
      '<div style="display:flex;gap:10px;margin-top:10px">' +
      '<button class="btn ghost" data-act="plan-edit" data-id="' + p.id + '">编辑计划</button>' +
      '<button class="btn danger" style="flex:none;width:96px" data-act="plan-delete" data-id="' + p.id + '">删除</button></div>');
  }

  // 计划里的一项：只有动作（重量/次数留到训练时逐组记）
  function planItemRow(it, i) {
    return '<div class="row" style="cursor:default">' +
      '<span class="pd-idx">' + (i + 1) + "</span>" +
      '<span class="grow"><b>' + esc(it.name) + "</b>" +
      '<small style="display:block;color:var(--text-2);font-size:13px;margin-top:2px">' +
      catLine(it.cat, it.type) + "</small></span>" +
      "</div>";
  }

  /* ---------- 新建 / 编辑计划 ---------- */
  function openPlanEditor(id) {
    const p = id ? Store.findPlan(id) : null;
    planDraft.id = p ? p.id : null;
    planDraft.name = p ? p.name : "";
    planDraft.items = p ? p.items.map((it) => Object.assign({}, it)) : [];
    renderPlanEditor();
  }
  function renderPlanEditor() {
    // 重渲染前把名称输入框里的值读回草稿：否则“添加动作→完成选择”回来会把用户起的名字覆盖成空
    const nameEl = $("#plan-name");
    if (nameEl && nameEl.value.trim()) planDraft.name = nameEl.value;
    // 名称放顶部导航（和训练页一样可编辑），保存按钮在右上
    $("#plan-name").value = planDraft.name;
    $("#plan-name").placeholder = planDraft.id ? "计划名称" : "计划名称，如：背部 · 增肌";
    refreshPlanSummary();
    $("#plan-body").innerHTML = planDraft.items.length
      ? planDraft.items.map(planEditRow).join("")
      : '<div class="empty">' + icon("list", 40) + "<b>还没有动作</b><p>点下面的「添加动作」从动作库挑</p></div>";
    injectIcons($("#plan-body"));
    closeSub();                       // 列表/详情页退到后面，编辑器独占屏幕
    $("#plan-view").classList.add("show");
  }
  function closePlanEditor() {
    // 名称读回草稿，方便返回后再进来不丢
    const nameEl = $("#plan-name");
    if (nameEl && nameEl.value.trim()) planDraft.name = nameEl.value;
    $("#plan-view").classList.remove("show");
  }
  // 编辑态的一项：只有动作本身（不设组、不设重量），重量次数留到训练时逐组记
  function planEditRow(it, i) {
    return '<div class="ex-card">' +
      '<div class="ex-head">' +
      '<span class="grow"><b>' + (i + 1) + ". " + esc(it.name) + "</b><small>" +
      catLine(it.cat, it.type) + "</small></span>" +
      '<button class="nav-btn" style="width:30px;height:30px;background:none;color:var(--text-3)" data-act="plan-item-del" data-i="' + i + '">' +
      icon("trash", 18) + "</button></div></div>";
  }
  /* ---------- 编辑器辅助 ---------- */
  // 添加动作（计划）：默认「点一下即加入并关闭」（和训练页一致）；
  // 想一次挑多个就点右上「批量选择」，进入多选，底部固定「完成选择」随时可点。
  function openPlanAddExercise() {
    picker.from = "plan";
    picker.multi = false;
    picker.sel = {};
    $("#sheet").classList.add("picker-sheet");
    $("#sheet-content").innerHTML =
      '<div class="picker-head">' +
      '<div class="sheet-title picker-title"><span>添加动作到计划</span>' +
      '<button class="picker-mode" id="picker-mode-btn" data-act="plan-pick-mode">批量选择</button></div>' +
      '<div class="search-bar" style="margin:10px 0"><span class="search-ico">' + icon("search", 18) + "</span>" +
      '<input id="picker-search" type="search" placeholder="搜索动作" autocomplete="off"></div>' +
      '<div class="chips" id="picker-chips"></div>' +
      '<button class="row picker-new" data-act="picker-new-plan"><span class="grow">新建自定义动作</span>' +
      '<span class="val">库里没有？当场新建</span></button>' +
      '</div>' +
      '<div class="picker-scroll" id="picker-list"></div>' +
      '<div class="picker-foot" id="picker-foot" style="display:none">' +
      '<button class="btn big" id="plan-pick-done" data-act="plan-pick-done">完成选择（0）</button></div>';
    injectIcons($("#sheet-content"));
    renderPicker();
    showSheet();
    setTimeout(() => { const i = $("#picker-search"); if (i) i.focus(); }, 300);
  }
  // 切换批量模式
  function togglePickerMulti() {
    picker.multi = !picker.multi;
    picker.sel = {};
    const btn = $("#picker-mode-btn");
    if (btn) btn.textContent = picker.multi ? "退出批量" : "批量选择";
    const foot = $("#picker-foot");
    if (foot) foot.style.display = picker.multi ? "" : "none";
    renderPicker();
    updatePickDone();
  }
  function updatePickDone() {
    const b = $("#plan-pick-done");
    if (b) b.textContent = "完成选择（" + Object.keys(picker.sel).length + "）";
  }
  // 批量模式提交：把勾选的动作一次性加入草稿
  function commitPicked() {
    const ids = Object.keys(picker.sel);
    if (!ids.length) { toast("还没有选择动作"); return; }
    ids.forEach((id) => {
      const ex = Store.findExercise(id);
      if (!ex) return;
      planDraft.items.push({
        id: "pi_" + Store.uid(), exerciseId: ex.id, name: ex.name, cat: ex.cat, type: ex.type,
      });
    });
    const n = ids.length;
    picker.from = null;
    picker.multi = false;
    picker.sel = {};
    closeSheet();
    renderPlanEditor();
    toast("已加入 " + n + " 个动作");
  }

  // 顶部汇总：只要动作数
  function refreshPlanSummary() {
    const sum = $("#plan-summary");
    if (sum) sum.textContent = planDraft.items.length + " 个动作";
  }

  function removePlanItem(i) {
    if (i < 0 || i >= planDraft.items.length) return;
    planDraft.items.splice(i, 1);
    renderPlanEditor();
    toast("已移除该动作");
  }
  function savePlanFromEditor() {
    const name = ($("#plan-name").value || "").trim();
    if (!name) { toast("请先填写计划名称"); return; }
    if (!planDraft.items.length) { toast("至少添加一个动作"); return; }
    // 只保留动作字段：计划不再存组/重量/次数（旧版本遗留的 sets 等字段一并丢掉）
    const clean = () => planDraft.items.map((it) => ({
      id: it.id, exerciseId: it.exerciseId, name: it.name, cat: it.cat, type: it.type,
    }));
    const now = Date.now();
    const plan = planDraft.id ? Store.findPlan(planDraft.id) : null;
    if (plan) {
      plan.name = name;
      plan.items = clean();
      plan.updatedAt = now;
      Store.savePlan(plan);
      $("#plan-view").classList.remove("show");
      toast("计划已更新");
      openPlanDetail(plan.id);
    } else {
      const np = {
        id: "p_" + Store.uid(), name: name,
        items: clean(),
        createdAt: now, updatedAt: now, deleted: false,
      };
      Store.savePlan(np);
      $("#plan-view").classList.remove("show");
      toast("计划已保存");
      openPlanDetail(np.id);
    }
  }

  async function deletePlanFlow(id) {
    const ok = await confirmAction("删除这个计划？", "只删除计划本身，不会影响已完成的训练记录。", "删除", true);
    if (!ok) return;
    Store.deletePlan(id);
    openPlanList();
    toast("计划已删除");
  }

  /* ---------- 从计划开始训练 ---------- */
  function startPlanWorkout(id) {
    const p = Store.findPlan(id);
    if (!p || p.deleted) return;
    if (Store.data.activeWorkout) { toast("请先完成或放弃当前训练"); return; }
    Store.data.activeWorkout = {
      id: Store.uid(), startedAt: Date.now(), name: p.name,
      planId: p.id,                       // 来源计划
      // 计划只提供动作清单：进来后每个动作都是空组，训练时逐组记录实际重量与次数
      exercises: p.items.map((it) => ({
        id: Store.uid(), exerciseId: it.exerciseId, name: it.name,
        cat: it.cat, type: it.type, sets: [],
      })),
    };
    Store.save();
    closeSub();
    openWorkoutView();
    toast("已按「" + p.name + "」开始，加油");
  }

  /* ---------- 分享长图：把整页训练记录画成一张图，带二维码 ---------- */
  function shareWorkout(id) {
    const w = Store.data.workouts.find((x) => x.id === id);
    if (!w) return;
    toast("正在生成图片…");
    buildShareCard(w).then((url) => {
      const img = $("#share-img");
      img.src = url;
      img.onload = () => { $("#share-view").classList.add("show"); };
      if (img.complete) $("#share-view").classList.add("show");
    }).catch(() => toast("图片生成失败，请重试"));
  }

  function buildShareCard(w) {
    return new Promise((resolve, reject) => {
      const qr = new Image();
      qr.onload = () => { try { resolve(drawShareCard(w, qr)); } catch (e) { reject(e); } };
      qr.onerror = () => reject(new Error("qr load fail"));
      qr.src = "icons/qr-home.png";
    });
  }

  function drawShareCard(w, qr) {
    const W = 750, PAD = 36, CW = W - PAD * 2;
    const FONT = '-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif';
    const INK = "#1c1c1e", SUB = "#8e8e93", LINE = "rgba(60,60,67,.12)", BLUE = "#007aff";
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = 5000;
    const c = cv.getContext("2d");
    const F = (size, weight) => { c.font = (weight || 400) + " " + size + "px " + FONT; };

    function rr(x, y, iw, ih, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + iw, y, x + iw, y + ih, r);
      c.arcTo(x + iw, y + ih, x, y + ih, r);
      c.arcTo(x, y + ih, x, y, r);
      c.arcTo(x, y, x + iw, y, r);
      c.closePath();
    }
    function card(x, y, iw, ih) { c.fillStyle = "#fff"; rr(x, y, iw, ih, 20); c.fill(); }

    // 背景
    c.fillStyle = "#f2f2f7"; c.fillRect(0, 0, W, 5000);

    let y = 34;
    // 顶部品牌
    F(30, 800); c.fillStyle = INK; c.textAlign = "left";
    c.fillText("练了吗", PAD, y + 26);
    F(15); c.fillStyle = SUB;
    c.fillText("记录每一组的进步", PAD + 108, y + 26);
    y += 62;

    // 标题 + 日期
    F(34, 800); c.fillStyle = INK;
    c.fillText(w.name || "训练", PAD, y + 30);
    y += 44;
    F(17); c.fillStyle = SUB;
    const d = new Date(w.startedAt);
    c.fillText(fmtDate(d) + " " + fmtWD(d) + " · " + fmtDur(w.endedAt - w.startedAt), PAD, y + 16);
    y += 40;

    // 汇总卡（2x2）
    const sumH = 150;
    card(PAD, y, CW, sumH);
    const items = [
      [fmtVol(workoutVol(w)), "总容量"],
      [w.exercises.length + "", "动作数"],
      [setCount(w) + "", "总组数"],
      [fmtClock(w.endedAt - w.startedAt), "时长"],
    ];
    items.forEach((it, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = PAD + 24 + col * (CW / 2), cy = y + 26 + row * 66;
      F(26, 800); c.fillStyle = INK; c.textAlign = "left";
      c.fillText(it[0], cx, cy + 20);
      F(14); c.fillStyle = SUB;
      c.fillText(it[1], cx, cy + 42);
      // 分隔线
      c.strokeStyle = LINE; c.lineWidth = 1;
      if (col === 0) { c.beginPath(); c.moveTo(PAD + CW / 2, cy - 6); c.lineTo(PAD + CW / 2, cy + 48); c.stroke(); }
      if (row === 0) { c.beginPath(); c.moveTo(PAD + 16, y + sumH / 2 + 4); c.lineTo(PAD + CW - 16, y + sumH / 2 + 4); c.stroke(); }
    });
    y += sumH + 18;

    // 每个动作一张卡
    w.exercises.forEach((e) => {
      const rowH = 40, headH = 58;
      const h = headH + 26 + e.sets.length * rowH + 12;
      card(PAD, y, CW, h);
      // 动作名 + 分类
      F(21, 700); c.fillStyle = INK; c.textAlign = "left";
      c.fillText(e.name, PAD + 20, y + 36);
      F(14); c.fillStyle = SUB;
      c.fillText(e.cat, PAD + 20 + c.measureText(e.name).width + 12, y + 36);
      // 右侧容量
      F(15, 600); c.fillStyle = BLUE; c.textAlign = "right";
      c.fillText(fmtVol(exVol(e)), PAD + CW - 20, y + 36);
      // 表头
      c.textAlign = "left";
      F(13); c.fillStyle = SUB;
      c.fillText("组", PAD + 20, y + headH + 12);
      c.fillText(e.type === "time" ? "时长" : "重量 × 次数", PAD + 70, y + headH + 12);
      c.textAlign = "right";
      c.fillText("e1RM", PAD + CW - 20, y + headH + 12);
      // 行
      e.sets.forEach((s2, si) => {
        const ry = y + headH + 26 + si * rowH + 22;
        c.textAlign = "left"; F(14); c.fillStyle = SUB;
        c.fillText(String(si + 1), PAD + 20, ry);
        F(16); c.fillStyle = INK;
        c.fillText(setText(s2, e.type), PAD + 70, ry);
        c.textAlign = "right"; F(15); c.fillStyle = SUB;
        const e1 = e.type === "time" || setE1RM(s2) <= 0 ? "—" : U.fmt(setE1RM(s2));
        c.fillText(e1, PAD + CW - 20, ry);
        if (si < e.sets.length - 1) {
          c.strokeStyle = LINE; c.lineWidth = 1;
          c.beginPath(); c.moveTo(PAD + 16, ry + 14); c.lineTo(PAD + CW - 16, ry + 14); c.stroke();
        }
      });
      y += h + 14;
    });

    // 底部二维码区
    const footH = 200;
    card(PAD, y, CW, footH);
    const qs = 132, qx = PAD + 26, qy = y + (footH - qs) / 2;
    c.drawImage(qr, qx, qy, qs, qs);
    F(19, 700); c.fillStyle = INK; c.textAlign = "left";
    c.fillText("扫码一起练", PAD + 26 + qs + 22, qy + 44);
    F(14); c.fillStyle = SUB;
    c.fillText("记录每一组的进步", PAD + 26 + qs + 22, qy + 72);
    F(13); c.fillStyle = BLUE;
    c.fillText("huiorg5.github.io/fitness-app", PAD + 26 + qs + 22, qy + 98);
    y += footH + 30;

    // 裁剪到实际高度
    const out = document.createElement("canvas");
    out.width = W; out.height = y;
    out.getContext("2d").drawImage(cv, 0, 0, W, y, 0, 0, W, y);
    return out.toDataURL("image/png");
  }

  function repeatWorkout(id) {
    const w = Store.data.workouts.find((x) => x.id === id);
    if (!w) return;
    if (Store.data.activeWorkout) {
      toast("请先完成或放弃当前训练");
      return;
    }
    Store.data.activeWorkout = {
      id: Store.uid(), startedAt: Date.now(), name: w.name,
      exercises: w.exercises.map((e) => ({
        id: Store.uid(), exerciseId: e.exerciseId, name: e.name,
        cat: e.cat, type: e.type, sets: [],
      })),
    };
    Store.save();
    closeSub();
    openWorkoutView();
    toast("已载入「" + w.name + "」的动作");
  }
  async function deleteWorkout(id) {
    const ok = await confirmAction("删除这条训练记录？", "删除后无法恢复，可先在设置中导出备份。", "删除", true);
    if (!ok) return;
    Store.data.workouts = Store.data.workouts.filter((x) => x.id !== id);
    // 记墓碑：否则下次云同步会把它当作“云端独有”又拉回本机
    if (!Array.isArray(Store.data.deletedWorkouts)) Store.data.deletedWorkouts = [];
    Store.data.deletedWorkouts.push({ id: id, at: Date.now() });
    Store.save();
    closeSub();
    renderAll();
    toast("已删除");
    if (Cloud.isLoggedIn()) doSync(true); // 静默同步，把云端那条一起删掉
  }

  /* ================= 动作详情 / 自定义动作 ================= */
  // 一次训练里某个动作「最重的那组」（计时动作取最长），用于最近记录行的右侧值
  function topSet(sets, type) {
    if (!sets || !sets.length) return null;
    const score = (s) => (type === "time" ? (s.sec || 0) : (s.kg || 0) * 10000 + (s.reps || 0));
    return sets.reduce((a, s) => (score(s) > score(a) ? s : a));
  }
  function openExerciseDetail(id) {
    const ex = Store.findExerciseAny ? Store.findExerciseAny(id) : Store.findExercise(id);
    if (!ex) return;
    const isHidden = !!(Store.data.hiddenBuiltins || []).length && Store.data.hiddenBuiltins.indexOf(id) >= 0;
    const ws = Store.data.workouts.filter((w) => w.exercises.some((e) => e.name === ex.name))
      .sort((a, b) => b.startedAt - a.startedAt);
    let statsHtml = "";
    if (ws.length) {
      const last = ws[0];
      const best = bestMaps().e1[ex.name];
      statsHtml = '<div class="list" style="margin-bottom:14px">' +
        '<div class="row"><span class="grow">训练次数</span><span class="val">' + ws.length + " 次</span></div>" +
        '<div class="row"><span class="grow">最近训练</span><span class="val">' + fmtDate(new Date(last.startedAt)) + "</span></div>" +
        (best ? '<div class="row"><span class="grow">最佳估算1RM</span><span class="val">' + U.fmt(best.val) + " " + U.cur() + "</span></div>" : "") +
        "</div>";
    }
    // 单次最佳容量趋势（原来在统计页，现在跟着动作走）：一次训练只有一个点，没意义，攒到 2 次再画
    const pts = trendPoints(ex.name);
    const trendHtml = pts.length >= 2
      ? '<div class="section-title">单次最佳容量 · 最近 ' + pts.length + ' 次</div><div class="chart-box"><div id="ex-trend-chart"></div></div>'
      : '<p class="set-note" style="margin-top:14px">再练一次就能看到容量趋势</p>';
    // 最近几次练这个动作的记录，点进去就是那天的训练详情
    const recentHtml = ws.length
      ? '<div class="section-title">最近记录</div><div class="list">' + ws.slice(0, 6).map((w) => {
          const it = w.exercises.find((x) => x.name === ex.name);
          const top = topSet(it.sets, ex.type);
          const val = top
            ? (ex.type === "time" ? fmtClock(top.sec || 0) : U.fmt(U.kgToDisp(top.kg || 0)) + " × " + (top.reps || 0))
            : "—";
          return '<button class="row" data-act="open-workout-detail" data-id="' + w.id + '">' +
            '<span class="grow">' + fmtDate(new Date(w.startedAt)) +
            '<span class="row-sub">' + it.sets.length + " 组 · 容量 " + fmtVol(exVol(it)) + "</span></span>" +
            '<span class="val">' + val + "</span></button>";
        }).join("") + "</div>"
      : "";

    openSub("动作详情",
      '<div class="card card-pad" style="margin-top:12px;text-align:center">' +
      '<div style="font-size:21px;font-weight:800">' + esc(ex.name) + "</div>" +
      '<div style="color:var(--text-2);font-size:13.5px;margin-top:3px">' + ex.cat + " · " + (ex.type === "time" ? "计时动作" : "次数动作") +
      (ex.custom ? " · 自定义" : "") + (isHidden ? " · 已从动作库移除" : "") + "</div></div>" + statsHtml +
      (Store.data.activeWorkout && !isHidden ? '<button class="btn" data-act="join-active" data-id="' + ex.id + '">加入当前训练</button>' : "") +
      trendHtml + recentHtml +
      (ex.custom
        ? '<button class="btn danger" style="margin-top:16px" data-act="delete-custom-exercise" data-id="' + ex.id + '">删除此动作</button>'
        : isHidden
          ? '<button class="btn" style="margin-top:16px" data-act="restore-builtin" data-id="' + ex.id + '">恢复到动作库</button>' +
            '<p class="set-note" style="margin-top:10px">已移除的动作不会出现在选择列表，但历史记录和趋势都还在</p>'
          : '<button class="btn danger" style="margin-top:16px" data-act="hide-builtin" data-id="' + ex.id + '">从动作库移除</button>' +
            '<p class="set-note" style="margin-top:10px">内置动作只是隐藏，历史记录不受影响，可在动作库右上角「重置」恢复</p>'));
    if ($("#ex-trend-chart")) Charts.lineChart($("#ex-trend-chart"), pts);
  }
  function joinActive(id) {
    const ex = Store.findExercise(id);
    const w = Store.data.activeWorkout;
    if (!ex || !w) return;
    w.exercises.push({
      id: Store.uid(), exerciseId: ex.id, name: ex.name,
      cat: ex.cat, type: ex.type, sets: [],
    });
    Store.save();
    closeSub();
    openWorkoutView();
    toast("已加入「" + ex.name + "」");
  }
  const customDraft = { name: "", cat: "胸", type: "reps" };
  let customFrom = null; // 从哪里打开的：null=动作库；"picker"=训练中添加动作；"plan"=计划编辑
  function openCustomExercise(from) {
    customFrom = from || null;
    customDraft.name = "";
    // 部位默认跟着“你眼前那个分类”走：从选择面板（训练/计划）进来就用面板选中的分类，
    // 从动作库进来就用动作库的筛选。之前漏了 "plan"，会回落到动作库筛选（常是「全部」→ 胸）
    const inPicker = customFrom === "picker" || customFrom === "plan";
    const base = inPicker ? picker.cat : exFilter.cat;
    customDraft.cat = (base && base !== "全部" && base !== "自定义") ? base : "胸";
    customDraft.type = "reps";
    $("#sheet-content").innerHTML =
      '<div class="sheet-title">自定义动作</div>' +
      '<div class="sheet-sub">添加动作库中没有的动作</div>' +
      '<div class="search-bar" style="margin:4px 0 14px"><input id="custom-ex-name" type="text" placeholder="动作名称，如：杠铃臀推" maxlength="16"></div>' +
      '<div class="chips" id="custom-cat-chips" style="margin-bottom:12px"></div>' +
      '<div class="seg" id="custom-type-seg" style="margin-bottom:18px">' +
      '<button data-act="custom-type" data-v="reps">记次数</button>' +
      '<button data-act="custom-type" data-v="time">记时间</button></div>' +
      '<button class="btn big" data-act="save-custom-exercise">保存动作</button>';
    renderCustomDraft();
    showSheet();
    setTimeout(() => { const i = $("#custom-ex-name"); if (i) i.focus(); }, 300);
  }
  function renderCustomDraft() {
    $("#custom-cat-chips").innerHTML = ["胸", "背", "腿", "肩", "臂", "核心", "有氧"].map((c) =>
      '<button class="chip' + (customDraft.cat === c ? " active" : "") + '" data-act="custom-cat" data-v="' + c + '">' + c + "</button>").join("");
    $$("#custom-type-seg button").forEach((b) =>
      b.classList.toggle("active", b.dataset.v === customDraft.type));
  }
  function saveCustomExercise() {
    const name = ($("#custom-ex-name").value || "").trim();
    if (!name) { toast("请填写动作名称"); return; }
    if (Store.allExercises().some((e) => e.name === name)) { toast("已存在同名动作"); return; }
    const newId = "c_" + Store.uid();
    Store.data.customExercises.push({
      id: newId, name: name, cat: customDraft.cat,
      type: customDraft.type, custom: true,
    });
    Store.save();
    Store.touchLib(); // 动作库改动：同步到云端，换设备也在
    closeSheet();
    renderExercises();
    if (customFrom === "picker") {
      // 从训练里的「添加动作」新建的：意图就是要用，直接加入本次训练并打开记组界面
      pickExercise(newId);
      toast("已添加「" + name + "」并加入训练");
    } else if (customFrom === "plan") {
      // 从计划编辑器里新建的：加入草稿（即便刚才在批量模式，新建的动作也直接进计划）
      picker.multi = false;
      picker.sel = {};
      picker.from = "plan";
      pickExercise(newId);
      picker.from = null;
    } else {
      toast("已添加「" + name + "」");
    }
  }
  async function deleteCustomExercise(id) {
    const ex = Store.findExercise(id);
    const ok = await confirmAction("删除自定义动作？", "「" + (ex ? ex.name : "") + "」将从动作库移除，历史记录不受影响。", "删除", true);
    if (!ok) return;
    Store.data.customExercises = Store.data.customExercises.filter((e) => e.id !== id);
    Store.data.exOrder = (Store.data.exOrder || []).filter((x) => x !== id);
    // 墓碑：没有它，云同步的"并集"合并会把这条从云端再捞回来（删了又出现）
    Store.tombstoneExercise(id);
    Store.save();
    Store.touchLib();
    closeSub();
    renderExercises();
    toast("已删除");
  }

  /* ---------- 内置动作：移除 / 恢复默认 ---------- */
  async function hideBuiltin(id) {
    const ex = Store.findExercise(id);
    const ok = await confirmAction("从动作库移除？",
      "「" + (ex ? ex.name : "") + "」将不再出现在动作库，历史训练记录不受影响，可在「重置」里恢复。", "移除", true);
    if (!ok) return;
    if (!Array.isArray(Store.data.hiddenBuiltins)) Store.data.hiddenBuiltins = [];
    if (Store.data.hiddenBuiltins.indexOf(id) < 0) Store.data.hiddenBuiltins.push(id);
    Store.save();
    Store.touchLib();
    closeSub();
    renderExercises();
    toast("已移除，可在重置中恢复");
  }

  // 单个恢复（详情页里用）
  function restoreBuiltin(id) {
    Store.data.hiddenBuiltins = (Store.data.hiddenBuiltins || []).filter((x) => x !== id);
    Store.save();
    Store.touchLib();
    closeSub();
    renderExercises();
    toast("已恢复到动作库");
  }

  /* 重置动作库：用底部弹层做「两个开关 + 取消」，比连问两遍更好退 */
  const resetOpt = { keepCustom: true, keepData: true };

  function resetRow(key, label, meta, on, disabled) {
    return '<div class="row"><span class="grow">' + label + '<small class="row-sub">' + meta + "</small></span>" +
      '<label class="switch"><input type="checkbox" data-reset="' + key + '"' +
      (on ? " checked" : "") + (disabled ? " disabled" : "") + '><span class="knob"></span></label></div>';
  }
  function openResetSheet() {
    const customCount = (Store.data.customExercises || []).length;
    const wCount = (Store.data.workouts || []).length;
    resetOpt.keepCustom = true;
    resetOpt.keepData = true;
    $("#sheet-content").innerHTML =
      '<div class="sheet-handle"></div>' +
      '<div class="sheet-title">重置动作库</div>' +
      '<div class="sheet-sub">恢复 ' + Store.BUILTIN.length + " 个内置动作，已移除的会全部回到列表。</div>" +
      '<div class="list" style="margin-bottom:14px">' +
      resetRow("keepCustom", "保留自定义动作", customCount + " 个", true, customCount === 0) +
      resetRow("keepData", "保留历史训练记录", wCount + " 条", true, wCount === 0) +
      "</div>" +
      '<p class="set-note" style="margin:0 0 16px">历史记录自带动作名称与重量快照，重置动作库本身不会影响它们；只有关掉第二项才会清空历史。</p>' +
      '<button class="btn danger" data-act="reset-confirm">恢复默认动作库</button>' +
      '<button class="btn ghost" style="margin-top:10px" data-act="reset-cancel">取消</button>';
    injectIcons($("#sheet-content"));
    showSheet();
  }
  function applyReset() {
    const keepCustom = resetOpt.keepCustom;
    const keepData = resetOpt.keepData;
    Store.data.hiddenBuiltins = [];
    if (!keepCustom) Store.data.customExercises = [];
    if (!keepData) {
      Store.data.workouts = [];
      Store.data.activeWorkout = null;
      Store.data.deletedWorkouts = [];
      Store.data.syncedIds = [];
    }
    Store.save();
    Store.touchLib();
    closeSheet();
    renderAll();
    toast("动作库已恢复默认" + (keepData ? "" : "，历史已清空"));
    if (!keepData && Cloud.isLoggedIn()) {
      Cloud.wipeRemoteWorkouts().then((r) => {
        if (r && r.error) toast("云端历史清空失败：" + r.error);
      });
    }
  }

  /* ================= 设置 ================= */
  function saveDefInputs() {
    const kg = $("#in-defkg"), rp = $("#in-defreps");
    if (!kg || !rp) return;
    const st = Store.data.settings;
    st.defaultKg = Math.max(0, Math.round(U.dispToKg(parseFloat(kg.value) || 0) * 10) / 10);
    const nextReps = Math.max(1, Math.round(parseFloat(rp.value) || 1));
    // 用户真的动过次数才置标记：之后第一组固定用这个次数（否则跟随上次训练）
    if (nextReps !== st.defaultReps) st.repsCustom = true;
    st.defaultReps = nextReps;
    Store.save();
  }
  /* 设置已经并入「我的」tab：任何旧的“打开设置”入口都退化成切 tab */
  function openSettings() { switchTab("me"); }

  /* ---------- 我的（账号 / 偏好 / 数据 / 关于） ---------- */
  function renderMe() {
    const box = $("#me-content");
    if (!box) return;
    const s = Store.data.settings;
    const u = Cloud.getUser();
    const p = Cloud.getProfile();
    const nick = (p && p.nickname) || "";
    const av = (p && p.avatar_url) || DEFAULT_AVATAR;

    let html = "";
    // 身份卡：登录态显示头像+昵称+邮箱；未登录显示登录入口
    if (u) {
      html += '<div class="me-card">' +
        '<button class="me-ava" data-act="change-avatar" aria-label="更换头像">' +
        '<img src="' + esc(av) + '" alt="头像"></button>' +
        '<div class="me-info">' +
        '<b id="profile-nickname-text">' + esc(nick || "未设置昵称") + '</b>' +
        '<span id="profile-email-text">' + esc(maskEmail(u.email)) + '</span>' +
        '</div>' +
        '<button class="me-sync" data-act="sync-now">' + icon("repeat", 16) + "同步</button>" +
        '</div>';
    } else {
      html += '<button class="me-card me-card-guest" data-act="open-auth">' +
        '<span class="me-ava me-ava-guest">' + icon("user", 26) + '</span>' +
        '<span class="me-info"><b>登录 / 注册</b><span>云端备份 · 多设备同步</span></span>' +
        '<span class="me-arrow">›</span></button>';
    }

    // 训练偏好
    html += '<div class="section-title">训练偏好</div><div class="list">' +
      '<div class="row"><span class="grow">重量单位</span><span class="seg" style="width:130px">' +
      '<button class="' + (s.unit === "kg" ? "active" : "") + '" data-act="set-unit" data-v="kg">公斤</button>' +
      '<button class="' + (s.unit === "lb" ? "active" : "") + '" data-act="set-unit" data-v="lb">磅</button></span></div>' +
      '<div class="row"><span class="grow">默认重量<small class="row-sub">0 = 跟随上次</small></span>' +
      '<span class="stepper"><button data-noblur data-act="dec-defkg">−</button>' +
      '<input id="in-defkg" type="number" inputmode="decimal" value="' + U.fmt(s.defaultKg || 0) + '">' +
      '<button data-noblur data-act="inc-defkg">+</button></span></div>' +
      '<div class="row"><span class="grow">默认次数<small class="row-sub">第一组预填</small></span>' +
      '<span class="stepper"><button data-noblur data-act="dec-defreps">−</button>' +
      '<input id="in-defreps" type="number" inputmode="numeric" value="' + (s.defaultReps || 10) + '">' +
      '<button data-noblur data-act="inc-defreps">+</button></span></div>' +
      '<div class="row"><span class="grow">主题</span><span class="seg" style="width:186px">' +
      '<button class="' + (s.theme === "system" ? "active" : "") + '" data-act="set-theme" data-v="system">系统</button>' +
      '<button class="' + (s.theme === "light" ? "active" : "") + '" data-act="set-theme" data-v="light">浅色</button>' +
      '<button class="' + (s.theme === "dark" ? "active" : "") + '" data-act="set-theme" data-v="dark">深色</button></span></div>' +
      "</div>";

    // 数据
    html += '<div class="section-title">数据</div><div class="list">' +
      '<button class="row" data-act="export-data"><span class="grow">导出数据（JSON 备份）</span>' + icon("download", 18) + "</button>" +
      '<button class="row" data-act="import-data"><span class="grow">导入数据</span>' + icon("upload", 18) + "</button>" +
      '<button class="row" data-act="clear-data" style="color:var(--red)"><span class="grow">清空所有数据</span>' + icon("trash", 18) + "</button>" +
      "</div>";

    // 账号（登录后才有）
    if (u) {
      html += '<div class="section-title">账号</div><div class="list">' +
        '<div class="row"><span class="grow">昵称</span>' +
        '<input class="nick-input" id="in-nickname" type="text" maxlength="16" value="' + esc(nick) + '" placeholder="未设置"></div>' +
        '<div class="row"><span class="grow">云端同步</span><span class="val" id="sync-status">' + syncStatusHtml() + "</span></div>" +
        '<button class="row" data-act="change-avatar"><span class="grow">更换头像</span><span class="val">可裁剪</span></button>' +
        '<button class="row" data-act="logout" style="color:var(--red)"><span class="grow">退出登录</span></button>' +
        '<button class="row" data-act="delete-account" style="color:var(--red)"><span class="grow">注销账号</span><span class="val">永久删除</span></button>' +
        "</div>";
    }

    // 关于
    html += '<div class="section-title">关于</div><div class="list">' +
      '<div class="row"><span class="grow">当前版本</span><span class="val" id="app-ver">' + APP_VERSION + "</span></div>" +
      '<button class="row" data-act="open-changelog"><span class="grow">更新记录</span><span class="val">每版改了什么</span></button>' +
      '<button class="row" data-act="check-update"><span class="grow">检查更新</span><span class="val">获取最新版</span></button>' +
      '<button class="row" data-act="force-refresh"><span class="grow">强制刷新</span><span class="val">版本没变时用</span></button>' +
      '<button class="row" data-act="open-legal" data-w="privacy"><span class="grow">隐私政策</span>' + icon("lock", 18) + "</button>" +
      '<button class="row" data-act="open-legal" data-w="terms"><span class="grow">用户协议</span>' + icon("list", 18) + "</button>" +
      '<button class="row" data-act="contact-me"><span class="grow">反馈 / 联系作者</span><span class="val">trainingdiary@qq.com</span></button>' +
      "</div>" +
      '<p class="set-note">本地模式：数据仅存本机，可导出 JSON 备份<br>登录后：训练数据自动云端备份，支持多设备同步</p>' +
      '<p class="app-ver">版本 ' + APP_VERSION + (Cloud.isLoggedIn() ? " · 已连接云端" : " · 本地模式") + "</p>";

    box.innerHTML = html;
    injectIcons(box);
  }
  /* 训练页齿轮：只调训练默认值，用底部弹层。整页设置已在「我的」tab，
     这里若复用会同时存在两组相同 id 的输入框（in-defkg / in-defreps） */
  function openWorkoutSettings() {
    const st = Store.data.settings;
    $("#sheet-content").innerHTML =
      '<div class="sheet-handle"></div>' +
      '<div class="sheet-title">训练默认值</div>' +
      '<div class="sheet-sub">新动作第一组按这里的值预填，记组时临时改不影响它</div>' +
      '<div class="list" style="margin:14px 0">' +
      '<div class="row"><span class="grow">默认重量<small class="row-sub">0 = 关闭</small></span>' +
      '<span class="stepper"><button data-noblur data-act="ts-dec-kg">−</button>' +
      '<input id="ts-kg" type="number" inputmode="decimal" value="' + U.fmt(st.defaultKg || 0) + '">' +
      '<button data-noblur data-act="ts-inc-kg">+</button></span></div>' +
      '<div class="row"><span class="grow">默认次数</span>' +
      '<span class="stepper"><button data-noblur data-act="ts-dec-reps">−</button>' +
      '<input id="ts-reps" type="number" inputmode="numeric" value="' + (st.defaultReps || 10) + '">' +
      '<button data-noblur data-act="ts-inc-reps">+</button></span></div>' +
      "</div>" +
      '<button class="btn big" data-act="sheet-close">完成</button>';
    injectIcons($("#sheet-content"));
    showSheet();
  }
  function saveTsInputs() {
    const kg = $("#ts-kg"), rp = $("#ts-reps");
    if (!kg || !rp) return;
    const st = Store.data.settings;
    st.defaultKg = Math.max(0, Math.round(U.dispToKg(parseFloat(kg.value) || 0) * 10) / 10);
    const nextReps = Math.max(1, Math.round(parseFloat(rp.value) || 1));
    if (nextReps !== st.defaultReps) st.repsCustom = true;   // 与「我的」页保持一致
    st.defaultReps = nextReps;
    Store.save();
  }

  // 重绘「我的」并保持滚动位置（改单位/主题后调用）
  function rerenderMe() {
    const scr = $("#screen-me");
    const st = scr ? scr.scrollTop : 0;
    renderMe();
    if (scr) scr.scrollTop = st;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(Store.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "练了吗-" + dayKey(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("已导出 JSON 备份文件");
  }
  function importData() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        let d;
        try {
          d = JSON.parse(r.result);
          if (!d || !Array.isArray(d.workouts)) throw new Error("bad");
        } catch (e) { toast("文件格式不正确"); return; }
        confirmAction("导入数据", "导入将覆盖当前所有数据，确定继续吗？", "导入", true).then((ok) => {
          if (!ok) return;
          Store.replace(Object.assign(JSON.parse(JSON.stringify(Store.DEFAULT)), d, {
            settings: Object.assign(JSON.parse(JSON.stringify(Store.DEFAULT.settings)), d.settings || {}),
          }));
          applyTheme();
          Store.touchLib(); // 导入的动作库/排序跟着账号走
          closeSub();
          renderAll();
          toast("导入成功");
        });
      };
      r.readAsText(f);
    };
    inp.click();
  }
  async function clearData() {
    const loggedIn = Cloud.isLoggedIn();
    const ok = await confirmAction(
      "清空所有数据？",
      loggedIn
        ? "全部训练记录、自定义动作与训练计划将被删除，云端记录也会一并清空，且无法恢复。建议先导出备份。"
        : "全部训练记录、自定义动作与训练计划将被删除，且无法恢复。建议先导出备份。",
      "清空", true);
    if (!ok) return;
    const keep = Store.data.settings;
    Store.replace(JSON.parse(JSON.stringify(Store.DEFAULT)));
    Store.data.settings = keep;
    Store.save();
    closeSub();
    renderAll();
    if (loggedIn) {
      // 本地已清空：把云端训练、动作库、计划一起推平，避免下次同步又拉回来
      try { await Cloud.wipeRemoteWorkouts(); } catch (e) {}
      try { const r = await Cloud.syncExerciseLib(); if (r && r.error) toast("云端动作库清空失败：" + r.error); } catch (e) {}
      try { const r2 = await Cloud.syncPlanLib(); if (r2 && r2.error) toast("云端计划清空失败：" + r2.error); } catch (e) {}
    }
    toast("已清空");
    if (loggedIn) {
      const r = await Cloud.wipeRemoteWorkouts();
      if (r && r.ok) toast("云端记录已清空");
      else if (r && r.error) toast("云端清空失败，稍后可重试：" + r.error);
    }
  }

  /* ================= 云同步（登录 / 账号 / 同步） ================= */
  let authMode = "login";
  let nickTimer = null;
  let firstAuthCallback = true;

  /* 邮箱脱敏：设置页不明文展示邮箱，只留首 3 位与末 2 位 */
  function maskEmail(email) {
    const e = (email || "").trim();
    const at = e.indexOf("@");
    if (at < 1) return e;
    const name = e.slice(0, at), domain = e.slice(at);
    if (name.length <= 3) return name.charAt(0) + "***" + domain;
    return name.slice(0, 3) + "****" + name.slice(-2) + domain;
  }

  function syncStatusHtml() {
    const at = Cloud.getLastSyncAt();
    if (!at) return '<span class="sync-dot"></span>未同步';
    const d = new Date(at), now = new Date();
    const hm = pad(d.getHours()) + ":" + pad(d.getMinutes());
    let label;
    if (now - at < 60000) label = "刚刚";
    else if (d.toDateString() === now.toDateString()) label = "今天 " + hm;
    else label = (d.getMonth() + 1) + "月" + d.getDate() + "日 " + hm;
    return '<span class="sync-dot"></span>' + label;
  }

  /* ---------- 登录 / 注册界面 ---------- */
  function showAuth() {
    authMode = "login";
    renderAuthTabs();
    authError("");
    $("#auth-email").value = "";
    $("#auth-password").value = "";
    $("#auth-nickname").value = "";
    $("#auth-view").classList.add("show");
  }
  function hideAuth() { $("#auth-view").classList.remove("show"); }
  function renderAuthTabs() {
    $$("#auth-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.authTab === authMode));
    $("#auth-nickname").style.display = authMode === "register" ? "" : "none";
    $("#auth-password2").style.display = authMode === "register" ? "" : "none";
    $("#auth-password").autocomplete = authMode === "register" ? "new-password" : "current-password";
    $("#auth-submit").textContent = authMode === "register" ? "注册并登录" : "登录";
  }
  function authError(msg) {
    const el = $("#auth-error");
    el.textContent = msg || "";
    el.classList.toggle("show", !!msg);
  }
  async function submitAuth() {
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    const nickname = $("#auth-nickname").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { authError("请输入正确的邮箱地址"); return; }
    if (password.length < 6) { authError("密码至少 6 位"); return; }
    if (authMode === "register" && password !== ($("#auth-password2").value || "")) {
      authError("两次输入的密码不一致");
      return;
    }
    const btn = $("#auth-submit");
    btn.disabled = true;
    btn.textContent = "处理中…";
    authError("");
    try {
      const r = authMode === "register"
        ? await Cloud.signUp(email, password, nickname)
        : await Cloud.signIn(email, password);
      if (r.error) { authError(r.error); return; }
      if (r.needConfirm) {
        authError("注册成功！请先到邮箱收取确认邮件，点击里面的链接完成验证，然后再回来登录。");
        authMode = "login";
        return;
      }
      // 只有用户主动点登录/注册成功，才允许弹一次“已登录”（不再依赖回调时序判断）
      pendingLoginToast = true;
    } finally {
      btn.disabled = false;
      renderAuthTabs();
    }
  }

  /* ---------- 登录状态变化 ---------- */
  // Supabase 在 App 回到前台时会自动刷新凭证，每次都触发一次“登录”回调。
  // 判定原则：只有用户刚刚主动点过登录/注册（pendingLoginToast），才提示一次；
  // 冷启动恢复会话、切前台刷新 token 一律静默。
  let pendingLoginToast = false;
  /* ---------- 忘记密码 ---------- */
  function openForgotSheet() {
    $("#sheet-content").innerHTML =
      '<div class="sheet-handle"></div>' +
      '<div class="sheet-title">重置密码</div>' +
      '<div class="sheet-sub">输入注册邮箱，我们会发一封重置邮件到它里面</div>' +
      '<div class="search-bar" style="margin:14px 0"><span class="search-ico">' + icon("search", 18) + "</span>" +
      '<input id="forgot-email" type="email" placeholder="注册邮箱" autocomplete="email" inputmode="email" value="' + esc($("#auth-email").value || "") + '"></div>' +
      '<button class="btn big" data-act="forgot-send">发送重置链接</button>' +
      '<button class="btn ghost" style="margin-top:10px" data-act="sheet-close">取消</button>';
    injectIcons($("#sheet-content"));
    showSheet();
    setTimeout(() => { const i = $("#forgot-email"); if (i) i.focus(); }, 300);
  }
  async function sendResetMail() {
    const mail = ($("#forgot-email").value || "").trim();
    if (!mail) { toast("请先填写邮箱"); return; }
    let r;
    try { r = await Cloud.resetPassword(mail); }
    catch (e) { r = { error: "网络异常" }; }
    if (r && r.error) { toast("发送失败：" + r.error); return; }
    closeSheet();
    toast("重置链接已发送，请到邮箱里完成设置");
  }

  /* ---------- 邮箱链接回来：设置新密码 ---------- */
  /* 刷新副标题里的账号邮箱：恢复会话是异步建立的，可能要等一拍才拿得到 */
  function refreshResetEmail() {
    const el = $("#reset-subtitle");
    if (!el) return;
    const u = Cloud.getUser();
    const mail = (u && u.email) || "";
    el.textContent = mail ? "为账号 " + mail + " 设置一个新密码" : "设置一个新密码";
  }
  function showResetView() {
    refreshResetEmail();
    // 双保险：固定补两次 + 会话建立时立刻刷新
    setTimeout(refreshResetEmail, 500);
    setTimeout(refreshResetEmail, 2000);
    hideAuth();
    $("#reset-view").classList.add("show");
    setTimeout(() => { const i = $("#reset-password"); if (i) i.focus(); }, 300);
  }
  // .auth-error 默认是隐藏的，必须加 show 才能看见（登录页的 authError 同理）
  function resetError(msg) {
    const el = $("#reset-error");
    el.textContent = msg || "";
    el.classList.toggle("show", !!msg);
  }
  async function submitNewPassword() {
    const a = $("#reset-password").value || "";
    const b = $("#reset-password2").value || "";
    if (a.length < 6) { resetError("密码至少 6 位"); return; }
    if (a !== b) { resetError("两次输入不一致"); return; }
    // 没有会话 = 令牌没消费成功（链接过期/已在别处用过），明确告知而不是静默失败
    if (!Cloud.getUser()) {
      resetError("重置链接已失效，请返回登录页重新申请");
      return;
    }
    resetError("");
    const btn = $("#reset-submit");
    const oldLabel = btn.textContent;
    btn.textContent = "保存中…";
    btn.disabled = true;
    let r;
    try { r = await Cloud.updatePassword(a); }
    catch (e) { r = { error: "网络异常，请稍后重试" }; }
    btn.textContent = oldLabel;
    btn.disabled = false;
    if (r && r.error) { resetError(r.error); return; }
    $("#reset-view").classList.remove("show");
    toast("密码已更新，请用新密码登录");
    showAuth();
  }

  /* ---------- 注销账号 ---------- */
  async function deleteAccount() {
    const ok = await confirmAction("注销账号？",
      "账号将被永久删除：训练记录、自定义动作、训练计划、头像全部清除，云端与本机同时删除，且无法恢复。建议先导出备份。",
      "永久删除", true);
    if (!ok) return;
    const loggedIn = Cloud.isLoggedIn();
    let removed = false;
    if (loggedIn) {
      // 先尝试彻底删除账号（Edge Function）；没部署/失败就降级成清数据
      const r = await Cloud.deleteAccountRemote();
      if (r && r.ok) removed = true;
      else if (r && r.skipped) { /* 服务端删除未启用：静默走降级，不拿技术错误烦用户 */ }
      else if (r && r.error && r.error !== "网络异常") toast("云端账号删除失败：" + r.error);
      // 兜底：确保云端数据一定清干净
      try { await Cloud.wipeRemoteWorkouts(); } catch (e) {}
      try {
        const lib = await Cloud.syncExerciseLib();
        if (lib && lib.error) toast("云端动作库清空失败：" + lib.error);
      } catch (e) {}
    }
    const keep = Store.data.settings;
    Store.replace(JSON.parse(JSON.stringify(Store.DEFAULT)));
    Store.data.settings = keep;
    Store.save();
    if (loggedIn) { try { await Cloud.signOut(); } catch (e) {} }
    closeSub();
    renderAll();
    rerenderMe();
    // 只有服务端确认删掉了账号才说"彻底删除"，否则别让用户误以为删干净了
    if (removed) toast("账号已彻底删除，感谢使用");
    else if (loggedIn) toast("数据已清空，但账号未能彻底删除，请稍后重试");
    else toast("已清空本机数据");
    showAuth();
  }

  function onCloudAuth(u) {
    firstAuthCallback = false;
    updateNavAvatar();
    if (u) {
      hideAuth();
      try { localStorage.removeItem("tieji.skippedAuth"); } catch (e) {}
      // 刚从邮件里的验证链接回来：令牌已被自动消费，明确告诉用户成功了
      if (urlFlags.verify) {
        urlFlags.verify = false;
        setTimeout(() => toast("邮箱验证成功，已自动登录"), 400);
      }
      renderAll();
      rerenderMe();
      // 只认“用户刚点过登录”这一个条件，回调时序再乱也不会误弹
      const shouldTell = pendingLoginToast;
      pendingLoginToast = false;
      doSync(true).then(() => { if (shouldTell) toast("已登录，数据已同步"); });
    } else {
      renderAll();
      rerenderMe();
    }
  }
  function updateNavAvatar() {
    // 顶部不再有头像按钮，头像统一在「我的」页身份卡；这里只把异步到达的资料补上
    const img = $("#me-content .me-ava img");
    if (!img) return;
    const p = Cloud.getProfile();
    img.src = (p && p.avatar_url) || DEFAULT_AVATAR;
  }
  // 资料（昵称/头像）异步到达后就地刷新，不整页重绘
  function refreshProfileUi() {
    updateNavAvatar();
    const p = Cloud.getProfile();
    if (!p) return;
    const av = $("#me-content .me-ava img");
    if (av && p.avatar_url) av.src = p.avatar_url;
    const nk = $("#profile-nickname-text");
    if (nk) nk.textContent = p.nickname || "未设置昵称";
  }

  /* ---------- 头像裁剪（圆形取景框） ---------- */
  const crop = { img: null, S: 0, base: 1, scale: 1, x: 0, y: 0, dragging: false, px: 0, py: 0 };

  function openCropper(dataUrl) {
    const img = $("#crop-img");
    img.onload = () => {
      crop.img = img;
      crop.scale = 1; crop.x = 0; crop.y = 0;
      $("#crop-zoom").value = 1;
      $("#crop-view").classList.add("show");
      // 等布局稳定后再量取景框尺寸
      requestAnimationFrame(() => {
        const stage = $("#crop-stage");
        crop.S = stage.clientWidth || 280;
        const w = img.naturalWidth, h = img.naturalHeight;
        crop.base = Math.max(crop.S / w, crop.S / h); // 铺满取景框的最小缩放
        crop.scale = crop.base;
        crop.x = (crop.S - w * crop.scale) / 2;
        crop.y = (crop.S - h * crop.scale) / 2;
        applyCrop();
      });
    };
    img.onerror = () => toast("图片解析失败，换一张试试");
    img.src = dataUrl;
  }
  function applyCrop() {
    const img = crop.img;
    if (!img) return;
    const w = img.naturalWidth * crop.scale;
    const h = img.naturalHeight * crop.scale;
    // 限制在取景框内，避免拖出空白
    crop.x = Math.min(0, Math.max(crop.S - w, crop.x));
    crop.y = Math.min(0, Math.max(crop.S - h, crop.y));
    img.style.width = w + "px";
    img.style.height = h + "px";
    img.style.left = crop.x + "px";
    img.style.top = crop.y + "px";
  }
  function closeCropper() {
    $("#crop-view").classList.remove("show");
    crop.img = null;
  }
  async function submitCrop() {
    const img = crop.img;
    if (!img) { closeCropper(); return; }
    const OUT = 256;
    const k = OUT / crop.S;
    const cv = document.createElement("canvas");
    cv.width = OUT; cv.height = OUT;
    const g = cv.getContext("2d");
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, OUT, OUT);
    g.drawImage(img, crop.x * k, crop.y * k, img.naturalWidth * crop.scale * k, img.naturalHeight * crop.scale * k);
    const blob = await new Promise((res) => cv.toBlob(res, "image/jpeg", 0.9));
    closeCropper();
    if (!blob) { toast("头像处理失败"); return; }
    toast("正在上传头像…");
    let r;
    try { r = await Cloud.uploadAvatarBlob(blob); }
    catch (e) { r = { error: "网络异常" }; }
    if (r && r.error) { toast("头像上传失败：" + r.error); return; }
    updateNavAvatar();
    openSettings();
    toast("头像已更新");
  }

  /* 从邮箱链接回来时的两种场景（init 时快照，supabase 消费后会清掉 URL） */
  const urlFlags = { recovery: false, verify: false };

  /* ---------- 检查更新 ----------
   * iOS 的 PWA 有时要冷启动两次才换上新版；这里让用户主动触发：
   * 立即向服务器要最新的 sw.js，发现新版本就让它 skipWaiting 接管，
   * 已有的 controllerchange 监听会自动重载页面。
   */
  async function checkUpdate() {
    if (!("serviceWorker" in navigator)) { toast("当前环境不支持自动更新"); return; }
    toast("正在检查更新…");
    let reg = null;
    try { reg = await navigator.serviceWorker.register("sw.js"); }
    catch (e) { toast("检查失败，请稍后重试"); return; }
    try { await reg.update(); } catch (e) {}
    await new Promise((r) => setTimeout(r, 600)); // 等 install 完成
    const sw = reg.waiting || reg.installing;
    if (sw) {
      let tookOver = false;
      const onCtrl = () => { tookOver = true; };
      navigator.serviceWorker.addEventListener("controllerchange", onCtrl);
      if (sw.state === "installed") sw.postMessage({ type: "SKIP_WAITING" });
      else sw.addEventListener("statechange", function onSc() {
        if (sw.state === "installed") { sw.removeEventListener("statechange", onSc); sw.postMessage({ type: "SKIP_WAITING" }); }
      });
      toast("发现新版本，正在应用…");
      // 兜底：个别旧版 iOS 不支持给 SW 发消息，2.5 秒还没接管就提示手动重启
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener("controllerchange", onCtrl);
        if (!tookOver) toast("新版本已下载，彻底关闭 App 再打开即可");
      }, 2500);
    } else {
      // 有可能被旧版 Service Worker 卡住（旧逻辑会把 sw.js 也缓存起来）。
      // 给用户一条能自救的路：确认后清掉全部缓存与 SW，重新从网络加载。
      toast("已是最新版本 " + APP_VERSION + "；若版本号没变，试试强刷");
      setTimeout(() => {
        confirmAction("版本号还是旧的？", "会清掉离线缓存并重新加载页面（训练数据不受影响）。", "强制刷新", false)
          .then((ok) => { if (ok) forceRefresh(); });
      }, 1200);
    }
  }
  // 彻底清掉 SW 与缓存后重载：专治“怎么刷都是旧版本”
  async function forceRefresh() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {}
    location.reload();
  }

  /* ---------- 同步 ---------- */
  async function doSync(quiet) {
    if (!Cloud.isLoggedIn()) { if (!quiet) toast("请先登录"); return; }
    const st = $("#sync-status");
    if (st) st.innerHTML = '<span class="sync-dot"></span>同步中…';
    let r;
    try { r = await Cloud.sync(); }
    catch (e) { r = { error: "网络异常" }; }
    if (st) st.innerHTML = syncStatusHtml();
    if (r && r.error) { if (!quiet) toast("同步失败：" + r.error); return; }
    // 只有数据真的变了才重绘，避免每次切回前台都把页面刷一遍（会打断滚动位置）
    if (r && (r.pushed || r.pulled || r.deleted || r.removed)) renderAll();
    if (!quiet) {
      const parts = [];
      if (r && r.pushed) parts.push("上传 " + r.pushed + " 条");
      if (r && r.pulled) parts.push("下载 " + r.pulled + " 条");
      if (r && r.deleted) parts.push("删除 " + r.deleted + " 条");
      if (r && r.removed) parts.push("同步移除 " + r.removed + " 条（已在其他设备删除）");
      if (parts.length) toast("同步完成：" + parts.join("，"));
      else toast("已是最新，无需同步");
    }
  }
  async function doLogout() {
    const ok = await confirmAction("退出登录？", "退出后本机数据仍保留，重新登录可恢复云端同步。", "退出", true);
    if (!ok) return;
    const r = await Cloud.signOut();
    if (r && r.error) { toast("退出失败：" + r.error); return; }
    closeSub();
    rerenderMe();
    toast("已退出登录");
  }

  /* ================= 事件 ================= */
  const ACTS = {
    "start-workout": startWorkout,
    "resume-workout": openWorkoutView,
    "cancel-workout": cancelWorkout,
    "add-exercise-to-workout": openExercisePicker,
    "add-set": (el) => openSetSheet(+el.dataset.i, null),
    "edit-set": (el) => openSetSheet(+el.dataset.i, +el.dataset.si),
    "save-set": saveSet,
    "delete-set": deleteSet,
    "del-exercise": (el) => delExercise(+el.dataset.i),
    "inc-kg": () => bump("#in-kg", U.step()),
    "dec-kg": () => bump("#in-kg", -U.step()),
    "inc-reps": () => bump("#in-reps", 1),
    "dec-reps": () => bump("#in-reps", -1),
    "inc-sec": () => bump("#in-sec", 15),
    "dec-sec": () => bump("#in-sec", -15),
    "quick-sec": (el) => { $("#in-sec").value = el.dataset.v; },
    "finish-workout": finishWorkout,
    "save-workout-final": saveWorkoutFinal,
    "discard-workout-final": discardWorkoutFinal,
    "inc-defkg": () => { bump("#in-defkg", U.step()); saveDefInputs(); },
    "dec-defkg": () => { bump("#in-defkg", -U.step()); saveDefInputs(); },
    "inc-defreps": () => { bump("#in-defreps", 1); saveDefInputs(); },
    "dec-defreps": () => { bump("#in-defreps", -1); saveDefInputs(); },
    "ts-inc-kg": () => { bump("#ts-kg", U.step()); saveTsInputs(); },
    "ts-dec-kg": () => { bump("#ts-kg", -U.step()); saveTsInputs(); },
    "ts-inc-reps": () => { bump("#ts-reps", 1); saveTsInputs(); },
    "ts-dec-reps": () => { bump("#ts-reps", -1); saveTsInputs(); },
    "open-settings": openSettings,
    "open-profile": openSettings,
    "open-auth": () => { closeSub(); showAuth(); },
    "sync-now": () => doSync(false),
    "logout": doLogout,
    "change-avatar": () => { $("#avatar-file").click(); },
    "sub-back": closeSub,
    "filter-cat": (el) => { exFilter.cat = el.dataset.cat; renderExercises(); },
    "picker-cat": (el) => { picker.cat = el.dataset.cat; renderPicker(); },
    "pick-exercise": (el) => pickExercise(el.dataset.id),
    "open-all-history": openHistoryView,
    "toggle-stats": toggleStats,
    "open-workout-detail": (el) => openWorkoutDetail(el.dataset.id),
    "repeat-workout": (el) => repeatWorkout(el.dataset.id),
    "share-workout": (el) => shareWorkout(el.dataset.id),
    "plan-list": openPlanList,
    "plan-new": () => openPlanEditor(null),
    "plan-edit": (el) => openPlanEditor(el.dataset.id),
    "plan-detail": (el) => openPlanDetail(el.dataset.id),
    "plan-start": (el) => startPlanWorkout(el.dataset.id),
    "plan-save": savePlanFromEditor,
    "plan-add-ex": openPlanAddExercise,
    "plan-item-del": (el) => removePlanItem(+el.dataset.i),
    "plan-editor-cancel": () => { if (planDraft.id) openPlanDetail(planDraft.id); else closeSub(); },
    "plan-delete": (el) => deletePlanFlow(el.dataset.id),
    "picker-new-plan": () => openCustomExercise("plan"),
    "plan-pick-done": commitPicked,
    "plan-pick-mode": togglePickerMulti,
    "delete-workout": (el) => deleteWorkout(el.dataset.id),
    "open-exercise-detail": (el) => openExerciseDetail(el.dataset.id),
    "join-active": (el) => joinActive(el.dataset.id),
    "delete-custom-exercise": (el) => deleteCustomExercise(el.dataset.id),
    "hide-builtin": (el) => hideBuiltin(el.dataset.id),
    "restore-builtin": (el) => restoreBuiltin(el.dataset.id),
    "reset-exercises": openResetSheet,
    "reset-confirm": applyReset,
    "reset-cancel": closeSheet,
    "add-custom-exercise": () => openCustomExercise(null),
    "picker-new": () => openCustomExercise("picker"),
    "custom-cat": (el) => { customDraft.cat = el.dataset.v; renderCustomDraft(); },
    "custom-type": (el) => { customDraft.type = el.dataset.v; renderCustomDraft(); },
    "save-custom-exercise": saveCustomExercise,
    "set-unit": (el) => { Store.data.settings.unit = el.dataset.v; Store.save(); rerenderMe(); renderAll(); },
    "set-theme": (el) => { Store.data.settings.theme = el.dataset.v; Store.save(); applyTheme(); rerenderMe(); renderAll(); },
    "export-data": exportData,
    "import-data": importData,
    "clear-data": clearData,
    "check-update": checkUpdate,
    "force-refresh": forceRefresh,
    "forgot-password": openForgotSheet,
    "forgot-send": sendResetMail,
    "sheet-close": closeSheet,
    "delete-account": deleteAccount,
    "open-changelog": () => { window.open("CHANGELOG.md", "_blank"); },
    "open-legal": (el) => { window.open("legal.html#" + (el.dataset.w || "privacy"), "_blank"); },
    "contact-me": () => { location.href = "mailto:trainingdiary@qq.com?subject=" + encodeURIComponent("练了吗 反馈"); },
  };

  function bindEvents() {
    $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
    bindExDrag(); // 动作库拖动排序
    bindSwipeBack(); // 右滑返回上一级
    $("#btn-add-exercise").addEventListener("click", openCustomExercise);
    $("#btn-back-workout").addEventListener("click", backWorkout);
    $("#btn-finish-workout").addEventListener("click", finishWorkout);
    $("#btn-add-exercise-to-workout").addEventListener("click", openExercisePicker);
    $("#sub-back").addEventListener("click", closeSub);
    $("#history-back").addEventListener("click", closeHistoryView);
    $("#sheet-backdrop").addEventListener("click", closeSheet);
    $("#btn-workout-settings").addEventListener("click", openWorkoutSettings);

    // 登录 / 注册
    $("#auth-submit").addEventListener("click", submitAuth);
    $("#auth-skip").addEventListener("click", () => {
      try { localStorage.setItem("tieji.skippedAuth", "1"); } catch (e) {}
      hideAuth();
      toast("本地模式：数据只存本机，登录后可云同步");
    });
    $$("#auth-tabs button").forEach((b) => b.addEventListener("click", () => {
      authMode = b.dataset.authTab;
      renderAuthTabs();
      authError("");
    }));
    $("#auth-email").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#auth-password").focus(); });
    $("#auth-forgot").addEventListener("click", openForgotSheet);
    $("#share-close").addEventListener("click", () => $("#share-view").classList.remove("show"));
    // 计划编辑：返回 / 保存 / 添加动作
    $("#plan-back").addEventListener("click", () => {
      closePlanEditor();
      if (planDraft.id) openPlanDetail(planDraft.id);
      else openPlanList();
    });
    $("#plan-save").addEventListener("click", savePlanFromEditor);
    $("#plan-add").addEventListener("click", openPlanAddExercise);
    // 名称输入实时同步到草稿
    $("#plan-name").addEventListener("input", (e) => { planDraft.name = e.target.value; });
    $("#reset-cancel").addEventListener("click", () => { $("#reset-view").classList.remove("show"); showAuth(); });
    $("#reset-submit").addEventListener("click", submitNewPassword);
    ["#reset-password", "#reset-password2"].forEach((sel) =>
      $(sel).addEventListener("keydown", (e) => { if (e.key === "Enter") submitNewPassword(); }));
    $("#auth-password").addEventListener("keydown", (e) => { if (e.key === "Enter") submitAuth(); });

    // 头像裁剪：拖动 + 缩放
    const stage = $("#crop-stage");
    stage.addEventListener("pointerdown", (e) => {
      if (!crop.img) return;
      crop.dragging = true; crop.px = e.clientX; crop.py = e.clientY;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!crop.dragging) return;
      crop.x += e.clientX - crop.px;
      crop.y += e.clientY - crop.py;
      crop.px = e.clientX; crop.py = e.clientY;
      applyCrop();
    });
    const endDrag = () => { crop.dragging = false; };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    $("#crop-zoom").addEventListener("input", (e) => {
      if (!crop.img) return;
      const z = parseFloat(e.target.value) || 1;
      const ns = crop.base * z;
      // 以取景框中心为锚点缩放
      const cx = (crop.S / 2 - crop.x) / crop.scale;
      const cy = (crop.S / 2 - crop.y) / crop.scale;
      crop.scale = ns;
      crop.x = crop.S / 2 - cx * ns;
      crop.y = crop.S / 2 - cy * ns;
      applyCrop();
    });
    $("#crop-cancel").addEventListener("click", closeCropper);
    $("#crop-ok").addEventListener("click", submitCrop);
    // iOS 痛点：输入框聚焦着的时候点页面按钮，第一次点击只会被系统用来“失焦+收键盘”，
    // 数值根本没变（要再点一次才生效）。对步进器按钮在 pointerdown 捕获阶段阻止默认行为，
    // 焦点就不转移，键盘保持抬起，点击立即生效。
    document.addEventListener("pointerdown", (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-noblur]") : null;
      if (t) e.preventDefault();
    }, true);

    // 步进器长按连发：+ / − 按住不放连续加减，不用一下一下点（次数从 10 调到 15 只需按住约一秒）
    let holdTimer = 0, holdEl = null, holdFired = false;
    function stopHold() {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = 0; }
      holdEl = null;
      // 放到下一轮再清：让同一次松手派发的 click 先被吞掉
      setTimeout(() => { holdFired = false; }, 0);
    }
    // 用递归 setTimeout 而不是 setInterval：主线程偶尔卡一下时不会把回调积压后一次性爆发
    function holdStep() {
      if (!holdEl) return;
      const fn = ACTS[holdEl.dataset.act];
      if (fn) { holdFired = true; fn(holdEl); }
      holdTimer = holdEl ? setTimeout(holdStep, 120) : 0;
    }
    document.addEventListener("pointerdown", (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!t) return;
      // 只接管步进类动作（inc-kg / dec-reps / ts-inc-kg / inc-defreps …）
      if (!/^(inc|dec|ts-inc|ts-dec)-/.test(t.dataset.act)) return;
      holdEl = t; holdFired = false;
      holdTimer = setTimeout(holdStep, 420);
    }, true);
    ["pointerup", "pointercancel"].forEach((ev) =>
      document.addEventListener(ev, () => { if (holdEl || holdTimer) stopHold(); }, true));
    // 长按后松手还会派发一次 click，吞掉它免得比预期多加一步
    document.addEventListener("click", (e) => {
      if (!holdFired) return;
      holdFired = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);

    $("#avatar-file").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f || !Cloud.isLoggedIn()) return;
      if (!/^image\//.test(f.type)) { toast("请选择图片文件"); return; }
      // 先让用户框选范围，再上传（长图直接压缩会被拉成椭圆）
      const reader = new FileReader();
      reader.onload = () => openCropper(reader.result);
      reader.onerror = () => toast("图片读取失败");
      reader.readAsDataURL(f);
    });

    $("#exercise-search").addEventListener("input", (e) => { exFilter.q = e.target.value; renderExercises(); });
    $("#workout-name").addEventListener("input", (e) => {
      const w = Store.data.activeWorkout;
      if (w) { w.name = e.target.value; Store.save(); }
    });

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-act]");
      if (!t) return;
      const fn = ACTS[t.dataset.act];
      if (fn) { e.preventDefault(); fn(t); }
    });
    document.addEventListener("change", (e) => {
      if (e.target.id === "ts-kg" || e.target.id === "ts-reps") {
        saveTsInputs();
        const st2 = Store.data.settings;
        $("#ts-kg").value = U.fmt(st2.defaultKg || 0);
        $("#ts-reps").value = String(st2.defaultReps || 10);
      }
      if (e.target.id === "in-defkg" || e.target.id === "in-defreps") {
        saveDefInputs();
        // 就地规范化显示（如 50.0 → 50、空值 → 默认），不整页重渲染
        const st = Store.data.settings;
        $("#in-defkg").value = U.fmt(st.defaultKg || 0);
        $("#in-defreps").value = String(st.defaultReps || 10);
      }
      const rk = e.target.dataset && e.target.dataset.reset;
      if (rk) resetOpt[rk] = !!e.target.checked;
    });
    document.addEventListener("input", (e) => {
      if (e.target.id === "picker-search") { picker.q = e.target.value; renderPicker(); }
      if (e.target.id === "custom-ex-name") { customDraft.name = e.target.value; }
      if (e.target.id === "in-defkg" || e.target.id === "in-defreps") saveDefInputs();
      if (e.target.id === "ts-kg" || e.target.id === "ts-reps") saveTsInputs();
      if (e.target.id === "in-nickname") {
        clearTimeout(nickTimer);
        nickTimer = setTimeout(async () => {
          let r;
          try { r = await Cloud.updateNickname(e.target.value); }
          catch (err) { return; }
          if (r && !r.error) {
            const t = $("#profile-nickname-text");
            if (t) t.textContent = r.nickname || "未设置昵称";
          }
        }, 600);
      }
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (Store.data.settings.theme === "system") applyTheme();
    });
  }

  function renderAll() {
    if ($("#screen-me") && $("#screen-me").classList.contains("active")) rerenderMe();
    renderToday();
    renderExercises();
    refreshHistoryIfActive();
    if (Store.data.activeWorkout) renderWorkout();
  }

  function init() {
    // 必须在 Cloud.init() 之前快照：supabase 会消费并清掉 URL 里的恢复令牌，
    // 之后再读 hash 就什么都看不到了。令牌无效时也要能给出解释，不能静默回登录页。
    urlFlags.recovery = /recovery/.test(location.hash + location.search);
    urlFlags.verify = /type=signup|type=invite|type=email_change/.test(location.hash + location.search);
    if (urlFlags.recovery) showResetView(); // 同步显示，不等云端回调
    applyTheme();
    injectIcons();
    bindEvents();
    switchTab("today");
    if ("serviceWorker" in navigator) {
      // 新版本安装好并接管后自动刷新一次，省掉“刷新两次才能更新”的老毛病。
      // 只在「原本就有 SW」时重载，首次安装不重载，避免多余刷新。
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || reloading) return;
        reloading = true;
        location.reload();
      });
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
    }
    // 云功能：初始化 → 恢复会话 → 未登录则展示登录层（跳过标志除外）
    if (Cloud.init()) {
      Cloud.onAuthChange((u) => {
        onCloudAuth(u);
        // 恢复会话刚建立：刷新“设置新密码”页上的账号邮箱
        if (u && $("#reset-view").classList.contains("show")) refreshResetEmail();
      });
      Cloud.onProfileChange(refreshProfileUi); // 头像/昵称拉到手后立刻换上
      Cloud.whenReady().then((loggedIn) => {
        // 令牌是异步消费的，事件可能比上面那次同步判断晚到：补一次
        if (Cloud.consumeRecoveryFlag()) showResetView();
        else if (!urlFlags.recovery && !loggedIn && !localStorage.getItem("tieji.skippedAuth")) showAuth();
      });
    }
  }
  init();
})();
