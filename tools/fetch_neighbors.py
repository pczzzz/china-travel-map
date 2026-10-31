# -*- coding: utf-8 -*-
"""七省（滇/黔/渝/陕/甘/青/藏）美食配图抓取包装器：复用 fetch_images.py 抓图逻辑，
读取 tools/jobs_neighbors.json，输出到 tools/image_report_neighbors.json。

用法：
  python tools/fetch_neighbors.py            # 抓全部
  python tools/fetch_neighbors.py guizhou    # 只抓贵州（按 route）
  python tools/fetch_neighbors.py fd_gz_01   # 只抓单张（按 slug）
  python tools/fetch_neighbors.py --force guizhou   # 忽略已存在文件重抓
"""
import os, io, json, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import fetch_images as F

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    args = [a for a in sys.argv[1:] if a != "--force"]
    force = "--force" in sys.argv[1:]
    jobs = json.load(io.open(os.path.join(HERE, "jobs_neighbors.json"), encoding="utf-8"))
    if args:
        jobs = [j for j in jobs if j["route"] in args or j["slug"] in args]
    if force:
        for j in jobs:
            p = os.path.join(F.IMG, j["slug"] + ".jpg")
            if os.path.exists(p):
                os.remove(p)
    print("jobs=%d force=%s -> %s" % (len(jobs), force, F.IMG))
    rep, done = [], 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(F.handle, j): j for j in jobs}
        for f in as_completed(futs):
            j = futs[f]
            try:
                r = f.result()
            except Exception as e:
                r = {"slug": j["slug"], "ok": False, "reason": "exception %s" % e}
            r["name"] = j.get("name")
            r["route"] = j.get("route")
            rep.append(r)
            done += 1
            print("[%3d/%3d] %-14s %-16s %s" % (done, len(jobs), j["slug"], j.get("name", ""),
                                                "OK" if r["ok"] else "FAIL:" + str(r.get("reason"))))
    okc = sum(1 for r in rep if r["ok"])
    io.open(os.path.join(HERE, "image_report_neighbors.json"), "w", encoding="utf-8").write(
        json.dumps(rep, ensure_ascii=False, indent=1))
    print("完成: %d/%d 成功, %.1f MB, %.0fs -> %s"
          % (okc, len(jobs), sum(r.get("bytes", 0) for r in rep) / 1048576.0,
             time.time() - t0, F.IMG))
    fails = [(r["slug"], r.get("name")) for r in rep if not r["ok"]]
    if fails:
        print("失败 %d: %s" % (len(fails), " ".join("%s(%s)" % f for f in fails)))
        print("重跑: python tools/fetch_neighbors.py " + " ".join(s for s, _ in fails))


if __name__ == "__main__":
    main()
