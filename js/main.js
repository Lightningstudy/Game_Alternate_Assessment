// main.js — screen routing, menu setup, and the math → basketball → results pipeline
const Screens = {
  show(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById("screen-" + name);
    if (target) target.classList.add("active");
    window.scrollTo(0, 0);
  },
};

function refreshMenu() {
  document.getElementById("menu-coins").textContent =
    State.data.coins.toLocaleString();
  document.getElementById("best-easy").textContent   = formatBest("easy");
  document.getElementById("best-medium").textContent = formatBest("medium");
  document.getElementById("best-hard").textContent   = formatBest("hard");

  const medBtn  = document.querySelector("[data-level=medium]");
  const hardBtn = document.querySelector("[data-level=hard]");
  medBtn.disabled  = !State.data.unlocked.medium;
  hardBtn.disabled = !State.data.unlocked.hard;
  document.getElementById("lock-medium").style.display =
    State.data.unlocked.medium ? "none" : "";
  document.getElementById("lock-hard").style.display =
    State.data.unlocked.hard ? "none" : "";

  // Render the team showcase
  const teamCanvas = document.getElementById("team-canvas");
  if (teamCanvas) Customize.drawTeam(teamCanvas, 6);
}

function formatBest(level) {
  const b = State.data.best[level];
  if (!b || b.total === 0) return "";
  return `Best: ${Math.round(b.accuracy)}% (${b.score}/${b.total})`;
}

function startLevel(level) {
  Screens.show("math");
  MathGame.start(level, onMathDone);
}

function onMathDone(result) {
  if (result.total === 0) {
    Screens.show("menu");
    refreshMenu();
    return;
  }
  Screens.show("basketball");
  BBGame.start({
    balls: Math.min(15, result.balls),
    level: result.level,
    onComplete: (bbResult) => onBasketballDone(result, bbResult),
  });
}

function onBasketballDone(mathResult, bbResult) {
  // Total coins = math points + basketball coins
  const mathCoins = mathResult.points || 0;
  const totalEarned = mathCoins + bbResult.coins;

  State.data.coins += totalEarned;

  const best = State.data.best[mathResult.level];
  if (mathResult.accuracy > best.accuracy ||
      (mathResult.accuracy === best.accuracy && mathResult.correct > best.score)) {
    best.accuracy = mathResult.accuracy;
    best.score = mathResult.correct;
    best.total = mathResult.total;
    best.coins = totalEarned;
    best.streak = mathResult.bestStreak;
  }

  let unlockedNew = null;
  if (mathResult.accuracy >= 80) {
    if (mathResult.level === "easy" && !State.data.unlocked.medium) {
      State.data.unlocked.medium = true;
      unlockedNew = "Starter (Medium)";
    } else if (mathResult.level === "medium" && !State.data.unlocked.hard) {
      State.data.unlocked.hard = true;
      unlockedNew = "All-Star (Hard)";
    }
  }

  State.save();

  Screens.show("results");
  document.getElementById("r-accuracy").textContent =
    Math.round(mathResult.accuracy) + "%";
  document.getElementById("r-correct").textContent =
    mathResult.correct + "/" + mathResult.total;
  document.getElementById("r-streak").textContent = mathResult.bestStreak;
  document.getElementById("r-points").textContent = mathCoins;
  document.getElementById("r-balls").textContent = bbResult.ballsUsed;
  document.getElementById("r-coins").textContent = totalEarned;
  document.getElementById("r-pb").textContent =
    Math.round(State.data.best[mathResult.level].accuracy) + "%";

  const banner = document.getElementById("unlock-banner");
  if (unlockedNew) {
    banner.textContent = `🎉 You unlocked ${unlockedNew}!`;
    banner.classList.remove("hidden");
  } else if (mathResult.accuracy >= 80 && mathResult.level === "hard") {
    banner.textContent = `🏆 Championship! ${Math.round(mathResult.accuracy)}% on All-Star.`;
    banner.classList.remove("hidden");
  } else if (mathResult.level !== "hard" && mathResult.total > 0) {
    const need = 80 - Math.round(mathResult.accuracy);
    if (need > 0) {
      banner.textContent = `Need 80%+ to unlock the next level. You're ${need}% short.`;
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  } else {
    banner.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshMenu();

  document.querySelectorAll(".level-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      startLevel(btn.dataset.level);
    });
  });

  document.getElementById("open-store").addEventListener("click", () => {
    Screens.show("store");
    Store.show();
  });
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (confirm("Wipe all progress, coins, and unlocks? This cannot be undone.")) {
      State.reset();
      refreshMenu();
    }
  });

  document.getElementById("quit-math").addEventListener("click", () => {
    if (confirm("End this drill early? Your current results will count.")) {
      MathGame.end("quit");
    }
  });

  document.getElementById("play-again").addEventListener("click", () => {
    startLevel(MathGame.lastLevel);
  });
  document.getElementById("goto-store").addEventListener("click", () => {
    Screens.show("store");
    Store.show();
  });
  document.getElementById("back-menu").addEventListener("click", () => {
    Screens.show("menu");
    refreshMenu();
  });

  document.getElementById("store-back").addEventListener("click", () => {
    Screens.show("menu");
    refreshMenu();
  });
});
