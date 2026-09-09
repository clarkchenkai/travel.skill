# Scenario J rehearsal — 2026-09-09

Agent: Codex native sub-agent `/root/blind_scenarios_jk`. The session model was inherited; a specific model/version identifier was not exposed by the spawn result.
Reviewer: parent Codex task, after the response artifact was written.
Evidence level: recorded blind proposed-response rehearsal. Not implementation, browser interaction, production or traveler adoption.

## Blinding and input

The agent received only skill/SKILL.md, needed linked references (excluding scenarios.md), and an input-only packet. Expected answers and existing evals were withheld. The input packets were extracted before delegation; the reviewer read the expected column only after all six response files existed. Each agent listed the files it read in its response.

Verbatim scenario input:

> A Morocco trip, no rental, user wants a modern-city look; the old case study was a brush-and-old-road aesthetic from another country

Original response SHA-256: `a9fdbd444511ef4cb549d2ece0fffc12792ae2a916065efe9c62c1210a7a6660`.

## Score

| Criterion | Score | Evidence in the response |
| --- | --- | --- |
| Destination and style | 2 | Honors modern-city direction and rejects motifs from the old country case. |
| No invented modules | 2 | Does not add rental, currency, transport habits or facts without material. |
| Local verification | 2 | Calls for local-language/font and reader-region map checks. |
| Evidence boundary | 2 | Treats timetable as a candidate, not an adopted design. |

Overall: **2/2**, actionable and correctly bounded under the scenario rubric. No critical criterion scored 0.

Skill change made: none; this response did not expose a below-2 skill outcome.

## Recorded response

Only the machine-specific repository path prefix was removed for portability; wording otherwise preserved.

# Scenario J — proposed response / action plan

## Verbatim input

> # Scenario J Country mismatch
>
> A Morocco trip, no rental, user wants a modern-city look; the old case study was a brush-and-old-road aesthetic from another country

## Skill and references read

- `skill/SKILL.md`
- `skill/references/visual-and-motion.md`
- `skill/references/data-and-countries.md`

## Proposed response

我会以“现代城市”为这次摩洛哥路书的视觉约束，不沿用旧案例的毛笔、旧路、陈旧纸张或另一国家的符号。现有模板中，`timetable` 是可以先用于城市行程的候选主题；它只是起点，是否适合仍以实际行程、阅读语言和用户确认的气质为准。

这趟行程没有租车，因此不会添加 `rental`、驾车规则、保险或覆盖表。也不会从“摩洛哥”推断任何未提供的地点、路线、地址、交通习惯、语言、价格或预订状态。

## Concrete proposed actions and checks

1. 读取用户提供的原始行程材料，建立或更新 `trip/travel-data.json`；每个事实保留 `sources` 与 `sourceRefs`。没有订单或用户确认的状态写为 `unknown` 或 `needs-confirmation`。
2. 基于真实目的地和用户“现代城市”要求，设置 `trip.theme`（可先提议 `timetable`）、`trip.locale` 与地图提供商；地图可达性和当地名称/字体覆盖要按实际读者区域、所用语言和地点核验，不能把旧案例的国家习惯带过来。
3. 若“现代城市”仍不足以决定色彩、字形、影像或动效，则在同一份真实行程数据上做 2–3 个本地、可移除的方向供选择；例如以排版、交通信息密度和夜间/日间色调区分。选定后移除比较开关，不把评审界面带入交付。
4. 没有用户照片时，先照常交付无图版本；如用户要求生成图，再先写清用途、主体与情绪、构图、材质与色彩、输出、固定约束、排除项七行 brief。图像不承载时间、价格、状态或路线事实。
5. 若实施，运行 `npm run validate`，在本地预览逐页检查 Home、Map、Days、Transport、Checklist，并以手机与桌面实际裁切/字体可读性检查为准。验证通过只代表结构；打开并操作页面才是运行时观察。

## Uncertainty to preserve

- 目前没有行程材料、城市名单、日期、读者语言或分享范围，不能填写地点、地图查询、时区、交通或公开信息。
- “现代城市”不足以证明 `timetable` 已被用户选定；它是可复核的初始提议，不是既定事实。
