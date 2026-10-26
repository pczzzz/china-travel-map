# -*- coding: utf-8 -*-
"""生成 assets/js/prov_<id>.js：四川周边七省分省路书数据（WGS-84 -> GCJ-02，带图检测）

与 tools/build_sichuan.py 输出格式完全一致（window.PROV_DATA.<id>），
但只处理本脚本 PROVINCES 列表中的省份，互不干扰。

用法：
  python tools/build_prov_neighbors.py                 # 构建全部七省 + 索引
  python tools/build_prov_neighbors.py yunnan guizhou  # 只构建指定省
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

# 本脚本负责的省份（四川由 build_sichuan.py 单独负责，勿加入）
PROVINCES = ["yunnan", "guizhou", "chongqing", "shaanxi", "gansu", "qinghai", "tibet"]

# 图片 slug 前缀
PREFIX = {"yunnan": "yn_", "guizhou": "gz_", "chongqing": "cq_", "shaanxi": "sx_",
          "gansu": "gs_", "qinghai": "qh_", "tibet": "xz_"}

# 索引排序（四川为中心，其余由南向北、由东向西）
ORDER = ["sichuan", "chongqing", "guizhou", "yunnan", "tibet", "qinghai", "gansu", "shaanxi"]


def have_img(slug):
    for ext in (".jpg", ".jpeg", ".webp", ".png"):
        if os.path.exists(os.path.join(IMAGES, slug + ext)):
            return "assets/images/" + slug + ext
    return ""


def parse_kv(tokens):
    """解析 spot 尾部 token：k=v 存入字典；裸标记（free/key）也置为 True。

    注：tools/build_sichuan.py 的同名函数只收 k=v，会丢掉 free/key 裸标记，
    导致四川模块的重点/免费标志全部未输出（已核对：prov_sichuan.js 中 "key":true 为 0，
    而 sichuan.py 里标了 17 个 key、6 个 free）。本脚本已修正，四川那份需单独修。
    """
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


def build_spots(M, prefix):
    spots = []
    seen = set()
    for line in M.SPOTS.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        p = [x.strip() for x in line.split("|")]
        if len(p) < 7:
            raise SystemExit("spot 字段不足 7 段: %r" % line[:60])
        sid, name, cat, city, lat, lng, desc = p[0], p[1], p[2], p[3], p[4], p[5], p[6]
        if sid in seen:
            raise SystemExit("spot id 重复: %s" % sid)
        seen.add(sid)
        if cat not in CATNAME:
            raise SystemExit("未知 cat: %s (%s)" % (cat, sid))
        extra = parse_kv(p[7:])
        img = extra.get("img") or (prefix + sid)
        sp = {
            "id": sid, "name": name, "cat": cat, "catName": CATNAME[cat],
            "city": city, "desc": desc, "img": have_img(img),
        }
        for k in ("elev", "diff", "time", "ticket", "season", "level"):
            if extra.get(k):
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
    prefix = PREFIX.get(pid, "")
    spots = build_spots(M, prefix)

    city_ids = {c[0] for c in M.CITIES}
    for sp in spots:
        if sp["city"] not in city_ids:
            raise SystemExit("[%s] spot %s 的 city=%s 不在 CITIES 中"
                             % (pid, sp["id"], sp["city"]))

    city_spots = {}
    for sp in spots:
        city_spots.setdefault(sp["city"], []).append(sp["id"])
    cities = []
    for cid, name, lat, lng, role, desc in M.CITIES:
        la, ln = gcj(lat, lng)
        c = {"id": cid, "name": name, "lat": la, "lng": ln,
             "role": role, "desc": desc, "spots": city_spots.get(cid, [])}
        if name == M.PROV.get("capital"):
            c["cap"] = True
        cities.append(c)

    foods = [{"name": n, "city": c, "desc": d} for n, c, d in M.FOODS]
    city_names = {c["id"]: c["name"] for c in cities}
    for f in foods:
        if f["city"] not in city_ids:
            raise SystemExit("[%s] food %s 的 city=%s 不在 CITIES 中"
                             % (pid, f["name"], f["city"]))
        f["cityName"] = city_names.get(f["city"], "")

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
    print("prov_%s.js: %d spots (%d 带图, %d 重点) / %d cities / %d foods / %d loops / %d tips / %.1f KB"
          % (pid, len(spots), nimg, nkey, len(cities), len(foods), len(loops),
             len(M.TIPS), len(js.encode("utf-8")) / 1024.0))
    return out


def write_index(cards):
    """assets/js/prov_neighbors_index.js —— 七省索引（不碰主站导航文件）"""
    dst = os.path.join(ROOT, "assets", "js", "prov_neighbors_index.js")
    js = ("window.PROV_NEIGHBORS = " + json.dumps(cards, ensure_ascii=False,
                                                 separators=(",", ":")) + ";\n")
    io.open(dst, "w", encoding="utf-8").write(js)
    print("prov_neighbors_index.js: %d 省 / %.1f KB" % (len(cards), len(js.encode("utf-8")) / 1024.0))


def main():
    want = sys.argv[1:] or PROVINCES
    built = {}
    for pid in PROVINCES:
        if pid not in want:
            continue
        built[pid] = build_one(pid)

    # 索引：包含四川（读取已生成的 prov_sichuan.js 或 content/sichuan.py）+ 本次七省
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
    write_index(cards)
    ntips = 0
    for c in cards:
        try:
            ntips += len(__import__(c["id"]).TIPS)
        except Exception:
            pass
    print("\n合计: %d 省 / %d 停靠点 / %d 城市 / %d 美食 / %d 环线 / %d 条贴士"
          % (len(cards), sum(c["nSpots"] for c in cards), sum(c["nCities"] for c in cards),
             sum(c["nFoods"] for c in cards), sum(c["nLoops"] for c in cards), ntips))


if __name__ == "__main__":
    main()
