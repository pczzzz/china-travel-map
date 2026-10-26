# -*- coding: utf-8 -*-
"""中国旅行地图 · 本地服务（静态 + 大模型代理）
用法: python tools/serve.py [port]   默认 8787, 绑定 127.0.0.1
相比 python -m http.server 多了 POST /api/llm —— 同源于网页转发到通威 AI 网关,
规避浏览器 CORS 拦截, 密钥只留在本机服务端。
"""
import json
import os
import ssl
import sys
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPSTREAM = "https://aigateway.tongwei.com/v1/chat/completions"
CTX = ssl.create_default_context()


def _load_key():
    """密钥只从环境变量或本地未入库文件读取，绝不硬编码在代码里。"""
    k = (os.environ.get("HZ_LLM_KEY") or "").strip()
    if k:
        return k
    kf = os.path.join(os.path.dirname(os.path.abspath(__file__)), "llm_key.local")
    try:
        with open(kf, "r", encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


API_KEY = _load_key()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/llm":
            self.send_response(404)
            self._cors()
            self.end_headers()
            self.wfile.write(b'{"error":"not found"}')
            return
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n) if n else b"{}"
        if not API_KEY:
            self.send_response(503)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(('{"error":{"message":"未配置大模型密钥：设置环境变量 HZ_LLM_KEY，'
                              '或在 tools/ 下创建 llm_key.local 写入密钥后重启 serve.py"}}').encode("utf-8"))
            return
        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception:
            payload = {}
        payload.setdefault("model", "tw-Qwen3")
        req = urllib.request.Request(
            UPSTREAM,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + API_KEY},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300, context=CTX) as r:
                data = r.read()
                code = r.status
        except urllib.error.HTTPError as e:
            data = e.read()
            code = e.code
        except Exception as e:  # noqa: BLE001
            data = json.dumps({"error": {"message": "upstream failed: %s" % e}}).encode("utf-8")
            code = 502
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        # 静态资源（GET/HEAD）一律禁用缓存，避免浏览器沿用旧版 plan.js / v2.css 导致页面异常
        if self.command in ("GET", "HEAD"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("serving %s at http://127.0.0.1:%d (with /api/llm proxy)" % (ROOT, port))
    srv.serve_forever()
