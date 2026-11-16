/* 图标库：图标数据 + 生成函数 + 动作/器械归类。
   单独成文件的原因：这块只增不改，主文件 app.js 已经 3000 多行，混在一起改错了很难查。
   主文件通过 window.Icons 取用（icon / gearOf / actionIconOf / CAT_ICON / CAT_COLORS）。 */
(function () {
  /* ---------- 图标 ---------- */
  const ICONS = {
    calendar: '<rect x="3.5" y="5.5" width="17" height="15" rx="4.5"/><path d="M8 3.2v3M16 3.2v3"/><circle cx="12" cy="13.6" r="1.7" fill="currentColor" stroke="none"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 10v4M20.5 10v4M6.5 12h11"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.4" cy="6.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="4.4" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="4.4" cy="17.5" r="1.6" fill="currentColor" stroke="none"/>',
    chart: '<path d="M4.5 20V13M10 20V6.5M15.5 20v-4.5M4.5 20h15.5"/>',
    sliders: '<path d="M4 7.5h8M16.5 7.5h3.5M4 16.5h3.5M12 16.5h8"/><circle cx="14.2" cy="7.5" r="2.3"/><circle cx="9.7" cy="16.5" r="2.3"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>',
    search: '<circle cx="11" cy="11" r="6.8"/><path d="M20 20l-3.7-3.7"/>',
    trash: '<path d="M4.5 7.5h15M9.7 7.5V4.8h4.6v2.7M6.3 7.5l1 12h9.4l1-12"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.8V12l3.2 2"/>',
    trophy: '<path d="M7.5 4.5h9v4a4.5 4.5 0 0 1-9 0v-4zM7.5 6H4.5v1.2a3.8 3.8 0 0 0 3 3.6M16.5 6h3v1.2a3.8 3.8 0 0 1-3 3.6M12 13.8V16M8.8 20h6.4l-.7-4H9.5z"/>',
    download: '<path d="M12 4v11.5M8 12l4 3.5 4-3.5"/><path d="M4.5 20.5h15"/>',
    upload: '<path d="M12 16V4.5M8 8l4-3.5 4 3.5"/><path d="M4.5 20.5h15"/>',
    repeat: '<path d="M16.5 3.5l3.5 3.5-3.5 3.5M3.5 11v-.8a3.6 3.6 0 0 1 3.6-3.6h12.9M7.5 20.5L4 17l3.5-3.5M20.5 13v.8a3.6 3.6 0 0 1-3.6 3.6H4"/>',
    flame: '<path d="M12 3.5s5 4.6 5 9.3a5 5 0 0 1-10 0c0-2 1-3.7 2-4.6 0 2 1 3 2.1 3 0-3.2 1-5.2.9-7.7z"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="3"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/>',
    xmark: '<path d="M6 6l12 12M18 6L6 18"/>',
    user: '<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c.7-3.5 3.6-5.6 7-5.6s6.3 2.1 7 5.6"/>',
    // 下面这些暂时没接进界面，给趋势 / 目标 / 编辑 / 筛选 / 排序 / 完成 / 云端预留
    trend: '<path d="M3 17l5.5-5.5 3.5 3.5L21 6"/><path d="M15 6h6v6"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
    edit: '<path d="M4.5 19.5l.6-4.4L15.6 4.6a2.3 2.3 0 0 1 3.3 0l.5.5a2.3 2.3 0 0 1 0 3.3L8.9 18.9z"/>',
    filter: '<path d="M4 6h16l-6.2 6.6v5.6L10.2 20v-7.4z"/>',
    // 排序用上下双箭头：箭头半宽只有 2.5，两列间距 8，2.3 的线宽下也不会粘到一起
    sort: '<path d="M8 19.5V4.5M5.5 7L8 4.5 10.5 7"/><path d="M16 4.5v15M13.5 17L16 19.5 18.5 17"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2l2.8 2.8 5.2-5.4"/>',
    cloud: '<path d="M12 3.5l8 4.2v8.6l-8 4.2-8-4.2V7.7z"/><path d="M12 12v8.5M4 7.7l8 4.3 8-4.3"/>',
    // 部位图标：抽象符号（人体部位做不了具象），配合各自的分类色使用
    chest: '<rect x="3.6" y="7.2" width="7" height="9.5" rx="2.6"/><rect x="13.4" y="7.2" width="7" height="9.5" rx="2.6"/>',
    back: '<path d="M5 5.5h14l-2.6 13.5H7.6z"/><path d="M12 5.5v13.5"/>',
    legs: '<path d="M8.5 4v8.5l-1.3 7M15.5 4v8.5l1.3 7"/>',
    shoulder: '<circle cx="12" cy="7.5" r="2.9"/><path d="M4.5 17a7.5 7.5 0 0 1 15 0"/>',
    arms: '<path d="M7 4v6a5 5 0 0 0 5 5h3a2.5 2.5 0 0 0 0-5h-2"/>',
    core: '<rect x="7.5" y="4.5" width="9" height="15" rx="3"/><path d="M12 4.5v15M7.5 9.5h9M7.5 14.5h9"/>',
    cardio: '<path d="M2.5 12h3.6l1.8-4.5 3.2 9 1.9-4.5h6"/>',
    // 器械图标：223 个动作归到这 8 类，列表里配部位色一起用
    gear_barbell: '<path d="M2.5 9.5v5M5.5 7v10M18.5 7v10M21.5 9.5v5M5.5 12h13"/>',
    // 哑铃整体倾斜 40 度：不倾斜的话和杠铃在 20px 下几乎分不出（都是「横线加两竖」）
    gear_dumbbell: '<g transform="rotate(-40 12 12)"><path d="M8 6.5v11M16 6.5v11M4.5 9.5v5M19.5 9.5v5M8 12h8"/></g>',
    gear_machine: '<rect x="4" y="4.5" width="16" height="15.5" rx="2.5"/><path d="M8 16.5v-4h4.5v4"/><path d="M16 8v4.5"/>',
    gear_cable: '<circle cx="12" cy="5.5" r="2.3"/><path d="M12 7.8v6.7"/><path d="M9 14.5h6"/><path d="M4 20h16"/>',
    gear_body: '<circle cx="12" cy="5.2" r="2.1"/><path d="M12 7.3v6.4"/><path d="M7 10.5l5 1.5 5-1.5"/><path d="M12 13.7l-2.8 6M12 13.7l2.8 6"/>',
    gear_kettlebell: '<path d="M8.6 9.6a4.4 4.4 0 0 1 6.8 0"/><circle cx="12" cy="15" r="5"/>',
    gear_band: '<path d="M3.5 6.5c4.5 0 4.5 11 8.5 11s4-11 8.5-11"/><path d="M3.5 6.5v3.5M20.5 6.5v3.5"/>',
    gear_treadmill: '<path d="M2.5 18.5h19"/><path d="M5 18.5l2.5-4h11.5"/><path d="M19 14.5V8.5"/><path d="M16 8.5h5"/>',
    // 动作图标：只在大尺寸用（详情页 56px / 选择列表 32px），列表行太小会糊
    act_bench_flat_bb: '<path d="M3 18h18"/><path d="M5 7h14"/><path d="M5 5v4M19 5v4"/>',
    act_bench_incline_bb: '<path d="M3 19.5L21 12.5"/><path d="M5 9L19 4"/><path d="M5 7v4M19 2v4"/>',
    act_bench_decline_bb: '<path d="M3 12.5L21 19.5"/><path d="M5 4L19 9"/><path d="M5 2v4M19 7v4"/>',
    act_bench_flat_db: '<path d="M3 18h18"/><g transform="rotate(-38 6 7)"><path d="M5 4.5v5M8 4.5v5M3.5 6v2M9.5 6v2M5 7h3"/></g><g transform="rotate(-38 18 7)"><path d="M17 4.5v5M20 4.5v5M15.5 6v2M21.5 6v2M17 7h3"/></g>',
    act_bench_incline_db: '<path d="M3 19.5L21 12.5"/><g transform="rotate(-38 6 5.5)"><path d="M5 3v5M8 3v5M3.5 4.5v2M9.5 4.5v2M5 5.5h3"/></g><g transform="rotate(-38 18 9)"><path d="M17 6.5v5M20 6.5v5M15.5 8v2M21.5 8v2M17 9h3"/></g>',
    act_machine_press: '<path d="M3.5 20.5V4.5h17"/><path d="M7.5 20.5v-4h5v4"/><path d="M15 14h6"/>',
    act_pec_deck: '<path d="M12 3v17"/><path d="M4.5 8.5L9 15M19.5 8.5L15 15"/>',
    act_pushup: '<path d="M3 19h18"/><circle cx="5.5" cy="12" r="1.8"/><path d="M7.5 13L18 16"/><path d="M8 13.8v4.5"/>',
    act_dip: '<path d="M4 8.5h5M15 8.5h5"/><path d="M4.5 8.5v11M19.5 8.5v11"/><circle cx="12" cy="5" r="1.8"/><path d="M12 7v5"/>',
    act_row_bb: '<circle cx="17.5" cy="5" r="1.9"/><path d="M16.5 6.5L8 11.5"/><path d="M8 11.5v7"/><path d="M4 15h8"/>',
    act_row_db: '<circle cx="17.5" cy="5" r="1.9"/><path d="M16.5 6.5L8 11.5"/><path d="M8 11.5v7"/><g transform="rotate(-38 5.5 15)"><path d="M4.5 12.5v5M7.5 12.5v5M3 14v2M9 14v2M4.5 15h3"/></g>',
    act_pulldown: '<circle cx="12" cy="3" r="1.5"/><path d="M12 4.5v4.5"/><path d="M6.5 9h11"/><path d="M9 9v4.5M15 9v4.5"/><path d="M7 18h10"/>',
    act_pullup: '<path d="M4 5h16"/><path d="M4.5 5v4M19.5 5v4"/><circle cx="12" cy="10" r="1.8"/><path d="M12 12v6"/><path d="M9.5 5.5L12 9.5M14.5 5.5L12 9.5"/>',
    act_squat_bb: '<circle cx="13" cy="4.6" r="1.9"/><path d="M13 6.5v5"/><path d="M7.5 9.5h11"/><path d="M13 11.5l-3 4.5V20M13 11.5l3 4.5V20"/>',
    act_deadlift: '<circle cx="13" cy="5.5" r="1.8"/><path d="M13 7.3L9.5 12"/><path d="M9.5 12v5"/><path d="M4 18.5h12"/>',
    act_press_bb: '<circle cx="12" cy="8.6" r="2"/><path d="M12 10.6v6"/><path d="M12 16.6l-2.6 3.4M12 16.6l2.6 3.4"/><path d="M8 5.4h8"/><path d="M9.5 12v-5.6M14.5 12v-5.6"/>',
    act_curl_bb: '<circle cx="12" cy="5" r="2"/><path d="M12 7v7"/><path d="M12 14l-2.5 6M12 14l2.5 6"/><path d="M6.5 11h11"/><path d="M6.5 11L9.5 7.5M17.5 11L14.5 7.5"/>',
    act_raise_lateral: '<circle cx="12" cy="5" r="2"/><path d="M12 7v7"/><path d="M12 14l-2.5 6M12 14l2.5 6"/><path d="M5 10.5h4.5M14.5 10.5h4.5"/><circle cx="4.6" cy="10.5" r="1.5"/><circle cx="19.4" cy="10.5" r="1.5"/>',
    act_plank: '<path d="M3 19.5h18"/><circle cx="6" cy="13.5" r="1.8"/><path d="M8 14.5L18 15.5"/><path d="M8 15v4M16 15v4"/>',
    act_treadmill: '<path d="M2.5 18.5h19"/><path d="M5 18.5l2.5-4h11.5"/><path d="M19 14.5V8.5"/><path d="M16 8.5h5"/>',
    act_bike: '<circle cx="6" cy="16.5" r="3.2"/><circle cx="18" cy="16.5" r="3.2"/><path d="M6 16.5l4.5-6h5l2.5 6"/><path d="M9.5 8h4.5"/>',
  };
  // 分类 → 图标名，动作库分类标题和日历图例都用这套
  const CAT_ICON = { 胸: "chest", 背: "back", 腿: "legs", 肩: "shoulder", 臂: "arms", 核心: "core", 有氧: "cardio" };
  // 动作 → 器械类型。223 个动作名都带器械词，按关键词判断即可；
  // 顺序有讲究：具体器械在前，宽泛的「器械/机」在后，最后按类型兜底。
  function gearOf(ex) {
    const n = (ex.name || "") + " " + (ex.id || "");
    if (/壶铃/.test(n)) return "gear_kettlebell";
    if (/弹力带|阻力带|橡皮带|弹力绳/.test(n)) return "gear_band";
    if (ex.type === "time" || /跑步机|椭圆机|台阶机|划船机|单车|动感单车|跳绳|爬楼/.test(n)) return "gear_treadmill";
    if (/绳索|龙门|拉力器|拉索|下拉|下压|飞鸟（[上下]位）/.test(n)) return "gear_cable";
    if (/史密斯|器械|推胸机|夹胸机|弯举机|腿举|哈克|蝴蝶|悍马|分动|坐姿.*机|机（/.test(n)) return "gear_machine";
    if (/杠铃|潘德雷|T 杠|硬拉/.test(n)) return "gear_barbell";
    if (/哑铃/.test(n)) return "gear_dumbbell";
    if (/俯卧撑|引体|悬垂|双杠|自重|徒手|平板支撑|卷腹|仰卧起坐|箭步|臀桥/.test(n)) return "gear_body";
    return "gear_machine";   // 兜底：没有器械线索的，多半是固定器械动作
  }
  // 动作 → 动作图标。只覆盖常见动作模式，其余一律退回器械图标（列表小尺寸下也够看）
  function actionIconOf(ex) {
    const n = ex.name || "";
    const has = (re) => re.test(n);
    if (ex.type === "time") return has(/单车|骑行/) ? "act_bike" : "act_treadmill";
    if (has(/卧推|推胸/)) {
      if (has(/史密斯|器械|机|悍马/)) return "act_machine_press";
      if (has(/哑铃/)) return has(/上斜/) ? "act_bench_incline_db" : "act_bench_flat_db";
      if (has(/上斜/)) return "act_bench_incline_bb";
      if (has(/下斜/)) return "act_bench_decline_bb";
      return "act_bench_flat_bb";
    }
    if (has(/飞鸟|夹胸/)) return "act_pec_deck";
    if (has(/俯卧撑/)) return "act_pushup";
    if (has(/双杠/)) return "act_dip";
    if (has(/划船/)) return has(/哑铃/) ? "act_row_db" : "act_row_bb";
    if (has(/引体/)) return "act_pullup";
    if (has(/下拉/)) return "act_pulldown";
    if (has(/深蹲|箭步|弓步/)) return "act_squat_bb";
    if (has(/硬拉/)) return "act_deadlift";
    if (has(/推举|肩推|实力举/)) return "act_press_bb";
    if (has(/平举|侧平|前平/)) return "act_raise_lateral";
    if (has(/弯举|臂屈伸/)) return "act_curl_bb";
    if (has(/平板支撑|卷腹|仰卧起坐|举腿/)) return "act_plank";
    return gearOf(ex);
  }
  function icon(name, size, color) {
    size = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size +
      '" fill="none" stroke="' + (color || "currentColor") + '" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || "") + "</svg>";
  }
  const CAT_COLORS = {
    胸: "#378ADD", 背: "#7F77DD", 腿: "#D85A30", 肩: "#EF9F27",
    臂: "#D4537E", 核心: "#0F6E56", 有氧: "#639922",
  };
  const CAT_COLOR_FALLBACK = "#888780";

  window.Icons = {
    icon: icon, gearOf: gearOf, actionIconOf: actionIconOf,
    CAT_ICON: CAT_ICON, CAT_COLORS: CAT_COLORS, CAT_COLOR_FALLBACK: CAT_COLOR_FALLBACK,
    ICONS: ICONS,
  };
})();
