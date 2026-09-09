# 高清素材记录

2026-09-09，本地候选。Lovart `upscale_image` 放大既有图片；WebP 由返回母版按比例缩小。原始素材保留，未重画旅行事实；超分会推测纹理，不能作为现实细节的新证据。

桌面背景按视口选择 1920 / 3840 宽版本，较窄桌面使用竖图 1600 / 2560；手机保留原图。日程图最高 2560 宽，地图 1920 宽。母版长边均超过 4K，不代表所有竖图宽度达到 3840。

晨雾和水彩插画本来就柔和；这次提高分辨率，保留原有画风。桌面画布最高 2 倍像素密度，总像素不超过 3840×2160；手机上限仍为 1.5。未做帧率基准测试。

横屏森林与晨雾先从原图中心取 16:10，再超分：森林裁切框 `(0,448,1024,1088)`；晨雾 `(0,350,800,850)`。其余使用完整原图。网页编码为 WebP：背景及日程 quality=86，地图 quality=92，缩小算法 LANCZOS。

发布文件合计 34.97 MB（全部文件总和，并非首屏下载量），PNG 母版未打包。

## 网页文件与母版

| 网页文件 | 尺寸 | 字节 | 母版 | SHA-256 |
| --- | --- | ---: | --- | --- |
| `assets/home-dawn-mist-desktop-1920.webp` | 1920×1200 | 26296 | `lovart_35214c05760e.png` | `394654b16438581792bf180d896f498e6e27b528afeb32479281da537185f3cc` |
| `assets/home-dawn-mist-desktop-3840.webp` | 3840×2400 | 79958 | `lovart_35214c05760e.png` | `763cbf6bcd4629e55b308d2209cabae532b55955f894ee94423aef298614ec88` |
| `assets/forest-cover-desktop-1920.webp` | 1920×1200 | 654332 | `lovart_eb76655772af.png` | `2b21feb2c5b21a294eb1e4aa13b711ad1b45d75086b2163d1905512d5beaac57` |
| `assets/forest-cover-desktop-3840.webp` | 3840×2400 | 1617976 | `lovart_eb76655772af.png` | `8869a13302f8c7044b3af146715297ff851def6d859912f41b15a960275b00ef` |
| `assets/coastal-sky-desktop-1920.webp` | 1920×1280 | 185292 | `lovart_2055afbc17e8.png` | `d8439111836fe2dffa2c1a92dffff94904d3839dee686b10b1de99d128192e32` |
| `assets/coastal-sky-desktop-3840.webp` | 3840×2559 | 492206 | `lovart_2055afbc17e8.png` | `fc4094d6eeee9ebeeb5feebd64eb7900c02235864f447dab9565c5fd20e71f52` |
| `assets/home-dawn-mist-portrait-1600.webp` | 1600×2400 | 42952 | `lovart_05f72c9132e7.png` | `60ed2b167c54af51ded7c12d7d1743d922b5813980effedb4e634b449de89940` |
| `assets/home-dawn-mist-portrait-2560.webp` | 2560×3841 | 96496 | `lovart_05f72c9132e7.png` | `eab6b42d66f47167bb857cfa82de2ae0125d6163f4a928603437b68171f4a115` |
| `assets/forest-cover-portrait-1600.webp` | 1600×2400 | 993704 | `lovart_55b128f0e1c5.png` | `a60a90649e1341dbb67f9c1cf22cdbc1d2fa1c32c65ad635b9345c976c9cf675` |
| `assets/forest-cover-portrait-2560.webp` | 2560×3841 | 1839952 | `lovart_55b128f0e1c5.png` | `1bebc1fc1d79dfc2bd1d5181d5a9a7224a79393d08393330c21436df17c7e4ef` |
| `assets/day-wakaura-bay-hd.webp` | 2560×1706 | 653834 | `lovart_22faf50ab3d3.png` | `97ab1cdfbb3bfa44c3d6dcf4220e4035d522ffa4a5f4d32352d80f570cde982b` |
| `assets/day-tea-path-hd.webp` | 2560×1706 | 886684 | `lovart_be1130531b0e.png` | `b438c8d782ff92b2b4fe39d071c7989a1331490e7fb25146ea8f707bc1e6b92a` |
| `assets/nachi-vertical-hd.webp` | 2560×3199 | 1330280 | `lovart_5c8e453eff72.png` | `99cd6a346b1efe2ac5718861abca15d24780380f9c9c5ace755d381912970383` |
| `assets/day-tokyo-arrival-hd.webp` | 2560×1706 | 764086 | `lovart_5e04b5843697.png` | `e19bba483ac4f999af0e076e023e61833b90f98d10e70f1df9c684db7d04d0d9` |
| `assets/day-tokyo-street-hd.webp` | 2560×1706 | 852404 | `lovart_66a5b57d7b1a.png` | `f213a7cae11f6a8e45f1db32c44df9567071efd1bd835a4f4508195e63f4f4af` |
| `assets/day-tokyo-asakusa-hd.webp` | 2560×1706 | 858436 | `lovart_e4368a546fb1.png` | `7f981420ff6c17fae7cf7afa1acb43c0c93c50a178b2cb6f2add522cd936cff9` |
| `assets/day-kawayu-water-hd.webp` | 2560×1706 | 1010822 | `lovart_6d9cc6826b25.png` | `0e9aa43fd012299e15d204b74964664338f23ed81b82bbe9f36dd1b4c91930e4` |
| `assets/route-overview-ai-hd.webp` | 1920×2881 | 1446222 | `lovart_8840b3d8b2a3.png` | `96fca99d1bc883f478e68282e3eec684595c3f85866ab2866153516819675492` |

