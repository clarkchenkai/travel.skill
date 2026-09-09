# travel.skill

**把旅行资料，变成有个人风格、可以分享的旅行网站。**

<p align="center"><img src="docs/demo/demo.gif" width="300" alt="手机上的操作演示：首页、日程、地点地图、航班、清单"></p>

订单、截图、备忘、链接 → 一个旅途中在手机上打开、发给同行人的页面。在线示例：**https://clarkchenkai.github.io/travel.skill/**

- **模板**：无依赖静态网站（纯 HTML、CSS、JavaScript）：首页、地图、日程、交通、清单；三套视觉方向；手机与桌面排布；打开过一次即可离线；可打印成纸质路书；聊天应用里有分享卡片。
- **Skill**：Coding Agent（Claude Code、Codex CLI，以及任何会读 `AGENTS.md` 的代理）遵循的流程：读资料、找缺口、填一份数据文件、预览、发布前检查。不编造事实。

不需要账号、数据库、付费服务。唯一要求是 Node.js 20+，示例不用任何 AI 就能跑。

[English →](README.md)

## 三种开始方式

**1. 在 GitHub 上用模板（什么都不用装）。** 点 *Use this template* → 建自己的仓库 → Settings → Pages → Source 选 *GitHub Actions*。自带的工作流一分钟内把一份起步路书发布到 `https://<你>.github.io/<仓库>/`。之后在网页里或本地改 `trip/travel-data.json`，每次推送自动重新部署。

**2. 本地运行。**

```bash
git clone https://github.com/clarkchenkai/travel.skill && cd travel.skill
npm run new -- japan-hiking    # 把示例复制到 trip/
npm run dev                    # 打开 http://localhost:4173/
```

**3. 配合 Coding Agent。** 把资料放进 `input/`，在 Claude Code 或 Codex 里打开仓库，粘贴：

```text
用 travel skill 做我的旅行路书。
资料在 input/。目的地：<哪里>。日期：<起止>。同行：<几人>。
先读资料，填 trip/travel-data.json，然后跑缺口报告，把要问我的问题一次列出来。
不要编造时间、价格和预订状态。
```

回答缺口清单，看预览，提修改。准备好后 `npm run build && npm run check`，把 `dist/` 放到任何静态托管（[docs/PUBLISHING.md](docs/PUBLISHING.md)）。

## 长什么样

仓库自带三个虚构示例，没有任何真实预订，只用来展示范围。

| `japan-hiking` · 主题 `field-notes` · 中文 | `europe-rail` · 主题 `timetable` · 英文 | `family-island` · 主题 `tide` · 英文 |
| --- | --- | --- |
| ![木曾谷示例，桌面首页](docs/screenshots/japan-hiking-desktop.png) | ![欧洲铁路示例，桌面首页](docs/screenshots/europe-rail-desktop.png) | ![马略卡亲子示例，桌面首页](docs/screenshots/family-island-desktop.png) |
| ![手机日程页](docs/screenshots/japan-hiking-mobile-days.png) | ![手机交通页](docs/screenshots/europe-rail-mobile-transport.png) | ![手机日程页](docs/screenshots/family-island-mobile-days.png) |

五天山谷徒步；八天跨四国的铁路环线（跨越欧洲夏令时结束）；一周带孩子的海岛自驾。气质不同，数据结构相同。所有照片均为为虚构行程生成的 AI 图像（GPT Image 2，经 Lovart），提示词与校验值见各示例的 `ASSETS.md` 和 [docs/VISUALS.md](docs/VISUALS.md)。

## 目录

```
skill/          代理 Skill：SKILL.md、references/、prompts/、evals/
template/       网站：index.html、styles.css、themes.css、app.js、core.mjs、i18n/
examples/       三个虚构行程
scripts/        new · dev · validate · gaps · build · check · preview · site · shot · check:offline（只用 Node，无依赖）
test/           node:test 测试（npm test）
docs/           数据字段、快速开始、发布、验证记录、视觉方法、演示录像
site/           示例画廊页（npm run site 构建，pages-demo.yml 部署）
showcase/       熊野古道 2026 真实路书完整版（本项目的来源，React + Three.js，21 MB）
trip/           你的旅行（npm run new 生成）
input/          你的原始资料（不入 Git）
```

## 测了什么，测到哪一层

`npm test` 覆盖时区计算、数据校验、发布审计，以及每个示例能校验、能构建、体积够小。维护者也在浏览器里逐个打开了示例，在手机与桌面尺寸下操作了地图弹层、票务标记、清单持久化和页面路由。**没做的**：从本仓库真正发布到线上托管；陌生用户完成第一份路书。[docs/VERIFICATION.md](docs/VERIFICATION.md) 按证据等级维护这份清单。

这个项目第一阶段的目标只有一句：**10 个陌生人不找作者指导，也能完成自己的第一份路书。** 你试过之后，请用「first roadbook」Issue 模板告诉我们过程，尤其是卡在哪里。

## 隐私

发布后 `dist/travel-data.json` 任何拿到链接的人都能下载。校验器和发布审计会拦下订单号、证件号类字段、令牌和本机路径，但读不懂你的自由文本。发布前自己把数据文件读一遍。`input/` 里的原件永远不会被复制进构建产物。

## 贡献

主题、国家/地区适配、模块、测试用例是四条贡献路线，见 [CONTRIBUTING.md](CONTRIBUTING.md)。Issue 模板覆盖首次路书反馈、Bug、主题提案和国家适配。

## 来源与许可

模板脱胎于一次真实旅行的自托管路书：完整网站、数据与设计记录在 [showcase/kumano-kodo](showcase/kumano-kodo/README.md)，其虚构数据版本此前发布为 [kumano-roadbook-template](https://github.com/clarkchenkai/kumano-roadbook-template)。本仓库将它重写为无依赖、不绑定国别视觉的模板，移植了它的动效层，并补上由那次开发笔记精简而成的代理 Skill。

MIT，见 [LICENSE](LICENSE)。示例数据为虚构；地名为公开地标，只用于展示地图功能。
