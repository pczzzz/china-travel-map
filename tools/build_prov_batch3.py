# -*- coding: utf-8 -*-
"""生成 assets/js/prov_<id>.js：五个新省（新疆/山西/湖南/广西/福建）分省路书数据。

输出格式与 tools/build_sichuan.py / tools/build_prov_neighbors.py 完全一致
（window.PROV_DATA.<id>，WGS-84 -> GCJ-02），另加：
- 城市 cap 标记（省会）
- 美食带图检测（fd_<prefix>_<NN>，图存在才写入 img 字段）
- assets/js/prov_batch3_index.js（window.PROV_BATCH3，五省索引卡片，不碰主站文件）

用法：
  python tools/build_prov_extra.py                 # 构建全部五省 + 索引
  python tools/build_prov_extra.py xinjiang hunan  # 只构建指定省
"""
import io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "content"))
from build_data import wgs2gcj          # noqa: E402

IMAGES = os.path.join(ROOT, "assets", "images")
CATNAME = {"scenery": "景色", "mountain": "山岳·徒步", "culture": "人文",
           "food": "美食", "landmark": "地标", "museum": "博物馆"}

# 本脚本负责的五个新省（勿与 build_sichuan.py / build_prov_neighbors.py 重叠）
PROVINCES = ["heilongjiang", "jilin", "liaoning", "neimenggu", "guangdong"]

# 图片 slug 前缀（sxi_ 避开陕西已占用的 sx_）
PREFIX = {"heilongjiang": "hl_", "jilin": "jl_", "liaoning": "ln_", "neimenggu": "nm_", "guangdong": "gd_"}
FOOD_PREFIX = {"heilongjiang": "hl", "jilin": "jl", "liaoning": "ln", "neimenggu": "nm", "guangdong": "gd"}

ORDER = ["heilongjiang", "jilin", "liaoning", "neimenggu", "guangdong"]


def have_img(slug):
    for ext in (".jpg", ".jpeg", ".webp", ".png"):
        if os.path.exists(os.path.join(IMAGES, slug + ext)):
            return "assets/images/" + slug + ext
    return ""


def parse_kv(tokens):
    """k=v 存字典；裸标记（free/key）置 True（修正版，同 build_prov_neighbors.py）"""
    d = {}
    for t in tokens:
        if "=" in t:
            k, v = t.split("=", 1)
            d[k.strip()] = v.strip()
        elif t:
            d[t] = True
    return d


def gcj(lat, lng):
    la, ln = wgs2gcj(float(lat), float(lng))
    return round(la, 5), round(ln, 5)


def build_spots(M, prefix, pid):
    spots, seen = [], set()
    for line in M.SPOTS.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        p = [x.strip() for x in line.split("|")]
        if len(p) < 7:
            raise SystemExit("[%s] spot 字段不足 7 段: %r" % (pid, line[:60]))
        sid, name, cat, city, lat, lng, desc = p[0], p[1], p[2], p[3], p[4], p[5], p[6]
        if sid in seen:
            raise SystemExit("[%s] spot id 重复: %s" % (pid, sid))
        seen.add(sid)
        if cat not in CATNAME:
            raise SystemExit("[%s] 未知 cat: %s (%s)" % (pid, cat, sid))
        extra = parse_kv(p[7:])
        img = extra.get("img") or (prefix + sid)
        sp = {"id": sid, "name": name, "cat": cat, "catName": CATNAME[cat],
              "city": city, "desc": desc, "img": have_img(img)}
        for k in ("elev", "diff", "time", "ticket", "season", "level"):
            if extra.get(k) and extra[k] is not True:
                sp[k] = int(extra[k]) if k in ("elev", "diff") else extra[k]
        if extra.get("free"):
            sp["free"] = True
        if extra.get("key"):
            sp["key"] = True
        sp["lat"], sp["lng"] = gcj(lat, lng)
        if not (17.0 <= sp["lat"] <= 54.5 and 73.0 <= sp["lng"] <= 135.5):
            raise SystemExit("[%s] spot %s 坐标落在中国境外: %s,%s"
                             % (pid, sid, sp["lat"], sp["lng"]))
        spots.append(sp)
    return spots


