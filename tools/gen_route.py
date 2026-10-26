# -*- coding: utf-8 -*-
"""知名国道内容生成器
读取: tools/route_specs/<id>.json  (meta + nodes + poi_text)
输出: tools/content/<id>.py        (ROUTE/ORDER/NEW/KM_OVERRIDE/POI)
      更新 tools/content/base_routes.json (追加/替换该线路条目, 含 GCJ-02 path)

spec 格式:
{
  "meta": {code,name,alias,color,from,to,km,kmNote,provinces[],days,season,
           seasonDetail,difficulty,difficultyText,tagline,highlights[],tips,
           navLabel,ring:false},
  "nodes": [{"name","prov","kind","role","desc", 可选"lat","lng"(WGS-84), 可选"km"}],
  "poi_text": "@节点|kind|tags|kv\\ncat|name|desc|k|season=..\\n..."
}

节点坐标: 优先用 spec 里的 lat/lng(WGS-84); 否则 Photon 地理编码(缓存)。
里程: 相邻节点 haversine 累积 -> KM_OVERRIDE; build 会把末点缩放到 meta.km。
用法: python tools/gen_route.py g318 [g317 ...]
"""
import json, os, sys, time, math, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(HERE, "content")
SPECS = os.path.join(HERE, "route_specs")
CACHE = os.path.join(HERE, "node_geo_cache.json")
sys.path.insert(0, HERE)
from build_data import wgs2gcj  # WGS-84 -> GCJ-02

UA = "Mozilla/5.0 (travel-map-route-gen; contact local)"


def hav(aLat, aLng, bLat, bLng):
    R, rad = 6371.0, math.pi / 180
    dLa, dLo = (bLat - aLat) * rad, (bLng - aLng) * rad
    s = math.sin(dLa / 2) ** 2 + math.cos(aLat * rad) * math.cos(bLat * rad) * math.sin(dLo / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(s), math.sqrt(1 - s))


