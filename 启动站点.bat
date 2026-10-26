@echo off
chcp 65001 >nul
setlocal
title 环中国旅行地图 - 本地站点
cd /d "%~dp0"

set "PORT=8787"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://127.0.0.1:%PORT%/"

rem ---- 1) 定位 Python ----
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY ( where python >nul 2>nul && set "PY=python" )
if not defined PY (
  echo [错误] 未找到 Python。
  echo        请安装 Python 3.9 及以上版本，并勾选 "Add Python to PATH"。
  echo        详见 README.md 第一节。
  echo.
  pause
  exit /b 1
)

rem ---- 2) 端口占用检测：已在监听则直接开浏览器 ----
netstat -ano | findstr /c:":%PORT% " | findstr /c:"LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo [提示] 端口 %PORT% 已有服务在监听，直接打开浏览器。
  echo        %URL%
  start "" "%URL%"
  timeout /t 2 >nul
  exit /b 0
)

rem ---- 3) AI 规划密钥检查（可选功能，缺失不影响浏览）----
if not defined HZ_LLM_KEY (
  if not exist "tools\llm_key.local" (
    echo [提示] 未配置 AI 密钥：站点可正常浏览，仅「AI 行程规划」会提示未配置。
    echo        需要时二选一：设置环境变量 HZ_LLM_KEY，或在 tools\ 下新建
    echo        llm_key.local 写入密钥（单行），然后重新运行本脚本。
    echo.
  )
)

rem ---- 4) 延迟 2 秒打开浏览器，前台运行服务（关闭窗口即停止）----
echo 正在启动本地服务：%URL%
echo 关闭本窗口即停止服务。
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 2; Start-Process '%URL%'"
%PY% tools\serve.py %PORT%

echo.
echo 服务已停止，按任意键关闭窗口。
pause >nul
endlocal