## 本地母版

母版位于仓库忽略目录 `artifacts/clarity-pass/masters/`，Lovart 对话 `10b3449d-d66c-4a29-ae2b-6470a61055fd`。

| 母版 | 尺寸 | SHA-256 |
| --- | --- | --- |
| `lovart_05f72c9132e7.png` | 3344×5017 | `68ccf57c4cbc9b8764055c18b31ba5cb2747635781dde8eb153f2fd750ad57e8` |
| `lovart_2055afbc17e8.png` | 5017×3344 | `0cdf786397f5843e31207a5d6ff8b80073a308c597f86414ec6471467a2e8ed7` |
| `lovart_22faf50ab3d3.png` | 5017×3344 | `64b9cae0648c09998253225e9741530f2aee344fdb3bb907d85eb10332cc647c` |
| `lovart_35214c05760e.png` | 5181×3238 | `4583fd95f4b3d01acd10b9e61c4ce2f8578b99975d82b57fa8bc2e1d7ea8a6d0` |
| `lovart_55b128f0e1c5.png` | 3344×5017 | `e7e043ed991917c13132ed02613bbe3559722deaf2d7e50ea0ed03fcc4499f6c` |
| `lovart_5c8e453eff72.png` | 3664×4579 | `79c32c7125cb0c13515402854a9dca9185a215c3cc3f776294f6ef12a50cbceb` |
| `lovart_5e04b5843697.png` | 5017×3344 | `5049358b40247ab624755bddf1ce9d65a353774925279469fd09c8db667c5d72` |
| `lovart_66a5b57d7b1a.png` | 5017×3344 | `de2a06787f2aeaa857f974d1f773d7d99403f068402bd4a1d4c85f4d78bbab69` |
| `lovart_6d9cc6826b25.png` | 5017×3344 | `e50ce1ade998dd3735da5b55de913daf3c79fe8b3747fe3346c4bcc6aac13805` |
| `lovart_8840b3d8b2a3.png` | 3344×5017 | `9f62bf1586dc3942b13a32b465e4b02016b5c9f1b56affbb3dc40a25ccaee773` |
| `lovart_be1130531b0e.png` | 5017×3344 | `73a3e149684722aa45bb586285cf37419d0e89742ffec6e9874c690127130285` |
| `lovart_e4368a546fb1.png` | 5017×3344 | `3473e3dd378ed54348d7227c9f7bbb5fb0290f26727514f570622b689d07de7a` |
| `lovart_eb76655772af.png` | 5181×3238 | `5aa6184d547d395b54b163a18338cbe4f38d0e2169111b35699fba042f6fd0ac` |

## 原图校验

| 原图 | SHA-256 |
| --- | --- |
| `assets/home-dawn-mist.webp` | `fd67e329b6d1a7ea361190e9c1f2c9641cc09e5ef1dfd444302200fb88546dfa` |
| `assets/forest-cover.webp` | `75628b79e8ade2146dcd60f2bae84ad37a49bf1538a2d7088df809e41f2cac54` |
| `assets/coastal-sky.webp` | `1a60741e501d8436651b43a822cfae846b589409e972c2a8de294885b2ff6059` |
| `assets/day-wakaura-bay.webp` | `c044d6c6282ddd415e41c9fff6eb79b3ebfc5b188711dc83bf32185934d3157d` |
| `assets/day-tea-path.webp` | `b206d47dfaea3df0b6175079a802883c32d36c9dd80e19224e7f324492adee85` |
| `assets/nachi-vertical.webp` | `14986f52db54ce21e3736dbf04a68ed6407da6e8c806a4756d176de0083dc3e0` |
| `assets/day-tokyo-arrival.webp` | `b3294e00b188ea87038620a28f9d529eaef2904e1a868a4f4255a210313478fa` |
| `assets/day-tokyo-street.webp` | `55104c0141e34f98878eba6b16bf96312d95eea69172da148a3b7530ff2ea717` |
| `assets/day-tokyo-asakusa.webp` | `ad2e05c7f516b588cc14c78252646266c3eaf03fa34e552ebcd2906d56c8edd8` |
| `assets/day-kawayu-water.webp` | `2251478b913ac796c38f60034c7a11e0084cb9788496ecd04d32de6b7f6557c1` |
| `assets/route-overview-ai.png` | `ee764561d87c60a889c44851f9f86e751b457ec29f45a4350966037dde45974b` |
