# For coding agents

This repository is a **travel roadbook builder**: an agent skill plus a static site template.

- When the user asks to build, import, update, check, or publish a travel roadbook / travel site / itinerary page, read and follow [skill/SKILL.md](skill/SKILL.md). It is the operating procedure; do not improvise a different one.
- Commands: `npm run new -- <example>` · `npm run dev` · `npm run validate` · `npm run gaps` · `npm run build` · `npm run check` · `npm test`. Node 20+ only; there are no dependencies to install.
- The traveler's original materials live in `input/` (git-ignored). Read them; never modify or copy them.
- The single data file is `trip/travel-data.json`. Field reference: [docs/DATA.md](docs/DATA.md).
- Never invent facts. Never write booking references, passport numbers, or private contact details into the data. Never push, deploy, buy, or message without explicit permission for that action.
- When changing the template itself, keep it dependency-free, light-background, and data-driven, and run `npm test`.
