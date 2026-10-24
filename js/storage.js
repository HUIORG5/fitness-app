/* ============ 练了吗 · 数据层 ============ */
(function () {
  const KEY = "tieji.diary.v1";

  /* 内置动作库：type = reps(记次数) | time(记时间) */
  const BUILTIN = [
    // 胸部
    { id: "b_bench",        name: "平板杠铃卧推",   cat: "胸", type: "reps" },
    { id: "b_incline_db",   name: "上斜哑铃卧推",   cat: "胸", type: "reps" },
    { id: "b_flat_db",      name: "平板哑铃卧推",   cat: "胸", type: "reps" },
    { id: "b_dip",          name: "双杠臂屈伸",     cat: "胸", type: "reps" },
    { id: "b_pushup",       name: "俯卧撑",         cat: "胸", type: "reps" },
    { id: "b_fly",          name: "哑铃飞鸟",       cat: "胸", type: "reps" },
    { id: "b_cable_fly",    name: "绳索夹胸",       cat: "胸", type: "reps" },
    // 背部
    { id: "b_pullup",       name: "引体向上",       cat: "背", type: "reps" },
    { id: "b_pulldown",     name: "高位下拉",       cat: "背", type: "reps" },
    { id: "b_row",          name: "杠铃划船",       cat: "背", type: "reps" },
    { id: "b_seated_row",   name: "坐姿划船",       cat: "背", type: "reps" },
    { id: "b_db_row",       name: "单臂哑铃划船",   cat: "背", type: "reps" },
    { id: "b_hyper",        name: "山羊挺身",       cat: "背", type: "reps" },
    // 腿部
    { id: "b_squat",        name: "杠铃深蹲",       cat: "腿", type: "reps" },
    { id: "b_front_squat",  name: "前蹲",           cat: "腿", type: "reps" },
    { id: "b_leg_press",    name: "腿举",           cat: "腿", type: "reps" },
    { id: "b_rdl",          name: "罗马尼亚硬拉",   cat: "腿", type: "reps" },
    { id: "b_deadlift",     name: "传统硬拉",       cat: "腿", type: "reps" },
    { id: "b_bulgarian",    name: "保加利亚分腿蹲", cat: "腿", type: "reps" },
    { id: "b_leg_curl",     name: "腿弯举",         cat: "腿", type: "reps" },
    { id: "b_leg_ext",      name: "腿屈伸",         cat: "腿", type: "reps" },
    { id: "b_calf",         name: "站姿提踵",       cat: "腿", type: "reps" },
    { id: "b_hip_thrust",   name: "臀推",           cat: "腿", type: "reps" },
    // 肩部
    { id: "b_ohp",          name: "站姿杠铃推举",   cat: "肩", type: "reps" },
    { id: "b_db_press",     name: "哑铃推举",       cat: "肩", type: "reps" },
    { id: "b_lateral",      name: "哑铃侧平举",     cat: "肩", type: "reps" },
    { id: "b_face_pull",    name: "绳索面拉",       cat: "肩", type: "reps" },
    { id: "b_rear_delt",    name: "俯身飞鸟",       cat: "肩", type: "reps" },
    { id: "b_shrug",        name: "杠铃耸肩",       cat: "肩", type: "reps" },
    // 手臂
    { id: "b_curl",         name: "杠铃弯举",       cat: "臂", type: "reps" },
    { id: "b_db_curl",      name: "哑铃弯举",       cat: "臂", type: "reps" },
    { id: "b_hammer",       name: "锤式弯举",       cat: "臂", type: "reps" },
    { id: "b_preacher",     name: "牧师凳弯举",     cat: "臂", type: "reps" },
    { id: "b_skull",        name: "仰卧臂屈伸",     cat: "臂", type: "reps" },
    { id: "b_pushdown",     name: "绳索下压",       cat: "臂", type: "reps" },
    { id: "b_close_bench",  name: "窄距卧推",       cat: "臂", type: "reps" },
    // 核心
    { id: "b_crunch",       name: "卷腹",           cat: "核心", type: "reps" },
    { id: "b_leg_raise",    name: "悬垂举腿",       cat: "核心", type: "reps" },
    { id: "b_plank",        name: "平板支撑",       cat: "核心", type: "time" },
    { id: "b_deadbug",      name: "死虫式",         cat: "核心", type: "reps" },
    // 有氧
    { id: "b_run",          name: "跑步",           cat: "有氧", type: "time" },
    { id: "b_elliptical",   name: "椭圆机",         cat: "有氧", type: "time" },
    { id: "b_rower",        name: "划船机",         cat: "有氧", type: "time" },
    { id: "b_bike",         name: "动感单车",       cat: "有氧", type: "time" },
    { id: "b_jump_rope",    name: "跳绳",           cat: "有氧", type: "time" },
  ];

  const DEFAULT = {
    workouts: [],          // 已完成训练
    customExercises: [],   // 自定义动作
    activeWorkout: null,   // 进行中的训练
    deletedWorkouts: [],   // 已删除训练的墓碑 [{id, at}]：云同步时据此删云端，防止“删了又回来”
    syncedIds: [],         // 已确认在云端的训练 id：云端忽然没有它，说明是别的设备删的
    hiddenBuiltins: [],    // 从动作库移除的内置动作 id（可一键恢复；历史记录不受影响）
    exOrder: [],           // 动作库自定义排序（动作 id 的全局顺序，空 = 用默认顺序）
    libUpdatedAt: 0,       // 动作库（自定义/隐藏/排序）最后一次改动的时间，用于跨设备合并
    settings: { unit: "kg", theme: "system", defaultKg: 0, defaultReps: 10 },
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const d = JSON.parse(raw);
      // 合并默认值，防止老数据缺字段
      const base = JSON.parse(JSON.stringify(DEFAULT));
      return Object.assign(base, d, {
        settings: Object.assign(base.settings, d.settings || {}),
      });
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  let data = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("保存失败", e);
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function allExercises() {
    const hidden = data.hiddenBuiltins || [];
    const builtin = hidden.length ? BUILTIN.filter((e) => hidden.indexOf(e.id) < 0) : BUILTIN;
    const all = builtin.concat(data.customExercises);
    const order = data.exOrder || [];
    if (!order.length) return all;
    // 按用户自定义顺序排，没进 order 的（例如新加的动作）按默认顺序追加在后面
    const rank = {};
    order.forEach((id, i) => { rank[id] = i; });
    return all.slice().sort((a, b) => {
      const ra = rank[a.id], rb = rank[b.id];
      if (ra === undefined && rb === undefined) return 0;
      if (ra === undefined) return 1;
      if (rb === undefined) return -1;
      return ra - rb;
    });
  }

  // 动作库（自定义动作 / 隐藏 / 排序）改动后调用：记时间戳，供跨设备合并判断新旧。
  // 时间戳严格递增：同一毫秒内的连续改动也要能区分，否则会被当成“没改过”而不推送
  function touchLib() {
    const now = Date.now();
    data.libUpdatedAt = now > (data.libUpdatedAt || 0) ? now : (data.libUpdatedAt || 0) + 1;
    save();
  }

  function isBuiltin(id) {
    return BUILTIN.some((e) => e.id === id);
  }

  function findExercise(id) {
    return allExercises().find((e) => e.id === id) || null;
  }

  // 连已移除的内置动作一起找：详情页要能打开被隐藏的动作
  function findExerciseAny(id) {
    return BUILTIN.concat(data.customExercises).find((e) => e.id === id) || null;
  }

  // 当前被移除的内置动作（对象列表）
  function hiddenList() {
    return (data.hiddenBuiltins || []).map((id) => BUILTIN.find((e) => e.id === id)).filter(Boolean);
  }

  window.Store = {
    BUILTIN,
    DEFAULT,
    get data() { return data; },
    replace(d) { data = d; save(); },
    save,
    uid,
    allExercises,
    touchLib,
    findExercise,
    findExerciseAny,
    hiddenList,
    isBuiltin,
    CATS: ["全部", "胸", "背", "腿", "肩", "臂", "核心", "有氧", "自定义"],
  };
})();
