# KEEP IT UP!

A simple soccer juggling game prototype.

This repository is set up for Codex-driven development. The goal is not to make a huge game immediately. The goal is to build the core juggling feel first, then add tricks, scoring, assets, and polish step by step.

## Current direction

KEEP IT UP! is a small 2D freestyle soccer juggling game.

Core modes:

- 90 second score attack
- 120 second score attack
- Hardcore mode, continuing until the ball drops

Core controls:

- Move left / right
- Right foot
- Left foot
- Chest
- Head
- Up / down direction modifiers for trick commands

## Development stack

- Vite
- Vanilla JavaScript
- HTML Canvas
- CSS

## How to run locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Codex workflow

Read `CODEX.md` first.

Do not try to finish the entire game in one task. Work in small steps:

1. Make basic foot juggling feel good.
2. Add chest and head control.
3. Add timer modes and hardcore mode.
4. Add trick commands.
5. Add pixel art assets.
6. Tune scoring and difficulty.

## Project structure

```text
keep-it-up/
├─ index.html
├─ package.json
├─ README.md
├─ CODEX.md
├─ GAME_SPEC.md
├─ src/
│  ├─ main.js
│  ├─ game.js
│  ├─ input.js
│  ├─ physics.js
│  ├─ tricks.js
│  └─ config.js
└─ styles/
   └─ style.css
```
