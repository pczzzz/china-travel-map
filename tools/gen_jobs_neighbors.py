# -*- coding: utf-8 -*-
"""生成 tools/jobs_neighbors.json：四川周边七省（滇/黔/渝/陕/甘/青/藏）**美食**配图抓取任务
+ 少量历史失败景点图重试任务。

背景：tools/build_prov_neighbors.py 之前没有给 foods 挂图（其它批次都有），
导致这七省的美食卡全部是渐变色块占位。本脚本按 fd_<prefix>_<NN> 规则补任务，
与 build_prov_batch3/4/5/6/extra 的美食图命名完全一致。

不修改共享的 tools/jobs.json / jobs_prov.json / jobs_supp.json。
运行：python tools/gen_jobs_neighbors.py
"""
import os, io, json, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(HERE, "content")
sys.path.insert(0, HERE)
sys.path.insert(0, CONTENT)

PROVS = ["yunnan", "guizhou", "chongqing", "shaanxi", "gansu", "qinghai", "tibet"]
PNAME = {"yunnan": "云南", "guizhou": "贵州", "chongqing": "重庆", "shaanxi": "陕西",
         "gansu": "甘肃", "qinghai": "青海", "tibet": "西藏"}
# 美食图前缀（与 build_prov_neighbors.FOOD_PREFIX 保持一致）
FOOD_PREFIX = {"yunnan": "yn", "guizhou": "gz", "chongqing": "cq", "shaanxi": "sx",
               "gansu": "gs", "qinghai": "qh", "tibet": "xz"}

# 历史抓取失败的景点图重试（slug 必须与各省 prov_*.js 里期望的文件名一致）
RETRY_SPOTS = [
    {"slug": "ln_fhs", "route": "liaoning", "name": "凤凰山",
     "q": "丹东凤凰山 辽宁 老牛背 山岳风景 实景"},
    {"slug": "sc_xlingxs", "route": "sichuan", "name": "西岭雪山",
     "q": "西岭雪山 成都大邑 四川 雪山滑雪场 实景"},
]


def clean_food_query(name):
    """菜名 -> 检索词主名：去掉括号补充说明、· 分隔的次要名、标点。"""
    s = re.split(r"[（(·]", name)[0]
    s = re.sub(r"[\s、,，。:：\"'“”‘’]+", "", s)
    return s.strip() or name


def main():
    jobs, seen = [], set()
    for j in RETRY_SPOTS:
        if j["slug"] in seen:
            continue
        seen.add(j["slug"])
        jobs.append({"q": j["q"], "slug": j["slug"], "route": j["route"],
                     "node": "", "cat": "scenery", "name": j["name"]})

    nfood = 0
    for pid in PROVS:
        M = __import__(pid)
        cities = dict((c[0], c[1]) for c in M.CITIES)
        for i, (name, city, desc) in enumerate(M.FOODS, 1):
            slug = "fd_%s_%02d" % (FOOD_PREFIX[pid], i)
            if slug in seen:
                continue
            seen.add(slug)
            cname = cities.get(city, city)
            main = clean_food_query(name)
            q = "%s %s %s 美食 实拍" % (main, cname, PNAME[pid])
            jobs.append({"q": q, "slug": slug, "route": pid,
                         "node": cname, "cat": "food", "name": name})
            nfood += 1

    out = os.path.join(HERE, "jobs_neighbors.json")
    io.open(out, "w", encoding="utf-8").write(
        json.dumps(jobs, ensure_ascii=False, indent=1))
    print("生成 %s: %d 个任务（美食 %d + 景点重试 %d）"
          % (out, len(jobs), nfood, len(jobs) - nfood))
    for pid in PROVS:
        n = sum(1 for j in jobs if j["route"] == pid and j["cat"] == "food")
        print("  %-10s %s  %d 味" % (pid, PNAME[pid], n))


if __name__ == "__main__":
    main()
