/* ============ 练了吗 · SVG 图表 ============ */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function fmtShort(v) {
    if (v >= 10000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    if (v >= 1000) return Math.round(v) + "";
    if (v >= 100) return Math.round(v) + "";
    if (v >= 10) return v.toFixed(0);
    return v.toFixed(0);
  }

  /* 柱状图：data = [{label, value, today}]，高度自适应 */
  function barChart(container, data) {
    container.innerHTML = "";
    const W = 343, H = 150, padB = 20, padT = 18;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` }, container);
    const max = Math.max(...data.map((d) => d.value), 1);
    const niceMax = max * 1.15;
    const bw = 22, gap = (W - data.length * bw) / (data.length + 1);

    data.forEach((d, i) => {
      const x = gap + i * (bw + gap);
      const h = Math.max(d.value > 0 ? 3 : 1, (d.value / niceMax) * (H - padB - padT));
      const y = H - padB - h;
      const fill = d.value > 0 ? (d.today ? "var(--blue)" : "var(--blue)") : "var(--sep)";
      el("rect", {
        x, y, width: bw, height: h, rx: 6, fill,
        opacity: d.today ? 1 : d.value > 0 ? 0.45 : 1,
      }, svg);
      const t = el("text", {
        x: x + bw / 2, y: y - 6, "text-anchor": "middle",
        "font-size": 10, "font-weight": 700, fill: "var(--text-2)",
      }, svg);
      if (d.value > 0 && d.value === max) t.textContent = fmtShort(d.value);
      const l = el("text", {
        x: x + bw / 2, y: H - 5, "text-anchor": "middle",
        "font-size": 10.5, fill: "var(--text-2)",
      }, svg);
      l.textContent = d.label;
    });
  }

  /* 折线图：points = [{label, value}] */
  function lineChart(container, points) {
    container.innerHTML = "";
    const W = 343, H = 150, padB = 20, padT = 18, padX = 14;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` }, container);
    const max = Math.max(...points.map((p) => p.value), 1);
    const niceMax = max * 1.15;
    const iw = W - padX * 2;
    const step = points.length > 1 ? iw / (points.length - 1) : 0;

    const pts = points.map((p, i) => ({
      x: padX + i * step,
      y: H - padB - (p.value / niceMax) * (H - padB - padT),
      ...p,
    }));

    // 面积填充
    if (pts.length > 1) {
      const d = `M ${pts[0].x} ${H - padB} ` +
        pts.map((p) => `L ${p.x} ${p.y}`).join(" ") +
        ` L ${pts[pts.length - 1].x} ${H - padB} Z`;
      el("path", { d, fill: "var(--blue)", opacity: 0.1 }, svg);
      const line = "M " + pts.map((p) => `${p.x} ${p.y}`).join(" L ");
      el("path", {
        d: line, fill: "none", stroke: "var(--blue)",
        "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round",
      }, svg);
    }
    pts.forEach((p, i) => {
      el("circle", {
        cx: p.x, cy: p.y, r: i === pts.length - 1 ? 4.5 : 3,
        fill: i === pts.length - 1 ? "var(--blue)" : "var(--card)",
        stroke: "var(--blue)", "stroke-width": 2,
      }, svg);
      if (i === pts.length - 1) {
        const t = el("text", {
          x: Math.min(Math.max(p.x, 24), W - 24), y: p.y - 10, "text-anchor": "middle",
          "font-size": 11, "font-weight": 800, fill: "var(--blue)",
        }, svg);
        t.textContent = fmtShort(p.value);
      }
      const l = el("text", {
        x: Math.min(Math.max(p.x, 14), W - 14), y: H - 5, "text-anchor": "middle",
        "font-size": 9.5, fill: "var(--text-2)",
      }, svg);
      l.textContent = p.label;
    });
  }

  window.Charts = { barChart, lineChart };
})();
