# KEEP IT UP! Game Spec

## One-line concept

A simple freestyle soccer juggling game where the player scores by keeping the ball up with correct timing, body-part choice, and trick commands.

## Target feeling

- Simple to understand
- Hard to master
- Fast restarts
- A little like rhythm action
- A little like freestyle football
- Score-chasing arcade feel

## Camera

2D side view.

The player stands near the bottom center of the screen. The ball moves vertically and slightly horizontally.

## Core loop

1. Ball falls.
2. Player moves under the ball.
3. Player presses a body-part button at the right moment.
4. Ball pops back up.
5. Score and combo increase.
6. Difficulty slowly increases.
7. If the ball hits the ground, the run ends.

## Controls

Keyboard baseline:

- Arrow Left: move left
- Arrow Right: move right
- Arrow Up: trick modifier up
- Arrow Down: trick modifier down
- A: left foot
- D: right foot
- W: chest
- S: head
- Space: start/restart

Touch baseline:

- Left/right movement buttons
- Up/down modifier buttons
- Four body-part buttons

## Modes

### 90 Second Score Attack

The player has 90 seconds to score as much as possible.

### 120 Second Score Attack

The player has 120 seconds to score as much as possible.

### Hardcore

No timer. Continue until the ball drops.

## Body part logic

### Feet

Best for low balls.

- safest
- low score
- good for stabilizing

### Chest

Best for mid-height balls.

- medium score
- can reset rhythm
- can set up tricks

### Head

Best for high balls.

- higher score
- timing should be tighter
- good for maintaining high ball state

## Trick logic

Tricks should not be random casino events.

A trick should succeed when these are good:

- ball height
- player horizontal position
- input timing
- previous move state
- current combo stability

Tricks should fail when:

- ball is too low/high for the trick
- player is not under the ball
- input is too early/late
- previous move makes the body position bad

## Early trick list

- Up + Right Foot: Around the World
- Up + Left Foot: Crossover
- Down + Right Foot: Heel Flick
- Down + Left Foot: Backheel
- Up + Chest: Chest Pop
- Down + Head: Neck Stall

## Scoring draft

- Basic foot: 1 point
- Chest: 2 points
- Head: 3 points
- Small trick: 5-8 points
- Big trick: 10-20 points
- Perfect timing bonus: x2
- Combo bonus every 10 successful touches

## Difficulty draft

As score/combo rises:

- gravity increases slightly
- ball horizontal drift increases slightly
- perfect window shrinks slightly
- trick requirements tighten slightly

Do not make early gameplay punishing.

## First milestone

Make Phase 1 fun:

- player can move left and right
- ball drops in readable arc
- A and D kick the ball
- success depends on timing and position
- score and combo work
- drop ends game
- immediate restart works

No advanced tricks until this feels good.
