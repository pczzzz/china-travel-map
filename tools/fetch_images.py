# -*- coding: utf-8 -*-
"""景点配图抓取: Bing 图片搜索 -> 下载到 assets/images/<slug>.jpg
- 统一用 Pillow 转 JPEG, 长边压到 1000px, q=82 (73 张约 6-8MB)
- 过滤: 最小边 >=480, 宽高比 0.8~4, 文件 >=20KB
- 失败记录到 tools/image_report.json, 页面自动回退到渐变占位
"""
import json, os, io, re, ssl, html, random, sys, time
import urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG = os.path.join(ROOT, "assets", "images")
os.makedirs(IMG, exist_ok=True)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
MAXSIDE = 1000
MIN_SIDE = 480


def get(url, referer=None, timeout=18):
    headers = {"User-Agent": UA, "Accept": "*/*",
               "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=timeout, context=CTX).read()


def search_murls(query, pages=2):
    """返回候选原图 URL 列表(已去重)"""
    out = []
    for i in range(pages):
        first = i * 20
        u = ("https://cn.bing.com/images/async?q=" + urllib.parse.quote(query) +
             "&first=%d&count=20&mmasync=1&qft=+filterui:imagesize-large" % first)
        try:
            t = get(u, referer="https://cn.bing.com/", timeout=18).decode("utf-8", "ignore")
        except Exception as e:
            print("    search fail p%d: %s" % (i, e))
            time.sleep(1.0)
            continue
        t = html.unescape(t)
        for m in re.findall(r'murl"\s*:\s*"(.*?)"', t):
            m = m.replace("\\/", "/").strip()
            if m.startswith("http") and m not in out:
                out.append(m)
        time.sleep(random.uniform(0.4, 1.0))
        if len(out) >= 22:
            break
    return out


def ok_image(data):
    """校验并返回 (Image, w, h) 或 None"""
    if len(data) < 20 * 1024:
        return None
    if not (data[:3] == b"\xff\xd8\xff" or data[:8] == b"\x89PNG\r\n\x1a\n"
            or data[:4] == b"RIFF" or data[:6] in (b"GIF87a", b"GIF89a")):
        return None
    try:
        im = Image.open(io.BytesIO(data))
        im.load()
    except Exception:
        return None
    w, h = im.size
    if min(w, h) < MIN_SIDE:
        return None
    if not (0.8 <= w / h <= 4.0):
        return None
    return im, w, h


def save(im, slug):
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    w, h = im.size
    if max(w, h) > MAXSIDE:
        s = MAXSIDE / float(max(w, h))
        im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
    p = os.path.join(IMG, slug + ".jpg")
    im.save(p, "JPEG", quality=82, optimize=True, progressive=True)
    return p


def handle(job):
    slug, q = job["slug"], job["q"]
    dst = os.path.join(IMG, slug + ".jpg")
    if os.path.exists(dst) and os.path.getsize(dst) > 20 * 1024:
        return {"slug": slug, "ok": True, "cached": True, "bytes": os.path.getsize(dst)}
    urls = search_murls(q)
    if not urls:
        return {"slug": slug, "ok": False, "q": q, "reason": "no search result"}
    for u in urls[:12]:
        try:
            data = get(u, referer="https://cn.bing.com/", timeout=15)
        except Exception:
            continue
        r = ok_image(data)
        if not r:
            continue
        im, w, h = r
        try:
            p = save(im, slug)
        except Exception as e:
            continue
        return {"slug": slug, "ok": True, "src": u[:120], "w": w, "h": h,
                "bytes": os.path.getsize(p)}
    return {"slug": slug, "ok": False, "q": q, "reason": "no downloadable image",
            "tried": len(urls[:12])}


def main():
    jobs = json.load(io.open(os.path.join(HERE, "jobs.json"), encoding="utf-8"))
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    if only:
        jobs = [j for j in jobs if j["slug"] in only]
    print("jobs=%d -> %s" % (len(jobs), IMG))
    rep, done = [], 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(handle, j): j for j in jobs}
        for f in as_completed(futs):
            j = futs[f]
            try:
                r = f.result()
            except Exception as e:
                r = {"slug": j["slug"], "ok": False, "reason": "exception %s" % e}
            r["name"] = j.get("name")
            rep.append(r)
            done += 1
            print("[%2d/%2d] %-22s %s" % (done, len(jobs), j["slug"],
                                          "OK" if r["ok"] else "FAIL:" + str(r.get("reason"))))
    okc = sum(1 for r in rep if r["ok"])
    io.open(os.path.join(HERE, "image_report.json"), "w", encoding="utf-8").write(
        json.dumps(rep, ensure_ascii=False, indent=1))
    tot = sum(r.get("bytes", 0) for r in rep)
    print("\n完成: %d/%d 成功, %.1f MB, %.0fs" % (okc, len(jobs), tot / 1048576.0, time.time() - t0))
    fails = [r["slug"] for r in rep if not r["ok"]]
    if fails:
        print("失败: " + " ".join(fails))
        print("重跑: python tools/fetch_images.py " + " ".join(fails))


if __name__ == "__main__":
    main()
