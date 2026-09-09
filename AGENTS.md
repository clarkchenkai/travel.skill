# Travel workspace for coding agents

Use the user's language and actual trip constraints. The gallery defaults to English; that does not prescribe every traveler's language or visual style.

## Select the relevant skill

- Planning, bookings, budget, companions, changes and settlement: [travel-management](skills/travel-management/SKILL.md).
- Turning materials into a usable website, integration and delivery: [travel-product-studio](skills/travel-product-studio/SKILL.md).
- Visual direction, comparison and refinement: [design-with-ai](skills/design-with-ai/SKILL.md).
- Selecting, modifying or creating templates, pages and modules: [travel-template-studio](skills/travel-template-studio/SKILL.md).
- Cross-border requirements, complex travel and evidence-based acceptance: [travel-verification](skills/travel-verification/SKILL.md).

Read only the skills and references relevant to the task. Their canonical content lives in `skills/`; discovery files for individual agents only point there. `skill/SKILL.md` remains a compatible command-oriented entry.

## Shared execution rules

- Existing templates are starting points. Generate the code needed for the user's task; do not force a fixed theme, country, page count or module list.
- Keep original materials in `input/` or the user's original location; never modify or publish them. Store public travel facts separately from private companion files and receipt originals.
- Do not invent facts, bookings, eligibility, company policy or current rules. User confirmation is evidence of the stated decision; independent verification of details is separate.
- Use stable IDs and one source per fact. A data change must update its dependent views; personal checks do not prove supplier action or multi-user synchronization.
- Respect authorization already given. Planning does not itself authorize a purchase, cancellation, message or public deployment. Re-check uncertain external transaction status before retrying.
- Build and inspect the actual artifact. Run relevant logic tests and browser tasks; distinguish static validity, runtime behavior, publication, target-network access and real adoption.

## Commands

`npm run new -- <example>` · `npm run new -- --from <trip> --trip <new-trip>` · `npm run new -- --blank --trip <trip>` · `npm run template -- --trip <trip>` · `npm run dev` · `npm run validate` · `npm run gaps` · `npm run build` · `npm run check` · `npm test`.

Node.js 20+; the core has no installed dependencies. A trip-local `template/` is automatically used by preview/build; declare its additional source files in `template/manifest.json`. Unknown draft facts should remain unknown until supplied; a blank draft must be completed before a production build passes validation.

Finish with the result, usable entry, actual verification and the shortest next step. Do not claim a rule exists merely because a checklist mentions it.
