/* 小宠物「角角」：一只长角的团子，住在「今天」页标题旁边。
   纯 SVG + CSS 动画，零图片资源，颜色跟随主题。

   两个设计上的关键点：
   1. 角必须「长」在身体上。所以角先画、身体后画，角的根部埋在身体轮廓里面，
      身体的不透明填充会把根部盖住，交界处只剩身体轮廓线——这才是从肉里长出来的样子。
   2. 角的高度随累计训练次数变化（data-stage 控制 CSS 变量 --horn），
      一套 SVG 就能表达成长，不用为每个阶段画一张图。 */
(function () {
  "use strict";

  const SVG = [
    '<svg viewBox="0 0 88 96" aria-hidden="true">',
    // 尾巴（也在身体下层）
    '<path class="pet-line pet-tail" d="M66 70 q11 4 8 14"/>',
    // 角：根部深埋进身体（y=44~50 已在身体椭圆内部）
    '<g class="horns">',
    // 用弧线而不是直线：根部粗、尖端细、向外微弯，这样才像「犄角」；
    // 直角三角形的尖会读成猫耳或天线
    '<path class="pet-horn" d="M29 51 Q24 33 18 16 Q31 32 44 44 Z"/>',
    '<path class="pet-horn" d="M59 51 Q64 33 70 16 Q57 32 44 44 Z"/>',
    "</g>",
    // 身体
    '<ellipse class="pet-body" cx="44" cy="62" rx="26" ry="23"/>',
    // 腮红
    '<ellipse class="pet-blush" cx="27" cy="67" rx="3.4" ry="2.1"/>',
    '<ellipse class="pet-blush" cx="61" cy="67" rx="3.4" ry="2.1"/>',
    // 平常的眼睛
    '<g class="eyes">',
    '<circle class="pet-ink" cx="36" cy="59" r="3"/>',
    '<circle class="pet-ink" cx="52" cy="59" r="3"/>',
    "</g>",
    // 被点时的眼睛（弯弯的）
    '<g class="eyes-happy">',
    '<path class="pet-line" d="M32 61 q4 -6 8 0"/>',
    '<path class="pet-line" d="M48 61 q4 -6 8 0"/>',
    "</g>",
    // 嘴
    '<path class="pet-line" d="M39 70 q5 4 10 0"/>',
    "</svg>",
  ].join("");

  // 成长阶段：累计训练次数
  function stageOf(n) {
    if (n >= 30) return 3;
    if (n >= 12) return 2;
    if (n >= 4) return 1;
    return 0;
  }

  function el() { return document.getElementById("pet"); }

  function render() {
    const box = el();
    if (!box) return;
    if (!box.querySelector("svg")) box.innerHTML = SVG;
    const n = (window.Store && window.Store.data && window.Store.data.workouts.length) || 0;
    box.dataset.stage = String(stageOf(n));
  }

  function heart(box) {
    const h = document.createElement("span");
    h.className = "pet-heart";
    h.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21s-8-4.6-8-10a4.6 4.6 0 018-2.8A4.6 4.6 0 0120 11c0 5.4-8 10-8 10z"/></svg>';
    box.appendChild(h);
    setTimeout(() => h.remove(), 1000);
  }

  let cool = false;
  function poke() {
    const box = el();
    if (!box || cool) return;
    cool = true;
    box.classList.add("happy");
    heart(box);
    // 抖一下角，显得有分量
    box.classList.add("wobble");
    setTimeout(() => {
      box.classList.remove("happy");
      box.classList.remove("wobble");
      cool = false;
    }, 900);
  }

  function init() {
    render();
    const box = el();
    if (box) box.addEventListener("click", poke);
    // 页面切到后台就停动画，回来再继续（省电）
    document.addEventListener("visibilitychange", () => {
      const b = el();
      if (b) b.classList.toggle("paused", document.hidden);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.Pet = { render: render, poke: poke };
})();
