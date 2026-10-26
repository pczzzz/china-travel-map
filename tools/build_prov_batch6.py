# -*- coding: utf-8 -*-
"""生成 assets/js/prov_<id>.js：batch6 六省（北京/天津/上海/香港/澳门/台湾）分省路书数据。

输出格式与 tools/build_sichuan.py / build_prov_neighbors.py / build_prov_extra.py 完全一致
（window.PROV_DATA.<id>，WGS-84 -> GCJ-02）。

本批次的特殊性：
- 六个都是直辖市/特别行政区，没有地级市，CITIES 按「城区分组」组织
- cap 标记由内容文件里的 CAP 变量指定（城区 id），不再用省会名匹配
- 港澳台不适用 GCJ-02 偏移（当地地图本身即 WGS-84），NO_GCJ 集合内的省跳过转换
- 美食带图检测（fd_<prefix>_<NN>，图存在才写入 img 字段）
- assets/js/prov_batch6_index.js（window.PROV_BATCH6，六省索引卡片，不碰主站文件）

图片前缀 bj_/tj_/sh_/hk_/mo_/tw_ 均未被占用，与其他批次无冲突。

用法：
  python tools/build_prov_batch6.py                        # 构建全部六省 + 索引
  python tools/build_prov_batch6.py beijing tianjin        # 只构建指定省
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

# 本脚本负责的六个省级行政区（直辖市 + 港澳台），图片前缀 bj_/tj_/sh_/hk_/mo_/tw_ 均未被占用
PROVINCES = ["beijing", "tianjin", "shanghai", "hongkong", "macau", "taiwan"]

# 图片 slug 前缀
PREFIX = {"beijing": "bj_", "tianjin": "tj_", "shanghai": "sh_",
          "hongkong": "hk_", "macau": "mo_", "taiwan": "tw_"}
FOOD_PREFIX = {"beijing": "bj", "tianjin": "tj", "shanghai": "sh",
               "hongkong": "hk", "macau": "mo", "taiwan": "tw"}

ORDER = ["beijing", "tianjin", "shanghai", "hongkong", "macau", "taiwan"]

# 港澳台不实行 GCJ-02 偏移（当地官方与商用地图均为 WGS-84），跳过转换以免底图错位
NO_GCJ = {"hongkong", "macau", "taiwan"}


def have_img(slug):
    for ext in (".jpg", ".jpeg", ".webp", ".png"):
        if os.path.exists(os.path.join(IMAGES, slug + ext)):
            return "assets/images/" + slug + ext
    return ""


def parse_kv(tokens):
    """k=v 存字典；裸标记（free/key）置 True"""
    d = {}
    for t in tokens:
        if "=" in t:
            k, v = t.split("=", 1)
            d[k.strip()] = v.strip()
        elif t:
            d[t] = True
    return d


# 当前省份是否跳过 WGS-84 -> GCJ-02 偏移（港澳台不适用 GCJ-02）
SKIP_SHIFT = False


def gcj(lat, lng):
    la, ln = float(lat), float(lng)
    if not SKIP_SHIFT:
        la, ln = wgs2gcj(la, ln)
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
    global SKIP_SHIFT
    SKIP_SHIFT = pid in NO_GCJ
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
    cap_id = getattr(M, "CAP", None)          # 直辖市/特区用城区 id 指定中心
    for cid, name, lat, lng, role, desc in M.CITIES:
        la, ln = gcj(lat, lng)
        c = {"id": cid, "name": name, "lat": la, "lng": ln,
             "role": role, "desc": desc, "spots": city_spots.get(cid, [])}
        if cap_id is not None:
            if cid == cap_id:
                c["cap"] = True
        elif name == capital:
            c["cap"] = True
        cities.append(c)
    if not any(c.get("cap") for c in cities):
        raise SystemExit("[%s] 未标记 cap 城区（CAP=%r，capital=%r）" % (pid, cap_id, capital))

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
    # 直辖市/特别行政区没有“省会”，用 capLabel 覆盖前端默认文案
    if M.PROV.get("capLabel"):
        out["meta"]["capLabel"] = M.PROV["capLabel"]
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
    dst = os.path.join(ROOT, "assets", "js", "prov_batch6_index.js")
    js = ("window.PROV_BATCH6 = " + json.dumps(cards, ensure_ascii=False,
                                              separators=(",", ":")) + ";\n")
    io.open(dst, "w", encoding="utf-8").write(js)
    print("prov_batch6_index.js: %d 省 / %.1f KB" % (len(cards), len(js.encode("utf-8")) / 1024.0))


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
