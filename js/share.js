/* 分享长图：把一次训练画成一张带二维码的图片（纯 canvas 绘制）。
   从 app.js 切出来的原因：这段 140 行全是绘制代码，只进不出、极少改动，
   混在主文件里翻起来累。调用方传一条训练记录进来，拿回 dataURL。
   依赖 window.Format（格式化函数）和 window.Store（取单位设置）。

   版式原则：一屏尽量多放内容。
   - 汇总卡从 2×2 改成一行四格（高度 150 → 88）
   - 每组数据从「一行一条」改成三列网格，e1RM 贴在格子右侧，不再让中间空一大块
   - 表头去掉：数字就是数字，标签只在必要处出现 */
(function () {
  "use strict";
  const F = window.Format;
  const fmtVol = F.fmtVol, fmtDur = F.fmtDur, fmtDate = F.fmtDate, fmtWD = F.fmtWD;
  const fmtClock = F.fmtClock, fmtMins = F.fmtMins, U = F.U;
  const setText = F.setText, setE1RM = F.setE1RM;
  const exVol = F.exVol, workoutVol = F.workoutVol, setCount = F.setCount, unitOf = F.unitOf;

  // 分享图用的配色：始终取浅色版，且跟随用户选的配色（发出去要和 App 看起来是一家的）
  const PALETTES = {
    classic: { bg: "#f2f2f7", card: "#ffffff", ink: "#1c1c1e", sub: "#8e8e93", line: "rgba(60,60,67,.10)", accent: "#007aff" },
    ink: { bg: "#f5f2ec", card: "#ffffff", ink: "#191815", sub: "#8a8578", line: "rgba(25,24,21,.10)", accent: "#a3764a" },
    slate: { bg: "#f2f4f6", card: "#ffffff", ink: "#0f1720", sub: "#7d8a96", line: "rgba(15,23,32,.10)", accent: "#1f3a5f" },
    clay: { bg: "#f5f5f6", card: "#ffffff", ink: "#121214", sub: "#82828a", line: "rgba(18,18,20,.10)", accent: "#b35c3a" },
  };
  function palette() {
    const st = (window.Store && window.Store.data && window.Store.data.settings) || {};
    return PALETTES[st.palette] || PALETTES.classic;
  }

  // 分享图里的组文本：力量动作省掉「次」字，三列才挤得下；时长照旧
  function shareSetText(s, type, unit) {
    if (type === "time") return setText(s, type, unit);
    return s.kg > 0 ? U.fmt(s.kg) + " " + U.cur() + " × " + s.reps : "徒手 × " + s.reps;
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
    const W = 750, PAD = 32, CW = W - PAD * 2;
    const FONT = '-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif';
    const P = palette();
    const INK = P.ink, SUB = P.sub, LINE = P.line, BLUE = P.accent, PAPER = P.card;
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
    function card(x, y, iw, ih) { c.fillStyle = PAPER; rr(x, y, iw, ih, 20); c.fill(); }

    // 背景
    c.fillStyle = P.bg; c.fillRect(0, 0, W, 5000);

    let y = 28;
    // 顶部品牌：一行，右侧补一句说明，不再单独占一行
    F(25, 800); c.fillStyle = INK; c.textAlign = "left";
    c.fillText("练了吗", PAD, y + 22);
    const brandW = c.measureText("练了吗").width;
    F(13); c.fillStyle = SUB;
    c.fillText("记录每一组的进步", PAD + brandW + 10, y + 22);
    y += 46;

    // 标题 + 副行（副行不再重复日期，只写星期和时长）
    F(31, 800); c.fillStyle = INK; c.textAlign = "left";
    c.fillText(w.name || "训练", PAD, y + 28);
    y += 42;
    F(15); c.fillStyle = SUB;
    const d = new Date(w.startedAt);
    const subline = [w.planName ? "计划 · " + w.planName : "",
      fmtWD(d), fmtDur(w.endedAt - w.startedAt)].filter(Boolean).join(" · ");
    c.fillText(subline, PAD, y + 14);
    y += 32;

    // 汇总卡：一行四格
    const sumH = 86;
    card(PAD, y, CW, sumH);
    const items = [
      [fmtVol(workoutVol(w)), "总容量"],
      [w.exercises.length + "", "动作数"],
      [setCount(w) + "", "总组数"],
      [fmtClock(w.endedAt - w.startedAt), "时长"],
    ];
    const qw = CW / 4;
    items.forEach((it, i) => {
      const cx = PAD + 16 + i * qw;
      F(22, 800); c.fillStyle = INK; c.textAlign = "left";
      c.fillText(it[0], cx, y + 40);
      F(12); c.fillStyle = SUB;
      c.fillText(it[1], cx, y + 62);
      if (i > 0) {
        c.strokeStyle = LINE; c.lineWidth = 1;
        c.beginPath(); c.moveTo(PAD + i * qw, y + 16); c.lineTo(PAD + i * qw, y + sumH - 16); c.stroke();
      }
    });
    y += sumH + 14;

    // 每个动作一张卡：头部一行 + 组数据三列网格
    const COLS = 3, cellW = (CW - 36) / COLS, cellH = 30, padX = 18;
    w.exercises.forEach((e) => {
      const rows = Math.max(1, Math.ceil(e.sets.length / COLS));
      const headH = 40;
      const h = headH + rows * cellH + 10;
      card(PAD, y, CW, h);

      // 右侧数值：力量看容量，有氧看总时长，两个都是 0（徒手）就不显示，
      // 否则有氧和自重动作会挂一个没意义的「0 kg」
      const secs = e.sets.reduce((a, x) => a + (x.sec || 0), 0);
      const volTxt = e.type === "time"
        ? (secs ? fmtMins(Math.round(secs / 60)) : "")
        : (exVol(e) > 0 ? fmtVol(exVol(e)) : "");
      F(14, 600);
      const volW = volTxt ? c.measureText(volTxt).width + 16 : 0;
      F(19, 700);
      let shown = e.name;
      const nameMax = CW - padX * 2 - volW - 64;      // 64 留给分类的两三个字
      if (c.measureText(shown).width > nameMax) {
        while (shown.length > 2 && c.measureText(shown + "…").width > nameMax) shown = shown.slice(0, -1);
        shown += "…";
        // 名字太长就不要分类了，否则挤在一起
        c.fillStyle = INK; c.textAlign = "left";
        c.fillText(shown, PAD + padX, y + 26);
      } else {
        c.fillStyle = INK; c.textAlign = "left";
        c.fillText(shown, PAD + padX, y + 26);
        const nw = c.measureText(shown).width;
        F(12); c.fillStyle = SUB;
        c.fillText(e.cat, PAD + padX + nw + 8, y + 26);
      }
      if (volTxt) {
        F(14, 600); c.fillStyle = BLUE; c.textAlign = "right";
        c.fillText(volTxt, PAD + CW - padX, y + 26);
      }

      // 组数据：三列网格，同一行从左到右
      e.sets.forEach((s2, si) => {
        const col = si % COLS, row = Math.floor(si / COLS);
        const cx = PAD + padX + col * cellW;
        const ry = y + headH + row * cellH + 20;
        c.textAlign = "left";
        F(12); c.fillStyle = SUB;
        c.fillText(String(si + 1), cx, ry);
        F(15); c.fillStyle = INK;
        const txt = shareSetText(s2, e.type, unitOf(e));
        c.fillText(txt, cx + 20, ry);
        const tw = c.measureText(txt).width;
        // e1RM 紧跟在数据后面（不是贴到格子右边缘）：贴右边会离下一格的组号太近，
        // 看起来像「31.7 是第 2 组的 e1RM」
        const e1 = e.type === "time" || setE1RM(s2) <= 0 ? "" : U.fmt(setE1RM(s2));
        if (e1) {
          F(11); c.fillStyle = "#b4b4b9"; c.textAlign = "left";
          c.fillText(e1, cx + 20 + tw + 8, ry);
        }
      });
      y += h + 10;
    });

    // 底部二维码区：压成一条，别占掉一整块
    const footH = 122;
    card(PAD, y + 4, CW, footH);
    const qs = 90, qx = PAD + padX, qy = y + 4 + (footH - qs) / 2;
    c.drawImage(qr, qx, qy, qs, qs);
    const tx = qx + qs + 18;
    F(18, 700); c.fillStyle = INK; c.textAlign = "left";
    c.fillText("扫码一起练", tx, qy + 32);
    F(13); c.fillStyle = SUB;
    c.fillText("记录每一组的进步", tx, qy + 56);
    F(12); c.fillStyle = BLUE;
    c.fillText("huiorg5.github.io/fitness-app", tx, qy + 78);
    y += footH + 28;

    // 裁剪到实际高度
    const out = document.createElement("canvas");
    out.width = W; out.height = y;
    out.getContext("2d").drawImage(cv, 0, 0, W, y, 0, 0, W, y);
    return out.toDataURL("image/png");
  }

  window.Share = { build: buildShareCard, draw: drawShareCard };
})();
