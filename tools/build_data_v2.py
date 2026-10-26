# -*- coding: utf-8 -*-
"""环中国 v2 数据构建脚本
读取: tools/content/base_{routes,cities,spots}.json + tools/content/g{331,219,228}.py
输出: assets/js/data.js   (window.ROAD_DATA: meta/routes/nodes/pois)
      tools/jobs.json     (待抓取配图任务)
校验: 节点顺序完整性、旧景点/旧配图复用率、里程单调性
"""
import json, os, re, sys, importlib.util, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(HERE, "content")
IMAGES = os.path.join(ROOT, "assets", "images")

sys.path.insert(0, HERE)
from build_data import wgs2gcj  # 复用 WGS-84 -> GCJ-02

CATS = [("scenery", "景色"), ("mountain", "山岳·徒步"), ("culture", "人文"),
        ("food", "美食"), ("landmark", "地标"), ("museum", "博物馆")]
CAT_NAME = dict(CATS)
CAT_ICON = {"scenery": "▲", "mountain": "⛰", "culture": "文", "food": "食",
            "landmark": "◉", "museum": "馆"}
KIND_NAME = {"city": "地级市", "county": "县/县级市", "district": "市辖区",
             "town": "乡镇", "pass": "垭口/口岸", "scenic": "景区节点"}

# 补给紧张度：0 充足 / 1 一般 / 2 紧张 / 3 极缺（前端「补给提醒」按此统计）
def fuel_level(kv):
    if kv.get("fuelLevel"):
        try:
            return max(0, min(3, int(kv["fuelLevel"])))
        except (ValueError, TypeError):
            pass
    f = (kv.get("fuel") or "")
    if any(w in f for w in ("极缺", "无站", "无油站", "无补给", "没有油站", "缺油")):
        return 3
    if any(w in f for w in ("紧张", "稀少", "补满", "备用油", "提前", "限量", "波动", "需登记")):
        return 2
    if any(w in f for w in ("镇上有站", "驿站有站", "乡上有站", "少量", "较少")):
        return 1
    return 0

# 旧图 slug 与内容文件的 img= 语义对齐修正（避免"张冠李戴"复用）
SLUG_FIX = {}


def load_json(name):
    with open(os.path.join(CONTENT, name), encoding="utf-8") as f:
        return json.load(f)


def load_module(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(CONTENT, name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def parse_kv(tokens):
    """把 ['k','img=abc','season=6-9月','diff=3'] 解析成 (flags, kv)"""
    flags, kv = set(), {}
    for t in tokens:
        t = t.strip()
        if not t:
            continue
        if "=" in t:
            k, v = t.split("=", 1)
            kv[k.strip()] = v.strip()
        else:
            flags.add(t)
    return flags, kv


def parse_new(block):
    out = {}
    for line in block.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split("|")]
        name, prov, kind, lat, lng, role, desc = parts[:7]
        flags, kv = parse_kv(parts[7:])
        out[name] = {"prov": prov, "kind": kind, "lat": float(lat), "lng": float(lng),
                     "role": role, "desc": desc, "km": int(kv["km"]) if "km" in kv else None,
                     "detour": 1 if kv.get("detour") == "1" else 0,
                     "alt": int(kv["alt"]) if kv.get("alt", "").lstrip("-").isdigit() else None}
    return out


def parse_poi(block, valid_nodes):
    """返回 {node_name: {"kind":..,"tags":[..],"kv":{..}, "pois":[...]}}"""
    nodes = collections.OrderedDict()
    cur = None
    for raw in block.strip().splitlines():
        line = raw.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if parts[0].startswith("@"):
            nm = parts[0][1:]
            if nm not in valid_nodes:
                print("  [warn] POI 头指向不存在的节点:", nm)
                cur = None
                continue
            kind = parts[1] if len(parts) > 1 else ""
            tags = [t for t in parts[2].split(",") if t] if len(parts) > 2 else []
            flags, kv = parse_kv(parts[3:])
            cur = {"kind": kind, "tags": tags, "kv": kv, "pois": []}
            nodes[nm] = cur
            continue
        if cur is None:
            continue
        cat = parts[0]
        if cat not in CAT_NAME:
            print("  [warn] 未知 POI 分类 %r in %s" % (cat, line[:30]))
            continue
        nm, desc = parts[1], parts[2] if len(parts) > 2 else ""
        flags, kv = parse_kv(parts[3:])
        cur["pois"].append({"cat": cat, "name": nm, "desc": desc,
                            "key": 1 if "k" in flags else 0,
                            "detour": 1 if "det" in flags else 0,
                            "free": 1 if "free" in flags else 0,
                            "border": 1 if "border" in flags else 0,
                            "kv": kv})
    return nodes


def lcs_len(a, b):
    """最长公共子串长度"""
    if not a or not b:
        return 0
    prev = [0] * (len(b) + 1)
    best = 0
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1] + 1
                if cur[j] > best:
                    best = cur[j]
        prev = cur
    return best


