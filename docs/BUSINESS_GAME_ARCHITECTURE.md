# ACHU Business Game — Architecture

This rebuild lives entirely under `src/business-game/` until explicitly promoted.

## Folder ownership

- `app/` — composition only. Creates modules and wires dependencies. No business rules.
- `content/` — authored campaign content: clients, story beats, problems, dialogue, scenarios.
- `domain/` — pure game rules and calculations: quotes, jobs, staff, vehicles, contracts, finance.
- `state/` — save model and state transitions. No rendering code.
- `scene/` — Three.js rendering only. Reads state; never decides game outcomes.
- `ui/` — DOM/UI rendering and input only. Calls store actions; never owns game rules.
- `assets/` — asset manifest and attribution metadata only. Binary assets live under `public/assets/business-game/`.
- `tests/` — deterministic gameplay tests and visual QA helpers.

## Hard rules

1. Never add new business-game logic to legacy `src/data`, `src/game` or `src/game3d`.
2. Never put gameplay rules inside UI click handlers or Three.js objects.
3. Every new mechanic gets one domain module before it gets UI.
4. Campaign text belongs in `content/`, not inside render functions.
5. External 3D assets must have a recorded source, licence and role before use.
6. Prefer files under 300 lines. Split a file before it becomes a mixed-responsibility module.
7. `main` is production. Rebuild work stays on `rebuild/real-business-game` until explicitly approved.
8. The QA mirror branch may contain workflow-only commits; gameplay source truth is `rebuild/real-business-game`.

## Current vertical slice

`lead -> quote -> accepted -> schedule -> travel -> on-site decision -> complete -> payment/review -> word-of-mouth lead`

The next systems must be added in this order:

1. Generic jobs + recurring clients.
2. Capacity calendar and overlapping work.
3. Staff candidates, hiring and wages.
4. Vehicle capacity/cost/reliability.
5. Premises progression driven by real operational limits.
6. Commercial contracts and service-level requirements.
7. Competitors/tenders based on price, rating, response speed and capability.

No abstract building-level progression should be reintroduced unless it represents a real business constraint the player has already encountered.
