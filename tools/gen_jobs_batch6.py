# -*- coding: utf-8 -*-
"""生成 tools/jobs_batch6.json：batch6 六省（北京/天津/上海/香港/澳门/台湾）景点+美食配图抓取任务。

景点任务 slug = <PREFIX><sid>（与 build_prov_batch6.py 的默认图名规则一致，
无显式 img= 时也生成任务）；美食任务按 fd_<prefix>_<NN> 顺序生成。
港澳台的搜索词使用「地名+省份名+实景/美食」避免限定语导致命中大陆同名地点。
不修改共享的 tools/jobs.json / jobs_prov.json / jobs_extra.json。
运行：python tools/gen_jobs_batch6.py
"""
import os, io, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, "content")
sys.path.insert(0, CONTENT)

PROVS = ["beijing", "tianjin", "shanghai", "hongkong", "macau", "taiwan"]
PNAME = {"beijing": "北京", "tianjin": "天津", "shanghai": "上海",
         "hongkong": "香港", "macau": "澳门", "taiwan": "台湾"}
# 景点图前缀（同 build_prov_batch6.PREFIX）
PREFIX = {"beijing": "bj_", "tianjin": "tj_", "shanghai": "sh_",
          "hongkong": "hk_", "macau": "mo_", "taiwan": "tw_"}
# 美食配图前缀（同 build_prov_batch6.FOOD_PREFIX）
FOOD_PROVS = {"beijing": "bj", "tianjin": "tj", "shanghai": "sh",
              "hongkong": "hk", "macau": "mo", "taiwan": "tw"}
CAT = {"scenery": "风景", "mountain": "山岳", "culture": "人文",
       "food": "美食", "landmark": "地标", "museum": "博物馆"}


def main():
    jobs, seen = [], set()
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
            slug = PREFIX[pid] + sid
            if slug in seen:
                continue
            seen.add(slug)
            cname = cities.get(city, city)
            q = "%s %s %s %s 实景" % (name, cname, PNAME[pid], CAT.get(cat, ""))
            jobs.append({"q": q, "slug": slug, "route": pid,
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
            q = "%s %s %s 美食" % (name, cname, PNAME[pid])
            jobs.append({"q": q, "slug": slug, "route": pid,
                         "node": cname, "cat": "food", "name": name})
    out = os.path.join(HERE, "jobs_batch6.json")
    io.open(out, "w", encoding="utf-8").write(
        json.dumps(jobs, ensure_ascii=False, indent=1))
    print("生成 %s: %d 个任务（景点 %d + 美食 %d）"
          % (out, len(jobs), sum(1 for j in jobs if j["cat"] != "food"),
             sum(1 for j in jobs if j["cat"] == "food")))


if __name__ == "__main__":
    main()
