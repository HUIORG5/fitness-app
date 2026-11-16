/* 分享长图：把一次训练画成一张带二维码的图片（纯 canvas 绘制）。
   从 app.js 切出来的原因：这段 140 行全是绘制代码，只进不出、极少改动，
   混在主文件里翻起来累。调用方传一条训练记录进来，拿回 dataURL。
   依赖 window.Format（格式化函数）和 window.Store（取单位设置）。 */
(function () {
  "use strict";
  const F = window.Format;
  const fmtVol = F.fmtVol, fmtDur = F.fmtDur, fmtDate = F.fmtDate, fmtWD = F.fmtWD;
  const fmtClock = F.fmtClock, U = F.U, setText = F.setText, setE1RM = F.setE1RM;
  const exVol = F.exVol, workoutVol = F.workoutVol, setCount = F.setCount, unitOf = F.unitOf;

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
        c.fillText(setText(s2, e.type, unitOf(e)), PAD + 70, ry);
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

  window.Share = { build: buildShareCard, draw: drawShareCard };
})();
