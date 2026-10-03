# 🚀 Superpowers 全局技能安装 - 快速指南

## ⚠️ 重要提示

由于 Trae IDE 的权限限制，**无法在 IDE 内部直接运行安装脚本**。

你需要**在 IDE 外部**运行安装程序。

## 📝 安装步骤

### 方法 1: 双击运行 (最简单) ⭐推荐

1. **关闭或最小化 Trae IDE**
2. 打开 **文件资源管理器**
3. 导航到：`E:\Projects\WeChatProjects\PAO-H5\`
4. 找到文件：**`install-global-skills.bat`**
5. **双击运行**该文件
6. 等待安装完成
7. 按任意键关闭窗口

### 方法 2: 右键运行

1. 打开文件资源管理器
2. 导航到：`E:\Projects\WeChatProjects\PAO-H5\`
3. 找到：`install-global-skills.bat`
4. **右键点击** → 选择 **"以管理员身份运行"** (如果需要)

### 方法 3: 命令行运行

1. 按 `Win + R`,输入 `cmd`,回车
2. 输入命令:
   ```cmd
   cd /d E:\Projects\WeChatProjects\PAO-H5
   install-global-skills.bat
   ```
3. 按回车执行

## ✅ 验证安装

安装完成后，验证技能是否成功安装:

### Windows 文件资源管理器
1. 打开文件资源管理器
2. 导航到：`C:\Users\hongr\.trae\skills\`
3. 检查是否有以下文件夹:
   - brainstorming
   - test-driven-development
   - systematic-debugging
   - writing-plans
   - subagent-driven-development
   - requesting-code-review
   - finishing-a-development-branch
   - using-git-worktrees
   - verification-before-completion
   - using-superpowers

### PowerShell 验证
```powershell
# 打开 PowerShell，运行以下命令
Get-ChildItem -Path "$env:USERPROFILE\.trae\skills" -Directory
```

## 🔄 安装完成后

1. **重启 Trae IDE**
2. 技能将自动应用到所有项目
3. 提出一个新功能想法，观察技能自动触发

## ❓ 常见问题

### Q: 为什么不能在 Trae IDE 内部运行？
A: Trae IDE 的 sandbox 权限限制，不允许操作用户目录 (`C:\Users\hongr\`)

### Q: 安装失败怎么办？
A: 
1. 检查是否有杀毒软件阻止
2. 尝试"以管理员身份运行"
3. 手动复制文件夹 (见下方)

### Q: 如何手动复制？
A:
1. 打开文件资源管理器
2. 进入：`E:\Projects\WeChatProjects\PAO-H5\.trae\skills\`
3. 选择所有 10 个文件夹
4. 复制 (Ctrl+C)
5. 进入：`C:\Users\hongr\.trae\skills\`
6. 粘贴 (Ctrl+V)

### Q: 安装后技能没有生效？
A:
1. 确认已重启 Trae IDE
2. 检查技能文件是否正确复制
3. 删除项目目录中的 `.trae/skills/` 文件夹 (项目级技能优先级更高)

## 📂 文件说明

- **`install-global-skills.bat`** - Windows 批处理安装脚本 (推荐)
- **`install-global-skills.ps1`** - PowerShell 安装脚本 (需要在 IDE 外部运行)
- **`SUPERPOWERS_DEPLOYMENT.md`** - 详细部署文档
- **`INSTALL_GLOBAL_GUIDE.md`** - 详细安装指南

## 🎯 安装输出示例

```
==================================
Superpowers 全局技能安装程序
==================================

源目录：E:\Projects\WeChatProjects\PAO-H5\.trae\skills
目标目录：C:\Users\hongr\.trae\skills

[成功] 源目录存在
[成功] 目标目录已准备

开始复制技能文件...

[复制] brainstorming
  [成功] brainstorming 复制完成
[复制] test-driven-development
  [成功] test-driven-development 复制完成
...
[复制] using-superpowers
  [成功] using-superpowers 复制完成

==================================
全局技能安装完成！
==================================

已安装技能:
  - brainstorming
  - test-driven-development
  ...

请重启 Trae IDE 以使技能生效。
```

## 📞 需要帮助？

如果遇到问题:
1. 查看 `SUPERPOWERS_DEPLOYMENT.md` 获取详细故障排除指南
2. 检查文件权限
3. 尝试手动复制文件夹

---

**提示**: 安装过程只需要几分钟，安装完成后所有 Trae IDE 项目都可以使用这些技能！🎉