def build_one(pid):
    M = __import__(pid)
    prefix = PREFIX[pid]
    spots = build_spots(M, prefix, pid)

    city_ids = {c[0] for c in M.CITIES}
    for sp in spots:
        if sp["city"] not in city_ids:
            raise SystemExit("[%s] spot %s 的 city=%s 不在 CITIES 中"
                             % (pid, sp["id"], sp["city"]))

    city_spots = {}
    for sp in spots:
        city_spots.setdefault(sp["city"], []).append(sp["id"])
    cities = []
    capital = M.PROV.get("capital")
    for cid, name, lat, lng, role, desc in M.CITIES:
        la, ln = gcj(lat, lng)
        c = {"id": cid, "name": name, "lat": la, "lng": ln,
             "role": role, "desc": desc, "spots": city_spots.get(cid, [])}
        if name == capital:
            c["cap"] = True
        cities.append(c)
    if not any(c.get("cap") for c in cities):
        raise SystemExit("[%s] 省会 %s 不在 CITIES 中" % (pid, capital))

    foods = []
    city_names = {c["id"]: c["name"] for c in cities}
    name2id = {c["name"]: c["id"] for c in cities}
    fpre = FOOD_PREFIX[pid]
    for i, (n, c, d) in enumerate(M.FOODS, 1):
        if c not in city_ids:
            c = name2id.get(c, c)          # 容错：内容源写了城市名而非 id
        if c not in city_ids:
            raise SystemExit("[%s] food %s 的 city=%s 不在 CITIES 中" % (pid, n, c))
        f = {"name": n, "city": c, "cityName": city_names.get(c, ""), "desc": d}
        fi = have_img("fd_%s_%02d" % (fpre, i))
        if fi:
            f["img"] = fi
        foods.append(f)

    loops = []
    for lp in M.LOOPS:
        pts = []
        for wid in lp["ids"].split(","):
            wid = wid.strip()
            wp = M.WAYPOINTS.get(wid)
            if not wp:
                raise SystemExit("[%s] loop 途径点缺失: %s (%s)" % (pid, wid, lp["name"]))
            la, ln = gcj(wp[1], wp[2])
            pts.append([la, ln, wp[0]])
        item = {k: lp[k] for k in ("name", "days", "km", "desc", "path", "note")}
        item["pts"] = pts
        loops.append(item)

    out = {
        "meta": {k: M.PROV[k] for k in ("id", "name", "en", "capital", "tagline",
                                        "geoTitle", "geoSub",
                                        "intro", "facts", "regions")},
        "cities": cities, "spots": spots, "foods": foods, "loops": loops, "tips": M.TIPS,
    }
    dst = os.path.join(ROOT, "assets", "js", "prov_%s.js" % pid)
    js = ("window.PROV_DATA = window.PROV_DATA || {};\nPROV_DATA.%s = " % pid
          + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    io.open(dst, "w", encoding="utf-8").write(js)
    nimg = sum(1 for s in spots if s["img"])
    nkey = sum(1 for s in spots if s.get("key"))
    nfoodimg = sum(1 for f in foods if f.get("img"))
    print("prov_%s.js: %d spots (%d 带图, %d 重点) / %d cities / %d foods (%d 带图) / %d loops / %.1f KB"
          % (pid, len(spots), nimg, nkey, len(cities), len(foods), nfoodimg,
             len(loops), len(js.encode("utf-8")) / 1024.0))
    return out


def write_index(cards):
    dst = os.path.join(ROOT, "assets", "js", "prov_batch3_index.js")
    js = ("window.PROV_BATCH3 = " + json.dumps(cards, ensure_ascii=False,
                                              separators=(",", ":")) + ";\n")
    io.open(dst, "w", encoding="utf-8").write(js)
    print("prov_batch3_index.js: %d 省 / %.1f KB" % (len(cards), len(js.encode("utf-8")) / 1024.0))


def main():
    want = sys.argv[1:] or PROVINCES
    built = {}
    for pid in PROVINCES:
        if pid not in want:
            continue
        built[pid] = build_one(pid)

    cards = []
    for pid in ORDER:
        d = built.get(pid)
        if d is None:
            p = os.path.join(ROOT, "assets", "js", "prov_%s.js" % pid)
            if os.path.exists(p):
                t = io.open(p, encoding="utf-8").read()
                t = t.split("=", 2)[-1].strip().rstrip(";").strip()
                try:
                    d = json.loads(t)
                except Exception:
                    d = None
        if d is None:
            continue
        m = d["meta"]
        cover = ""
        for s in d["spots"]:
            if s.get("key") and s.get("img"):
                cover = s["img"]
                break
        if not cover:
            for s in d["spots"]:
                if s.get("img"):
                    cover = s["img"]
                    break
        cards.append({
            "id": m["id"], "name": m["name"], "en": m["en"], "capital": m["capital"],
            "tagline": m["tagline"], "cover": cover,
            "nCities": len(d["cities"]), "nSpots": len(d["spots"]),
            "nFoods": len(d["foods"]), "nLoops": len(d["loops"]),
            "nImg": sum(1 for s in d["spots"] if s.get("img")),
            "nKey": sum(1 for s in d["spots"] if s.get("key")),
            "regions": [r[0] for r in m["regions"]],
            "lat": d["cities"][0]["lat"], "lng": d["cities"][0]["lng"],
        })
    if cards:
        write_index(cards)
    print("合计: %d 省 / %d 停靠点 / %d 城市 / %d 美食 / %d 环线"
          % (len(cards), sum(c["nSpots"] for c in cards), sum(c["nCities"] for c in cards),
             sum(c["nFoods"] for c in cards), sum(c["nLoops"] for c in cards)))


if __name__ == "__main__":
    main()
