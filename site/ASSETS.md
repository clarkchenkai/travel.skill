# 展示页素材

2026-09-09。绿色封面和细纹纸底采用已确认样稿，经 Lovart `upscale_image` 保真超分得到4K以上母版，再按网页用途缩小。初始样稿由内置图像生成工具制作；这里不把超分表述为 Lovart 从零生成。Lovart 重新生图的偏离构图版本未采用。

风格参考：[GC Minimal Zine Poster / Shore Pause](https://github.com/LiamGvchi/gc-minimal-zine-poster/blob/main/examples/shore-pause.jpeg)。生产封面使用苔绿色小路、网页文字与实际功能入口；Shore Pause复刻研究仅作对照，不进入发布目录。

所有本次定稿设计母版长边均超过4096像素。网页只分发缩小的WebP，不将巨大PNG放进Git或首屏。

| 用途 | Lovart 母版尺寸 | 网页文件 | 网页尺寸 / 字节 |
| --- | --- | --- | --- |
| 熊野苔绿封面-3171x5291.png | 3171×5291 | `assets/zine-trail-cover.webp` | 1600×2670 / 262,906 |
| 细纹纸底-3172x5289.png | 3172×5289 | `assets/zine-paper-fine.webp` | 1940×3235 / 363,918 |
| Shore-Pause复刻研究-3171x5291.png | 3171×5291 | 不发布 | — |

## 母版回溯

Lovart 对话 `10b3449d-d66c-4a29-ae2b-6470a61055fd`；最终操作 `upscale_image`。

- [熊野苔绿封面-3171x5291.png](https://a.lovart.ai/artifacts/agent/unIsYRmGWdCDGZjH.png)
  SHA-256: `d4c5c27ea64a90353d5ee95d649ebb36cd6f83b16080a4946295ff254f46f38b`

- [细纹纸底-3172x5289.png](https://a.lovart.ai/artifacts/agent/rFbuGJ1Z09EKYqh5.png)
  SHA-256: `6ddf4d034c82ed173844b5debadc784bceba04facda13f4f233cf46dc91a07de`

- [Shore-Pause复刻研究-3171x5291.png](https://a.lovart.ai/artifacts/agent/RqU5ilQuZLGjOtc7.png)
  SHA-256: `a28cbb274a0f27583efce1acb23f39d12025f05116d0bd45514b011d5e134ee2`

## 真实操作短片

作者提供的 CleanShot 录屏，原长79.2167秒、3160×1766/60fps、无音轨。采用片段为0–19、24–29、33–36、37–44、50–54.5、60–64、69–72秒，合计45.5秒；原速剪接，末尾0.35秒淡出。删去等待和重复停留，没有生成或重绘页面画面。

`assets/kumano-walkthrough.mp4`：1920×1074 / 30fps / 9,586,176字节。

`assets/kumano-walkthrough-poster.jpg`：取自短片第17秒，是真实界面的静帧。

短片覆盖开场、路线、日程与交通，不声称含清单演示。封面、背景用AI纹理；实际视频不叠加纸纹。

旧粗纤维纸、红色封面与A/B/C探索留在开发历史中，发布资产清单仅包含最终采用文件。
