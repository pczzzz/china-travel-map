# -*- coding: utf-8 -*-
"""生成 tools/jobs_supp.json：补齐批次（10 省）新增景点+美食配图任务，仅缺图才生成。"""
import os, io, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(os.path.dirname(HERE), "assets", "images")
CONTENT = os.path.join(HERE, "content")
sys.path.insert(0, CONTENT)

PROVS = ["xinjiang", "shanxi", "hunan", "guangxi", "fujian",
         "heilongjiang", "jilin", "liaoning", "neimenggu", "guangdong"]
PNAME = {"xinjiang": "新疆", "shanxi": "山西", "hunan": "湖南", "guangxi": "广西",
         "fujian": "福建", "heilongjiang": "黑龙江", "jilin": "吉林", "liaoning": "辽宁",
         "neimenggu": "内蒙古", "guangdong": "广东"}
FOOD_PRE = {"xinjiang": "xj", "shanxi": "sxi", "hunan": "hn", "guangxi": "gx",
            "fujian": "fj", "heilongjiang": "hl", "jilin": "jl", "liaoning": "ln",
            "neimenggu": "nm", "guangdong": "gd"}
CAT = {"scenery": "风景", "mountain": "山岳", "culture": "人文",
       "food": "美食", "landmark": "地标", "museum": "博物馆"}


def has_img(slug):
    for ext in (".jpg", ".jpeg", ".webp", ".png"):
        if os.path.exists(os.path.join(IMG, slug + ext)):
            return True
    return False


def main():
    jobs = []
    for pid in PROVS:
        m = __import__(pid)
        cities = {c[0]: c[1] for c in m.CITIES}
        # 景点
        for line in m.SPOTS.strip().splitlines():
            parts = [p.strip() for p in line.strip().split("|")]
            if len(parts) < 7:
                continue
            sid, name, cat, city = parts[0], parts[1], parts[2], parts[3]
            img = ""
            for tok in parts[7:]:
                if tok.startswith("img="):
                    img = tok.split("=", 1)[1]
            if not img or has_img(img):
                continue
            q = "%s %s %s %s景点 实景" % (name, cities.get(city, city), PNAME[pid], CAT.get(cat, ""))
            jobs.append({"q": q, "slug": img, "route": pid, "node": cities.get(city, city),
                         "cat": cat, "name": name})
        # 美食（fd_<pre>_<NN> 按列表顺序编号，与 builder 一致）
        for i, f in enumerate(m.FOODS, 1):
            slug = "fd_%s_%02d" % (FOOD_PRE[pid], i)
            if has_img(slug):
                continue
            name = f[0] if isinstance(f, (list, tuple)) else f
            q = "%s %s 美食 实拍" % (name, PNAME[pid])
            jobs.append({"q": q, "slug": slug, "route": pid, "node": name,
                         "cat": "food", "name": name})
    out = os.path.join(HERE, "jobs_supp.json")
    io.open(out, "w", encoding="utf-8").write(json.dumps(jobs, ensure_ascii=False, indent=1))
    print("生成 %s: %d 个任务" % (out, len(jobs)))


if __name__ == "__main__":
    main()
