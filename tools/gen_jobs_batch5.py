# -*- coding: utf-8 -*-
"""生成 tools/jobs_batch5.json：batch5 五省（湖北/安徽/浙江/江西/宁夏）景点+美食配图抓取任务。

景点任务从 content 源解析 img= 标记；美食任务按 fd_<prefix>_<NN> 顺序生成
（与 build_prov_batch5.py 的美食带图检测规则一致）。
不修改共享的 tools/jobs.json / jobs_prov.json / jobs_extra.json。
运行：python tools/gen_jobs_batch5.py
"""
import os, io, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, "content")
sys.path.insert(0, CONTENT)

PROVS = ["hubei", "anhui", "zhejiang", "jiangxi", "ningxia"]
PNAME = {"hubei": "湖北", "anhui": "安徽", "zhejiang": "浙江",
         "jiangxi": "江西", "ningxia": "宁夏"}
CAT = {"scenery": "风景", "mountain": "山岳", "culture": "人文",
       "food": "美食", "landmark": "地标", "museum": "博物馆"}
# 美食配图：省份 -> 前缀（fd_<前缀>_<序号>）
FOOD_PROVS = {"hubei": "hb", "anhui": "ah", "zhejiang": "zj",
              "jiangxi": "jx", "ningxia": "nx"}


def main():
    jobs, seen = [], set()
    # 景点
    for pid in PROVS:
        m = __import__(pid)
        cities = {c[0]: c[1] for c in m.CITIES}
        for line in m.SPOTS.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) < 7:
                continue
            sid, name, cat, city = parts[0], parts[1], parts[2], parts[3]
            img = ""
            for tok in parts[7:]:
                if tok.startswith("img="):
                    img = tok.split("=", 1)[1]
            if not img or img in seen:
                continue
            seen.add(img)
            cname = cities.get(city, city)
            q = "%s %s %s %s景点 实景" % (name, cname, PNAME[pid], CAT.get(cat, ""))
            jobs.append({"q": q, "slug": img, "route": pid,
                         "node": cname, "cat": cat, "name": name})
    # 美食
    for pid in PROVS:
        m = __import__(pid)
        for i, (name, city, desc) in enumerate(m.FOODS, 1):
            slug = "fd_%s_%02d" % (FOOD_PROVS[pid], i)
            if slug in seen:
                continue
            seen.add(slug)
            cname = dict((c[0], c[1]) for c in m.CITIES).get(city, city)
            q = "%s %s %s美食 实拍" % (name, cname, PNAME[pid])
            jobs.append({"q": q, "slug": slug, "route": pid,
                         "node": cname, "cat": "food", "name": name})
    out = os.path.join(HERE, "jobs_batch5.json")
    io.open(out, "w", encoding="utf-8").write(
        json.dumps(jobs, ensure_ascii=False, indent=1))
    print("生成 %s: %d 个任务（景点 %d + 美食 %d）"
          % (out, len(jobs), sum(1 for j in jobs if j["cat"] != "food"),
             sum(1 for j in jobs if j["cat"] == "food")))


if __name__ == "__main__":
    main()
