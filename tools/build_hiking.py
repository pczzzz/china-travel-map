# -*- coding: utf-8 -*-
"""
build_hiking.py — 从「自驾游」文件夹解析用户自收集资料，生成 assets/js/hiking_data.js
数据源：
  1) 自驾游/攻略汇总/徒步爬山路线汇总.xmind  → 贡嘎重装线 + 全国经典长线名单
  2) 自驾游/攻略汇总/徒步爬山路线汇总.xlsx   → 成都周边 19 条实操路线 + 山峰速查
  3) 自驾游/攻略汇总/徒步爬山经验.xmind      → 户外知识库
  4) 自驾游/甘孜州.xmind                     → 海螺沟—木格措 2 天车露营实操路书
输出：assets/js/hiking_data.js （window.HIKE_DATA）
"""
import json, os, re, sys, zipfile
import xml.etree.ElementTree as ET
import openpyxl

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "自驾游")
OUT = os.path.join(BASE, "assets", "js", "hiking_data.js")


# ---------------------------------------------------------------- xmind 解析
def ln(tag):
    return tag.split('}')[-1] if '}' in tag else tag


def xmind_tree(path):
    """返回 root topic 的嵌套 dict: {t:标题, n:[备注行], c:[子节点]}"""
    z = zipfile.ZipFile(path)
    if 'content.json' in z.namelist():
        data = json.loads(z.read('content.json').decode('utf-8'))
        def recj(t):
            node = {'t': (t.get('title') or '').strip(), 'n': [], 'c': []}
            nt = t.get('notes')
            if isinstance(nt, dict):
                plain = nt.get('plain', {}).get('content', '')
                node['n'] = [x.strip() for x in plain.split('\n') if x.strip()]
            for c in (t.get('children', {}) or {}).get('attached', []) or []:
                node['c'].append(recj(c))
            return node
        return recj(data[0]['rootTopic'])

    root = ET.fromstring(z.read('content.xml').decode('utf-8'))

    def rec(t):
        node = {'t': '', 'n': [], 'c': []}
        for ch in t:
            k = ln(ch.tag)
            if k == 'title' and not node['t']:
                node['t'] = (ch.text or '').strip()
            elif k == 'notes':
                txt = ''.join(x.text or '' for x in ch.iter() if ln(x.tag) == 'plain')
                node['n'] = [x.strip() for x in txt.split('\n') if x.strip()]
            elif k == 'children':
                for tp in ch:
                    if ln(tp.tag) == 'topics':
                        for sub in tp:
                            if ln(sub.tag) == 'topic':
                                node['c'].append(rec(sub))
        return node

    for sheet in root:
        if ln(sheet.tag) != 'sheet':
            continue
        for ch in sheet:
            if ln(ch.tag) == 'topic':
                return rec(ch)
    return {'t': '', 'n': [], 'c': []}


def find(node, title):
    for c in node['c']:
        if c['t'] == title:
            return c
    for c in node['c']:
        r = find(c, title)
        if r:
            return r
    return None


def clean(s):
    if s is None:
        return ''
    s = str(s).replace('\xa0', ' ').replace('\r', ' ')
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip()


def is_name(t):
    """标题是否像一个「路线名」（短句、无逗号）"""
    t = clean(t)
    return bool(t) and len(t) <= 22 and not re.search(r'[，。；,]', t)


def norm_name(t):
    return re.sub(r'\s*\n\s*', ' · ', clean(t)).strip(' ·')


SEASON_CLAUSE = re.compile(r'(最佳|季节|雨季|冬季|夏季|春秋|避开|均可上山|月)')
DAY_RE = re.compile(r'(\d+\s*[-–~]\s*\d+\s*天|\d+\s*天|[一二三四五六七八九十]+天[一二三四五六七八九十]*夜?)')


def parse_spec(spec):
    """仅对首行概述做结构化抽取，避免跳句误匹配"""
    days = elev = season = ''
    m = DAY_RE.search(spec)
    if m:
        days = m.group(1).replace(' ', '')
    m = re.search(r'海拔\s*(\d[\d,.]*\s*[Kk]?\+?\s*米?)', spec)
    if m:
        elev = m.group(1).strip()
    for cl in re.split(r'[，。;；]', spec):
        cl = clean(cl)
        if cl and SEASON_CLAUSE.search(cl) and not DAY_RE.fullmatch(cl):
            season = cl
            break
    return days, elev, season


def guess_level(text):
    if re.search(r'谨慎前往|风险很高|事故|没有下撤|泥石流|禁', text):
        return ('高危', 5)
    if re.search(r'重装|经验|适应|慢|攀登', text):
        return ('进阶', 4)
    if re.search(r'网红|当日往返|1-2天|轻', text):
        return ('轻松', 2)
    return ('中等', 3)