def match_old_spot(pname, nname, candidates):
    """在同线路旧景点中找最匹配项：最长公共子串>=4，或旧景点 city 与本节点同名"""
    best, bs = None, 0
    for o in candidates:
        l = lcs_len(o["name"], pname)
        same_city = (o.get("city") == nname)
        if l >= 4 or (same_city and l >= 2):
            score = l + (5 if same_city else 0)
            if score > bs:
                best, bs = o, score
    return best


def have_img(slug):
    for ext in (".jpg", ".jpeg", ".webp", ".png"):
        if os.path.exists(os.path.join(IMAGES, slug + ext)):
            return "assets/images/" + slug + ext
    return None


# ---- 挂载点真坐标匹配（地名词典，由 tools/gen_gazetteer.py 生成） ----
import math as _math
GAZ = {"spots": [], "adm": []}
_gaz_path = os.path.join(HERE, "geo_gazetteer.json")
if os.path.exists(_gaz_path):
    GAZ = json.load(open(_gaz_path, encoding="utf-8"))
GAZ_SPOTS = [(s[0], s) for s in GAZ.get("spots", [])]
GAZ_ADM = {}
for _a in GAZ.get("adm", []):
    GAZ_ADM.setdefault(_a[0], _a)

# Photon 地理编码结果（最高优先，由 tools/geocode_scatter.py 生成）
GEO_EXTRA = {}
_ge_path = os.path.join(HERE, "geo_extra.json")
if os.path.exists(_ge_path):
    GEO_EXTRA = {k: v for k, v in json.load(open(_ge_path, encoding="utf-8")).items() if v.get("lat")}


def _hav(aLat, aLng, bLat, bLng):
    R = 6371.0
    rad = _math.pi / 180
    dLa = (bLat - aLat) * rad
    dLo = (bLng - aLng) * rad
    s = _math.sin(dLa / 2) ** 2 + _math.cos(aLat * rad) * _math.cos(bLat * rad) * _math.sin(dLo / 2) ** 2
    return R * 2 * _math.atan2(_math.sqrt(s), _math.sqrt(1 - s))


def match_gaz(name, prov, nlat, nlng):
    """返回 (lat, lng, src, refname) 或 None；src: spot=景点真坐标 / adm=城区驻地"""
    norm = re.sub(r"[（(].*?[)）]", "", name or "").replace(" ", "")
    bases = [norm] + [x for x in norm.split("·") if x and x != norm]
    best = None
    for b in bases:
        for sn, s in GAZ_SPOTS:
            if sn == b or (len(sn) >= 4 and len(b) >= 4 and (sn in b or b in sn)):
                d = _hav(nlat, nlng, s[1], s[2])
                if (s[3] == prov or d < 120) and (best is None or d < best[0]):
                    best = (d, s[1], s[2], "spot", sn)
        if best:
            break
    if best:
        return best[1], best[2], best[3], best[4]
    for b in bases:
        for L in (4, 3, 2):
            a = GAZ_ADM.get(b[:L])
            if a:
                d = _hav(nlat, nlng, a[1], a[2])
                if a[3] == prov or d < 300:
                    return a[1], a[2], "adm", a[0]
    return None


