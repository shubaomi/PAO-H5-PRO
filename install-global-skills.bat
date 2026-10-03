@echo off
chcp 65001 >nul 2>&1
echo ==================================
echo Superpowers Global Skills Installer
echo ==================================
echo.

REM Set paths
set SOURCE_PATH=%CD%\.trae\skills
set DEST_PATH=%USERPROFILE%\.trae\skills

echo Source: %SOURCE_PATH%
echo Target: %DEST_PATH%
echo.

REM Check source exists
if not exist "%SOURCE_PATH%" (
    echo [ERROR] Source directory not found: %SOURCE_PATH%
    pause
    exit /b 1
)

echo [OK] Source directory found

REM Create target directory
if not exist "%DEST_PATH%" (
    echo [INFO] Creating target directory: %DEST_PATH%
    mkdir "%DEST_PATH%"
)

echo [OK] Target directory ready
echo.
echo Copying skills...
echo.

REM Copy each skill
for %%i in (
    brainstorming
    test-driven-development
    systematic-debugging
    writing-plans
    subagent-driven-development
    requesting-code-review
    finishing-a-development-branch
    using-git-worktrees
    verification-before-completion
    using-superpowers
) do (
    echo [COPY] %%i
    xcopy /E /I /Y "%SOURCE_PATH%\%%i" "%DEST_PATH%\%%i" >nul
    if %errorlevel% equ 0 (
        echo   [OK] %%i completed
    ) else (
        echo   [FAIL] %%i failed
    )
)

echo.
echo ==================================
echo Installation Complete!
echo ==================================
echo.
echo Installed skills:
echo   - brainstorming
echo   - test-driven-development
echo   - systematic-debugging
echo   - writing-plans
echo   - subagent-driven-development
echo   - requesting-code-review
echo   - finishing-a-development-branch
echo   - using-git-worktrees
echo   - verification-before-completion
echo   - using-superpowers
echo.
echo Please restart Trae IDE to activate skills.
echo.
pause
