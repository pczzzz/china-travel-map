# 环中国旅行地图 · 部署说明

纯静态站点 + 一个本地 Python 服务（提供 `/api/llm` 代理）。**无需构建、无需 Node、无需数据库**，拷到另一台电脑即可运行。

---

## 一、环境要求

| 项目 | 要求 | 说明 |
| --- | --- | --- |
| 操作系统 | Windows 10/11、macOS、Linux | 启动脚本已提供 Windows 版 |
| Python | **3.9 及以上** | 只用到标准库（`http.server` / `urllib`），**不需要 pip 安装任何包** |
| 浏览器 | Chrome / Edge 等现代浏览器 | 站点使用 ES5 兼容写法，主流浏览器均可 |
| 磁盘 | 约 450 MB | 主要是 `assets/images` 配图 |
| 内存 | 1 GB 以上 | 静态服务占用极低 |

> 检查 Python：命令行执行 `python --version` 或 `py -3 --version`。若提示找不到，请安装 Python 并勾选 **Add Python to PATH**。

---

## 二、启动方式

### Windows（推荐）

双击项目根目录的 **`启动站点.bat`**，脚本会自动：

1. 定位 Python（优先 `py -3`，其次 `python`）；
2. 检测端口 8787 是否被占用，已占用则直接开浏览器；
3. 启动本地服务并自动打开 `http://127.0.0.1:8787/`。

指定其它端口：`启动站点.bat 9000`

关闭窗口即停止服务。

### macOS / Linux

```bash
cd 中国旅行地图
python3 tools/serve.py 8787
# 浏览器打开 http://127.0.0.1:8787/
```

### 为什么必须用 serve.py 而不是直接双击 index.html

`file://` 协议下浏览器会拦截本地 JSON/JS 的跨源读取，且 AI 规划接口无法工作。**请始终通过 `http://127.0.0.1:8787/` 访问。**

---

## 三、AI 行程规划密钥（可选功能）

站点的「AI 规划」会把请求发到本地 `/api/llm`，由 `tools/serve.py` 转发到大模型网关。**密钥不出现在任何前端代码中**，需由部署者单独配置，二选一：

| 方式 | 做法 | 适用 |
| --- | --- | --- |
| 环境变量 | 设置 `HZ_LLM_KEY=<你的密钥>` 后重启服务 | 服务器/多人共用 |
| 本地文件 | 在 `tools/` 下新建 `llm_key.local`，内容为密钥（单行） | 个人电脑，最省事 |

- 未配置时：站点其余功能**完全正常**，仅点击「AI 规划」会提示"未配置大模型密钥"（HTTP 503）。
- `tools/llm_key.local` 已写入 `.gitignore`，**不要提交到代码仓库，也不要放进分发包**。
- 网关地址：`https://aigateway.tongwei.com/v1/chat/completions`（内网/企业网环境才可访问）。

Windows 临时设置环境变量示例：

```bat
set HZ_LLM_KEY=你的密钥
启动站点.bat
```

---

## 四、外网依赖清单

站点自带 Leaflet（`assets/leaflet/`）与全部数据、配图，**离线也能打开页面**，但以下功能需要联网：

| 功能 | 依赖地址 | 断网表现 |
| --- | --- | --- |
| 地图底图（路网） | `https://webrd0{1-4}.is.autonavi.com/appmaptile` | 地图空白，标记与路线仍显示 |
| 地图底图（卫星） | `https://webst0{1-4}.is.autonavi.com/appmaptile` | 同上 |
| 地图标注层 | `https://webd0{1-4}.is.autonavi.com/appmaptile` | 缺地名标注 |
| 备用底图（腾讯） | `https://rt{0-3}.map.gtimg.com/tile` | 底图切换项不可用 |
| 沿途天气预报 | `https://api.open-meteo.com/v1/forecast` | 天气栏提示加载失败，不影响行程 |
| AI 行程规划 | `https://aigateway.tongwei.com/v1/chat/completions` | 按钮提示网关不可达 |
| 「搜一下」外链 | `https://cn.bing.com/search?q=...` | 新标签页打不开 |

> 若部署环境为内网，请确认上述域名已放行；地图瓦片建议保留公网访问，否则地图仅剩矢量路线。

---

## 五、目录结构

