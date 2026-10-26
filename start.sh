#!/usr/bin/env bash
# 环中国旅行地图 · 本地站点启动脚本（macOS / Linux）
# 用法: ./start.sh [端口]   默认 8787
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-8787}"
URL="http://127.0.0.1:${PORT}/"

# 1) 定位 Python
if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python >/dev/null 2>&1; then PY=python
else
  echo "[错误] 未找到 Python，请安装 Python 3.9+（详见 README.md 第一节）"
  exit 1
fi

# 2) 端口占用检测
if (echo >/dev/tcp/127.0.0.1/"$PORT") >/dev/null 2>&1; then
  echo "[提示] 端口 ${PORT} 已有服务在监听，直接打开浏览器：${URL}"
  { command -v xdg-open >/dev/null && xdg-open "$URL"; } || \
  { command -v open >/dev/null && open "$URL"; } || true
  exit 0
fi

# 3) AI 密钥检查（可选）
if [ -z "${HZ_LLM_KEY:-}" ] && [ ! -f tools/llm_key.local ]; then
  echo "[提示] 未配置 AI 密钥：站点可正常浏览，仅「AI 行程规划」会提示未配置。"
  echo "       需要时：export HZ_LLM_KEY=你的密钥，或新建 tools/llm_key.local"
fi

# 4) 延迟打开浏览器 + 前台运行服务
echo "正在启动本地服务：${URL}"
( sleep 2; { command -v xdg-open >/dev/null && xdg-open "$URL"; } || \
            { command -v open >/dev/null && open "$URL"; } || true ) &
exec "$PY" tools/serve.py "$PORT"
