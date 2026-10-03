# 中国 PAO 训练系统

基于 Vue 3、Vite、Pinia 和 Vue Router 的独立网页记忆训练应用，包括快速扑克、快速数字、马拉松扑克、马拉松数字四类训练。

生产站点：https://pao.hihongrun.com/

## 开发与验证

使用 Node.js 22（本次验证版本 22.22.1）和 npm：

```bash
npm ci
npm run dev
npm run build
node tests/marathonPoker.test.js
npm run preview
```

当前路由根路径为 `/`。生产 Nginx 将旧 `/braintranning/` 地址重定向到根路径；历史迁移文档描述的旧前缀不代表当前配置。

## 生产基线

本仓库首次提交对应生产发布 `20261003T062845Z`（UTC），包括“中国 PAO 训练系统”文案更新。提交前已逐一核对 39 个生产源码、资源、测试与配置文件，SHA256 与本地一致；生产构建与已有测试通过。

- 本地工作目录：`E:\Projects\WeChatProjects\PAO-H5`
- 服务器源码：`/data/claude_project/pao`
- 生产运行目录：`/data/prod/pao/current` → `releases/<发布编号>`
- Git 远端：`git@github.com:shubaomi/PAO-H5-PRO.git`

`src/` 是完整业务源码，`public/` 是静态资源，`tests/` 是现有测试，`ops/` 和 `deploy.sh` 保存部署配置、验证记录与回滚说明。详见 [设计合同](DESIGN.md) 和 [部署说明](ops/DEPLOYMENT.md)。记录中“不是 Git 仓库”的描述属于此次入库前的历史状态。

不提交 `node_modules/`、`dist/`、本地辅助工具、备份或凭据。部署时先构建，再上传独立发布目录；推送 Git 不会自动更新生产。

训练中的状态保存在内存，刷新后返回设置。数字历史保存在浏览器 localStorage，不跨域或跨设备同步。服务器证书及私钥不属于仓库内容。
