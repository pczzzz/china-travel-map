# -*- coding: utf-8 -*-
"""生成 assets/js/prov_sichuan.js：四川分省路书数据（WGS-84 -> GCJ-02，带图检测）"""
import io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "content"))
from build_data import wgs2gcj          # noqa: E402
import sichuan as SC                     # noqa: E402

IMAGES = os.path.join(ROOT, "assets", "images")
CATNAME = {"scenery": "景色", "mountain": "山岳·徒步", "culture": "人文",
           "food": "美食", "landmark": "地标", "museum": "博物馆"}


def have_img(slug):
    for ext in (".jpg", ".jpeg", ".webp", ".png"):
        if os.path.exists(os.path.join(IMAGES, slug + ext)):
            return "assets/images/" + slug + ext
    return ""


def parse_kv(tokens):
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


def main():
    spots = []
    for line in SC.SPOTS.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        p = [x.strip() for x in line.split("|")]
        sid, name, cat, city, lat, lng, desc = p[0], p[1], p[2], p[3], p[4], p[5], p[6]
        extra = parse_kv(p[7:])
        img = extra.get("img") or ("sc_" + sid)
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
        spots.append(sp)

    city_spots = {}
    for sp in spots:
        city_spots.setdefault(sp["city"], []).append(sp["id"])
    cities = []
    for cid, name, lat, lng, role, desc in SC.CITIES:
        la, ln = gcj(lat, lng)
        c = {"id": cid, "name": name, "lat": la, "lng": ln,
             "role": role, "desc": desc, "spots": city_spots.get(cid, [])}
        if name == SC.PROV.get("capital"):
            c["cap"] = True
        cities.append(c)

    foods = []
    for i, (n, c, d) in enumerate(SC.FOODS, 1):
        f = {"name": n, "city": c, "desc": d}
        fi = have_img("fd_sc_%02d" % i)
        if fi:
            f["img"] = fi
        foods.append(f)

    loops = []
    for lp in SC.LOOPS:
        pts = []
        for pid in lp["ids"].split(","):
            pid = pid.strip()
            wp = SC.WAYPOINTS.get(pid)
            if not wp:
                raise SystemExit("loop 途径点缺失: %s (%s)" % (pid, lp["name"]))
            la, ln = gcj(wp[1], wp[2])
            pts.append([la, ln, wp[0]])
        loops.append({k: lp[k] for k in ("name", "days", "km", "desc", "path", "note")} | {"pts": pts})

    city_names = {c["id"]: c["name"] for c in cities}
    for f in foods:
        f["cityName"] = city_names.get(f["city"], "")

    out = {
        "meta": {k: SC.PROV[k] for k in ("id", "name", "en", "capital", "tagline",
                                         "intro", "facts", "regions")},
        "cities": cities, "spots": spots, "foods": foods, "loops": loops, "tips": SC.TIPS,
    }
    dst = os.path.join(ROOT, "assets", "js", "prov_sichuan.js")
    js = ("window.PROV_DATA = window.PROV_DATA || {};\nPROV_DATA.sichuan = "
          + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    io.open(dst, "w", encoding="utf-8").write(js)
    nimg = sum(1 for s in spots if s["img"])
    print("prov_sichuan.js: %d spots (%d 带图) / %d cities / %d foods / %d loops / %.1f KB"
          % (len(spots), nimg, len(cities), len(foods), len(loops), len(js.encode("utf-8")) / 1024.0))


if __name__ == "__main__":
    main()