```
中国旅行地图/
├─ index.html            首页（地图 + 三条国道总览）
├─ route.html            国道详情（?id=g318 等 9 条）
├─ provinces.html        省份索引
├─ province.html         省份详情（?id=sichuan）
├─ city.html             节点/城市详情（?id=g318:0）
├─ themes.html           主题索引（12 条主题线）
├─ theme.html            主题详情（?id=rmb）
├─ hiking.html           徒步登山路线库
├─ guide.html            实用攻略
├─ favorites.html        收藏 / 图鉴 / 已去清单
├─ plan.html             行程规划（?route=g318；含「行程地图」按天聚焦 / 播放）
├─ recommend.html        旅行推荐 · 当季盲盒（AI 优先，失败自动降级本地物候引擎）
├─ atlas.html            旧图鉴入口（自动跳转 favorites.html）
├─ assets/
│  ├─ css/               main.css + v2.css（含移动端抽屉样式）+ rec.css（推荐页样式）
│  ├─ js/                core.js（全局 HZ API）、data.js（路网/POI 数据）、
│  │                     各省数据、plan*.js、plan_map.js、recommend.js、atlas.js、theme.js 等
│  ├─ images/            配图（`_unused/` 为历史遗留图，运行时不引用）
│  ├─ leaflet/           Leaflet 库（本地自带，无需 CDN）
│  └─ geo/               省界 GeoJSON
└─ tools/
   ├─ serve.py           本地静态服务 + /api/llm 代理（唯一运行时依赖）
   ├─ llm_key.local      AI 密钥（本地私有，勿分发）
   └─ 其余为数据构建/QA 脚本（部署时不需要）
```

**最小部署集**：13 个 `.html` + 整个 `assets/`（可排除 `assets/images/_unused/`）+ `tools/serve.py`。

---

## 六、数据与本地存储

用户数据只存在浏览器 `localStorage`，服务器不留痕：

| Key | 内容 |
| --- | --- |
| `huanzhongguo.v2.visited` | 已去过的节点 |
| `huanzhongguo.v2.fav` | 收藏（POI 用 `p:` 前缀、节点用 `n:` 前缀、省份景点用 `省份:景点`） |
| `huanzhongguo.plan.*` | 行程规划表单与结果 |

收藏页支持导出 TSV；已去清单可导出。换电脑时可用「导出」功能带走数据。

---

## 七、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 双击 `index.html` 页面空白/报错 | 必须经 `serve.py` 用 http 访问，见第二节 |
| 端口被占用（`OSError: 10048`） | 换端口启动：`启动站点.bat 9000` |
| 地图灰块但标记正常 | 瓦片域名被墙/断网，见第四节 |
| 点「AI 规划」提示未配置密钥 | 按第三节配置 `HZ_LLM_KEY` 或 `tools/llm_key.local` |
| 点「AI 规划」提示本地代理未启用 | 说明是 `file://` 打开或没走 serve.py，改用第二节方式 |
| AI 请求超时 | 默认 150s 超时；内网到网关链路慢时可重试，或检查网关可达性 |
| 手机端导航不见了 | 窄屏（≤1080px）使用右上角汉堡按钮打开抽屉导航 |

---

## 八、验收与自检（可选）

`tools/` 下保留了可复跑的 QA 脚本，需要本机有 Node.js 与 Chromium：

```bash
node tools/_qa_full.js      # 68 页全站真实浏览器巡检（控制台错误/断链/内容量）
node tools/_qa_mobile.js    # 26 页移动端横向溢出检测
node tools/_qa_inter.js     # 41 项交互（筛选/收藏/地图/行程/抽屉）
node tools/_qa_pwa.js       # PWA 验证（manifest/SW 激活/预缓存/离线开壳/13 页注入）
node tools/_verify_fix2.js  # 59 项回归（含移动端导航与收藏修复验证）
```

部署包中默认不含这些脚本；最近一次全量验收结果：**桌面 68 页 0 问题、移动端 0 溢出、交互 41/41、PWA 6/6**。

## 九、线上部署（GitHub Pages）

- 仓库推送到 GitHub 后，`.github/workflows/deploy.yml` 会自动把站点发布到 GitHub Pages，地址形如：
  `https://<用户名>.github.io/china-travel-map/`
- 全站为相对路径，天然兼容子路径托管；地图瓦片走公网 CDN，无需额外配置。
- **线上没有 `/api/llm` 后端**：AI 盲盒推荐会自动降级为本地物候引擎（功能完整，仅少 AI 生成文案）。`tools/llm_key.local` 已被 `.gitignore` 排除，**严禁**提交或上传到任何托管。
- 更新站点 = `git add / commit / push`，Actions 自动重新发布，地址不变。

## 十、PWA（可安装、可离线）

- `manifest.webmanifest` + `sw.js` + `assets/js/pwa.js` 提供渐进式 Web App 能力：
  - 手机/桌面浏览器打开站点后可"添加到主屏幕"，全屏运行、有独立图标；
  - Service Worker 预缓存站点骨架，同源资源 stale-while-revalidate，**离线可打开已访问过的页面**；
  - 地图底图瓦片不缓存（避免存储膨胀），离线时路线/标记等矢量内容仍完整显示。
- 缓存版本号在 `sw.js` 顶部 `CACHE` 常量，大改版时递增即可让客户端强制更新缓存。
