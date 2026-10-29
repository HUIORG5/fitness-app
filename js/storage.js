/* ============ 练了吗 · 数据层 ============ */
(function () {
  const KEY = "tieji.diary.v1";

  /* 内置动作库：type = reps(记次数) | time(记时间) */
  const BUILTIN = [
    // 胸部 · 推类（杠铃）
    { id: "b_bench",                    name: "平板杠铃卧推", cat: "胸", type: "reps" },
    { id: "b_bench_wide",               name: "平板杠铃卧推（宽距）", cat: "胸", type: "reps" },
    { id: "b_bench_narrow",             name: "平板杠铃卧推（窄距）", cat: "胸", type: "reps" },
    { id: "b_incline_bb",               name: "上斜杠铃卧推", cat: "胸", type: "reps" },
    { id: "b_decline_bb",               name: "下斜杠铃卧推", cat: "胸", type: "reps" },

    // 胸部 · 推类（哑铃 / 史密斯）
    { id: "b_flat_db",                  name: "平板哑铃卧推", cat: "胸", type: "reps" },
    { id: "b_incline_db",               name: "上斜哑铃卧推", cat: "胸", type: "reps" },
    { id: "b_decline_db",               name: "下斜哑铃卧推", cat: "胸", type: "reps" },
    { id: "b_smith_bench",              name: "平板史密斯卧推", cat: "胸", type: "reps" },
    { id: "b_smith_incline",            name: "上斜史密斯卧推", cat: "胸", type: "reps" },
    { id: "b_smith_decline",            name: "下斜史密斯卧推", cat: "胸", type: "reps" },

    // 胸部 · 推类（固定器械）
    { id: "b_chest_press",              name: "坐姿推胸机", cat: "胸", type: "reps" },
    { id: "b_chest_press_ng",           name: "坐姿推胸机（对握）", cat: "胸", type: "reps" },
    { id: "b_incline_press_machine",    name: "上斜推胸机", cat: "胸", type: "reps" },
    { id: "b_decline_press_machine",    name: "下斜推胸机", cat: "胸", type: "reps" },
    { id: "b_hammer_press",             name: "悍马机推胸", cat: "胸", type: "reps" },
    { id: "b_hammer_press_single",      name: "悍马机推胸（单侧）", cat: "胸", type: "reps" },
    { id: "b_chest_press_iso",          name: "分动式推胸机", cat: "胸", type: "reps" },

    // 胸部 · 夹胸 / 飞鸟
    { id: "b_pec_deck",                 name: "蝴蝶机夹胸", cat: "胸", type: "reps" },
    { id: "b_pec_deck_seat",            name: "坐姿器械飞鸟", cat: "胸", type: "reps" },
    { id: "b_cable_fly",                name: "绳索夹胸", cat: "胸", type: "reps" },
    { id: "b_cable_fly_high",           name: "上斜绳索飞鸟（高位）", cat: "胸", type: "reps" },
    { id: "b_cable_fly_low",            name: "下斜绳索飞鸟（低位）", cat: "胸", type: "reps" },
    { id: "b_cable_fly_single",         name: "单臂绳索夹胸", cat: "胸", type: "reps" },
    { id: "b_fly",                      name: "平板哑铃飞鸟", cat: "胸", type: "reps" },
    { id: "b_incline_db_fly",           name: "上斜哑铃飞鸟", cat: "胸", type: "reps" },
    { id: "b_decline_db_fly",           name: "下斜哑铃飞鸟", cat: "胸", type: "reps" },

    // 胸部 · 自重与其他
    { id: "b_dip",                      name: "双杠臂屈伸（侧重胸）", cat: "胸", type: "reps" },
    { id: "b_pushup",                   name: "标准俯卧撑", cat: "胸", type: "reps" },
    { id: "b_pushup_wide",              name: "宽距俯卧撑", cat: "胸", type: "reps" },
    { id: "b_pushup_narrow",            name: "窄距俯卧撑", cat: "胸", type: "reps" },
    { id: "b_pushup_diamond",           name: "钻石俯卧撑", cat: "胸", type: "reps" },
    { id: "b_pushup_incline",           name: "上斜俯卧撑", cat: "胸", type: "reps" },
    { id: "b_pushup_decline",           name: "下斜俯卧撑", cat: "胸", type: "reps" },
    { id: "b_squeeze_press",            name: "哑铃挤压推胸", cat: "胸", type: "reps" },

    // 背部 · 引体向上
    { id: "b_pullup",                   name: "宽握正握引体向上", cat: "背", type: "reps" },
    { id: "b_pullup_narrow",            name: "窄握反握引体向上", cat: "背", type: "reps" },
    { id: "b_pullup_neutral",           name: "对握引体向上", cat: "背", type: "reps" },
    { id: "b_pullup_assist",            name: "辅助引体向上", cat: "背", type: "reps" },

    // 背部 · 高位下拉
    { id: "b_pulldown",                 name: "高位下拉（宽距正握）", cat: "背", type: "reps" },
    { id: "b_pulldown_narrow",          name: "高位下拉（窄距正握）", cat: "背", type: "reps" },
    { id: "b_pulldown_reverse",         name: "高位下拉（反手窄距）", cat: "背", type: "reps" },
    { id: "b_pulldown_v",               name: "高位下拉（对握 V 把）", cat: "背", type: "reps" },
    { id: "b_pulldown_behind",          name: "高位下拉（宽握颈后）", cat: "背", type: "reps" },
    { id: "b_pulldown_single",          name: "单臂高位下拉", cat: "背", type: "reps" },

    // 背部 · 杠铃 / T 杠划船
    { id: "b_row",                      name: "俯身杠铃划船", cat: "背", type: "reps" },
    { id: "b_bb_row_wide",              name: "俯身杠铃划船（宽距正握）", cat: "背", type: "reps" },
    { id: "b_bb_row_reverse",           name: "俯身杠铃划船（反握窄距）", cat: "背", type: "reps" },
    { id: "b_pendlay",                  name: "潘德雷划船", cat: "背", type: "reps" },
    { id: "b_tbar_row",                 name: "宽握 T 杠划船", cat: "背", type: "reps" },
    { id: "b_tbar_row_narrow",          name: "窄握 T 杠划船", cat: "背", type: "reps" },
    { id: "b_landmine_row",             name: "地雷管划船", cat: "背", type: "reps" },

    // 背部 · 坐姿 / 器械划船
    { id: "b_seated_row",               name: "坐姿绳索划船", cat: "背", type: "reps" },
    { id: "b_seated_row_wide",          name: "坐姿绳索划船（宽握）", cat: "背", type: "reps" },
    { id: "b_seated_row_narrow",        name: "坐姿绳索划船（窄握）", cat: "背", type: "reps" },
    { id: "b_seated_machine_row",       name: "坐姿器械划船（分动式）", cat: "背", type: "reps" },
    { id: "b_hammer_row",               name: "悍马机划船", cat: "背", type: "reps" },
    { id: "b_hammer_row_single",        name: "悍马机划船（单侧）", cat: "背", type: "reps" },
    { id: "b_cable_row_single",         name: "单臂绳索划船", cat: "背", type: "reps" },

    // 背部 · 哑铃与自重
    { id: "b_db_row",                   name: "单臂哑铃划船", cat: "背", type: "reps" },
    { id: "b_db_row_both",              name: "双臂俯身哑铃划船", cat: "背", type: "reps" },
    { id: "b_inverted_row",             name: "仰卧划船（反向划船）", cat: "背", type: "reps" },
    { id: "b_straight_arm_pulldown",    name: "绳索直臂下压", cat: "背", type: "reps" },
    { id: "b_hyper",                    name: "山羊挺身", cat: "背", type: "reps" },

    // 肩部 · 杠铃推举
    { id: "b_ohp",                      name: "站姿杠铃推举", cat: "肩", type: "reps" },
    { id: "b_seated_bb_press",          name: "坐姿杠铃推举", cat: "肩", type: "reps" },
    { id: "b_front_press",              name: "颈前推举", cat: "肩", type: "reps" },
    { id: "b_behind_press",             name: "颈后推举", cat: "肩", type: "reps" },

    // 肩部 · 哑铃 / 器械推举
    { id: "b_db_press",                 name: "坐姿哑铃推举", cat: "肩", type: "reps" },
    { id: "b_standing_db_press",        name: "站姿哑铃推举", cat: "肩", type: "reps" },
    { id: "b_arnold",                   name: "阿诺德推举", cat: "肩", type: "reps" },
    { id: "b_smith_press",              name: "坐姿史密斯推举", cat: "肩", type: "reps" },
    { id: "b_smith_press_stand",        name: "站姿史密斯推举", cat: "肩", type: "reps" },
    { id: "b_shoulder_machine",         name: "坐姿肩推机", cat: "肩", type: "reps" },
    { id: "b_shoulder_machine_iso",     name: "分动式肩推机", cat: "肩", type: "reps" },
    { id: "b_hammer_shoulder",          name: "悍马机肩推", cat: "肩", type: "reps" },

    // 肩部 · 侧平举（中束）
    { id: "b_lateral",                  name: "哑铃侧平举", cat: "肩", type: "reps" },
    { id: "b_lateral_seated",           name: "坐姿哑铃侧平举", cat: "肩", type: "reps" },
    { id: "b_cable_lateral",            name: "绳索侧平举", cat: "肩", type: "reps" },
    { id: "b_cable_lateral_single",     name: "单臂绳索侧平举", cat: "肩", type: "reps" },
    { id: "b_machine_lateral",          name: "器械侧平举", cat: "肩", type: "reps" },
    { id: "b_bent_lateral",             name: "俯身侧平举", cat: "肩", type: "reps" },
    { id: "b_lying_lateral",            name: "侧卧侧平举", cat: "肩", type: "reps" },

    // 肩部 · 前平举（前束）
    { id: "b_front_raise",              name: "哑铃前平举", cat: "肩", type: "reps" },
    { id: "b_front_raise_alt",          name: "交替哑铃前平举", cat: "肩", type: "reps" },
    { id: "b_bb_front_raise",           name: "杠铃前平举", cat: "肩", type: "reps" },
    { id: "b_ez_front_raise",           name: "EZ 杆前平举", cat: "肩", type: "reps" },
    { id: "b_cable_front_raise",        name: "绳索前平举", cat: "肩", type: "reps" },
    { id: "b_plate_front_raise",        name: "杠铃片前平举", cat: "肩", type: "reps" },

    // 肩部 · 后束与斜方
    { id: "b_reverse_pec_deck",         name: "反向蝴蝶机飞鸟", cat: "肩", type: "reps" },
    { id: "b_rear_delt",                name: "俯身哑铃飞鸟", cat: "肩", type: "reps" },
    { id: "b_cable_rear_lateral",       name: "单臂绳索后拉", cat: "肩", type: "reps" },
    { id: "b_prone_machine_fly",        name: "俯卧器械后飞鸟", cat: "肩", type: "reps" },
    { id: "b_face_pull",                name: "绳索面拉", cat: "肩", type: "reps" },
    { id: "b_shrug",                    name: "杠铃耸肩", cat: "肩", type: "reps" },
    { id: "b_db_shrug",                 name: "哑铃耸肩", cat: "肩", type: "reps" },
    { id: "b_smith_shrug",              name: "史密斯耸肩", cat: "肩", type: "reps" },
    { id: "b_machine_shrug",            name: "器械耸肩", cat: "肩", type: "reps" },
    { id: "b_farmer_walk",              name: "农夫行走", cat: "肩", type: "reps" },

    // 腿部 · 深蹲
    { id: "b_squat",                    name: "杠铃颈后深蹲", cat: "腿", type: "reps" },
    { id: "b_squat_high",               name: "高杠深蹲", cat: "腿", type: "reps" },
    { id: "b_squat_low",                name: "低杠深蹲", cat: "腿", type: "reps" },
    { id: "b_front_squat",              name: "杠铃颈前深蹲", cat: "腿", type: "reps" },
    { id: "b_smith_squat",              name: "史密斯深蹲", cat: "腿", type: "reps" },
    { id: "b_db_squat",                 name: "哑铃深蹲", cat: "腿", type: "reps" },
    { id: "b_goblet",                   name: "杯式深蹲", cat: "腿", type: "reps" },
    { id: "b_box_squat",                name: "箱式深蹲", cat: "腿", type: "reps" },
    { id: "b_sumo_squat",               name: "相扑深蹲", cat: "腿", type: "reps" },

    // 腿部 · 腿举 / 腿屈伸
    { id: "b_leg_press",                name: "45° 倒蹬机腿举", cat: "腿", type: "reps" },
    { id: "b_leg_press_narrow",         name: "腿举（窄距）", cat: "腿", type: "reps" },
    { id: "b_leg_press_wide",           name: "腿举（宽距）", cat: "腿", type: "reps" },
    { id: "b_leg_press_high",           name: "腿举（高位脚位）", cat: "腿", type: "reps" },
    { id: "b_leg_press_low",            name: "腿举（低位脚位）", cat: "腿", type: "reps" },
    { id: "b_leg_press_vertical",       name: "垂直腿举机", cat: "腿", type: "reps" },
    { id: "b_leg_press_horizontal",     name: "水平腿举机", cat: "腿", type: "reps" },
    { id: "b_leg_ext",                  name: "坐姿腿屈伸", cat: "腿", type: "reps" },
    { id: "b_leg_ext_single",           name: "单腿腿屈伸", cat: "腿", type: "reps" },

    // 腿部 · 弓步
    { id: "b_bulgarian",                name: "保加利亚分腿蹲", cat: "腿", type: "reps" },
    { id: "b_bb_lunge",                 name: "杠铃箭步蹲", cat: "腿", type: "reps" },
    { id: "b_db_lunge",                 name: "哑铃箭步蹲", cat: "腿", type: "reps" },
    { id: "b_smith_lunge",              name: "史密斯箭步蹲", cat: "腿", type: "reps" },
    { id: "b_walking_lunge",            name: "箭步蹲走", cat: "腿", type: "reps" },

    // 腿部 · 腘绳肌
    { id: "b_leg_curl",                 name: "俯卧腿弯举", cat: "腿", type: "reps" },
    { id: "b_seated_leg_curl",          name: "坐姿腿弯举", cat: "腿", type: "reps" },
    { id: "b_standing_leg_curl",        name: "站姿单腿弯举", cat: "腿", type: "reps" },
    { id: "b_hip_ext_machine",          name: "仰卧腿弯举（臀推椅）", cat: "腿", type: "reps" },
    { id: "b_nordic",                   name: "北欧挺", cat: "腿", type: "reps" },

    // 腿部 · 硬拉与伸髋
    { id: "b_deadlift",                 name: "传统硬拉", cat: "腿", type: "reps" },
    { id: "b_sumo_deadlift",            name: "相扑硬拉", cat: "腿", type: "reps" },
    { id: "b_rdl",                      name: "罗马尼亚硬拉", cat: "腿", type: "reps" },
    { id: "b_sl_deadlift",              name: "直腿硬拉", cat: "腿", type: "reps" },
    { id: "b_rack_pull",                name: "架上硬拉", cat: "腿", type: "reps" },
    { id: "b_good_morning",             name: "早安式体前屈", cat: "腿", type: "reps" },
    { id: "b_back_ext_machine",         name: "俯卧挺身（器械）", cat: "腿", type: "reps" },

    // 腿部 · 臀部
    { id: "b_hip_thrust",               name: "杠铃臀推", cat: "腿", type: "reps" },
    { id: "b_hip_thrust_machine",       name: "臀推机", cat: "腿", type: "reps" },
    { id: "b_glute_bridge",             name: "杠铃臀桥", cat: "腿", type: "reps" },
    { id: "b_hip_abduction",            name: "髋外展机", cat: "腿", type: "reps" },
    { id: "b_hip_adduction",            name: "髋内收机", cat: "腿", type: "reps" },
    { id: "b_glute_kickback",           name: "跪姿髋伸展", cat: "腿", type: "reps" },
    { id: "b_cable_kickback",           name: "绳索后踢腿", cat: "腿", type: "reps" },

    // 腿部 · 小腿
    { id: "b_calf",                     name: "站姿提踵", cat: "腿", type: "reps" },
    { id: "b_seated_calf",              name: "坐姿提踵机", cat: "腿", type: "reps" },
    { id: "b_leg_press_calf",           name: "腿举机提踵", cat: "腿", type: "reps" },
    { id: "b_single_calf",              name: "单腿提踵", cat: "腿", type: "reps" },

    // 手臂 · 杠铃弯举
    { id: "b_curl",                     name: "直杆杠铃弯举", cat: "臂", type: "reps" },
    { id: "b_curl_wide",                name: "宽距杠铃弯举", cat: "臂", type: "reps" },
    { id: "b_curl_narrow",              name: "窄距杠铃弯举", cat: "臂", type: "reps" },
    { id: "b_ez_curl",                  name: "EZ 杆弯举", cat: "臂", type: "reps" },
    { id: "b_reverse_curl",             name: "反握弯举", cat: "臂", type: "reps" },

    // 手臂 · 哑铃弯举
    { id: "b_db_curl",                  name: "站姿哑铃弯举", cat: "臂", type: "reps" },
    { id: "b_db_curl_alt",              name: "交替哑铃弯举", cat: "臂", type: "reps" },
    { id: "b_hammer",                   name: "锤式弯举", cat: "臂", type: "reps" },
    { id: "b_concentration",            name: "集中弯举", cat: "臂", type: "reps" },
    { id: "b_spider_curl",              name: "蜘蛛弯举", cat: "臂", type: "reps" },

    // 手臂 · 牧师椅与器械弯举
    { id: "b_preacher",                 name: "牧师椅杠铃弯举", cat: "臂", type: "reps" },
    { id: "b_preacher_db",              name: "牧师椅哑铃弯举", cat: "臂", type: "reps" },
    { id: "b_preacher_cable",           name: "牧师椅绳索弯举", cat: "臂", type: "reps" },
    { id: "b_machine_curl",             name: "坐姿弯举机", cat: "臂", type: "reps" },
    { id: "b_cable_curl",               name: "低位绳索弯举", cat: "臂", type: "reps" },
    { id: "b_cable_curl_high",          name: "高位绳索弯举", cat: "臂", type: "reps" },
    { id: "b_cable_curl_single",        name: "单臂绳索弯举", cat: "臂", type: "reps" },

    // 手臂 · 三头 · 下压
    { id: "b_pushdown",                 name: "绳索下压（直杆）", cat: "臂", type: "reps" },
    { id: "b_pushdown_v",               name: "绳索下压（V 把）", cat: "臂", type: "reps" },
    { id: "b_pushdown_rope",            name: "绳索下压（绳把）", cat: "臂", type: "reps" },
    { id: "b_pushdown_reverse",         name: "反手下压", cat: "臂", type: "reps" },
    { id: "b_pushdown_single",          name: "单臂绳索下压", cat: "臂", type: "reps" },

    // 手臂 · 三头 · 臂屈伸
    { id: "b_skull",                    name: "仰卧杠铃臂屈伸", cat: "臂", type: "reps" },
    { id: "b_db_skull",                 name: "仰卧哑铃臂屈伸", cat: "臂", type: "reps" },
    { id: "b_ez_skull",                 name: "EZ 杆仰卧臂屈伸", cat: "臂", type: "reps" },
    { id: "b_overhead_db",              name: "颈后哑铃臂屈伸", cat: "臂", type: "reps" },
    { id: "b_overhead_cable",           name: "颈后绳索臂屈伸", cat: "臂", type: "reps" },
    { id: "b_cable_overhead_ext",       name: "绳索过头臂屈伸", cat: "臂", type: "reps" },
    { id: "b_close_bench",              name: "窄距卧推", cat: "臂", type: "reps" },
    { id: "b_dip_tricep",               name: "双杠臂屈伸（侧重三头）", cat: "臂", type: "reps" },

    // 手臂 · 前臂
    { id: "b_wrist_curl",               name: "腕弯举（正握）", cat: "臂", type: "reps" },
    { id: "b_reverse_wrist",            name: "腕弯举（反握）", cat: "臂", type: "reps" },
    { id: "b_wrist_roller",             name: "杠铃卷腕", cat: "臂", type: "reps" },

    // 核心 · 腹直肌
    { id: "b_crunch",                   name: "卷腹", cat: "核心", type: "reps" },
    { id: "b_machine_crunch",           name: "器械卷腹机", cat: "核心", type: "reps" },
    { id: "b_cable_crunch",             name: "绳索卷腹", cat: "核心", type: "reps" },
    { id: "b_reverse_crunch",           name: "反向卷腹", cat: "核心", type: "reps" },
    { id: "b_leg_raise",                name: "悬垂举腿", cat: "核心", type: "reps" },
    { id: "b_roman_chair_leg_raise",    name: "罗马椅抬腿", cat: "核心", type: "reps" },
    { id: "b_lying_leg_raise",          name: "仰卧举腿", cat: "核心", type: "reps" },
    { id: "b_ab_wheel",                 name: "健腹轮", cat: "核心", type: "reps" },

    // 核心 · 腹斜肌
    { id: "b_russian_twist",            name: "俄罗斯转体", cat: "核心", type: "reps" },
    { id: "b_cable_woodchop_high",      name: "绳索伐木（高到低）", cat: "核心", type: "reps" },
    { id: "b_cable_woodchop_low",       name: "绳索伐木（低到高）", cat: "核心", type: "reps" },
    { id: "b_side_crunch",              name: "侧卧卷腹", cat: "核心", type: "reps" },
    { id: "b_db_side_bend",             name: "哑铃体侧屈", cat: "核心", type: "reps" },
    { id: "b_hanging_side_raise",       name: "悬垂侧举腿", cat: "核心", type: "reps" },
    { id: "b_rotary_torso",             name: "转体卷腹机", cat: "核心", type: "reps" },

    // 核心 · 稳定与功能性
    { id: "b_deadbug",                  name: "死虫式", cat: "核心", type: "reps" },
    { id: "b_bird_dog",                 name: "鸟狗式", cat: "核心", type: "reps" },
    { id: "b_trx_crunch",               name: "悬吊收腹（TRX）", cat: "核心", type: "reps" },
    { id: "b_med_ball_slam",            name: "药球砸地", cat: "核心", type: "reps" },
    { id: "b_plank",                    name: "平板支撑", cat: "核心", type: "time" },
    { id: "b_side_plank",               name: "侧平板支撑", cat: "核心", type: "time" },
    { id: "b_sled_push",                name: "雪橇推拉", cat: "核心", type: "time" },

    // 有氧 · 器械
    { id: "b_run",                      name: "跑步机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_treadmill_walk",           name: "跑步机快走", cat: "有氧", type: "time", unit: "min" },
    { id: "b_treadmill_incline",        name: "跑步机爬坡", cat: "有氧", type: "time", unit: "min" },
    { id: "b_treadmill_interval",       name: "跑步机间歇", cat: "有氧", type: "time", unit: "min" },
    { id: "b_elliptical",               name: "椭圆机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_elliptical_reverse",       name: "椭圆机（反向）", cat: "有氧", type: "time", unit: "min" },
    { id: "b_bike",                     name: "动感单车", cat: "有氧", type: "time", unit: "min" },
    { id: "b_bike_sprint",              name: "动感单车（站姿冲刺）", cat: "有氧", type: "time", unit: "min" },
    { id: "b_recumbent_bike",           name: "卧式健身车", cat: "有氧", type: "time", unit: "min" },
    { id: "b_stair_climber",            name: "台阶机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_stepper",                  name: "踏步机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_rower",                    name: "划船机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_ski_erg",                  name: "滑雪机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_rope_climb",               name: "爬绳机", cat: "有氧", type: "time", unit: "min" },
    { id: "b_assault_bike",             name: "风阻单车", cat: "有氧", type: "time", unit: "min" },

    // 有氧 · 功能性与自重
    { id: "b_battle_rope",              name: "战绳", cat: "有氧", type: "time" },
    { id: "b_jump_rope",                name: "跳绳", cat: "有氧", type: "time", unit: "min" },
    { id: "b_agility_ladder",           name: "敏捷梯", cat: "有氧", type: "time" },
    { id: "b_box_jump",                 name: "跳箱", cat: "有氧", type: "reps" },
    { id: "b_burpee",                   name: "波比跳", cat: "有氧", type: "reps" },
    { id: "b_kettlebell_swing",         name: "壶铃摇摆", cat: "有氧", type: "reps" },
  ];

  const DEFAULT = {
    workouts: [],          // 已完成训练
    customExercises: [],   // 自定义动作
    deletedExercises: [],  // 已删自定义动作的墓碑 [{id, at}]：云同步据此把它从云端也删掉，防止"删了又回来"
    activeWorkout: null,   // 进行中的训练
    deletedWorkouts: [],   // 已删除训练的墓碑 [{id, at}]：云同步时据此删云端，防止“删了又回来”
    syncedIds: [],         // 已确认在云端的训练 id：云端忽然没有它，说明是别的设备删的
    hiddenBuiltins: [],    // 从动作库移除的内置动作 id（可一键恢复；历史记录不受影响）
    exOrder: [],           // 动作库自定义排序（动作 id 的全局顺序，空 = 用默认顺序）
    libUpdatedAt: 0,       // 动作库（自定义/隐藏/排序）最后一次改动的时间，用于跨设备合并
    plans: [],             // 训练计划 [{id,name,note,items:[{id,exerciseId,name,cat,type,sets,reps,kg}],createdAt,updatedAt,deleted}]
    planDeleted: [],       // 计划墓碑 [{id, at}]
    planUpdatedAt: 0,      // 计划库最后一次改动时间，用于跨设备合并
    settings: { unit: "kg", theme: "system", defaultKg: 0, defaultReps: 10, repsCustom: false },
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
  /* ---------- 训练计划 ---------- */
  function livePlans() {
    return (data.plans || []).filter((p) => !p.deleted).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  function findPlan(id) {
    return (data.plans || []).find((p) => p.id === id) || null;
  }
  function savePlan(plan) {
    data.plans = data.plans || [];
    const i = data.plans.findIndex((p) => p.id === plan.id);
    if (i >= 0) data.plans[i] = plan;
    else data.plans.push(plan);
    save();
    touchPlans();
  }
  function deletePlan(id) {
    const p = findPlan(id);
    if (!p) return;
    p.deleted = true;
    p.updatedAt = Date.now();
    data.planDeleted = data.planDeleted || [];
    data.planDeleted.push({ id: id, at: Date.now() });
    save();
    touchPlans();
  }
  // 清理 90 天前的计划墓碑，避免无限增长
  function gcPlanTombs() {
    const now = Date.now();
    data.planDeleted = (data.planDeleted || []).filter((t) => t && t.id && (now - (t.at || 0)) < 90 * 24 * 3600 * 1000);
  }
  // 计划库改动：记时间戳供跨设备合并；严格递增，同一毫秒内的连续改动也要能区分
  function touchPlans() {
    const now = Date.now();
    data.planUpdatedAt = now > (data.planUpdatedAt || 0) ? now : (data.planUpdatedAt || 0) + 1;
    save();
  }

  function touchLib() {
    const now = Date.now();
    data.libUpdatedAt = now > (data.libUpdatedAt || 0) ? now : (data.libUpdatedAt || 0) + 1;
    save();
  }

  /* 自定义动作墓碑：动作库云同步对 custom 是"并集"合并，只删本地不改云端的话，
   * 下一次同步会把它从云端捞回来（表现为"删了过一会儿又出现"）。
   * 所以删除时记一条墓碑，合并前先剔除这些 id。 */
  function tombstoneExercise(id) {
    data.deletedExercises = (data.deletedExercises || []).filter((t) => t && t.id !== id);
    data.deletedExercises.push({ id: id, at: Date.now() });
  }
  // 清理 90 天前的动作墓碑，避免无限增长
  function gcExerciseTombs() {
    const now = Date.now();
    data.deletedExercises = (data.deletedExercises || []).filter((t) => t && t.id && (now - (t.at || 0)) < 90 * 24 * 3600 * 1000);
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
    touchLib, touchPlans, livePlans, findPlan, savePlan, deletePlan, gcPlanTombs,
    tombstoneExercise, gcExerciseTombs,
    findExercise,
    findExerciseAny,
    hiddenList,
    isBuiltin,
    CATS: ["全部", "胸", "背", "腿", "肩", "臂", "核心", "有氧", "自定义"],
  };
})();
