# -*- coding: utf-8 -*-
"""
把 tools/content/features/<省 id>.json 注入 assets/js/prov_<省 id>.js 的 features 字段。

用法：
  python tools/build_features.py                 # 注入全部已存在的特色内容文件
  python tools/build_features.py guizhou yunnan  # 只注入指定省份
  python tools/build_features.py --check         # 只校验不写入
可重复执行（覆盖旧 features 字段），不改动其余任何数据。
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "assets", "js")
SRC = os.path.join(ROOT, "tools", "content", "features")

ICON_HINT = "icon 必须是 1 个字符（汉字或符号），用于分组标题左侧色块"


def load_js(pid):
    p = os.path.join(JS, "prov_%s.js" % pid)
    if not os.path.exists(p):
        return None, None, None, p
    txt = open(p, encoding="utf-8").read()
    m = re.search(r'PROV_DATA\.%s\s*=\s*' % pid, txt)
    if not m:
        raise SystemExit("[FAIL] %s 找不到 PROV_DATA.%s 赋值语句" % (p, pid))
    head, body = txt[:m.end()], txt[m.end():]
    body = body.rstrip()
    assert body.endswith(";"), "数据体不以 ; 结尾: %s" % p
    data = json.loads(body[:-1])
    return p, head, data, body


def validate(pid, feat, spot_ids):
    """返回 (errors, warns)"""
    err, warn = [], []
    if not isinstance(feat, dict):
        return ["顶层必须是对象"], warn
    groups = feat.get("groups")
    if not isinstance(groups, list) or not groups:
        return ["缺少 groups 数组"], warn
    if len(groups) < 3:
        err.append("groups 只有 %d 个，至少 3 个主题" % len(groups))
    if len(groups) > 7:
        err.append("groups 有 %d 个，最多 7 个主题" % len(groups))
    intro = feat.get("intro", "")
    if not intro:
        warn.append("缺 intro（模块导语）")
    elif len(intro) < 30:
        warn.append("intro 偏短（%d 字）" % len(intro))
    total = 0
    for gi, g in enumerate(groups):
        tag0 = "group[%d]" % gi
        if not g.get("name"):
            err.append(tag0 + " 缺 name")
        icon = g.get("icon", "")
        if not icon or len(str(icon)) != 1:
            err.append("%s icon 非法(%r)：%s" % (tag0, icon, ICON_HINT))
        color = g.get("color")
        if color and not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(color)):
            err.append("%s color 必须是 #RRGGBB，当前 %r" % (tag0, color))
        items = g.get("items") or []
        if len(items) < 2:
            err.append("%s(%s) 只有 %d 条，至少 2 条" % (tag0, g.get("name"), len(items)))
        if len(items) > 6:
            warn.append("%s(%s) 有 %d 条，建议不超过 6 条" % (tag0, g.get("name"), len(items)))
        for ii, it in enumerate(items):
            t = "%s.%s item[%d]" % (tag0, g.get("name"), ii)
            if not it.get("name"):
                err.append(t + " 缺 name")
            text = it.get("text", "")
            if len(text) < 40:
                err.append("%s text 只有 %d 字，必须写具体内容（数据/纪录/做法/时间），至少 40 字" % (t, len(text)))
            if len(text) > 200:
                warn.append("%s text %d 字偏长，建议 ≤200 字" % (t, len(text)))
            tagv = it.get("tag", "")
            if not tagv:
                warn.append("%s 缺 tag（短标签，放硬性数据如「主跨 1125 米 · 世界第一」）" % t)
            elif len(tagv) > 20:
                warn.append("%s tag %d 字偏长，建议 ≤20 字" % (t, len(tagv)))
            sp = it.get("spot")
            if sp:
                if sp not in spot_ids:
                    err.append("%s spot=%r 不在本省 spots 里（必须照抄已有景点 id，否则去掉该字段）" % (t, sp))
            elif it.get("img"):
                warn.append("%s 用了自定义 img，请确认路径文件存在" % t)
            total += 1
    if total < 10:
        err.append("全部条目只有 %d 条，至少 10 条" % total)
    return err, warn


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check_only = "--check" in sys.argv
    pids = args or [f[:-5] for f in sorted(os.listdir(SRC)) if f.endswith(".json")]
    ok = fail = 0
    for pid in pids:
        fp = os.path.join(SRC, pid + ".json")
        if not os.path.exists(fp):
            print("[SKIP] %s 无内容文件" % pid); continue
        try:
            feat = json.load(open(fp, encoding="utf-8"))
        except Exception as e:
            print("[FAIL] %s 内容文件 JSON 解析失败: %s" % (pid, e)); fail += 1; continue
        path, head, data, _ = load_js(pid)
        if data is None:
            print("[FAIL] %s 缺 prov_%s.js" % (pid, pid)); fail += 1; continue
        spot_ids = set(s.get("id") for s in data.get("spots", []))
        err, warn = validate(pid, feat, spot_ids)
        for w in warn:
            print("  [warn] %s: %s" % (pid, w))
        if err:
            print("[FAIL] %s 校验未通过（未写入）:" % pid)
            for e in err:
                print("        - " + e)
            fail += 1; continue
        if check_only:
            print("[OK-CHECK] %s %d 组 / %d 条" % (pid, len(feat["groups"]),
                  sum(len(g.get("items") or []) for g in feat["groups"]))); ok += 1; continue
        data["features"] = feat
        out = head + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(out)
        print("[OK] %s 写入 %d 组 / %d 条" % (pid, len(feat["groups"]),
              sum(len(g.get("items") or []) for g in feat["groups"])))
        ok += 1
    print("\n== build_features 完成: 成功 %d, 失败 %d ==" % (ok, fail))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
