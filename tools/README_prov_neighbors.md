# 四川周边七省 · 内容接入说明

> 本批数据由独立对话完成：云南 / 重庆 / 贵州 / 陕西 / 甘肃 / 青海 / 西藏。
> 全程未改动另一对话拥有的共享文件，产物可直接被 `province.html?id=xxx` 消费。

## 一、新增文件清单

### 内容源（`tools/content/`）
| 文件 | 省份 | 规模 |
|---|---|---|
| `yunnan.py` | 云南 | 16 城 / 61 景 / 13 味 / 5 环线 |
| `chongqing.py` | 重庆 | 28 区县 / 73 景 / 13 味 / 5 环线 |
| `guizhou.py` | 贵州 | 9 市州 / 53 景 / 12 味 / 5 环线 |
| `shaanxi.py` | 陕西 | 10 地市 / 66 景 / 13 味 / 5 环线 |
| `gansu.py` | 甘肃 | 15 市州 / 68 景 / 13 味 / 5 环线 |
| `qinghai.py` | 青海 | 9 市州 / 46 景 / 12 味 / 5 环线 |
| `tibet.py` | 西藏 | 7 地市 / 57 景 / 12 味 / 5 环线 |

### 构建与数据
- `tools/build_prov_neighbors.py` — 独立构建器（可指定省份参数），输出 `assets/js/prov_<id>.js`
- `assets/js/prov_{yunnan,chongqing,guizhou,shaanxi,gansu,qinghai,tibet}.js` — 7 份构建产物
- `assets/js/prov_neighbors_index.js` — 8 省索引（含四川），供总览页按需加载

### 配图
- `tools/gen_jobs_prov.py` — 从内容源生成抓图任务
- `tools/jobs_prov.json` — 独立任务队列（**不占用共享 `tools/jobs.json`**）
- `tools/fetch_prov.py` — 独立抓图入口（复用 `fetch_images.py` 逻辑，报告写 `image_report_prov.json`）
- 图片：`assets/images/{yn,gz,cq,sx,gs,qh,xz}_*.jpg`，命名带省份前缀，不与四川 `sc_` 冲突

## 二、数据结构（与 `sichuan.py` 完全一致）

每个内容源包含：
- `PROV`：`id / name / en / capital / tagline / intro[] / facts[(k,v)] / regions[(name,desc)]`
- `CITIES`：`(id, name, lat, lng, role, desc)`，坐标 WGS-84
- `SPOTS`：多行字符串 `id|name|cat|city|lat|lng|desc|img=..|elev=..|diff=..|time=..|ticket=..|season=..|level=..|free|key`
- `FOODS`：`(name, cityId, desc)`；`LOOPS`：`dict(name, days, km, desc, path, note, ids)`
- `TIPS`：`(title, desc)`；`WAYPOINTS`：`{id: (name, lat, lng)}`

构建产物（`prov_<id>.js`）：
- `window.PROV_DATA.<id>` = `{meta, cities(含 spots/cap), spots(含 img/key/free/catName/gcj 坐标), foods, loops(含 pts 坐标数组), tips}`
- 坐标已由 WGS-84 转 GCJ-02；`img` 仅在图片文件存在时输出

## 三、接入正式页面（最小改动）

`province.html` 的 `province.js` 已通过 `loadProv()` 动态加载 `assets/js/prov_<id>.js`，因此 **7 省无需改代码即可直接打开**：
- `province.html?id=yunnan`、`?id=chongqing`、`?id=guizhou`、`?id=shaanxi`、`?id=gansu`、`?id=qinghai`、`?id=tibet`

`provinces.html` 的 `provinces.js` 中 `FEAT` 列表为硬编码（当前仅四川"已上线"、云南"规划中"），若要展示七省卡片，需把 FEAT 中对应项改为：
```js
{ id: "yunnan", name: "云南", tg: "已上线", soon: false },
{ id: "chongqing", name: "重庆", tg: "已上线", soon: false },
{ id: "guizhou", name: "贵州", tg: "已上线", soon: false },
{ id: "shaanxi", name: "陕西", tg: "已上线", soon: false },
{ id: "gansu", name: "甘肃", tg: "已上线", soon: false },
{ id: "qinghai", name: "青海", tg: "已上线", soon: false },
{ id: "tibet", name: "西藏", tg: "已上线", soon: false },
```
卡片渲染逻辑与四川共用（`sc` 变量处改为按 `f.id` 读 `PROV_DATA`），即把 `if (!f.soon && f.id === "sichuan" && sc)` 改为 `if (!f.soon && (window.PROV_DATA||{})[f.id])` 即可通用。

## 四、给另一对话的提示（不代改）