def flatten_bullets(node, depth=0, out=None):
    """把子树压成 [{lv, tx}] 便于前端渲染缩进列表"""
    if out is None:
        out = []
    for c in node['c']:
        t = clean(c['t']).replace('\n', ' ')
        if t:
            out.append({'lv': depth, 'tx': t})
        for n in c['n']:
            out.append({'lv': depth + 1, 'tx': clean(n)})
        flatten_bullets(c, depth + 1, out)
    for n in node['n']:
        out.append({'lv': depth, 'tx': clean(n)})
    return out


# ---------------------------------------------------------------- 1. 贡嘎线
def build_gongga(xm):
    root = xmind_tree(xm)
    g = find(root, '贡嘎')
    if not g:
        return [], []
    slopes, routes = [], []

    def mk(name, zone, desc_nodes):
        descs = []
        for n in desc_nodes:
            t = clean(n['t']) if isinstance(n, dict) else clean(n)
            if t:
                descs.append(t)
            if isinstance(n, dict):
                for x in n['n']:
                    if clean(x):
                        descs.append(clean(x))
        spec = descs[0] if descs else ''
        days, elev, season = parse_spec(spec)
        lv, lvn = guess_level(' '.join(descs))
        r = {'name': norm_name(name), 'zone': zone, 'days': days, 'elev': elev,
             'season': season, 'level': lv, 'levelNum': lvn,
             'spec': spec, 'points': descs[1:]}
        return r

    for slope in g['c']:
        sname = norm_name(slope['t'])
        if not sname:
            continue
        kids = slope['c']
        name_kids = [k for k in kids if is_name(k['t'])]
        desc_kids = [k for k in kids if not is_name(k['t'])]
        if name_kids:
            sub = {'name': sname, 'routes': []}
            for k in name_kids:
                sub['routes'].append(mk(k['t'], sname, k['c'] or [{'t': x} for x in k['n']]))
            slopes.append(sub)
            routes.extend(sub['routes'])
        else:
            # 坡向自身就是一条线（东南坡 / 南坡 / 贡嘎大环线）
            r = mk(sname, '坡向直达' if sname.endswith('坡') else '环线',
                   desc_kids or [{'t': x} for x in slope['n']])
            if not r['spec']:
                r['spec'] = ('思维导图中的预留条目，尚未展开。完整逐日行程见下方「成都周边实操路线」中的「反穿贡嘎大环线」。'
                             if '环线' in sname else '思维导图中的预留条目，尚未展开。')
                r['level'], r['levelNum'] = '待整理', 0
            slopes.append({'name': sname, 'routes': [r]})
            routes.append(r)
    return slopes, routes


def build_classic(xm):
    root = xmind_tree(xm)
    out = []
    for c in root['c']:
        if c['t'] == '贡嘎':
            continue
        t = clean(c['t'])
        if t:
            out.append({'name': t, 'note': ' / '.join(clean(x) for x in c['n'])})
    return out


# ---------------------------------------------------------------- 2. xlsx 路线
def build_cd_routes(xl):
    wb = openpyxl.load_workbook(xl, read_only=True, data_only=True)
    ws = wb['路线']
    rows = list(ws.iter_rows(values_only=True))
    out = []
    for r in rows[1:]:
        if not r or not r[0]:
            continue
        cells = [clean(x) for x in r]
        # 线路字段里的换行是 D1/D2 分段
        plan = [clean(x) for x in re.split(r'\n', str(r[2] or '')) if clean(x)]
        out.append({
            'name': cells[0],
            'km': cells[1],
            'plan': plan,
            'stay': cells[3],
            'gear': cells[4],
            'guide': cells[5],
            'level': int(float(cells[6])) if re.match(r'^\d+(\.\d+)?$', cells[6]) else 0,
            'note': cells[7],
        })
    peaks = []
    if '山' in wb.sheetnames:
        for r in wb['山'].iter_rows(min_row=2, values_only=True):
            if not r or not r[0]:
                continue
            c = [clean(x) for x in r]
            peaks.append({'name': c[0], 'place': c[1], 'feat': c[2],
                          'hours': c[3], 'km': c[4], 'diff': c[5], 'key': c[6] if len(c) > 6 else ''})
    wb.close()
    return out, peaks


# ---------------------------------------------------------------- 3. 户外知识
def build_knowledge(xm):
    root = xmind_tree(xm)
    out = []
    for sec in root['c']:
        name = clean(sec['t'])
        if not name:
            continue
        items = flatten_bullets(sec)
        if items:
            out.append({'cat': name, 'items': items})
    return out


