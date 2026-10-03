# Superpowers 全局技能系统 - 部署说明

## 📦 当前状态

✅ **已完成**: 在当前项目中创建了 10 个 Superpowers 核心技能
⏳ **待完成**: 将技能复制到全局目录以应用到所有项目

## 📂 技能文件位置

### 当前项目技能目录
```
E:\Projects\WeChatProjects\PAO-H5\.trae\skills\
```

### 全局技能目录 (目标位置)
```
C:\Users\hongr\.trae\skills\
```

## 🚀 安装到全局的方法

### 方法 1: 运行安装脚本 (推荐)

我已经为你创建了自动安装脚本。

**步骤**:
1. 打开文件资源管理器
2. 导航到：`E:\Projects\WeChatProjects\PAO-H5\`
3. 找到文件：`install-global-skills.ps1`
4. **右键点击**该文件
5. 选择 **"使用 PowerShell 运行"**

脚本会自动:
- 检查源目录
- 创建目标目录 (如果不存在)
- 复制所有 10 个技能到全局目录
- 显示安装进度和结果

### 方法 2: 手动复制

**步骤**:
1. 打开文件资源管理器
2. 导航到：`E:\Projects\WeChatProjects\PAO-H5\.trae\skills\`
3. 选择所有技能文件夹 (10 个)
4. 复制 (Ctrl+C)
5. 导航到：`C:\Users\hongr\.trae\skills\`
6. 粘贴 (Ctrl+V)

**需要复制的文件夹**:
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

### 方法 3: 使用 PowerShell 命令

以**管理员身份**打开 PowerShell，运行:

```powershell
# 复制所有技能到全局目录
$sourcePath = "E:\Projects\WeChatProjects\PAO-H5\.trae\skills"
$destPath = "$env:USERPROFILE\.trae\skills"

$skills = @("brainstorming", "test-driven-development", "systematic-debugging", 
            "writing-plans", "subagent-driven-development", "requesting-code-review", 
            "finishing-a-development-branch", "using-git-worktrees", 
            "verification-before-completion", "using-superpowers")

foreach ($skill in $skills) {
    Copy-Item -Path "$sourcePath\$skill" -Destination $destPath -Recurse -Force
    Write-Host "✅ Installed: $skill" -ForegroundColor Green
}

Write-Host "`n✅ 全局技能安装完成！请重启 Trae IDE。" -ForegroundColor Green
```

## ✅ 验证安装

安装完成后，验证技能是否正确安装:

### PowerShell 验证命令
```powershell
# 检查全局技能目录
Get-ChildItem -Path "$env:USERPROFILE\.trae\skills" -Directory

# 检查特定技能是否存在
Test-Path "$env:USERPROFILE\.trae\skills\brainstorming"
Test-Path "$env:USERPROFILE\.trae\skills\test-driven-development"
```

### 期望结果
应该看到以下目录:
```
brainstorming/
test-driven-development/
systematic-debugging/
writing-plans/
subagent-driven-development/
requesting-code-review/
finishing-a-development-branch/
using-git-worktrees/
verification-before-completion/
using-superpowers/
```

## 🎯 已安装的技能列表

| # | 技能名称 | 触发时机 | 核心作用 |
|---|---------|---------|---------|
| 1 | **brainstorming** | 新功能想法 | 设计讨论和需求澄清 |
| 2 | **test-driven-development** | 实现功能/修复 bug | 测试驱动开发 (RED-GREEN-REFACTOR) |
| 3 | **systematic-debugging** | Bug 报告 | 4 阶段系统化调试 |
| 4 | **writing-plans** | 设计批准后 | 创建详细实现计划 |
| 5 | **subagent-driven-development** | 有实现计划 | 子代理驱动开发 + 两阶段审查 |
| 6 | **requesting-code-review** | 任务完成 | 代码审查 (按严重程度报告) |
| 7 | **finishing-a-development-branch** | 所有任务完成 | 完成分支 (合并/PR/清理) |
| 8 | **using-git-worktrees** | 开始新功能 | 创建隔离开发工作区 |
| 9 | **verification-before-completion** | 任务完成后 | 完成前全面验证 |
| 10 | **using-superpowers** | 询问技能系统 | 技能系统使用指南 |

## 🔄 技能自动触发

安装完成后，技能会在以下场景**自动触发**:

### 新功能开发流程
```
用户："我想添加一个用户登录功能"
  ↓