1. **`tools/build_sichuan.py` 的 `parse_kv` 有裸标记 bug**：只解析含 `=` 的 token，景点尾部裸标记 `free` / `key` 会被丢弃。已验证 `prov_sichuan.js` 中 `key/free` 均为 0，而内容源实际标了 17 个 `key`、6 个 `free`。本对话已在 `build_prov_neighbors.py` 中修复，四川如需正确输出需单独修复。
2. 抓图使用独立的 `tools/jobs_prov.json` / `fetch_prov.py`，不碰共享的 `jobs.json`，两套任务可并行。
3. `neighbors.html` 未创建——因为发现 `province.html` 已能直接渲染 7 省，无需再建预览页；如需独立预览可随时从产物读取。

## 五、事实口径说明（保守表述）

- 最高峰：云南卡瓦格博 6740m / 贵州韭菜坪 2900.6m / 重庆阴条岭 2796.8m / 陕西太白山拔仙台 3771m / 甘肃团结峰 5827m（另有阿尔金山主峰 5798m 说）/ 青海布喀达坂峰 6860m / 西藏珠穆朗玛峰 8848.86m
- 人口与面积均采用「2023 年末常住人口约 X 万」口径，精确数据以官方公报为准
- 世界遗产年份：丽江古城 1997、三江并流 2003、石林 2007、澄江化石地 2012、景迈山 2023、荔波喀斯特 2007、赤水丹霞 2010、施秉 2014、梵净山 2018、海龙屯 2015、大足石刻 1999、武隆 2007、金佛山 2014、泰山/长城/兵马俑/莫高窟等陕西甘肃的世遗也按联合国名录年份标注

## 六、重建方式

```bash
python tools/build_prov_neighbors.py          # 重建全部 7 省 + 索引
python tools/build_prov_neighbors.py yunnan   # 只重建云南
python tools/fetch_prov.py                    # 抓取全部剩余配图
```

## 七、新增五省（新疆 / 山西 / 湖南 / 广西 / 福建）

在七省闭环后追加的一批，结构与七省完全一致，但由独立工具链产出，互不干扰：

| 文件 | 省份 | 规模 |
|---|---|---|
| `content/xinjiang.py` | 新疆 | 11 城 / 30 景 / 10 味 / 4 环线 |
| `content/shanxi.py` | 山西 | 8 城 / 24 景 / 8 味 / 4 环线 |
| `content/hunan.py` | 湖南 | 9 城 / 21 景 / 8 味 / 3 环线 |
| `content/guangxi.py` | 广西 | 8 城 / 20 景 / 8 味 / 4 环线 |
| `content/fujian.py` | 福建 | 8 城 / 22 景 / 8 味 / 3 环线 |

- 构建器：`tools/build_prov_extra.py` → `assets/js/prov_<id>.js` + `assets/js/prov_extra_index.js`（`window.PROV_EXTRA`）
- 图片前缀：`xj_ / sxi_ / hn_ / gx_ / fj_`（山西用 `sxi_` 避开陕西的 `sx_`）；美食配图 `fd_<前缀>_<NN>`
- 抓图：`tools/gen_jobs_extra.py` → `jobs_extra.json`（172 个任务，含四川 13 味美食）→ `tools/fetch_extra.py`，日志 `fetch_extra.log`
- `provinces.js` 已同时消费 `PROV_NEIGHBORS` + `PROV_EXTRA` 两个索引，13 张深度路书卡片自动出现，无需改代码
- 容错：构建器对 `LOOPS.ids` 同时兼容逗号串与列表；美食 `city` 兼容城市名与城市 id

当前全量：13 省 / 585 停靠点 / 150 城市 / 143 美食 / 58 环线，停靠点与美食配图 100%。

## 八、给另一对话的第二处提示（不代改）

`province.html` 第 30–31 行把「地理速览」的标题写死成了四川文案：

```html
<h2>三大板块，一省三种玩法</h2>
<p class="sub">先认清地形再排行程：盆地吃与逛、川西看与爬、攀西晒与躺。</p>
```

导致其余 12 省页面也显示这句四川话。内容源已备好通用字段：`PROV.geoTitle` / `PROV.geoSub`
（12 省均已写入，并随构建输出到 `meta`；四川内容源未加，回退即可保持原文案）。最小改法：

1. 给这两行加 id：`<h2 id="geoTitle">…</h2>`、`<p class="sub" id="geoSub">…</p>`
2. 在 `province.js` 渲染 `#regions` 处（约 57 行）补两行回退赋值：

```js
if (M.geoTitle) $("#geoTitle").textContent = M.geoTitle;
if (M.geoSub) $("#geoSub").textContent = M.geoSub;
```

四川 `sichuan.py` 没有这两个字段，行为与现在完全一致，零风险。
