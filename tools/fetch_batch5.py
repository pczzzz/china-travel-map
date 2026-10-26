# -*- coding: utf-8 -*-
"""batch5 五省配图抓取包装器：复用 fetch_images.py 抓图逻辑，读取 tools/jobs_batch5.json，
输出到 tools/image_report_batch5.json。不修改共享的 tools/jobs*.json。

用法：
  python tools/fetch_batch5.py              # 抓全部
  python tools/fetch_batch5.py hubei        # 只抓湖北
  python tools/fetch_batch5.py hb_huanghelou # 只抓单张
"""
import os, io, json, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import fetch_images as F

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    jobs = json.load(io.open(os.path.join(HERE, "jobs_batch5.json"), encoding="utf-8"))
    only = sys.argv[1:]
    if only:
        jobs = [j for j in jobs if j["route"] in only or j["slug"] in only]
    print("jobs=%d -> %s" % (len(jobs), F.IMG))
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
            print("[%3d/%3d] %-22s %s" % (done, len(jobs), j["slug"],
                                          "OK" if r["ok"] else "FAIL:" + str(r.get("reason"))))
    okc = sum(1 for r in rep if r["ok"])
    io.open(os.path.join(HERE, "image_report_batch5.json"), "w", encoding="utf-8").write(
        json.dumps(rep, ensure_ascii=False, indent=1))
    print("完成: %d/%d 成功, %.1f MB, %ds -> %s"
          % (okc, len(jobs), sum(r.get("bytes", 0) for r in rep) / 1048576.0,
             time.time() - t0, F.IMG))


if __name__ == "__main__":
    main()