🤖 自动触发 brainstorming (设计讨论)
  ↓
🤖 自动触发 writing-plans (创建计划)
  ↓
🤖 自动触发 using-git-worktrees (工作区)
  ↓
🤖 自动触发 subagent-driven-development (执行)
  ├─ 🤖 每个任务触发 test-driven-development
  └─ 🤖 每个任务触发 requesting-code-review
  ↓
🤖 自动触发 verification-before-completion
  ↓
🤖 自动触发 finishing-a-development-branch
```

### Bug 修复流程
```
用户："这个功能报错了"
  ↓
🤖 自动触发 systematic-debugging (调试)
  ↓
🤖 自动触发 test-driven-development (修复)
  ↓
🤖 自动触发 verification-before-completion (验证)
  ↓
🤖 自动触发 requesting-code-review (审查)
```

## ⚠️ 注意事项

### 1. 权限问题
- 如果遇到"权限不足"错误，请**以管理员身份运行 PowerShell**
- 或手动使用文件资源管理器复制

### 2. 目录不存在
- 如果 `C:\Users\hongr\.trae\skills\` 不存在，安装脚本会自动创建
- 手动复制时，需要先创建该目录

### 3. 技能优先级
- **项目级技能** (项目目录中的 `.trae/skills/`) 优先级**高于**全局技能
- 如需使用全局技能，删除项目目录中的 `.trae/skills/` 文件夹

### 4. 重启 IDE
- 安装完成后，**重启 Trae IDE** 以使技能生效

## 📖 参考文档

- **INSTALL_GLOBAL_GUIDE.md** - 详细的安装指南
- **SUPERPOWERS_GUIDE.md** - 技能系统使用指南
- 每个技能目录中的 **SKILL.md** - 具体技能说明

## 🎉 完成后的效果

安装完成后，你将拥有:

✅ **全局可用的 Superpowers 技能系统**
- 在所有 Trae IDE 项目中自动生效
- 无需在每个项目中重复安装
- 遵循统一的开发流程和最佳实践

✅ **自动化的开发流程**
- 设计讨论 → 实现计划 → 测试驱动开发 → 代码审查 → 完成分支
- 每个环节都有技能引导和约束

✅ **高质量的代码保证**
- 测试覆盖率提升
- 代码审查常态化
- 系统化调试方法

## 📞 故障排除

### 问题 1: 技能没有自动触发

**解决方案**:
1. 确认技能已正确复制到全局目录
2. 重启 Trae IDE
3. 检查技能文件格式是否正确

### 问题 2: 安装脚本无法运行

**解决方案**:
1. 右键点击脚本 → 属性 → 解除锁定
2. 以管理员身份运行 PowerShell
3. 运行：`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
4. 然后运行脚本

### 问题 3: 项目级技能与全局技能冲突

**解决方案**:
- 项目级技能优先级更高
- 如需使用全局技能，删除项目中的 `.trae/skills/` 目录
- 或重命名项目级技能目录

## 📝 下一步

1. ✅ **运行安装脚本**或使用其他方法复制到全局目录
2. ✅ **验证安装** - 检查全局技能目录
3. ✅ **重启 Trae IDE** - 使技能生效
4. ✅ **测试技能** - 提出一个新功能想法，观察技能自动触发
5. ✅ **阅读文档** - 了解每个技能的详细用法

---

**创建时间**: 2026-03-04  
**基于**: [obra/superpowers](https://github.com/obra/superpowers)  
**版本**: 1.0.0
