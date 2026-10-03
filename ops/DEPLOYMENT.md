# PAO 静态站点部署

用户授权：2026-10-02，改造方向 A，目标服务器与 Time Hacker 相同。目标域名 pao.hihongrun.com。

## 路径
- 本地源码：E:/Projects/WeChatProjects/PAO-H5
- 服务器源码：/data/claude_project/pao
- 静态版本：/data/prod/pao/releases/<UTC release ID>
- 当前版本：/data/prod/pao/current（软链接）
- 回滚记录：/data/prod/pao/backups/<UTC release ID>
- Nginx：/etc/nginx/conf.d/pao.conf
- 访问与错误日志：/var/log/nginx/pao.access.log、pao.error.log

与现有项目保持源码、生产目录分离。纯静态 Vue 应用，不增加 PM2、端口或数据库。复用现有 *.hihongrun.com 证书，证书续期仍属服务器原有运维流程。

## 发布
1. 本地 npm ci、npm run build、node tests/marathonPoker.test.js；按 DESIGN.md 实测四个流程和手机/桌面。
2. 使用明确文件白名单上传源码，不上传 node_modules、工具配置、备份或凭据。构建 dist 以 SHA256 校验后上传到独立 releases/<ID>。
3. 在服务器运行 bash /data/claude_project/pao/deploy.sh <ID>。部署脚本备份本站配置、切换软链接、检查并重载 Nginx，验证本站与 Time Hacker；失败自动恢复。
4. 验证 DNS A 记录指向 212.64.10.243，检查正常公网 HTTPS、深链刷新、旧 /braintranning/ 跳转、资源缓存。

## 手动回滚
先读取 backups/<ID>/previous-target.txt。如果存在上一版本，将 current 原子切回该路径；恢复 backups/<ID>/pao.conf。运行 nginx -t 通过后 systemctl reload nginx。
若为首发、previous-target.txt 为空且无旧配置，仅移走 /etc/nginx/conf.d/pao.conf（保留在本站 backups 下），nginx -t 后重载；保留 source/releases 方便排查。不要停止 Nginx 或修改其他站点。

## 数据限制
浏览器内存保存当前训练；刷新后返回设置。数字历史保存在原有 localStorage 键中。新域名无法自动读取停服旧域名的本地存储，不删除或迁移旧站数据，不声称跨域同步。

## Git
本目录不是 Git 仓库。未自动初始化、提交或推送。原源码归档保存在 ../backup/pao-ui-20261002/original-source.tar.gz。
