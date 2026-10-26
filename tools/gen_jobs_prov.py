# -*- coding: utf-8 -*-
"""生成 tools/jobs_prov.json：从 7 省内容源解析带 img= 标记的景点，转成抓图任务。

任务格式与 tools/jobs.json 一致（q/slug/route/node/cat），但 route 字段存省份 id，
避免与共享的 jobs.json 混淆。运行：python tools/gen_jobs_prov.py
"""
import os, re, io, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, "content")
sys.path.insert(0, CONTENT)

PROVS = ["yunnan", "guizhou", "chongqing", "shaanxi", "gansu", "qinghai", "tibet"]
PNAME = {"yunnan": "云南", "guizhou": "贵州", "chongqing": "重庆",
         "shaanxi": "陕西", "gansu": "甘肃", "qinghai": "青海", "tibet": "西藏"}


def load(mod):
    m = __import__(mod)
    return m


def main():
    jobs = []
    for pid in PROVS:
        m = load(pid)
        cities = {c[0]: c[1] for c in m.CITIES}
        seen = set()
        for line in m.SPOTS.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) < 7:
                continue
            sid, name, cat, city, lat, lng, desc = parts[:7]
            kv = parts[7:]
            extra = {}
            for tok in kv:
                if "=" in tok:
                    k, v = tok.split("=", 1)
                    extra[k] = v
                else:
                    extra[tok] = True
            img = extra.get("img")
            if not img:
                continue
            if img in seen:
                continue
            seen.add(img)
            cname = cities.get(city, city)
            q = "%s %s %s %s景点 实景" % (name, cname, PNAME[pid], cat)
            jobs.append({"q": q, "slug": img, "route": pid,
                         "node": cname, "cat": cat, "name": name})
    out = os.path.join(HERE, "jobs_prov.json")
    io.open(out, "w", encoding="utf-8").write(
        json.dumps(jobs, ensure_ascii=False, indent=1))
    print("生成 %s: %d 个任务" % (out, len(jobs)))


if __name__ == "__main__":
    main()
