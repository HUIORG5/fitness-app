# 练了吗 · 健身记录 PWA

记录训练动作、组数、重量、容量与个人记录的移动端 Web App（PWA）。支持本地离线使用，登录后可云端备份、多设备同步。

## 在 iPhone 上使用

Safari 打开 **https://huiorg5.github.io/fitness-app/** → 分享按钮 → **添加到主屏幕**，即可像原生 App 一样全屏使用，走流量、弱网、断网都不影响（断网时数据存本地，联网后自动同步）。

## 功能

- 45 个内置动作（胸/背/腿/肩/臂/核心/有氧，记次数或计时两种类型）+ 自定义动作
- 训练中记录组：重量/次数 stepper、默认重量与次数（设置里配置）、后续组自动接着上一组
- 容量自动计算（kg 内部存储，kg/lb 显示换算）、e1RM 估算、PR 实时标记
- 「上组完成时间」记录、返回即保存进度、今天页可继续训练
- 历史按月分组、统计（本周容量图/总览/PR 列表/动作趋势图）
- 动作库可管理：内置动作可移除（可恢复）、自定义动作可删除、一键「重置」恢复默认（可选保留自定义动作与历史记录）
- 账号系统：邮箱注册/登录、头像上传（圆形取景框裁剪后上传）、昵称（设置页邮箱脱敏展示）、训练数据云同步（按记录 id 合并，不重复不覆盖，删除跨设备同步生效）
- 设置：单位、主题、默认重量次数、JSON 导入导出、清空（登录状态下会一并清空云端）

## 技术

纯静态站点（HTML/CSS/JS，无构建），Service Worker 离线缓存，localStorage 本地存储 + Supabase（Postgres + Auth + Storage）云端同步。数据安全依赖数据库 RLS 行级隔离（见 `supabase-schema.sql`），前端仅含设计上公开的 publishable key。

## 数据与隐私

- 未登录：数据只存在本机浏览器，可导出 JSON 备份
- 登录后：训练记录加密传输到云端并受行级隔离保护，仅本人可读写；头像存于公开读的存储桶
- 隐私政策与用户协议见 [legal.html](legal.html)（线上可直接访问，注册页与设置页均有入口）

## 本地开发 / 更新

直接编辑文件后推送到 `main` 分支，GitHub Pages 约 1 分钟自动更新。数据库结构变更在 `supabase-schema.sql` 中维护。

### 接手前必读的约定

> 这几条都是踩过坑总结的，**尤其是第 1 条**——漏一次，已安装的用户就会一直用旧代码。

1. **每次改动前端代码，必须同时 +1 两处版本号，缺一不可：**
   - `sw.js` 里的 `const CACHE = "tieji-vN"`（Service Worker 缓存名）
   - `js/app.js` 顶部的 `const APP_VERSION = "vN"`（显示在设置页底部，用来确认手机跑的是哪一版）

   只改内容不换版本号时，已经加载过该版本的 Service Worker 不会更新，用户会一直拿旧文件。

2. **不要改 localStorage 的键名**（现在是 `tieji.diary.v1`）。改了老用户的训练数据会全部"消失"。

3. **训练记录是自包含快照**：每条 workout 里存了动作名、分类、类型和每组数值，动作库只是新建训练时的模板。所以删除/隐藏动作、重置动作库都不会破坏历史；统计与 PR 按「动作名」聚合，同名动作会被合并。
4. **动作库三件套跟着账号走**：`customExercises` / `hiddenBuiltins` / `exOrder` 存在 `exercise_lib` 表（见 `supabase-schema.sql`，改动 schema 后要提醒用户重跑）。同步合并规则在 `Cloud.syncExerciseLib()`：custom 按 id 取并集，hidden / ex_order 按时间戳取较新（>2 秒容差）。改动后必须调 `Store.touchLib()`，否则不会推上去。

5. **改同步逻辑前先跑测试**：`../_test/sync-test.html`（训练记录 8 场景）、`../_test/exlib-sync-test.html`（动作库跨设备合并 6 场景）、`../_test/auth-toast-test.html`（登录提示只弹一次）、`../_test/profile-timing-test.html`（头像异步加载）。用带根目录的本地服务器打开这些文件。

6. **部署用 `python ../deploy_github.py`**：自动读同目录 `.gh_token`（该文件在仓库外，不会被上传），推完会主动触发 Pages 构建并用线上 sw.js 的版本号核验真的换了版。注意：**Pages 不会随 commit 自动重建**，必须走这一步。

7. 云端安全靠数据库 RLS，不在前端：`verify_cloud.py` 可一键体检注册/写入/读取/隔离/越权/头像桶共 24 项。

