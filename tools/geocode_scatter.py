# -*- coding: utf-8 -*-
"""用 Photon(OSM) 免费地理编码为剩余 scatter 挂载点找真坐标。
输入: assets/js/data.js 中 scatter=true 的挂载点（由 node 预导出 tools/scatter_pois.json）
输出: tools/geo_extra.json  {"name@nodeName": {"lat":gcj,"lng":gcj,"src":"photon"}}
构建脚本 build_data_v2.py 会加载 geo_extra.json 作为最高优先坐标源。
用法: 先 node tools/dump_scatter.js，再 python tools/geocode_scatter.py
"""
import json, os, sys, time, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_data import wgs2gcj  # Photon 返回 WGS-84，转 GCJ-02 与站内一致

SRC = os.path.join(HERE, "scatter_pois.json")
OUT = os.path.join(HERE, "geo_extra.json")
UA = "Mozilla/5.0 (travel-map-geocoder; contact local)"


def hav(aLat, aLng, bLat, bLng):
    import math
    R, rad = 6371.0, math.pi / 180
    dLa, dLo = (bLat - aLat) * rad, (bLng - aLng) * rad
    s = math.sin(dLa / 2) ** 2 + math.cos(aLat * rad) * math.cos(bLat * rad) * math.sin(dLo / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(s), math.sqrt(1 - s))


def photon(q, limit=3):
    url = "https://photon.komoot.io/api/?" + urllib.parse.urlencode({"q": q, "limit": limit})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8")).get("features", [])


def main():
    pois = json.load(open(SRC, encoding="utf-8"))
    extra = {}
    if os.path.exists(OUT):
        extra = json.load(open(OUT, encoding="utf-8"))
    todo = [p for p in pois if (p["name"] + "@" + p["nodeName"]) not in extra]
    print("待编码 %d / 总 %d（已有 %d）" % (len(todo), len(pois), len(extra)), flush=True)
    ok = fail = 0
    for i, p in enumerate(todo, 1):
        key = p["name"] + "@" + p["nodeName"]
        base = p["name"].split("·")[0]
        q1 = base + " " + p["nodeName"] + (" " + p["prov"] if p["prov"] and p["prov"] not in p["nodeName"] else "")
        try:
            feats = photon(q1) or photon(base + " " + p["prov"])
        except Exception as e:
            print("[%d/%d] %s ERR %s" % (i, len(todo), key, e), flush=True)
            time.sleep(3)
            continue
        best = None
        for f in feats:
            geo = f.get("geometry", {})
            co = geo.get("coordinates")
            if not co or len(co) < 2:
                continue
            wlat, wlng = co[1], co[0]
            glat, glng = wgs2gcj(wlat, wlng)
            d = hav(p["lat"], p["lng"], glat, glng)  # 与节点 GCJ 距离
            prop = f.get("properties", {})
            nm = (prop.get("name") or "")
            score = (0 if (nm and (nm in p["name"] or p["name"].split("·")[0] in nm)) else 1, d)
            if d < 250 and (best is None or score < best[0]):
                best = (score, round(glat, 5), round(glng, 5), d, nm)
        if best:
            extra[key] = {"lat": best[1], "lng": best[2], "src": "photon", "d": round(best[3], 1), "osmName": best[4]}
            ok += 1
            print("[%d/%d] %s OK d=%.1fkm osm=%s" % (i, len(todo), key, best[3], best[4]), flush=True)
        else:
            extra[key] = {"src": "miss"}
            fail += 1
            print("[%d/%d] %s MISS" % (i, len(todo), key), flush=True)
        if i % 20 == 0:
            json.dump(extra, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
        time.sleep(1.1)
    json.dump(extra, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    good = sum(1 for v in extra.values() if v.get("lat"))
    print("完成: 本轮 ok=%d miss=%d；geo_extra 累计有效 %d" % (ok, fail, good), flush=True)


if __name__ == "__main__":
    main()
