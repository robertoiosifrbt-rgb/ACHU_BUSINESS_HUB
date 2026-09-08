# BUILD — v0.3

Mobile-first 2D winter strategy prototype built as a real Vite + PixiJS project.

## Architecture
- PixiJS/WebGL renderer
- Vite build
- Game logic split into data, systems, scene and HUD modules
- Persistent local state
- GitHub Pages production build from `dist/`

## Current systems
- Full-screen draggable/zoomable 2D winter settlement
- Furnace-led building progression
- Building prerequisites, costs, timers and power
- Single construction queue + Alliance Help
- Research Center gated by Furnace 9
- Growth / Economy / Battle research branches
- Independent research queue and prerequisite chains
- Research bonuses that affect construction speed and resource production
- Passive resources and persistent progression

The HTML file is now only the browser boot shell. Game rendering, UI and gameplay logic live under `src/`.
