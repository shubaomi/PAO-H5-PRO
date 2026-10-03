# install-global-skills.ps1
# Superpowers 全局技能安装脚本

$ErrorActionPreference = "Stop"

# 设置路径
$sourcePath = "E:\Projects\WeChatProjects\PAO-H5\.trae\skills"
$destPath = "$env:USERPROFILE\.trae\skills"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Superpowers 全局技能安装程序" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查源目录是否存在
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ 错误：源目录不存在：$sourcePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 源目录存在：$sourcePath" -ForegroundColor Green

# 创建目标目录 (如果不存在)
if (-not (Test-Path $destPath)) {
    Write-Host "📁 创建目标目录：$destPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $destPath | Out-Null
}

Write-Host "✅ 目标目录存在：$destPath" -ForegroundColor Green
Write-Host ""

# 技能列表
$skills = @(
    "brainstorming",
    "test-driven-development",
    "systematic-debugging",
    "writing-plans",
    "subagent-driven-development",
    "requesting-code-review",
    "finishing-a-development-branch",
    "using-git-worktrees",
    "verification-before-completion",
    "using-superpowers"
)

# 复制每个技能
foreach ($skill in $skills) {
    Write-Host "📦 复制技能：$skill" -ForegroundColor Cyan
    try {
        Copy-Item -Path "$sourcePath\$skill" -Destination $destPath -Recurse -Force
        Write-Host "   ✅ 完成" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ 失败：$_" -ForegroundColor Red
        Write-Host "   请尝试以管理员身份运行此脚本" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ 全局技能安装完成！" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "已安装技能:" -ForegroundColor Yellow
foreach ($skill in $skills) {
    Write-Host "  - $skill" -ForegroundColor White
}

Write-Host ""
Write-Host "请重启 Trae IDE 以使技能生效。" -ForegroundColor Yellow
Write-Host ""