def _jit(name, lat, lng):
    h = int(__import__("hashlib").md5(name.encode("utf-8")).hexdigest()[:8], 16)
    dx = ((h % 1000) / 1000.0 - 0.5) * 0.010
    dy = (((h >> 10) % 1000) / 1000.0 - 0.5) * 0.010
    return round(lat + dy, 5), round(lng + dx / max(0.2, _math.cos(_math.radians(lat))), 5)


def main():
    base_routes = load_json("base_routes.json")
    base_cities = load_json("base_cities.json")
    base_spots = load_json("base_spots.json")

    # 旧景点索引: (route, name) -> spot
    old_spot = {(s["route"], s["name"]): s for s in base_spots}
    old_by_route = collections.defaultdict(list)
    for s in base_spots:
        old_by_route[s["route"]].append(s)
    # slug -> 旧景点（全局），用于按配图继承真实坐标
    slug2spot = {}
    for sp in base_spots:
        if sp.get("img"):
            slug2spot.setdefault(re.sub(r"\.(jpe?g|png|webp)$", "", sp["img"]), sp)
    used_old = set()

    bc = {}
    for c in base_cities:
        bc[(c["route"], c["name"])] = c

    routes_out, nodes_out, pois_out, jobs = [], [], [], []
    stats = []

    # 数据驱动：按 base_routes 顺序，凡 content/<id>.py 存在的路线都编译。
    # base_routes 里 ring=True 的为“环中国黄金大外环”三线；其余为独立“知名国道”。
    route_ids = [b["id"] for b in base_routes
                 if os.path.exists(os.path.join(CONTENT, b["id"] + ".py"))]
    for rid in route_ids:
        mod = load_module(rid)
        order = [x.strip() for x in mod.ORDER.split(",") if x.strip()]
        new = parse_new(mod.NEW)
        kmo = getattr(mod, "KM_OVERRIDE", {})
        valid = set(order)
        pmap = parse_poi(mod.POI, valid)

        # 旧数据里的节点未出现在 ORDER 中 -> 报告
        missing = [n for (r, n) in bc if r == rid and n not in valid]
        if missing:
            print("  [%s] ORDER 缺少旧节点: %s" % (rid, missing))
        for n in new:
            if n not in valid:
                print("  [%s] NEW 中 %s 不在 ORDER" % (rid, n))

        # ---- 里程: 以旧节点为锚点，新节点在锚点间线性插值 ----
        anchors = []  # (idx, km)
        for i, nm in enumerate(order):
            if nm in kmo:
                anchors.append((i, kmo[nm]))
            elif (rid, nm) in bc:
                anchors.append((i, bc[(rid, nm)]["km"]))
            elif new.get(nm, {}).get("km") is not None:
                anchors.append((i, new[nm]["km"]))
        anchors.sort()
        km_of = {}
        ai = 0
        for i, nm in enumerate(order):
            while ai < len(anchors) - 1 and anchors[ai + 1][0] <= i:
                ai += 1
            if ai + 1 < len(anchors) and anchors[ai][0] != anchors[ai + 1][0]:
                (i0, k0), (i1, k1) = anchors[ai], anchors[ai + 1]
                if i0 <= i <= i1:
                    km_of[nm] = k0 if i == i0 else (k1 if i == i1 else int(round(k0 + (k1 - k0) * (i - i0) / (i1 - i0))))
                    continue
            km_of[nm] = anchors[min(ai, len(anchors) - 1)][1]
        # 强制单调不减
        prev = 0
        for nm in order:
            if km_of[nm] < prev:
                km_of[nm] = prev
            prev = km_of[nm]

        # 端点对齐：末点里程按比例对齐线路公布里程，避免站点表与头部数字不一致
        declared = [x for x in base_routes if x["id"] == rid][0]["km"]
        last = km_of[order[-1]]
        if declared and last and last != declared:
            f = declared / float(last)
            for nm in order:
                km_of[nm] = int(round(km_of[nm] * f))
            prev = 0
            for nm in order:
                if km_of[nm] < prev:
                    km_of[nm] = prev
                prev = km_of[nm]

        # ---- 节点 ----
        route_nodes = []
        for i, nm in enumerate(order):
            meta = pmap.get(nm, {"kind": "", "tags": [], "kv": {}, "pois": []})
            if nm in new:
                n = new[nm]
                prov, kind, lat, lng = n["prov"], n["kind"], n["lat"], n["lng"]
                role, desc, detour = n["role"], n["desc"], n["detour"]
                alt = None
                # 海拔：取最近旧锚点均值
                nb = [bc[(rid, x)]["alt"] for x in order if (rid, x) in bc and bc[(rid, x)].get("alt")]
                alt = int(round(sum(nb) / len(nb))) if nb else None
                if n.get("alt") is not None:
                    alt = int(n["alt"])
            else:
                c = bc[(rid, nm)]
                prov, lat, lng = c["prov"], c["lat"], c["lng"]
                role, desc = c["role"], c["desc"]
                alt = c.get("alt")
                detour = 0
                kind = meta["kind"] or ("city" if ("市" in role or i == 0) else "county")
            if meta.get("kind"):
                kind = meta["kind"]
            gla, gln = wgs2gcj(lat, lng)
            nid = "%s:%d" % (rid, i)
            node = {
                "id": nid, "route": rid, "idx": i, "name": nm, "prov": prov,
                "kind": kind, "kindName": KIND_NAME.get(kind, kind),
                "lat": round(gla, 5), "lng": round(gln, 5),
                "wlat": round(lat, 5), "wlng": round(lng, 5),
                "km": km_of.get(nm, 0), "alt": alt, "role": role, "desc": desc,
                "tags": meta["tags"], "detour": detour,
                "stay": meta["kv"].get("stay"), "best": meta["kv"].get("best"),
                "fuel": meta["kv"].get("fuel"), "fuelLevel": fuel_level(meta["kv"]),
                "border": 1 if meta["kv"].get("border") else 0,
                "img": None, "poi": collections.OrderedDict(), "count": 0,
            }

            # ---- 挂载点 ----
            ring = 0
            for p in meta["pois"]:
                kv = p["kv"]
                scatter = False
                slug = SLUG_FIX.get((rid, p["name"]), kv.get("img"))
                if slug:
                    slug = re.sub(r"\.(jpe?g|png|webp)$", "", slug)   # 旧数据 img 带扩展名
                # 1) 复用旧景点坐标与配图（精确名 -> LCS/同城 -> 同图 slug）
                old = old_spot.get((rid, p["name"]))
                if old is None:
                    old = match_old_spot(p["name"], nm, old_by_route[rid])
                if old is None and slug and slug in slug2spot:
                    old = slug2spot[slug]   # 跨线路同图（如虎山长城记在 g228 丹东）
                if old is not None:
                    used_old.add((rid, old["name"]))
                    pl, pn = old["lat"], old["lng"]          # 旧数据 lat/lng 已是 GCJ-02
                    pwlat, pwlng = old["wlat"], old["wlng"]
                    slug = slug or re.sub(r"\.(jpe?g|png|webp)$", "", old.get("img") or "") or None
                    if not kv.get("season") and old.get("season"):
                        kv["season"] = old["season"]
                    if old.get("detour"):
                        p["detour"] = 1
                else:
                    gz = None
                    gx = GEO_EXTRA.get(p["name"] + "@" + nm)
                    if gx:
                        gz = (gx["lat"], gx["lng"], "photon", p["name"])
                    else:
                        gz = match_gaz(p["name"], prov, node["lat"], node["lng"])
                    if gz is None and p["cat"] == "food":
                        gz = (node["lat"], node["lng"], "node", nm)
                    if gz:
                        pl, pn = _jit(p["name"], gz[0], gz[1])
                        pwlat, pwlng = None, None
                        scatter = False
                        geosrc = gz[2]
                    else:
                        # 2) 环绕节点分布，避免重叠（GCJ-02 偏移量，约 0.02°≈2km）
                        ang = ring * (2 * _math.pi / 6.0)
                        ring += 1
                        r = 0.022
                        pl = round(node["lat"] + r * _math.sin(ang), 5)
                        pn = round(node["lng"] + r * _math.cos(ang) / max(0.2, _math.cos(_math.radians(node["lat"]))), 5)
                        pwlat, pwlng = None, None
                        scatter = True
                        geosrc = None
                img = have_img(slug) if slug else None
                if slug and not img and not any(j["slug"] == slug for j in jobs):
                    pn_clean = re.sub(r"[（(].*?[)）]", "", p["name"]).split("·")[0].strip()
                    jobs.append({"q": "%s %s 实景" % (pn_clean, nm),
                                 "slug": slug, "route": rid, "node": nm, "cat": p["cat"]})
                aslug = "auto_" + ("%s_p%d" % (nid, node["count"])).replace(":", "_")
                if not img:
                    img = have_img(aslug)
                if not img and not slug and not any(j["slug"] == aslug for j in jobs):
                    pn_clean2 = re.sub(r"[（(].*?[)）]", "", p["name"]).split("·")[0].strip()
                    jobs.append({"q": "%s %s %s 实景" % (pn_clean2, nm, CAT_NAME[p["cat"]]),
                                 "slug": aslug, "route": rid, "node": nm, "cat": p["cat"]})
                pid = len(pois_out)
                po = {
                    "id": "%s:p%d" % (nid, node["count"]),
                    "route": rid, "node": nid, "nodeName": nm, "prov": prov,
                    "cat": p["cat"], "catName": CAT_NAME[p["cat"]], "icon": CAT_ICON[p["cat"]],
                    "name": p["name"], "desc": p["desc"], "img": img, "slug": slug,
                    "lat": pl, "lng": pn, "key": p["key"], "detour": p["detour"],
                    "scatter": scatter, "geo": geosrc,
                    "free": p["free"], "border": p["border"],
                    "season": kv.get("season"), "ticket": kv.get("ticket"),
                    "elev": int(kv["elev"]) if kv.get("elev", "").isdigit() else None,
                    "diff": int(kv["diff"]) if kv.get("diff", "").isdigit() else None,
                    "time": kv.get("time"), "guide": 1 if kv.get("guide") else 0,
                    "km": node["km"],
                }
                if pwlat is not None:
                    po["wlat"], po["wlng"] = pwlat, pwlng
                node["poi"].setdefault(p["cat"], []).append(pid)
                node["count"] += 1
                pois_out.append(po)

            if any(pois_out[pid]["border"] for cat in node["poi"] for pid in node["poi"][cat]):
                node["border"] = 1

            # 封面图: 优先有图的 key POI
            for cat, _ in CATS:
                for pid in node["poi"].get(cat, []):
                    if pois_out[pid]["img"] and pois_out[pid]["key"]:
                        node["img"] = pois_out[pid]["img"]
                        break
                if node["img"]:
                    break
            if not node["img"]:
                for cat, _ in CATS:
                    for pid in node["poi"].get(cat, []):
                        if pois_out[pid]["img"]:
                            node["img"] = pois_out[pid]["img"]
                            break
                    if node["img"]:
                        break
            if not node["img"]:
                na = "auto_n_" + nid.replace(":", "_")
                ni = have_img(na)
                if ni:
                    node["img"] = ni
                elif not any(j["slug"] == na for j in jobs):
                    jobs.append({"q": "%s %s 城市 地标 风光" % (nm, prov),
                                 "slug": na, "route": rid, "node": nm, "cat": "node"})
            route_nodes.append(node)
            nodes_out.append(node)

        # ---- 线路 ----
        r = dict(base_routes[[x["id"] for x in base_routes].index(rid)])
        cat_count = collections.Counter(p["cat"] for p in pois_out if p["route"] == rid)
        r["nodeCount"] = len(route_nodes)
        r["poiCount"] = sum(cat_count.values())
        r["catCount"] = dict(cat_count)
        r["imgCount"] = len([p for p in pois_out if p["route"] == rid and p["img"]])
        r["nodeIds"] = [n["id"] for n in route_nodes]
        r["sections"] = []
        for n in route_nodes:
            if not r["sections"] or r["sections"][-1]["prov"] != n["prov"]:
                r["sections"].append({"prov": n["prov"], "ids": []})
            r["sections"][-1]["ids"].append(n["id"])
        routes_out.append(r)
        stats.append((rid, len(route_nodes), sum(cat_count.values()), dict(cat_count)))

    # 区分环线（环中国黄金大外环）与知名国道（独立长线）
    for r in routes_out:
        r.setdefault("ring", r["id"] in ("g331", "g219", "g228"))
    ring_routes = [r for r in routes_out if r.get("ring")]
    famous_routes = [r for r in routes_out if not r.get("ring")]

    meta = {
        "title": "环中国 · 黄金大外环路书",
        "subtitle": "G331 北境线 + G219 新藏线 + G228 滨海线，三条国道首尾相接绕中国一圈",
        "totalKm": 27198 if {r["id"] for r in ring_routes} == {"g331", "g219", "g228"} else sum(r.get("km", 0) for r in ring_routes),
        "allKm": sum(r.get("km", 0) for r in routes_out),
        "ringIds": [r["id"] for r in ring_routes],
        "famousIds": [r["id"] for r in famous_routes],
        "routeCount": len(routes_out),
        "nodeCount": len(nodes_out),
        "poiCount": len(pois_out),
        "crs": "GCJ-02（与高德瓦片、阿里 DataV 边界一致）；节点另存 WGS-84 于 wlat/wlng",
        "cats": [{"id": c, "name": n, "icon": CAT_ICON[c]} for c, n in CATS],
        "kinds": [{"id": k, "name": v} for k, v in KIND_NAME.items()],
        "kmNote": "里程为公开资料估算值，页面统一标注“约”",
        "builtAt": "",
        "version": "2.0",
    }
    import datetime
    meta["builtAt"] = datetime.date.today().isoformat()

    data = {"meta": meta, "routes": routes_out, "nodes": nodes_out, "pois": pois_out}
    out = os.path.join(ROOT, "assets", "js", "data.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write("// 环中国·黄金大外环 v2 数据（由 tools/build_data_v2.py 生成，勿手改）\n")
        f.write("// 结构: meta / routes / nodes(树) / pois(扁平) ；坐标 GCJ-02\n")
        f.write("window.ROAD_DATA = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    with open(os.path.join(HERE, "jobs.json"), "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=1)

    # ---- 报告 ----
    print("\n== 构建报告 ==")
    for rid, n, p, cc in stats:
        print("  %s: 节点 %d, 挂载点 %d, 分类 %s" % (rid.upper(), n, p, cc))
    print("  合计节点 %d / 挂载点 %d" % (len(nodes_out), len(pois_out)))
    print("  已有配图 %d 张, 待抓取 %d 张" % (len([p for p in pois_out if p["img"]]), len(jobs)))
    unused_old = [(r, n) for (r, n) in old_spot if (r, n) not in used_old]
    print("  旧景点未复用 %d: %s" % (len(unused_old), unused_old[:12]))
    # 里程单调性
    for r in routes_out:
        kms = [n["km"] for n in nodes_out if n["route"] == r["id"]]
        bad = [i for i in range(1, len(kms)) if kms[i] < kms[i - 1]]
        print("  %s 里程单调: %s (%d→%d)" % (r["id"], "OK" if not bad else "FAIL@%s" % bad, kms[0], kms[-1]))
    print("  data.js 大小: %.0f KB" % (os.path.getsize(out) / 1024))


if __name__ == "__main__":
    main()
