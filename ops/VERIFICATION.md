# 本轮交付证据

完成日期：2026-10-02（America/Los_Angeles）。发布 ID 使用 UTC：20261003T060722Z。

## 项目定位（R1/R3）
- PAO-H5 为独立 Vue 3 / Vite / Vue Router 浏览器应用，含四类训练完整视图与状态实现。
- src/public 的 31 个文件与 PAO_MiniProgram_Refactor/pao-h5 对应文件原始哈希一致。
- pao-miniprogram-uniapp-vite 和 vite3 的 App.vue 是 HelloWorld 示例；其他主要候选依赖微信页面/UniApp。
- 旧服务器已停服，因此无法确认历史服务器究竟从哪份副本上传；结论是代码基线确认，不是历史上线记录确认。

## 改造范围（R1/R2/R4）
- Home.vue：快速/马拉松分类、原生路由链接、响应式首页。
- App.vue：阶段提示与 scoped 共享视觉，移动复原区、固定操作栏、可见焦点与减少动态支持。
- 各 views：按钮名称、卡牌/槽位键盘操作、原 CSS 色系统一、数字待开始状态。
- dialog.js/main.js：弹窗焦点约束、Escape 取消和焦点恢复。
- router：根路径部署和无训练状态的深链保护。
- 快速扑克 Memory：清理倒计时间隔，避免离开后启动后台计时。
- 四个 store 文件均与原版哈希一致，未变更计分规则或持久化键。

## 验证结果
- 原版与新版：npm ci、npm run build、node tests/marathonPoker.test.js 通过。
- Edge 实际浏览器：桌面 1440px，手机 360px/390px，首页及四个设置入口无页面横向溢出。
- 四类完整流程均在本地与真实公网 HTTPS 上通过。快速数字录入实际展示序列，得到 100% 正确率；扑克支持输入、提交和结果；马拉松扑克完成两副各 52 张复原并提交；马拉松数字验证未全部填写确认及结果。
- 操作说明 Escape 关闭、键盘 Enter 放牌、无状态刷新返回设置通过；pageerror 数组为空。
- 并未覆盖所有参数组合、长时计时漂移或真人审美验收；不将浏览器脚本验证等同这些证据。
- 浏览器检查脚本与截图：../backup/pao-ui-20261002/，真实公网截图在 production/。该目录不对外发布。

## 生产（R5）
- 源码 /data/claude_project/pao；current → /data/prod/pao/releases/20261003T060722Z。
- DNS pao.hihongrun.com → 212.64.10.243，由用户添加后验证。
- 正常公网 HTTPS 首页 200，深链 200；HTTP → HTTPS 301；旧 /braintranning/poker/settings → /poker/settings 301。
- 不存在的 JS 返回 404；版本化 JS 缓存 public, max-age=31536000, immutable。
- 下载首页字节与 release/index.html 完全一致；Nginx 校验通过；Time Hacker 仍为 HTTP 200。
- 证书覆盖 *.hihongrun.com，有效期至 2026-11-19（复用现有运维证书）。
- dist 压缩包 SHA256：7aba2871be00704ba017ca967837279eb148107e1a54930a3cd8a961d20b051f。

## 发布过程与回滚
首次 20261003T060549Z 在 Nginx reload 切换窗口读取旧虚拟主机 301，健康检查未通过，自动回滚成功。增加最长 10 次有限就绪重试后，第二次成功；未降级 HTTP/证书/页面验证。
成功发布备份 /data/prod/pao/backups/20261003T060722Z。此为首次站点发布，无前一 PAO 版本；回滚按 DEPLOYMENT.md 撤下本站 Nginx 配置，保留源码和产物。
原版源码归档 ../backup/pao-ui-20261002/original-source.tar.gz。
其他项目目录没有修改；独立副本保留。目录不是 Git 仓库，没有创建提交、远端或推送。
