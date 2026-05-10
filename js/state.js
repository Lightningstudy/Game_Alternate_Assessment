// state.js — persistent game state stored in localStorage
const STATE_KEY = "coach-algebra-state-v1";

const defaultState = {
  coins: 0,
  unlocked: { easy: true, medium: false, hard: false },
  best: {
    easy:   { accuracy: 0, score: 0, total: 0, coins: 0, streak: 0 },
    medium: { accuracy: 0, score: 0, total: 0, coins: 0, streak: 0 },
    hard:   { accuracy: 0, score: 0, total: 0, coins: 0, streak: 0 },
  },
  inventory: {
    jersey: ["classic_red"],
    shoes:  ["white"],
    court:  ["hardwood"],
    mascot: ["eagle"],
  },
  equipped: {
    jersey: "classic_red",
    shoes:  "white",
    court:  "hardwood",
    mascot: "eagle",
  },
};

const State = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // shallow merge with defaults for forward-compat
        this.data = {
          ...defaultState,
          ...parsed,
          unlocked:  { ...defaultState.unlocked,  ...(parsed.unlocked  || {}) },
          best:      { ...defaultState.best,      ...(parsed.best      || {}) },
          inventory: { ...defaultState.inventory, ...(parsed.inventory || {}) },
          equipped:  { ...defaultState.equipped,  ...(parsed.equipped  || {}) },
        };
      } else {
        this.data = JSON.parse(JSON.stringify(defaultState));
      }
    } catch {
      this.data = JSON.parse(JSON.stringify(defaultState));
    }
    return this.data;
  },
  save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save state", e);
    }
  },
  reset() {
    this.data = JSON.parse(JSON.stringify(defaultState));
    this.save();
  },
};

State.load();
