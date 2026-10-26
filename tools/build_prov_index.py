# -*- coding: utf-8 -*-
"""协作式主索引合并器：读取 assets/js/ 下所有 prov_*_index.js，去重合并后重新生成
assets/js/prov_index.js（window.PROV_INDEX，全站导航/图鉴/收藏页共用）。

设计目的：batch3、batch4 等多对话并行时，各自只写自己的 prov_<batch>_index.js，
最后任意一方运行本脚本即可把所有已构建批次合并进主索引，互不覆盖。

合并顺序：neighbors -> extra -> batch3 -> batch4 -> 其它（按文件名字典序），同 id 去重保留先出现者。
运行：python tools/build_prov_index.py
"""
import io, json, os, re, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JS = os.path.join(ROOT, "assets", "js")

# 优先级顺序（越靠前越先纳入，同 id 保留先出现者）
PRIORITY = ["prov_neighbors_index.js", "prov_extra_index.js",
            "prov_batch3_index.js", "prov_batch4_index.js"]


def load_cards(path):
    txt = io.open(path, encoding="utf-8").read()
    # 形如 window.PROV_XXX = [ ... ];
    m = re.search(r"=\s*(\[.*\])\s*;?\s*$", txt, re.S)
    if not m:
        return []
    try:
        arr = json.loads(m.group(1))
        return arr if isinstance(arr, list) else []
    except Exception as e:
        print("  跳过 %s（解析失败：%s）" % (os.path.basename(path), e))
        return []


def main():
    files = [os.path.join(JS, f) for f in PRIORITY if os.path.exists(os.path.join(JS, f))]
    # 追加其它 prov_*_index.js（如未来新增批次），字典序
    for p in sorted(glob.glob(os.path.join(JS, "prov_*_index.js"))):
        if p not in files and os.path.basename(p) != "prov_index.js":
            files.append(p)

    merged, seen = [], set()
    for p in files:
        cards = load_cards(p)
        added = 0
        for c in cards:
            cid = c.get("id")
            if not cid or cid in seen:
                continue
            seen.add(cid)
            merged.append(c)
            added += 1
        print("  %s -> %d 省（新增 %d）" % (os.path.basename(p), len(cards), added))

    dst = os.path.join(JS, "prov_index.js")
    js = ("/* prov_index.js —— 全部已上线分省深度路书索引（由 build_prov_index.py 合并各批次 prov_*_index.js 生成，供全站导航使用）\n"
          " * 重新生成：python tools/build_prov_index.py */\n"
          "window.PROV_INDEX = " + json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + ";\n")
    io.open(dst, "w", encoding="utf-8").write(js)
    print("prov_index.js: 合计 %d 省 / %.1f KB" % (len(merged), len(js.encode("utf-8")) / 1024.0))
    print("省份：" + "、".join(c.get("name", c.get("id")) for c in merged))


if __name__ == "__main__":
    main()
