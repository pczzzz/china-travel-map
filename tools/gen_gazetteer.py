# -*- coding: utf-8 -*-
"""生成挂载点真坐标匹配用的地名词典 tools/geo_gazetteer.json
来源：
  1) 各省已生成数据 assets/js/prov_*.js 的 PROV_DATA.<id>.spots / cities（GCJ-02）
  2) tools/content/base_spots.json（旧景点，GCJ-02）
  3) tools/content/base_cities.json（线路节点城镇，GCJ-02）
输出: {"spots":[[name,lat,lng,prov,city],...], "adm":[[name,lat,lng,prov],...]}
"""
import json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spots, adm, seen = [], [], set()


def add_spot(name, lat, lng, prov, city):
    name = (name or "").strip()
    if not name or lat is None or lng is None:
        return
    k = (name, round(lat, 3), round(lng, 3))
    if k in seen:
        return
    seen.add(k)
    spots.append([name, round(lat, 5), round(lng, 5), prov, city or ""])


def add_adm(name, lat, lng, prov):
    name = (name or "").strip()
    if not name or lat is None or lng is None:
        return
    adm.append([name, round(lat, 5), round(lng, 5), prov])


# 1) 省份数据
for f in sorted(glob.glob(os.path.join(ROOT, "assets", "js", "prov_*.js"))):
    base = os.path.basename(f)[5:-3]
    if base in ("index", "neighbors_index", "extra_index", "batch3_index", "batch4_index", "batch5_index"):
        continue
    txt = open(f, encoding="utf-8").read()
    m = re.search(r"PROV_DATA\.%s\s*=\s*(\{.*\})\s*;?\s*$" % base, txt, re.S)
    if not m:
        continue
    try:
        P = json.loads(m.group(1))
    except Exception as e:
        print("[skip]", base, e)
        continue
    prov = P.get("meta", {}).get("name", base)
    cname = {c["id"]: c["name"] for c in P.get("cities", [])}
    for c in P.get("cities", []):
        add_adm(c["name"], c.get("lat"), c.get("lng"), prov)
    for s in P.get("spots", []):
        add_spot(s["name"], s.get("lat"), s.get("lng"), prov, cname.get(s.get("city"), ""))

# 2) 旧景点
bf = os.path.join(ROOT, "tools", "content", "base_spots.json")
if os.path.exists(bf):
    for s in json.load(open(bf, encoding="utf-8")):
        add_spot(s["name"], s.get("lat"), s.get("lng"), s.get("prov", ""), s.get("city", ""))

# 3) 线路节点城镇
bc = os.path.join(ROOT, "tools", "content", "base_cities.json")
if os.path.exists(bc):
    for c in json.load(open(bc, encoding="utf-8")):
        add_adm(c["name"], c.get("lat"), c.get("lng"), c.get("prov", ""))

# 行政名去重（同名保留第一个）
adm_seen, adm2 = set(), []
for a in adm:
    if a[0] in adm_seen:
        continue
    adm_seen.add(a[0])
    adm2.append(a)

out = os.path.join(ROOT, "tools", "geo_gazetteer.json")
json.dump({"spots": spots, "adm": adm2}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print("geo_gazetteer.json: spots %d / adm %d" % (len(spots), len(adm2)))
