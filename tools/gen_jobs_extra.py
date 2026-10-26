# -*- coding: utf-8 -*-
"""生成 tools/jobs_extra.json：五个新省景点配图 + 六省美食配图抓取任务。

景点任务从 content 源解析 img= 标记；美食任务按 fd_<prefix>_<NN> 顺序生成
（与 build_sichuan.py / build_prov_extra.py 的美食带图检测规则一致）。
不修改共享的 tools/jobs.json。运行：python tools/gen_jobs_extra.py
"""
import os, io, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, "content")
sys.path.insert(0, CONTENT)

PROVS = ["xinjiang", "shanxi", "hunan", "guangxi", "fujian"]
PNAME = {"xinjiang": "新疆", "shanxi": "山西", "hunan": "湖南",
         "guangxi": "广西", "fujian": "福建", "sichuan": "四川"}
CAT = {"scenery": "风景", "mountain": "山岳", "culture": "人文",
       "food": "美食", "landmark": "地标", "museum": "博物馆"}
# 美食配图：省份 -> 前缀（fd_<前缀>_<序号>）
FOOD_PROVS = {"sichuan": "sc", "xinjiang": "xj", "shanxi": "sxi",
              "hunan": "hn", "guangxi": "gx", "fujian": "fj"}


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
    # 美食（含四川，让 fd_sc_* 占位补上）
    all_provs = ["sichuan"] + PROVS
    for pid in all_provs:
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
    out = os.path.join(HERE, "jobs_extra.json")
    io.open(out, "w", encoding="utf-8").write(
        json.dumps(jobs, ensure_ascii=False, indent=1))
    print("生成 %s: %d 个任务（景点 %d + 美食 %d）"
          % (out, len(jobs), sum(1 for j in jobs if j["cat"] != "food"),
             sum(1 for j in jobs if j["cat"] == "food")))


if __name__ == "__main__":
    main()
