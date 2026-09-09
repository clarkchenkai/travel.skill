# 熊野展示版本来源

核对日期：2026-09-09。正式公开入口：https://kumano-roadbook.pages.dev/?v=tokyo34 。

本目录是作者作品的固定公开快照，不是通用模板生成效果的承诺。首次收录版本为 `skip32`；本轮同步到正式站实际返回的 `tokyo34`，恢复“东京”标题及午饭后涩谷 TOWER RECORDS 安排。原作的视觉与交互不在这次同步中重新设计。

## 核对结果

下列文件通过正式站下载，与作者工作区对应文件逐字节一致。作者工作区核对时版本：`ea7ebf98eaeec3d7b8fd1f6d2644bbcc7bd766e2`。

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `index.html` | 6,853 | `c6e871c4b3af06514b2775722434065642cf9c2f53144fdfd5d5baac923cba7f` |
| `app.js` | 41,038 | `80a7d1765c6e43e3730e15a2cdcb7d27336584318346b7f4d8338079cfce5eb0` |
| `styles.css` | 94,065 | `bc5e86f03f0d91016120e5abcf78088dc38069035896306b0516af4513c46851` |
| `desktop.css` | 5,155 | `2d3f9465d1822cfa5f82bdecbfaf1c6198f6a3a4d4909023c1092c9dfb00b68f` |
| `travel-data.json` | 97,920 | `6306676acb46af241cfbf0a95f7f38ea7389be3b497c5c82848ad0eeb6e0ecbb` |
| `assets/story.js` | 753,835 | `b62eac32aa5c7467d2e0105affb87be34ebb2e8d500a1ade6c86d33ebba5692b` |

本次仅更新已跟踪的 `index.html`、`app.js`、`travel-data.json`。`assets/story.js` 是正式站的已编译包，仅用于本地核对和截图，仍由 Git 忽略；正式构建继续使用源码与锁定的依赖。

## 后续更新

读取正式公开版本 → 比对文件和来源 → 更新固定快照及本记录 → 构建并实看 → 通过 PR 交付。不要在访问者打开网页或每次构建时，自动覆盖为未经核对的远端内容。

截图仅取自这个已核对版本。Lovart 的海报、纸面或章节意象属于独立设计素材，不能替代原作界面的真实截图，也不能用来声称已有交互效果。
