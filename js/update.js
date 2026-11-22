/* 下拉更新：在页面顶部往下拉 → 提示「下拉更新版本」→ 继续拉 → 松手，强制从网络取最新版。
   更新完重载后会弹一张卡，告诉你从哪一版到了哪一版、这次改了什么。

   为什么不用「检测到新版本自动刷新」：那样页面会突然闪一下，用户既不知道发生了什么，
   也不知道到底有没有换成新版。改成手动触发 + 结果弹框后，每一笔更新都是明确的。

   依赖：window.APP_VERSION_HINT（app.js 里的版本号）、window.CHANGELOG（changelog.js）。
   加载顺序放在 app.js 之后，此时 DOM 已就绪。 */
(function () {
  "use strict";

  const FROM_KEY = "tieji.updateFrom";
  const TRIGGER = 58;   // 阻尼后拉过这个距离，松手就更新
  const DAMP = 0.62;    // 阻尼系数：手指拉 100px，提示条按 62px 计算

  let startY = 0;
  let dragged = 0;
  let armed = false;
  let pulling = false;
  let busy = false;

  function byId(id) { return document.getElementById(id); }
  function activeScreen() {
    return document.querySelector(".screen.active") || byId("screens");
  }
  function overlayOpen() {
    // 只要有任何遮罩/弹层/抽屉在显示，就不要接管下拉——那时候用户多半在填数据
    return !!document.querySelector(".overlay.show") ||
      !!document.querySelector(".sheet.show") ||
      !!document.querySelector(".alert-backdrop.show");
  }
  function currentVersion() { return window.APP_VERSION_HINT || "v0"; }

  /* ---------- 顶部提示条 ---------- */
  function hintBox() { return byId("pull-hint"); }

  function paint(offset) {
    const h = hintBox();
    if (!h) return;
    h.style.opacity = String(Math.min(1, offset / 20));
    h.style.transform = "translate(-50%, " + Math.min(8, offset * 0.14).toFixed(1) + "px)";
    // 页面内容跟着往下走一小段，才有「下拉」的手感；最多 62px，再多就空得难看
    const sc = activeScreen();
    if (sc && offset > 0) {
      sc.style.transition = "none";
      sc.style.transform = "translateY(" + Math.min(62, offset).toFixed(1) + "px)";
    }
  }
  function speak(text, state) {
    const h = hintBox();
    if (!h) return;
    h.classList.add("show");
    h.classList.toggle("ready", state === "ready");
    h.classList.toggle("busy", state === "busy");
    h.querySelector(".ph-text").textContent = text;
    h.querySelector(".ph-ico").textContent = state === "busy" ? "↻" : "↓";
  }
  function hideHint() {
    const h = hintBox();
    if (!h) return;
    h.classList.remove("show", "ready", "busy");
    h.style.opacity = "";
    h.style.transform = "";
    const sc = activeScreen();
    if (sc) {
      sc.style.transition = "transform .24s cubic-bezier(.32,.72,0,1)";
      sc.style.transform = "";
      setTimeout(() => { sc.style.transition = ""; }, 260);
    }
  }

  function reset() {
    armed = false;
    pulling = false;
    dragged = 0;
    hideHint();
  }

  /* ---------- 触摸手势 ---------- */
  function onStart(e) {
    if (busy || e.touches.length !== 1) return;
    if (overlayOpen()) return;
    // 底部标签栏上往下拉没有意义，别在这儿接管
    const t = e.target;
    if (t && t.closest && t.closest(".tabbar")) return;
    if (t && t.closest && t.closest("input,textarea,select,[contenteditable]")) return;
    const sc = activeScreen();
    if (!sc || sc.scrollTop > 0) return;
    armed = true;
    startY = e.touches[0].clientY;
    dragged = 0;
  }

  function onMove(e) {
    if (!armed || busy || e.touches.length !== 1) return;
    const d = e.touches[0].clientY - startY;
    if (d <= 0) { if (pulling) reset(); return; }
    const sc = activeScreen();
    // 拉到一半页面自己开始滚了（比如从顶部往下拽时内容在动），交还给原生滚动
    if (sc && sc.scrollTop > 0) { reset(); return; }
    // 先观察一小段，确认是「往下拉」再接管，否则会把正常点击/横滑也吃掉
    if (!pulling && d < 6) return;
    pulling = true;
    dragged = Math.min(d, 190);
    if (e.cancelable) e.preventDefault();
    const off = dragged * DAMP;
    paint(off);
    if (off >= TRIGGER) speak("松手，更新到最新版本", "ready");
    else speak("下拉更新版本", "");
  }

  function onEnd() {
    if (!armed) return;
    const off = dragged * DAMP;
    const fire = pulling && off >= TRIGGER;
    armed = false;
    pulling = false;
    dragged = 0;
    if (!fire) { hideHint(); return; }
    run();
  }

  /* ---------- 执行更新 ---------- */
  function run() {
    if (busy) return;
    if (!navigator.onLine) {
      paint(TRIGGER);
      speak("没有网络，连上再试", "");
      setTimeout(hideHint, 1500);
      return;
    }
    busy = true;
    paint(TRIGGER);
    speak("正在更新…", "busy");
    try { sessionStorage.setItem(FROM_KEY, currentVersion()); } catch (e) {}
    // 先让「正在更新」画出来，再去拆缓存——否则提示还没渲染页面就重载了
    setTimeout(forceReload, 260);
  }

  async function forceReload() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) { /* 拆不掉也要继续，至少试一次 reload */ }
    location.reload();
  }

  /* ---------- 更新结果弹框 ---------- */
  function entryFor(v) {
    const list = window.CHANGELOG || [];
    for (let i = 0; i < list.length; i++) if (list[i].v === v) return list[i];
    return null;
  }

  function showResult(from) {
    const cur = currentVersion();
    const box = byId("upd-backdrop");
    if (!box) return;
    const changed = !!from && from !== cur;
    const entry = entryFor(cur);
    byId("upd-title").textContent = changed ? "已更新到 " + cur : "已经是最新版本";
    byId("upd-sub").textContent = changed
      ? from + " → " + cur + (entry && entry.at ? " · " + entry.at : "")
      : cur + " · 没发现更新的版本，过几天再来试试";
    byId("upd-ico").textContent = changed ? "✓" : "i";
    box.classList.toggle("nochange", !changed);

    const ul = byId("upd-list");
    ul.innerHTML = "";
    const items = changed && entry && entry.items ? entry.items : [];
    items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });
    ul.style.display = items.length ? "" : "none";
    box.classList.add("show");
  }

  function closeResult() {
    byId("upd-backdrop").classList.remove("show");
  }

  /* ---------- 启动 ---------- */
  function init() {
    let from = null;
    try { from = sessionStorage.getItem(FROM_KEY); } catch (e) {}
    if (from) {
      try { sessionStorage.removeItem(FROM_KEY); } catch (e) {}
      // 等首屏画完再弹，否则会盖在「加载中」上面
      setTimeout(() => showResult(from), 800);
    }
    const ok = byId("upd-ok");
    if (ok) ok.addEventListener("click", closeResult);
    const box = byId("upd-backdrop");
    if (box) box.addEventListener("click", (e) => { if (e.target === box) closeResult(); });

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", () => { if (!busy) reset(); }, { passive: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // 便于在调试工具里直接触发（也在自动化里用过）
  window.PullUpdate = { run: run, reset: reset, result: showResult };
})();
