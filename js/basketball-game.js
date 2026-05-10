// basketball-game.js — coach mini-game (lead-pass drill to cutters)
//
// A spot on the court lights up green and a player cuts toward it from
// somewhere on the perimeter. The coach must CLICK where they want the
// pass to land. The goal: ball arrives at the lit spot just as the cutter
// gets there. Both spatial accuracy (clicked near the spot) and timing
// accuracy (ball lands when cutter arrives) matter. A shrinking shot
// clock forces a quick decision. Difficulty ramps over the session:
// faster cutters, tighter shot clock, smaller error tolerance.
const BBGame = {
  start(opts) {
    this.canvas = document.getElementById("bb-canvas");
    this.ctx = this.canvas.getContext("2d");
    const H = this.canvas.height;

    this.s = {
      ballsTotal: opts.balls,
      ballsResolved: 0,
      runnersSpawned: 0,
      level: opts.level,
      coachX: 90,
      coachY: H - 60,
      coins: 0,
      ratings: { perfect: 0, good: 0, miss: 0, injury: 0 },
      lastRating: null,
      lastEarned: 0,
      ratingShownUntil: 0,

      coachScale: 1.5,
      runnerScale: 1.6,
      ballFlightFrames: 18,

      // Catch spots scattered around the court
      spots: [
        { x: 820, y: 140 },
        { x: 700, y: 220 },
        { x: 580, y: 170 },
        { x: 460, y: 290 },
        { x: 360, y: 180 },
        { x: 250, y: 240 },
      ],
      activeSpotIdx: -1,

      currentRunner: null,
      nextRunnerAt: null,
      shotDeadlineAt: null,
      shotDeadlineDuration: 0,
      runnerNumber: 4,

      throws: [],
      sparkles: [],

      mouseX: -100,
      mouseY: -100,

      ended: false,
      finishingAt: null,
      onComplete: opts.onComplete,
    };

    if (this.s.ballsTotal <= 0) {
      setTimeout(() => {
        opts.onComplete({ coins: 0, ballsUsed: 0, ratings: this.s.ratings });
      }, 800);
      this.draw(performance.now());
      return;
    }

    this._mh = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.s.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.s.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    };
    this._ch = (e) => {
      if (this.s.ended) return;
      const rect = this.canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const cy = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.throwBall(cx, cy);
    };
    this.canvas.addEventListener("mousemove", this._mh);
    this.canvas.addEventListener("click", this._ch);

    this.spawnNextRunner();

    this._loop = this._loop.bind(this);
    this._lastT = performance.now();
    this._raf = requestAnimationFrame(this._loop);
    this.updateHUD();
  },

  cleanup() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this.canvas.removeEventListener("mousemove", this._mh);
    this.canvas.removeEventListener("click", this._ch);
  },

  difficulty() {
    if (this.s.ballsTotal <= 1) return 0;
    return Math.min(1, (this.s.runnersSpawned - 1) / Math.max(1, this.s.ballsTotal - 1));
  },

  spawnNextRunner() {
    if (this.s.runnersSpawned >= this.s.ballsTotal) {
      this.s.currentRunner = null;
      this.s.activeSpotIdx = -1;
      return;
    }
    this.s.runnersSpawned += 1;

    let idx;
    do {
      idx = Math.floor(Math.random() * this.s.spots.length);
    } while (idx === this.s.activeSpotIdx && this.s.spots.length > 1);
    this.s.activeSpotIdx = idx;
    const spot = this.s.spots[idx];

    const d = this.difficulty();
    const speed = 130 + d * 150;             // 130..280 px/s
    const startDist = 230 + Math.random() * 80;
    const angle = Math.random() * Math.PI * 2;
    let startX = spot.x + Math.cos(angle) * startDist;
    let startY = spot.y + Math.sin(angle) * startDist;
    startX = Math.max(-40, Math.min(this.canvas.width + 40, startX));
    startY = Math.max(60, Math.min(this.canvas.height - 30, startY));
    const dx = spot.x - startX;
    const dy = spot.y - startY;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;
    const arrivalMs = (dist / speed) * 1000;

    const now = performance.now();

    this.s.currentRunner = {
      x: startX,
      y: startY,
      targetSpot: idx,
      dirX,
      dirY,
      speed,
      legPhase: 0,
      number: this.s.runnerNumber++,
      thrown: false,
      animState: "running",
      stateTime: 0,
      stars: [],
      arrivalMs,
      spawnedAt: now,
    };

    const baseDeadline = 3500 - d * 1700;    // 3500..1800 ms
    this.s.shotDeadlineAt = now + baseDeadline;
    this.s.shotDeadlineDuration = baseDeadline;
  },

  throwBall(targetX, targetY) {
    const r = this.s.currentRunner;
    if (!r || r.thrown || r.animState !== "running") return;
    const spot = this.s.spots[r.targetSpot];
    const now = performance.now();

    const flightMs = this.s.ballFlightFrames * 16;
    const ballArrivalAt = now + flightMs;
    const cutterArrivalAt = r.spawnedAt + r.arrivalMs;
    const timingErr = ballArrivalAt - cutterArrivalAt;
    const spatialErr = Math.hypot(targetX - spot.x, targetY - spot.y);

    const d = this.difficulty();
    const spatialPerfect = 36 - d * 10;      // 36..26 px
    const spatialGood    = 80 - d * 22;      // 80..58 px
    const timingPerfect  = 280 - d * 130;    // 280..150 ms
    const timingGood     = 620 - d * 250;    // 620..370 ms

    let rating;
    if (spatialErr <= spatialPerfect && Math.abs(timingErr) <= timingPerfect) {
      rating = "PERFECT";
    } else if (spatialErr <= spatialGood && Math.abs(timingErr) <= timingGood) {
      rating = "GOOD";
    } else if (timingErr > timingGood && spatialErr <= spatialGood) {
      rating = "INJURY";
    } else {
      rating = "MISS";
    }

    r.thrown = true;
    const mult = { PERFECT: 2.5, GOOD: 1.0, MISS: 0.1, INJURY: 0 }[rating];
    const base = ({ easy: 5, medium: 12, hard: 25 })[this.s.level] || 5;
    const earned = Math.round(base * mult);
    this.s.coins += earned;
    this.s.ratings[rating.toLowerCase()] += 1;
    this.s.lastRating = rating;
    this.s.lastEarned = earned;
    this.s.ratingShownUntil = now + 1100;
    this.s.shotDeadlineAt = null;

    const cs = this.s.coachScale;
    this.s.throws.push({
      sx: this.s.coachX + 24 * cs,
      sy: this.s.coachY - 110 * cs,
      tx: targetX,
      ty: targetY,
      progress: 0,
      duration: flightMs,
      rating,
      runner: r,
    });

    if (rating === "PERFECT") this._spawnSparkles(targetX, targetY);
  },

  _resolveRunnerOutcome(rating, runner) {
    if (rating === "PERFECT" || rating === "GOOD") {
      runner.animState = "caught";
    } else if (rating === "INJURY") {
      runner.animState = "injured";
      for (let i = 0; i < 4; i++) runner.stars.push(Math.random() * Math.PI * 2);
    } else {
      runner.animState = "missed";
    }
    runner.stateTime = 0;
  },

  _spawnSparkles(x, y) {
    for (let i = 0; i < 14; i++) {
      this.s.sparkles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 4 - 1,
        life: 1.0,
        size: Math.random() * 3 + 2,
      });
    }
  },

  _endTurn(ts) {
    this.s.ballsResolved += 1;
    this.s.currentRunner = null;
    this.s.activeSpotIdx = -1;
    this.s.shotDeadlineAt = null;
    this.s.nextRunnerAt = ts + 350;
  },

  _loop(ts) {
    const dt = ts - this._lastT;
    this._lastT = ts;

    const r = this.s.currentRunner;
    if (r) {
      r.legPhase += dt / 80;
      r.stateTime += dt;
      if (r.animState === "running") {
        const stepDist = (r.speed * dt) / 1000;
        r.x += r.dirX * stepDist;
        r.y += r.dirY * stepDist;
        if (r.x < -60 || r.x > this.canvas.width + 60 ||
            r.y < -60 || r.y > this.canvas.height + 60) {
          if (!r.thrown) {
            this.s.ratings.miss += 1;
            this.s.lastRating = "MISS";
            this.s.lastEarned = 0;
            this.s.ratingShownUntil = ts + 800;
          }
          this._endTurn(ts);
        }
      } else if (r.animState === "caught" || r.animState === "missed") {
        const stepDist = (r.speed * dt) / 1000;
        r.x += r.dirX * stepDist;
        r.y += r.dirY * stepDist;
        if (r.stateTime > 900 ||
            r.x < -60 || r.x > this.canvas.width + 60 ||
            r.y < -60 || r.y > this.canvas.height + 60) {
          this._endTurn(ts);
        }
      } else if (r.animState === "injured") {
        if (r.stateTime > 1700) this._endTurn(ts);
      }
    }

    // Shot-clock auto-miss
    if (this.s.shotDeadlineAt !== null && r && !r.thrown && ts > this.s.shotDeadlineAt) {
      r.thrown = true;
      this.s.ratings.miss += 1;
      this.s.lastRating = "MISS";
      this.s.lastEarned = 0;
      this.s.ratingShownUntil = ts + 800;
      this.s.shotDeadlineAt = null;
      r.animState = "missed";
      r.stateTime = 0;
    }

    if (!this.s.currentRunner && this.s.nextRunnerAt !== null && ts >= this.s.nextRunnerAt) {
      this.s.nextRunnerAt = null;
      this.spawnNextRunner();
    }

    for (const t of this.s.throws) {
      const before = t.progress;
      t.progress = Math.min(1, t.progress + dt / t.duration);
      if (before < 1 && t.progress >= 1) {
        this._resolveRunnerOutcome(t.rating, t.runner);
      }
    }
    this.s.throws = this.s.throws.filter((t) => t.progress < 1);

    for (const sp of this.s.sparkles) {
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.18;
      sp.life -= dt / 700;
    }
    this.s.sparkles = this.s.sparkles.filter((sp) => sp.life > 0);

    if (!this.s.ended &&
        this.s.ballsResolved >= this.s.ballsTotal &&
        this.s.throws.length === 0 &&
        !this.s.currentRunner) {
      if (!this.s.finishingAt) this.s.finishingAt = ts + 900;
      if (ts > this.s.finishingAt) {
        this.s.ended = true;
        this.draw(ts);
        this.cleanup();
        this.s.onComplete({
          coins: this.s.coins,
          ballsUsed: this.s.ballsTotal,
          ratings: this.s.ratings,
        });
        return;
      }
    }

    this.draw(ts);
    this.updateHUD();
    this._raf = requestAnimationFrame(this._loop);
  },

  draw(ts) {
    const ctx = this.ctx;
    const W = this.canvas.width;

    Customize.drawBackground(ctx);

    // Court spots — faint white rings, active one is bright pulsing green
    for (let i = 0; i < this.s.spots.length; i++) {
      const sp = this.s.spots[i];
      const isActive = i === this.s.activeSpotIdx;
      if (isActive) {
        const blink = Math.abs(Math.sin(ts / 280));
        const a = 0.55 + blink * 0.4;
        ctx.save();
        ctx.shadowColor = "rgba(60, 235, 110, 1)";
        ctx.shadowBlur = 26;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60, 235, 110, ${a})`;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(20, 130, 50, 1)";
        ctx.stroke();
        ctx.restore();
        // bright inner dot
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
        ctx.stroke();
      }
    }

    // Coach + ball pile
    Customize.drawCoach(ctx, this.s.coachX, this.s.coachY, ts / 200, {
      moving: false,
      scale: this.s.coachScale,
    });
    Customize.drawBallPile(
      ctx, this.s.coachX - 50, this.s.coachY,
      Math.max(0, this.s.ballsTotal - this.s.ballsResolved - (this.s.throws.length > 0 ? 1 : 0))
    );

    // Cutter
    const eq = State.data.equipped;
    const jersey = Customize.jerseys[eq.jersey];
    const shoes = Customize.shoes[eq.shoes];
    const r = this.s.currentRunner;
    if (r) {
      const rs = this.s.runnerScale;
      if (r.animState === "injured") {
        ctx.save();
        ctx.translate(r.x, r.y - 50 * rs);
        ctx.rotate(-Math.PI / 2);
        Customize.drawPlayer(ctx, 0, 0, jersey, shoes, {
          armsForward: false,
          number: r.number,
          scale: rs,
        });
        ctx.restore();
        Customize.drawDazed(ctx, r.x, r.y - 110 * rs, ts);
      } else {
        Customize.drawPlayer(ctx, r.x, r.y, jersey, shoes, {
          running: r.animState === "running" || r.animState === "caught",
          armsForward: r.animState === "running" && !r.thrown,
          legPhase: r.legPhase,
          number: r.number,
          scale: rs,
        });
        if (r.animState === "caught") {
          Customize.drawBall(ctx, r.x - 30 * rs, r.y - 70 * rs, 14);
        }
      }
    }

    // Aim crosshair while a runner is live and undecided
    if (r && !r.thrown) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.s.mouseX, this.s.mouseY, 18, 0, Math.PI * 2);
      ctx.moveTo(this.s.mouseX - 26, this.s.mouseY);
      ctx.lineTo(this.s.mouseX + 26, this.s.mouseY);
      ctx.moveTo(this.s.mouseX, this.s.mouseY - 26);
      ctx.lineTo(this.s.mouseX, this.s.mouseY + 26);
      ctx.stroke();
      ctx.restore();
    }

    // Ball arcs
    for (const t of this.s.throws) {
      const p = t.progress;
      const x = t.sx + (t.tx - t.sx) * p;
      const arc = Math.sin(p * Math.PI) * 160;
      const y = t.sy + (t.ty - t.sy) * p - arc;
      Customize.drawBall(ctx, x, y, 12);
    }

    // Sparkles
    for (const sp of this.s.sparkles) {
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.fillStyle = "#fcc419";
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Shot clock bar
    if (this.s.shotDeadlineAt && r && !r.thrown && this.s.shotDeadlineDuration > 0) {
      const remaining = Math.max(0, this.s.shotDeadlineAt - ts);
      const ratio = remaining / this.s.shotDeadlineDuration;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(20, 20, 220, 22);
      ctx.fillStyle = ratio > 0.5 ? "#69db7c" : ratio > 0.25 ? "#fcc419" : "#fa5252";
      ctx.fillRect(22, 22, (220 - 4) * ratio, 18);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Lilita One, sans-serif";
      ctx.fillText("SHOT CLOCK", 28, 36);
    }

    // Rating popup
    if (this.s.lastRating && ts < this.s.ratingShownUntil) {
      const remaining = (this.s.ratingShownUntil - ts) / 1100;
      const rise = (1 - remaining) * 60;
      ctx.globalAlpha = remaining;
      const colors = {
        PERFECT: "#fcc419",
        GOOD:    "#69db7c",
        MISS:    "#fa5252",
        INJURY:  "#fa5252",
      };
      ctx.fillStyle = colors[this.s.lastRating] || "#fff";
      ctx.font = "bold 38px Lilita One, sans-serif";
      ctx.textAlign = "center";
      const labels = {
        PERFECT: `PERFECT! +${this.s.lastEarned}🪙`,
        GOOD:    `GOOD +${this.s.lastEarned}🪙`,
        MISS:    `MISS!`,
        INJURY:  `INJURED 🤕`,
      };
      const text = labels[this.s.lastRating];
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      const tx = W / 2;
      const ty = 130 - rise;
      ctx.strokeText(text, tx, ty);
      ctx.fillText(text, tx, ty);
      ctx.textAlign = "start";
      ctx.globalAlpha = 1;
    }

    // Throws-left readout
    const left = this.s.ballsTotal - this.s.ballsResolved;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W - 170, 80, 150, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Lilita One, sans-serif";
    ctx.fillText(`Throws left: ${left}`, W - 162, 105);

    // Pace indicator (difficulty tier)
    const d = this.difficulty();
    const tier = d < 0.34 ? "Warm-up" : d < 0.67 ? "Drill" : "Crunch time";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W - 170, 130, 150, 30);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Lilita One, sans-serif";
    ctx.fillText(`Pace: ${tier}`, W - 162, 150);
  },

  updateHUD() {
    const left = this.s.ballsTotal - this.s.ballsResolved;
    document.getElementById("bb-balls").textContent = left;
    document.getElementById("bb-coins").textContent = this.s.coins;
    document.getElementById("bb-best").textContent = this.s.lastRating || "-";
  },
};
