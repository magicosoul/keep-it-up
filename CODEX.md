# Codex Development Guide

You are working on KEEP IT UP!, a simple but skill-based freestyle soccer juggling game.

## Main rule

Do not build everything at once.

Make one small playable improvement at a time, then verify it runs.

## Product goal

The game should feel simple, readable, and addictive.

The player keeps a soccer ball in the air by choosing the correct body part and timing:

- right foot
- left foot
- chest
- head

The player can move left and right to stay under the ball.

Directional modifiers create tricks:

- Up + foot = aerial trick
- Down + foot = heel/backheel style trick
- Up + chest = chest pop
- Down + head = neck stall style trick

Big tricks should score more points but require better timing and position.

## Development phases

### Phase 1: Core foot juggling

Build only:

- ball physics
- player horizontal movement
- right foot and left foot inputs
- score and combo
- drop = game over

Success criteria:

- The game is playable for at least 20-30 seconds with normal skill.
- Basic juggling feels responsive.
- The ball does not feel random or unfair.

### Phase 2: Body parts

Add:

- chest input
- head input
- height zones
- readable visual feedback

Success criteria:

- Low ball = feet
- Mid ball = chest
- High ball = head
- Wrong body part should usually fail or weaken control.

### Phase 3: Modes

Add:

- 90 second score attack
- 120 second score attack
- Hardcore mode until ball drop
- best score per mode

### Phase 4: Tricks

Add command tricks gradually:

- Up + right foot: Around the World
- Up + left foot: Crossover
- Down + right foot: Heel Flick
- Down + left foot: Backheel
- Up + chest: Chest Pop
- Down + head: Neck Stall

Important:

Do not use pure randomness as the main failure system.
Failure should mostly come from timing, height, horizontal position, and previous move state.

### Phase 5: Art and polish

Add:

- pixel art character sprite
- pixel art ball
- background
- sound effects
- hit sparks
- combo feedback

## Code rules

- Keep files small.
- Put constants in `src/config.js`.
- Put input handling in `src/input.js`.
- Put physics helpers in `src/physics.js`.
- Put trick definitions in `src/tricks.js`.
- Put game loop and state in `src/game.js`.
- Keep `src/main.js` as the boot entry.

## Verification

After changes, run:

```bash
npm install
npm run build
```

If build fails, fix it before stopping.

## Current priority

Start with Phase 1 only.

Do not add chest, head, or complex tricks until basic foot juggling feels good.
