/* ============ 练了吗 · 云同步层（Supabase） ============
 * 职责：登录注册 / 资料与头像 / 训练数据双向同步
 * 安全：数据隔离靠数据库 RLS（见 supabase-schema.sql），本文件不含任何特权密钥
 */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);

  let client = null;
  let user = null;
  let profile = null;
  let lastSyncAt = 0;
  const authListeners = [];

  function configured() {
    return !!(
      window.SUPABASE_URL &&
      window.SUPABASE_PUBLISHABLE_KEY &&
      window.supabase &&
      window.supabase.createClient
    );
  }

  /* ---------- 初始化 ---------- */
  let readyPromise = null;
  function init() {
    if (!configured()) { console.warn("Supabase 未配置，云功能不可用"); return false; }
    try {
      client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
    } catch (e) {
      console.warn("Supabase 初始化失败", e);
      return false;
    }
    readyPromise = client.auth.getSession().then(({ data }) => {
      setUser(data.session ? data.session.user : null);
      return !!data.session;
    }).catch(() => false);
    client.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
    });
    return true;
  }
  function whenReady() {
    return readyPromise || Promise.resolve(false);
  }

  function setUser(u) {
    const changed = (u && u.id) !== (user && user.id);
    user = u;
    if (!u) { profile = null; }
    else if (changed) { loadProfile(); }
    authListeners.forEach((cb) => { try { cb(u); } catch (e) {} });
  }

  function onAuthChange(cb) { authListeners.push(cb); }

  // 资料（昵称/头像）是异步拉取的，加载完成后要再通知一次界面，
  // 否则冷启动时会一直挂着默认头像，直到下一次 auth 回调才刷出来。
  const profileListeners = [];
  function onProfileChange(cb) { profileListeners.push(cb); }
  function notifyProfile() {
    profileListeners.forEach((cb) => { try { cb(profile); } catch (e) {} });
  }

  /* ---------- 认证 ---------- */
  async function signUp(email, password, nickname) {
    if (!client) return { error: "云服务未初始化" };
    const { data, error } = await client.auth.signUp({
      email: email.trim(), password: password,
      options: { data: { nickname: (nickname || "").trim() } },
    });
    if (error) return { error: friendlyAuthError(error) };
    // 未开启邮箱确认时直接返回会话；开启时 data.session 为 null
    return { ok: true, needConfirm: !data.session, user: data.user };
  }
  async function signIn(email, password) {
    if (!client) return { error: "云服务未初始化" };
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password: password });
    if (error) return { error: friendlyAuthError(error) };
    return { ok: true };
  }
  /* 忘记密码：给邮箱发重置链接，用户在邮箱里点链接回到 App 设置新密码 */
  async function resetPassword(email) {
    if (!client) return { error: "云服务未初始化" };
    const mail = (email || "").trim();
    if (!mail) return { error: "请先填写邮箱" };
    const redirectTo = location.origin + location.pathname;
    const { error } = await client.auth.resetPasswordForEmail(mail, { redirectTo: redirectTo });
    if (error) return { error: friendlyAuthError(error) };
    return { ok: true };
  }
  /* 邮箱链接回来后设置新密码 */
  async function updatePassword(password) {
    if (!client) return { error: "云服务未初始化" };
    if (!password || password.length < 6) return { error: "密码至少 6 位" };
    const { error } = await client.auth.updateUser({ password: password });
    if (error) return { error: error.message };
    return { ok: true };
  }

  async function signOut() {
    if (!client) return { error: "云服务未初始化" };
    const { error } = await client.auth.signOut();
    if (error) return { error: error.message };
    return { ok: true };
  }
  function friendlyAuthError(e) {
    const m = (e && e.message) || "操作失败，请重试";
    // 顺序有讲究：先匹配具体原因，最后才用宽泛的 invalid 兜底
    if (/rate limit/i.test(m)) return "发送太频繁：免费邮件额度已用尽。请在后台关闭「Confirm email」，或稍后再试";
    if (/Failed to fetch|NetworkError|network request failed/i.test(m)) return "网络连接失败，请检查网络后重试";
    if (/Invalid login/i.test(m)) return "邮箱或密码不正确";
    if (/already registered|been registered/i.test(m)) return "该邮箱已注册，请直接登录";
    if (/Password should be/i.test(m)) return "密码至少 6 位";
    if (/Email not confirmed/i.test(m)) return "邮箱尚未验证，请先收邮件完成确认（或在 Supabase 关闭邮件确认）";
    if (/Unable to validate email/i.test(m)) return "邮箱格式不正确";
    return m;
  }

  /* ---------- 资料 ---------- */
  async function loadProfile() {
    if (!client || !user) return null;
    const { data } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data || null;
    if (!profile) {
      // 兜底：老账号（触发器上线前注册的）补建资料行
      await client.from("profiles").upsert({ id: user.id, nickname: "" });
      const { data: d2 } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
      profile = d2 || null;
    }
    notifyProfile();
    return profile;
  }
  async function updateNickname(name) {
    if (!client || !user) return { error: "未登录" };
    const nick = (name || "").trim().slice(0, 16);
    const { error } = await client.from("profiles").update({ nickname: nick, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) return { error: error.message };
    if (profile) profile.nickname = nick;
    notifyProfile();
    return { ok: true, nickname: nick };
  }
  async function uploadAvatar(file) {
    if (!client || !user) return { error: "未登录" };
    let blob;
    try { blob = await compressImage(file, 256, 0.85); }
    catch (e) { return { error: "图片处理失败" }; }
    return putAvatar(blob);
  }
  // 裁剪界面输出的已是 256×256 方图，直接上传
  async function uploadAvatarBlob(blob) {
    if (!client || !user) return { error: "未登录" };
    if (!blob) return { error: "图片处理失败" };
    return putAvatar(blob);
  }
  async function putAvatar(blob) {
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const path = user.id + "/avatar." + ext;
    const { error } = await client.storage.from("avatars").upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) return { error: error.message };
    const { data } = client.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now(); // 破缓存
    const { error: e2 } = await client.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (e2) return { error: e2.message };
    if (profile) profile.avatar_url = url;
    notifyProfile();
    return { ok: true, url: url };
  }

  /* ---------- 训练数据 ---------- */
  function mapRemoteWorkout(w) {
    return {
      id: w.id, name: w.name, startedAt: w.started_at, endedAt: w.ended_at,
      exercises: (w.exercises || []).map((e) => ({
        id: e.id, exerciseId: e.exercise_id || "", name: e.name, cat: e.cat, type: e.type,
        sets: (e.sets || []).map((s) => ({ id: s.id, kg: s.kg, reps: s.reps, sec: s.sec, at: s.at })),
      })),
    };
  }
  async function fetchWorkouts() {
    if (!client || !user) return { error: "未登录" };
    const { data, error } = await client
      .from("workouts")
      .select("*, exercises (*, sets (*))")
      .order("started_at", { ascending: false });
    if (error) return { error: error.message };
    return { workouts: (data || []).map(mapRemoteWorkout) };
  }
  async function pushWorkout(w) {
    if (!client || !user) return { error: "未登录" };
    const { error: e1 } = await client.from("workouts").upsert({
      id: w.id, user_id: user.id, name: w.name,
      started_at: w.startedAt, ended_at: w.endedAt,
    });
    if (e1) return { error: e1.message };
    const exRows = w.exercises.map((e, i) => ({
      id: e.id, workout_id: w.id, exercise_id: e.exerciseId || "",
      name: e.name, cat: e.cat, type: e.type, pos: i,
    }));
    if (exRows.length) {
      const { error: e2 } = await client.from("exercises").upsert(exRows);
      if (e2) return { error: e2.message };
      const setRows = [];
      w.exercises.forEach((e) => e.sets.forEach((s) => setRows.push({
        id: s.id, exercise_id: e.id, kg: s.kg || 0, reps: s.reps || 0, sec: s.sec || 0, at: s.at || 0,
      })));
      if (setRows.length) {
        const { error: e3 } = await client.from("sets").upsert(setRows);
        if (e3) return { error: e3.message };
      }
    }
    return { ok: true };
  }

  /* ---------- 删除 ---------- */
  // 删除云端的一条训练（exercises / sets 由数据库外键级联删除）
  async function deleteRemoteWorkout(id) {
    if (!client || !user) return { skipped: true };
    const { error } = await client.from("workouts").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { error: error.message };
    return { ok: true };
  }
  // 清空云端全部训练（“清空所有数据”时用，否则下次同步会把云端数据拉回本机）
  async function wipeRemoteWorkouts() {
    if (!client || !user) return { skipped: true };
    const { error } = await client.from("workouts").delete().eq("user_id", user.id);
    if (error) return { error: error.message };
    return { ok: true };
  }

  /* ---------- 双向同步（按 id 合并，不覆盖已存在记录） ---------- */
  const TOMB_TTL = 90 * 24 * 3600 * 1000; // 墓碑保留 90 天
  let libPushedAt = 0; // 动作库上次推送时间，避免每次同步都写库
  /* 合并规则：
   *  - 本机删过的（墓碑）→ 删云端，且不再拉回
   *  - 曾同步过、现在云端没有（别的设备删的）→ 本机也删掉，绝不重新上传
   *  - 从没同步过、云端也没有 → 上传
   *  - 只有云端有 → 下载
   */
  async function sync() {
    if (!client || !user) return { error: "未登录" };

    // 0) 整理墓碑：只留 90 天内的，避免无限增长
    const now = Date.now();
    Store.data.deletedWorkouts = (Store.data.deletedWorkouts || []).filter((t) => t && t.id && (now - (t.at || 0)) < TOMB_TTL);
    const tombs = Store.data.deletedWorkouts;
    const deadIds = new Set(tombs.map((t) => t.id));

    // 1) 删除：本机删过的记录，云端也要删（一次批量，重复执行无副作用）
    let deleted = 0;
    if (tombs.length) {
      const { error } = await client.from("workouts").delete().in("id", tombs.map((t) => t.id));
      if (error) return { error: error.message };
      deleted = tombs.length;
    }

    // 2) 拉取云端
    const remote = await fetchWorkouts();
    if (remote.error) return remote;
    const remoteWorkouts = remote.workouts.filter((w) => !deadIds.has(w.id));
    const remoteIds = new Set(remoteWorkouts.map((w) => w.id));

    // 3) 跟随删除：以前同步过、现在云端没有了 → 是别的设备删了它，本机也删
    const synced = new Set((Store.data.syncedIds || []).filter((id) => !deadIds.has(id)));
    let removed = 0;
    let local = Store.data.workouts || [];
    const kept = local.filter((w) => {
      if (!remoteIds.has(w.id) && synced.has(w.id)) { removed++; return false; }
      return true;
    });
    if (removed) { local = kept; Store.data.workouts = kept; }

    const localIds = new Set(local.map((w) => w.id));

    // 4) 上传：本机有、云端没有、且从没同步过的（新记录）
    let pushed = 0;
    const pushedIds = [];
    for (const w of local) {
      if (!remoteIds.has(w.id)) {
        const r = await pushWorkout(w);
        if (r.error) return r;
        pushed++; pushedIds.push(w.id);
      }
    }

    // 5) 下载：云端有、本机没有的
    let pulled = 0;
    const fresh = remoteWorkouts.filter((w) => !localIds.has(w.id));
    if (fresh.length) {
      Store.data.workouts = local.concat(fresh).sort((a, b) => b.startedAt - a.startedAt);
      pulled = fresh.length;
    }

    // 6) 记录云端真实存在的 id，供下次判断“别的设备是否删了它”
    Store.data.syncedIds = Array.from(new Set([...remoteIds].concat(pushedIds)));
    Store.save();

    // 7) 动作库（自定义动作 / 已移除内置 / 排序）跟着账号走，避免换设备就“消失”
    const lib = await syncExerciseLib();
    if (lib && lib.error) return lib;

    lastSyncAt = Date.now();
    return { ok: true, pushed: pushed, pulled: pulled, deleted: deleted, removed: removed, lib: lib || null };
  }

  /* ---------- 动作库同步 ----------
   * custom 按 id 取并集（两边都新增过也不会互相覆盖丢失）；
   * hidden / ex_order 按 updated_at 取较新的一份；最后把合并结果推回云端。
   */
  function mergeCustomById(local, remote) {
    const out = [];
    const seen = {};
    (remote || []).concat(local || []).forEach((e) => {
      if (!e || !e.id || seen[e.id]) return;
      seen[e.id] = 1;
      out.push(e);
    });
    return out;
  }

  async function fetchExerciseLib() {
    if (!client || !user) return null;
    const { data } = await client.from("exercise_lib").select("*").eq("user_id", user.id).maybeSingle();
    return data || null;
  }

  async function syncExerciseLib() {
    if (!client || !user) return { skipped: true };
    let remote = null;
    try { remote = await fetchExerciseLib(); }
    catch (e) { return { error: "动作库读取失败" }; }

    const localAt = Store.data.libUpdatedAt || 0;
    const remoteAt = remote && remote.updated_at ? new Date(remote.updated_at).getTime() : 0;
    // 远端必须“明显更新”（>2 秒）才覆盖本地的 hidden / ex_order：
    // 刚推送完两端时间戳几乎相同，不设容差会把自己刚写的排序盖掉
    const remoteNewer = remoteAt > localAt + 2000;

    // 合并：custom 永远取并集；hidden / ex_order 谁新听谁的
    Store.data.customExercises = mergeCustomById(Store.data.customExercises, remote && remote.custom);
    if (remoteNewer) {
      Store.data.hiddenBuiltins = Array.isArray(remote.hidden) ? remote.hidden : [];
      Store.data.exOrder = Array.isArray(remote.ex_order) ? remote.ex_order : [];
      Store.data.libUpdatedAt = remoteAt;
    }
    // 清理 hidden / exOrder 里已不存在的 id（动作被删后不留垃圾）
    const alive = {};
    Store.BUILTIN.forEach((e) => { alive[e.id] = 1; });
    Store.data.customExercises.forEach((e) => { alive[e.id] = 1; });
    Store.data.hiddenBuiltins = (Store.data.hiddenBuiltins || []).filter((id) => alive[id]);
    Store.data.exOrder = (Store.data.exOrder || []).filter((id) => alive[id]);

    // 全新账号且本地动作库也是空的：不必写库
    if (!remote && !localAt && !Store.data.customExercises.length &&
        !Store.data.hiddenBuiltins.length && !Store.data.exOrder.length) {
      return { ok: true, skipped: true };
    }
    // 云端有记录、本地也没改过：不用回写
    if (remote && !remoteNewer && localAt <= libPushedAt) {
      Store.save();
      return { ok: true, pulled: false };
    }

    const { error } = await client.from("exercise_lib").upsert({
      user_id: user.id,
      custom: Store.data.customExercises,
      hidden: Store.data.hiddenBuiltins,
      ex_order: Store.data.exOrder,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
    // 用“改动时刻”而不是“推送时刻”：否则中间隔着的网络往返会让下一次改动被误判为没改过
    libPushedAt = Store.data.libUpdatedAt || Date.now();
    Store.save();
    return { ok: true, pushed: true, pulled: remoteNewer };
  }

  /* ---------- 工具：图片压缩 ---------- */
  function compressImage(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
          else if (height >= width && height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.Cloud = {
    init, whenReady, onAuthChange, onProfileChange,
    getUser: () => user,
    getProfile: () => profile,
    loadProfile,
    isLoggedIn: () => !!user,
    signUp, signIn, signOut, resetPassword, updatePassword,
    updateNickname, uploadAvatar, uploadAvatarBlob, syncExerciseLib,
    fetchWorkouts, pushWorkout, sync,
    deleteRemoteWorkout, wipeRemoteWorkouts,
    getLastSyncAt: () => lastSyncAt,
  };
})();
