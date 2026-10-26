/* ---------- 轻量错误上报 ----------
 * 捕获到的异常写进 Supabase 的 client_errors 表，之后在后台就能看到"用户到底卡在哪"。
 *
 * 三条铁律：
 *   1. 绝不影响 App —— fire-and-forget，任何失败静默吞掉，不弹提示、不重试
 *   2. 绝不刷屏 —— 同一条错误 10 分钟内只报一次，每次启动最多 10 条
 *   3. 绝不泄露内容 —— 只报错误信息/堆栈/版本/页面，**不报训练数据、邮箱、昵称**
 *
 * 依赖：js/config.js 里的 window.SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY
 *       （直接打 REST 接口，不用等 supabase client 初始化，启动早期的错误也能上报）
 */
(function () {
  var MAX_PER_SESSION = 10;
  var DEDUP_MS = 10 * 60 * 1000;
  var seen = Object.create(null);
  var sent = 0;
  var endpoint = "";

  function url() {
    if (!endpoint && window.SUPABASE_URL) {
      endpoint = String(window.SUPABASE_URL).replace(/\/+$/, "") + "/rest/v1/client_errors";
    }
    return endpoint;
  }

  function cut(v, n) {
    return v == null ? "" : String(v).slice(0, n);
  }

  // 这些属于噪音（弱网、浏览器扩展、长列表循环），报上去只会淹没有用信息
  function noisy(msg) {
    return /ResizeObserver loop|Script error\.?$|Failed to fetch|NetworkError|Load failed|AbortError|The user aborted|non-passive event listener/i.test(
      msg || ""
    );
  }

  function currentTab() {
    var t = document.querySelector("#tabbar .tab.active");
    return t ? t.textContent.trim() : "";
  }

  function send(kind, message, detail) {
    if (sent >= MAX_PER_SESSION) return;
    var msg = cut(message, 400);
    if (!msg || noisy(msg)) return;

    var now = Date.now();
    if (seen[msg] && now - seen[msg] < DEDUP_MS) return;
    seen[msg] = now;

    var ep = url();
    var key = window.SUPABASE_PUBLISHABLE_KEY;
    if (!ep || !key) return;

    sent++;
    var row = {
      app_version: window.APP_VERSION_HINT || "",
      kind: kind,
      message: msg,
      source: cut(detail && detail.source, 200),
      stack: cut(detail && detail.stack, 2000),
      page: currentTab(),
      ua: cut(navigator.userAgent, 200),
      extra: (detail && detail.extra) || null,
    };

    try {
      fetch(ep, {
        method: "POST",
        headers: {
          apikey: key,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(row),
        keepalive: true, // 页面正在关闭时也尽量发出去
      }).catch(function () {});
    } catch (e) {
      /* 上报本身出错，忽略 */
    }
  }

  // 1) 同步错误 + 资源加载失败（脚本/样式挂了才是真问题，图片失败不算）
  window.addEventListener(
    "error",
    function (e) {
      var t = e.target;
      if (t && t !== window && t.tagName) {
        if (t.tagName === "SCRIPT" || t.tagName === "LINK") {
          send("resource", "资源加载失败：" + (t.src || t.href || t.tagName), {});
        }
        return;
      }
      var err = e.error;
      send("error", (err && err.message) || e.message || "unknown error", {
        source: (e.filename || "") + (e.lineno ? ":" + e.lineno : ""),
        stack: err && err.stack,
      });
    },
    true
  );

  // 2) Promise 里没接住的错（异步请求失败大多走这里）
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    var msg = (r && (r.message || String(r))) || "unhandled promise rejection";
    send("rejection", msg, { stack: r && r.stack });
  });

  // 3) 手动上报：关键流程用，比如"保存训练失败了但没抛异常"
  //    用法：window.reportClientError("保存训练失败", { step: "saveWorkout" })
  window.reportClientError = function (message, extra) {
    send("manual", message, { extra: extra || null });
  };
})();