def load_cache():
    if os.path.exists(CACHE):
        try:
            return json.load(open(CACHE, encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(c):
    json.dump(c, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)


def photon(q, limit=3):
    url = "https://photon.komoot.io/api/?" + urllib.parse.urlencode({"q": q, "limit": limit})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8")).get("features", [])


def geocode_node(name, prov, cache):
    """返回 (wlat, wlng, osmName, src)；src: spec/photon/cache/miss"""
    key = name + "|" + prov
    if key in cache:
        v = cache[key]
        if v.get("wlat") is not None:
            return v["wlat"], v["wlng"], v.get("osmName", ""), "cache"
    queries = []
    if prov and prov not in name:
        queries.append(name + " " + prov)
    queries.append(name)
    for suffix in ("县", "市", "区"):
        if not name.endswith(suffix):
            queries.append(name + suffix + (" " + prov if prov else ""))
    for q in queries:
        try:
            feats = photon(q)
        except Exception as e:
            print("    geo ERR %r: %s" % (q, e), flush=True)
            time.sleep(2)
            continue
        if feats:
            co = feats[0].get("geometry", {}).get("coordinates")
            prop = feats[0].get("properties", {})
            if co and len(co) >= 2:
                wlng, wlat = co[0], co[1]
                osm = prop.get("name") or ""
                cache[key] = {"wlat": wlat, "wlng": wlng, "osmName": osm, "q": q}
                save_cache(cache)
                time.sleep(0.35)
                return wlat, wlng, osm, "photon"
        time.sleep(0.35)
    cache[key] = {"wlat": None, "wlng": None, "osmName": "", "miss": True}
    save_cache(cache)
    return None, None, "", "miss"


def py_str(s):
    """把字符串安全地写进生成的 .py（用三引号原文块时不需转义，这里用于单行）"""
    return s


def build_route(rid):
    spec_path = os.path.join(SPECS, rid + ".json")
    if not os.path.exists(spec_path):
        print("!! 缺少 spec: %s" % spec_path)
        return False
    spec = json.load(open(spec_path, encoding="utf-8"))
    meta = spec["meta"]
    nodes = spec["nodes"]
    poi_text = spec.get("poi_text", "")
    cache = load_cache()

    if isinstance(poi_text, list):
        poi_text = "\n".join(poi_text)
    print("== %s (%s) 节点 %d ==" % (rid.upper(), meta.get("code", ""), len(nodes)))
    geo = []  # (name, prov, kind, wlat, wlng, role, desc)
    miss = []
    for n in nodes:
        name = n["name"].strip()
        prov = n.get("prov", "").strip()
        kind = n.get("kind", "county").strip()
        role = n.get("role", "").strip()
        desc = n.get("desc", "").strip()
        if n.get("lat") is not None and n.get("lng") is not None:
            wlat, wlng, osm, src = float(n["lat"]), float(n["lng"]), "(spec)", "spec"
        else:
            wlat, wlng, osm, src = geocode_node(name, prov, cache)
        if wlat is None:
            miss.append(name)
            print("  [MISS] %s %s -> 稍后插值" % (name, prov), flush=True)
        geo.append({"name": name, "prov": prov, "kind": kind, "role": role,
                    "desc": desc, "wlat": wlat, "wlng": wlng, "osm": osm, "src": src,
                    "km": n.get("km"), "alt": n.get("alt")})
    # 缺失坐标：在前后最近已知点之间线性插值，绝不丢节点
    if miss:
        n_tot = len(geo)
        for i, g in enumerate(geo):
            if g["wlat"] is not None:
                continue
            p = i - 1
            while p >= 0 and geo[p]["wlat"] is None:
                p -= 1
            q = i + 1
            while q < n_tot and geo[q]["wlat"] is None:
                q += 1
            if p >= 0 and q < n_tot:
                t = (i - p) / float(q - p)
                g["wlat"] = geo[p]["wlat"] + t * (geo[q]["wlat"] - geo[p]["wlat"])
                g["wlng"] = geo[p]["wlng"] + t * (geo[q]["wlng"] - geo[p]["wlng"])
            elif p >= 0:
                g["wlat"], g["wlng"] = geo[p]["wlat"], geo[p]["wlng"]
            elif q < n_tot:
                g["wlat"], g["wlng"] = geo[q]["wlat"], geo[q]["wlng"]
            g["src"] = "interp"
        print("  !! %d 个节点坐标缺失已插值（建议在 spec 补 lat/lng）: %s" % (len(miss), miss))
    # 累积里程（haversine, WGS-84）
    cum = 0.0
    for i, g in enumerate(geo):
        if i == 0:
            g["cum"] = 0.0
        else:
            cum += hav(geo[i - 1]["wlat"], geo[i - 1]["wlng"], g["wlat"], g["wlng"])
            g["cum"] = cum
    # 若 spec 指定了 km，用其覆盖（作为锚点）
    for g in geo:
        if g.get("km") is not None:
            g["cum"] = float(g["km"])
    total_hav = geo[-1]["cum"] if geo else 0
    print("  haversine 总长 %.0f km；声明 %s km" % (total_hav, meta.get("km")))

    # ---- 写 content/<id>.py ----
    order = ",".join(g["name"] for g in geo)
    new_lines = []
    for g in geo:
        line = "%s|%s|%s|%.5f|%.5f|%s|%s" % (
            g["name"], g["prov"], g["kind"], g["wlat"], g["wlng"], g["role"], g["desc"])
        if g.get("alt") is not None:
            line += "|alt=%d" % int(g["alt"])
        new_lines.append(line)
    kmo = {g["name"]: int(round(g["cum"])) for g in geo}
    kmo[geo[0]["name"]] = 0

    content = []
    content.append('# -*- coding: utf-8 -*-')
    content.append('"""%s %s 内容源（由 tools/gen_route.py 生成，可手工微调）"""' % (
        meta.get("code", rid.upper()), meta.get("name", "")))
    content.append("")
    content.append('ROUTE = "%s"' % rid)
    content.append("")
    content.append('ORDER = "%s"' % order)
    content.append("")
    content.append('NEW = r"""')
    content.extend(new_lines)
    content.append('"""')
    content.append("")
    content.append("KM_OVERRIDE = " + json.dumps(kmo, ensure_ascii=False))
    content.append("")
    content.append('POI = r"""')
    content.append(poi_text.rstrip("\n"))
    content.append('"""')
    content.append("")
    out_py = os.path.join(CONTENT, rid + ".py")
    with open(out_py, "w", encoding="utf-8") as f:
        f.write("\n".join(content))
    print("  写入 %s" % out_py)

    # ---- 更新 base_routes.json ----
    br_path = os.path.join(CONTENT, "base_routes.json")
    br = json.load(open(br_path, encoding="utf-8"))
    path_gcj = []
    for g in geo:
        glat, glng = wgs2gcj(g["wlat"], g["wlng"])
        path_gcj.append([round(glat, 5), round(glng, 5)])
    entry = dict(meta)
    entry["id"] = rid
    entry.setdefault("ring", False)
    entry["path"] = path_gcj
    # 保证字段顺序与现有一致（id 在最前）
    ordered_keys = ["id", "code", "name", "alias", "color", "from", "to", "km", "kmNote",
                    "provinces", "days", "season", "seasonDetail", "difficulty", "difficultyText",
                    "tagline", "highlights", "tips", "navLabel", "ring", "path"]
    entry2 = {}
    for k in ordered_keys:
        if k in entry:
            entry2[k] = entry[k]
    for k in entry:
        if k not in entry2:
            entry2[k] = entry[k]
    idx = next((i for i, x in enumerate(br) if x["id"] == rid), None)
    if idx is None:
        br.append(entry2)
    else:
        br[idx] = entry2
    with open(br_path, "w", encoding="utf-8") as f:
        json.dump(br, f, ensure_ascii=False)
    print("  更新 base_routes.json（%d 条）" % len(br))
    return True


def main():
    ids = sys.argv[1:]
    if not ids:
        print("用法: python tools/gen_route.py g318 [g317 ...]")
        return
    for rid in ids:
        build_route(rid)


if __name__ == "__main__":
    main()
