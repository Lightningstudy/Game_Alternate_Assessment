// math-game.js — 5-minute math drill session
const MathGame = {
  state: null,
  lastLevel: "easy",

  start(level, onDone) {
    this.lastLevel = level;
    this.state = {
      level,
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      balls: 0,
      points: 0,
      timeLeft: 5 * 60,
      currentProblem: null,
      onDone,
      pendingAdvance: null,
      ended: false,
      paused: true, // wait until pre-game countdown finishes
      feedbackEndsAt: 0,
      feedbackCorrect: false,
    };
    document.getElementById("hud-level").textContent =
      ({ easy: "Rookie", medium: "Starter", hard: "All-Star" })[level];

    // Show personal best
    const best = State.data.best[level];
    document.getElementById("hud-best").textContent =
      best && best.total > 0 ? Math.round(best.accuracy) + "%" : "-";

    // Clear UI
    document.getElementById("problem-area").innerHTML = "";
    document.getElementById("feedback").classList.add("hidden");
    this.updateHUD();

    this.runPregameCountdown(() => {
      this.state.paused = false;
      this._tick = this._tick.bind(this);
      this._lastT = Date.now();
      this._timer = setInterval(this._tick, 100);
      this.nextProblem();
    });
  },

  runPregameCountdown(onDone) {
    const overlay = document.getElementById("pregame-countdown");
    overlay.classList.remove("hidden");
    let n = 5;
    const tick = () => {
      if (n === 0) {
        overlay.innerHTML = `<div class="pregame-num">GO!</div><div class="pregame-tag">DRILL</div>`;
        setTimeout(() => {
          overlay.classList.add("hidden");
          onDone();
        }, 600);
        return;
      }
      overlay.innerHTML = `<div class="pregame-num">${n}</div><div class="pregame-tag">GET READY</div>`;
      n -= 1;
      setTimeout(tick, 1000);
    };
    tick();
  },

  end(reason) {
    if (this.state.ended) return;
    this.state.ended = true;
    if (this._timer) clearInterval(this._timer);
    if (this.state.pendingAdvance) {
      clearTimeout(this.state.pendingAdvance);
      this.state.pendingAdvance = null;
    }
    const accuracy =
      this.state.total > 0 ? (this.state.correct / this.state.total) * 100 : 0;
    this.state.onDone({
      level: this.state.level,
      correct: this.state.correct,
      total: this.state.total,
      accuracy,
      balls: this.state.balls,
      points: this.state.points,
      bestStreak: this.state.bestStreak,
      reason,
    });
  },

  _tick() {
    if (this.state.paused) return;
    const now = Date.now();
    const dt = (now - this._lastT) / 1000;
    this._lastT = now;
    this.state.timeLeft -= dt;
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.updateHUD();
      this.end("time");
      return;
    }
    // Update feedback countdown if active
    if (this.state.feedbackEndsAt && now < this.state.feedbackEndsAt) {
      const remaining = Math.ceil((this.state.feedbackEndsAt - now) / 1000);
      const cdEl = document.getElementById("fb-countdown");
      if (cdEl) cdEl.textContent = remaining;
    }
    this.updateHUD();
  },

  updateHUD() {
    const m = Math.floor(this.state.timeLeft / 60);
    const s = Math.floor(this.state.timeLeft % 60).toString().padStart(2, "0");
    const timeEl = document.getElementById("hud-time");
    timeEl.textContent = `${m}:${s}`;
    const board = timeEl.parentElement;
    board.classList.toggle("warning", this.state.timeLeft <= 30);

    document.getElementById("hud-score").textContent =
      this.state.correct + "/" + this.state.total;
    document.getElementById("hud-points").textContent = this.state.points;
    document.getElementById("hud-streak").textContent = this.state.streak;
    const fire = document.getElementById("hud-fire");
    fire.textContent =
      this.state.streak >= 10 ? "🔥🔥🔥" :
      this.state.streak >= 5  ? "🔥🔥" :
      this.state.streak >= 3  ? "🔥" : "";
    const cell = document.getElementById("streak-cell");
    cell.classList.toggle("hot", this.state.streak >= 5 && this.state.streak < 10);
    cell.classList.toggle("mega", this.state.streak >= 10);
    document.getElementById("hud-balls").textContent = this.state.balls;
  },

  nextProblem() {
    if (this.state.ended) return;
    this.state.feedbackEndsAt = 0;
    const p = Problems.generate(this.state.level);
    this.state.currentProblem = p;
    this.renderProblem(p);
  },

  renderProblem(p) {
    const area = document.getElementById("problem-area");
    area.innerHTML = "";
    document.getElementById("feedback").classList.add("hidden");

    const card = document.createElement("div");
    card.className = "problem-card";

    // Points-per-question badge
    const streakBonus = Problems.streakBonus(this.state.streak);
    const totalWorth = p.basePoints + streakBonus;
    const badge = document.createElement("div");
    badge.className = "points-badge";
    badge.innerHTML =
      `+${totalWorth} pts` +
      (streakBonus > 0
        ? `<span class="bonus">+${streakBonus} streak bonus</span>`
        : "");
    card.appendChild(badge);

    const prompt = document.createElement("div");
    prompt.className = "prompt";
    prompt.innerHTML = p.prompt;
    card.appendChild(prompt);

    let canvas = null;
    if (p.graph) {
      canvas = document.createElement("canvas");
      canvas.width = p.graph.width || 400;
      canvas.height = p.graph.height || 320;
      canvas.className = "problem-graph";
      card.appendChild(canvas);
      Graph.render(canvas, p.graph);
    }

    if (p.inputType === "mc") {
      const choices = document.createElement("div");
      choices.className = "choices";
      p.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "choice";
        btn.innerHTML = opt;
        btn.addEventListener("click", (e) =>
          this.submitAnswer(opt === p.correct, p, opt, e.clientX, e.clientY)
        );
        choices.appendChild(btn);
      });
      card.appendChild(choices);
    } else if (p.inputType === "numeric") {
      const form = document.createElement("form");
      form.className = "numeric-form";
      form.innerHTML = `
        <label>${p.label || "Answer:"}</label>
        <input type="text" name="v" autocomplete="off" inputmode="numeric" />
        <button type="submit">Submit</button>`;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = form.querySelector("[name=v]").value;
        const ok = Problems.checkNumeric(v, p.correct);
        const r = form.querySelector("button").getBoundingClientRect();
        this.submitAnswer(ok, p, v, r.left + r.width / 2, r.top);
      });
      card.appendChild(form);
      setTimeout(() => form.querySelector("input").focus(), 30);
    } else if (p.inputType === "numeric-pair") {
      const form = document.createElement("form");
      form.className = "numeric-form";
      form.innerHTML = `
        <label>x =</label>
        <input type="text" name="x" autocomplete="off" inputmode="numeric" />
        <label>y =</label>
        <input type="text" name="y" autocomplete="off" inputmode="numeric" />
        <button type="submit">Submit</button>`;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const xv = form.querySelector("[name=x]").value;
        const yv = form.querySelector("[name=y]").value;
        const ok =
          Problems.checkNumeric(xv, p.correct.x) &&
          Problems.checkNumeric(yv, p.correct.y);
        const r = form.querySelector("button").getBoundingClientRect();
        this.submitAnswer(ok, p, `(${xv || "?"}, ${yv || "?"})`, r.left + r.width / 2, r.top);
      });
      card.appendChild(form);
      setTimeout(() => form.querySelector("input").focus(), 30);
    } else if (p.inputType === "graph-equation") {
      const form = document.createElement("form");
      form.className = "numeric-form eq-form";
      form.innerHTML = `
        <span>y =</span>
        <input type="text" name="m" autocomplete="off" inputmode="numeric" />
        <span>x +</span>
        <input type="text" name="b" autocomplete="off" inputmode="numeric" />
        <button type="submit">Submit</button>`;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const mv = form.querySelector("[name=m]").value;
        const bv = form.querySelector("[name=b]").value;
        const ok =
          Problems.checkNumeric(mv, p.correct.m) &&
          Problems.checkNumeric(bv, p.correct.b);
        const r = form.querySelector("button").getBoundingClientRect();
        this.submitAnswer(ok, p, `y = ${mv}x + ${bv}`, r.left + r.width / 2, r.top);
      });
      card.appendChild(form);
      setTimeout(() => form.querySelector("input").focus(), 30);
    } else if (p.inputType === "graph-click") {
      const helper = document.createElement("p");
      helper.className = "graph-helper";
      helper.textContent = "Click two distinct integer points. You can undo or change before submitting.";
      card.appendChild(helper);

      // Controls: Undo, Submit
      const ctrls = document.createElement("div");
      ctrls.className = "click-controls";
      ctrls.innerHTML = `
        <button type="button" class="undo">↶ Undo last point</button>
        <button type="button" class="submit" disabled>Submit ✓</button>`;
      card.appendChild(ctrls);

      const points = [];
      let locked = false;
      const undoBtn = ctrls.querySelector(".undo");
      const submitBtn = ctrls.querySelector(".submit");

      const redraw = () => {
        Graph.render(canvas, p.graph);
        for (const pt of points) {
          Graph.drawClickPoint(canvas, p.graph, pt, "#1864ab");
        }
        if (points.length === 2) {
          Graph.drawLineThroughPoints(canvas, p.graph, points, "#1864ab");
        }
        submitBtn.disabled = points.length !== 2 || locked;
        undoBtn.disabled = points.length === 0 || locked;
      };

      canvas.style.cursor = "crosshair";
      canvas.addEventListener("click", (e) => {
        if (locked || points.length >= 2) return;
        const rect = canvas.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
        const gp = Graph.pixelToGrid(canvas, p.graph, px, py);
        if (points.some((q) => q.x === gp.x && q.y === gp.y)) return;
        points.push(gp);
        redraw();
      });

      undoBtn.addEventListener("click", () => {
        if (locked) return;
        points.pop();
        redraw();
      });

      submitBtn.addEventListener("click", (e) => {
        if (locked || points.length !== 2) return;
        locked = true;
        submitBtn.disabled = true;
        undoBtn.disabled = true;

        const ok = points.every(
          (pt) => Math.abs(pt.y - (p.correct.m * pt.x + p.correct.b)) < 0.01
        );
        Graph.drawLineThroughPoints(
          canvas, p.graph, points, ok ? "#2f9e44" : "#c92a2a"
        );
        if (!ok) {
          // overlay the correct line
          const ctx = canvas.getContext("2d");
          const o = Object.assign({}, Graph.defaults, p.graph);
          Graph._drawLine(ctx, canvas.width, canvas.height, o, {
            m: p.correct.m,
            b: p.correct.b,
            color: "#2f9e44",
            width: 3,
          });
        }
        const r = submitBtn.getBoundingClientRect();
        setTimeout(
          () => this.submitAnswer(
            ok, p,
            points.map((pt) => `(${pt.x}, ${pt.y})`).join(" & "),
            r.left + r.width / 2, r.top
          ),
          400
        );
      });

      redraw();
    }

    area.appendChild(card);
  },

  submitAnswer(correct, p, given, sourceX, sourceY) {
    if (this.state.ended) return;
    this.state.total += 1;
    if (correct) {
      this.state.correct += 1;
      this.state.streak += 1;
      if (this.state.streak > this.state.bestStreak) {
        this.state.bestStreak = this.state.streak;
      }
      if (this.state.balls < 15) this.state.balls += 1;
      const bonus = Problems.streakBonus(this.state.streak);
      const earned = p.basePoints + bonus;
      this.state.points += earned;
      this.showFloatPoints(sourceX, sourceY, earned, bonus);
      this.spawnConfetti(sourceX, sourceY);
      this.showFeedback(true);
      this.state.pendingAdvance = setTimeout(() => this.nextProblem(), 850);
    } else {
      this.state.streak = 0;
      this.showFeedback(false, p, given);
      this.state.feedbackEndsAt = Date.now() + 5000;
      this.state.pendingAdvance = setTimeout(() => this.nextProblem(), 5000);
    }
    this.updateHUD();
  },

  showFeedback(correct, p) {
    const fb = document.getElementById("feedback");
    fb.classList.remove("hidden", "correct", "wrong");
    fb.classList.add(correct ? "correct" : "wrong");
    if (correct) {
      const msgs = [
        "Bucket! 🏀",
        "Swish! Nothing but net.",
        "Drained it!",
        "Got one — you earned a ball!",
        "Splash 💦",
      ];
      fb.innerHTML = `<strong>${msgs[Math.floor(Math.random() * msgs.length)]}</strong>`;
    } else {
      const correctText = p.displayCorrect ||
        (typeof p.correct === "object" ? JSON.stringify(p.correct) : String(p.correct));
      fb.innerHTML = `
        <strong>Off the rim. Correct answer: ${correctText}</strong>
        <p class="explain">${p.explanation || ""}</p>
        <p class="countdown" id="fb-countdown">5</p>`;
    }
  },

  showFloatPoints(x, y, total, bonus) {
    if (x === undefined || y === undefined) return;
    const el = document.createElement("div");
    el.className = "float-points";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.innerHTML = `+${total}` + (bonus > 0 ? `<span class="bonus">🔥 +${bonus}</span>` : "");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  },

  spawnConfetti(x, y) {
    const layer = document.getElementById("confetti-layer");
    if (!layer) return;
    const colors = ["#e8773a", "#fcc419", "#1864ab", "#c92a2a", "#2f9e44", "#5f3dc4", "#f783ac"];
    const cx = x !== undefined ? x : window.innerWidth / 2;
    const cy = y !== undefined ? y : window.innerHeight / 2;
    for (let i = 0; i < 26; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.background = colors[i % colors.length];
      piece.style.left = cx + "px";
      piece.style.top = cy + "px";
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 200;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist + 100;
      piece.style.setProperty("--dx", dx + "px");
      piece.style.setProperty("--dy", dy + "px");
      piece.style.animationDelay = (Math.random() * 0.1) + "s";
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 1700);
    }
  },
};