# ---------------------------------------------------------------- 4. 甘孜车露营
def build_field(xm):
    root = xmind_tree(xm)
    plan = find(root, '旅行计划')
    route = None
    if plan:
        for c in plan['c']:
            if '木格措' in c['t'] and '海螺沟' in c['t']:
                route = c
                break
    days = []
    if route:
        for d in route['c']:
            steps = []
            for s in d['c']:
                t = clean(s['t'])
                m = re.match(r'^(上午|中午|下午|傍晚|夜宿|夜间)[：:]\s*(.*)$', t, re.S)
                if m:
                    steps.append({'ph': m.group(1), 'tx': clean(m.group(2))})
                else:
                    steps.append({'ph': '', 'tx': t})
                for n in s['n']:
                    steps.append({'ph': '', 'tx': clean(n)})
            days.append({'title': clean(d['t']), 'steps': steps})
    gear = []
    must = find(root, '必备物品')
    if must:
        for g in must['c']:
            raw = str(g['t'] or '')
            if '\t' in raw:
                k, v = raw.split('\t', 1)
                gear.append({'cat': clean(k), 'tx': clean(v)})
            elif g['c']:
                gear.append({'cat': clean(raw), 'tx': ' / '.join(norm_name(x['t']) for x in g['c'])})
            else:
                gear.append({'cat': '', 'tx': clean(raw)})
    return {'name': (clean(route['t']) if route else ''), 'days': days, 'gear': gear}


# ---------------------------------------------------------------- 5. 物资准备
def build_packing(xl):
    wb = openpyxl.load_workbook(xl, read_only=True, data_only=True)
    ws = wb['物资准备']
    groups, big, cat = [], None, None
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r:
            continue
        c = [clean(x) for x in r]
        if c[0] and c[0] != big:
            big = c[0]
            groups.append({'name': big, 'cats': []})
            cat = None
        if not groups:
            continue
        if c[1] and c[1] != cat:
            cat = c[1]
            groups[-1]['cats'].append({'name': cat, 'items': []})
        if not c[2]:
            continue
        if not groups[-1]['cats']:
            groups[-1]['cats'].append({'name': '', 'items': []})
        groups[-1]['cats'][-1]['items'].append({
            'n': c[2], 'q': c[3], 'note': c[4]
        })
    wb.close()
    return [g for g in groups if g['cats']]


def main():
    x_hike = os.path.join(SRC, '攻略汇总', '徒步爬山路线汇总.xmind')
    x_exp = os.path.join(SRC, '攻略汇总', '徒步爬山经验.xmind')
    x_gz = os.path.join(SRC, '甘孜州.xmind')
    x_route = os.path.join(SRC, '攻略汇总', '徒步爬山路线汇总.xlsx')
    x_plan = os.path.join(SRC, '路线攻略.xlsx')

    slopes, groutes = build_gongga(x_hike)
    classic = build_classic(x_hike)
    cd, peaks = build_cd_routes(x_route)
    know = build_knowledge(x_exp)
    field = build_field(x_gz)
    packing = build_packing(x_plan)

    data = {
        'meta': {
            'title': '徒步登山 · 路线库与户外知识',
            'source': '整理自本人自收集的徒步/自驾资料（xmind 思维导图 + Excel 台账）',
            'builtAt': '2026-10-25',
            'warning': '路线信息为个人实测与网络整理版本，山区路况、住宿与联系方式随时变化，出发前务必再核实并向当地报备。'
        },
        'gongga': {'slopes': slopes, 'routes': groutes},
        'classic': classic,
        'cdRoutes': cd,
        'peaks': peaks,
        'knowledge': know,
        'fieldBook': field,
        'packing': packing
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// 徒步登山数据 — 由 tools/build_hiking.py 从「自驾游」资料生成，勿手改\n')
        f.write('window.HIKE_DATA = ')
        f.write(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        f.write(';\n')

    print('OUTPUT=%s' % os.path.abspath(OUT))
    print('贡嘎坡向 %d 组 / 路线 %d 条' % (len(slopes), len(groutes)))
    print('经典长线 %d 条 | 成都周边 %d 条 | 山峰速查 %d 条' % (len(classic), len(cd), len(peaks)))
    print('户外知识 %d 类 | 车露营 %d 天 %d 步 | 物资 %d 大类' %
          (len(know), len(field['days']), sum(len(d['steps']) for d in field['days']), len(packing)))
    print('文件大小 %.1f KB' % (os.path.getsize(OUT) / 1024))


if __name__ == '__main__':
    main()
