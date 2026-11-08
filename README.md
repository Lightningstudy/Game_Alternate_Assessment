# Coach Algebra

A basketball-themed math game for practicing linear equations and systems of equations. Answer algebra questions against the clock to earn basketballs, then run a lead-pass drill on the court to turn those balls into coins. Spend coins in the Locker Room on jerseys, shoes, courts, and mascots.

## Play it now

**[Play Coach Algebra in your browser](https://lightningstudy.github.io/Game_Alternate_Assessment/)**

No install, no sign-up. Works on desktop browsers (Chrome, Firefox, Edge, Safari). A mouse or trackpad is recommended for the passing drill.

Progress (coins, unlocks, personal bests, purchased gear) is saved in your browser's local storage, so it persists between visits on the same device.

## How it works

Each session has three stages:

1. **Math drill (2 minutes).** Answer as many questions as you can. Each correct answer earns points and one basketball (up to 15). Consecutive correct answers build a streak bonus.
2. **Passing drill.** For each ball you earned, a spot on the court lights up and a player cuts toward it. Click where you want the pass to land so the ball arrives just as the cutter does, before the shot clock runs out. Passes are rated PERFECT, GOOD, MISS, or INJURY and pay out coins accordingly. Cutters get faster and the shot clock tighter as the drill goes on.
3. **Results.** Math points and drill coins are added to your bank. Score 80% or higher on a level to unlock the next one.

### Levels

| Level | Name | Topics | Points / question | Coins / ball |
|---|---|---|---|---|
| 1 | Rookie | Slope, y-intercept, slope-intercept form, slope sign, reading an intersection from a graph | 10 | 5 |
| 2 | Starter | Solving for x (multiple choice and typed), plotting points on a line, finding intersections | 25 | 12 |
| 3 | All-Star | Writing the equation of a graphed line, solving full systems by typing x and y | 50 | 25 |

Rookie is unlocked from the start. Pass Rookie at 80%+ to unlock Starter, and Starter at 80%+ to unlock All-Star.

### Locker Room

Spend coins on cosmetic gear for your team. Prices range from 200 coins for a pair of shoes up to 10,000 coins for the rarest mascot. Equipped items show up on the menu screen and in the passing drill.

## Run it locally

The game is plain HTML, CSS, and JavaScript with no build step or dependencies.

```bash
git clone https://github.com/Lightningstudy/Game_Alternate_Assessment.git
cd Game_Alternate_Assessment
```

Then either open `index.html` directly in a browser, or serve the folder (recommended, avoids browser restrictions on local files):

```bash
python3 -m http.server 8000
```

and visit <http://localhost:8000>.

## Project layout

```
index.html              Screens: menu, math drill, passing drill, results, store
style.css               All styling
js/state.js             Persistent state (localStorage)
js/problems.js          Problem generators for each level
js/graph.js             Canvas graph rendering for graph-based questions
js/math-game.js         Timed math session, scoring, streaks, feedback
js/basketball-game.js   Lead-pass drill mini-game
js/customize.js         Cosmetic items and team rendering
js/store.js             Locker Room UI
js/main.js              Screen routing and the math -> drill -> results flow
```

## Resetting progress

Use the **Reset progress** link on the menu screen. This clears coins, unlocks, personal bests, and purchased gear for this browser.
