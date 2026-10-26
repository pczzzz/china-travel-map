# 部署手册（GitHub Pages / Cloudflare Pages / 临时分享）

> 本机网络实测（2026-10-26）：`github.com` 网页与 git HTTPS **间歇性可达**（时通时被重置），
> SSH:22 与 SSH-over-443 **被阻断**，`api.cloudflare.com` / `dash.cloudflare.com` 可达，
> `*.github.io`（Pages 访问域名）可达。因此远程已从 SSH 改为 **HTTPS + Git Credential Manager 浏览器授权**，
> 全程不需要把密码交给任何工具。

本地已就绪的状态：
- git 仓库已初始化并完成首次提交（分支 `main`，约 3777 个文件 / .git 约 418MB）
- 远程：`origin = https://github.com/pczzzz/china-travel-map.git`
- PWA 已注入全部 13 页并通过 `tools/_qa_pwa.js`（6/6）
- GitHub Actions 工作流 `.github/workflows/deploy.yml`（push 到 main 自动发布 Pages）
- 密钥文件 `tools/llm_key.local` 已被 `.gitignore` 排除，历次自检 0 泄漏

---

## 路线 A（推荐）：GitHub Pages

1. **立即修改 GitHub 密码**（之前在聊天里贴过，视为已泄露）。
2. 浏览器打开 <https://github.com/new>（若打不开说明正处于阻断窗口，隔几分钟重试或换网络）：
   - 仓库名：`china-travel-map`
   - 可见性：**Public**（免费账户 Pages 需要公开仓库）
   - **不要**勾选 README / .gitignore / license（必须空仓库）
3. 在项目根目录执行推送：

   ```bash
   git push -u origin main
   ```

   - 首次会弹出浏览器让你登录 GitHub 并授权 Git Credential Manager，登录一次即可记住。
   - 仓库约 420MB，推送时间取决于上行带宽；若中途被重置（阻断窗口），直接重跑同一命令即可断点续推。
   - 可选加大缓冲：`git config http.postBuffer 524288000`
4. 推送后打开仓库 **Actions** 页，等待 `Deploy to GitHub Pages` 变绿（约 2-5 分钟）。
5. 访问 `https://pczzzz.github.io/china-travel-map/` 验收。

日常更新：`git add -A && git commit -m "update" && git push`，Actions 自动重新发布。

## 路线 B（备选）：Cloudflare Pages（不依赖 GitHub）

1. 注册/登录 <https://dash.cloudflare.com>（免费）。
2. 项目根目录执行：

   ```bash
   npx wrangler pages deploy . --project-name=china-travel-map
   ```

   首次会弹浏览器授权。发布后得到 `https://china-travel-map.pages.dev`。
3. 注意：`*.pages.dev` 域名在境内存在间歇性 DNS 污染，可达性不如 `github.io`；绑自定义域名可解决。

## 路线 C（临时演示）：WorkBuddy / 云沙箱一键部署

把 `../环中国旅行地图-部署包.zip`（401MB，含 PWA，自检无密钥）交给 WorkBuddy 一键部署，
拿到临时公网链接。沙箱链接可能在闲置后被回收，仅作演示，不作长期托管。

---

## PWA 安装（上线后）

- **Android Chrome**：打开线上地址 → 菜单 → “添加到主屏幕/安装应用”，即可像 App 一样全屏打开。
- **iOS Safari**：分享 → “添加到主屏幕”。
- 离线能力：应用外壳 + 站点数据可离线打开；**地图瓦片不缓存**（避免占用爆炸），离线时底图空白属预期。
- AI 推荐在线上无 `/api/llm` 后端，会自动降级为本地当季物候引擎，功能可用。

## 安全红线

- 私钥 `~/.ssh/comate_github_ed25519` 只在本机；GitHub 侧不需要再配它（HTTPS 路线用不到）。
- `tools/llm_key.local`、`*.local`、`tools/_*` 均在 `.gitignore` 中，禁止强制加入版本库。
