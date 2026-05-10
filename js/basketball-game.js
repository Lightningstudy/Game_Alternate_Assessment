// basketball-game.js — coach mini-game (timed throws to running players)
//
// Coach stays on the left with a pile of basketballs. Players run from
// right to left one at a time. The user must press Space (or click) so
// that the ball lands just ahead of the runner — too early and it falls
// short, too late and it bonks the player on the head (injury, no points).
const BBGame = {
  start(opts) {
    this.canvas = document.getElementById("bb-canvas");
    this.ctx = this.canvas.getContext("2d");
    const W = this.canvas.width;
    const H = this.canvas.height;

    this.s = {
      ballsTotal: opts.balls,
      ballsResolved: 0,           // runners whose attempt has concluded
      runnersSpawned: 0,
      level: opts.level,
      coachX: 100,
      coachY: H - 60,
      coins: 0,
      ratings: { perfect: 0, good: 0, miss: 0, injury: 0 },
      lastRating: null,
      lastEarned: 0,
      ratingShownUntil: 0,

      catchX: 380,                // where the ball lands on every throw
      runnerVelocity: 5.0,        // px/frame (~300 px/s at 60fps)
      ballFlightFrames: 28,       // ~470ms
      coachScale: 1.5,
      runnerScale: 1.7,

      currentRunner: null,
      nextRunnerAt: null,
      runnerNumber: 4,

      throws: [],
      sparkles: [],

      ended: false,
      finishingAt: null,
      onComplete: opts.onComplete,
    };

    if (this.s.ballsTotal <= 0) {
      // No balls earned — show a brief message then exit
      setTimeout(() => {
        opts.onComplete({
          coins: 0,
          ballsUsed: 0,
          ratings: this.s.ratings,
        });
      }, 800);
      this.draw(performance.now());
      return;
    }

    this.spawnNextRunner();

    this._kh = (e) => {
      if (e.code === "Space" && !this.s.ended) {
        e.preventDefault();
        this.throwBall();
      }
    };
    this._ch = () => { if (!this.s.ended) this.throwBall(); };
    document.addEventListener("keydown", this._kh);
    this.canvas.addEventListener("click", this._ch);

    this._loop = this._loop.bind(this);
    this._lastT = performance.now();
    this._raf = requestAnimationFrame(this._loop);
    this.updateHUD();
  },

  cleanup() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    document.removeEventListener("keydown", this._kh);
    this.canvas.removeEventListener("click", this._ch);
  },

  spawnNextRunner() {
    if (this.s.runnersSpawned >= this.s.ballsTotal) {
      this.s.currentRunner = null;
      return;
    }
    this.s.runnersSpawned += 1;
    this.s.currentRunner = {
      x: this.canvas.width + 50,
      y: this.canvas.height - 60,
      legPhase: 0,
      number: this.s.runnerNumber++,
      thrown: false,
      animState: "running",       // running | caught | injured | exiting
      stateTime: 0,
      stars: [],                  // dazed visual particles
    };
  },

  throwBall() {
    const r = this.s.currentRunner;
    if (!r || r.thrown || r.animState !== "running") return;

    // Predicted player position when ball lands
    const flightFrames = this.s.ballFlightFrames;
    const predicted = r.x - this.s.runnerVelocity * flightFrames;
    // Offset of player relative to ball-landing point.
    // > 0: player still right of catch (ball ahead of player → catchable)
    // < 0: player past catch (ball behind player → potential head shot)
    const offset = predicted - this.s.catchX;

    let rating;
    if (offset > 50)        rating = "MISS";       // way too early
    else if (offset > 25)   rating = "GOOD";        // early but ok
    else if (offset > 8)    rating = "PERFECT";     // sweet spot
    else if (offset > -3)   rating = "GOOD";        // right on player
    else if (offset > -16)  rating = "INJURY";      // ball lands on head
    else                    rating = "MISS";        // way too late

    r.thrown = true;
    const mult = { PERFECT: 2.5, GOOD: 1.0, MISS: 0.1, INJURY: 0 }[rating];
    const base = ({ easy: 5, medium: 12, hard: 25 })[this.s.level] || 5;
    const earned = Math.round(base * mult);
    this.s.coins += earned;
    this.s.ratings[rating.toLowerCase()] += 1;
    this.s.lastRating = rating;
    this.s.lastEarned = earned;
    this.s.ratingShownUntil = performance.now() + 1100;

    // Schedule the actual outcome at ball-landing
    const cs = this.s.coachScale;
    this.s.throws.push({
      sx: this.s.coachX + 24 * cs,
      sy: this.s.coachY - 110 * cs,
      tx: this.s.catchX,
      ty: this.s.coachY - 110,
      progress: 0,
      duration: flightFrames * 16,
      rating,
      runner: r,
    });

    if (rating === "PERFECT") this._spawnSparkles(this.s.catchX, this.s.coachY - 90);
  },

  _resolveRunnerOutcome(rating, runner) {
    // Called when the ball arc completes
    if (rating === "PERFECT" || rating === "GOOD") {
      runner.animState = "caught";
    } else if (rating === "INJURY") {
      runner.animState = "injured";
      // Spawn dazed stars
      for (let i = 0; i < 4; i++) runner.stars.push(Math.random() * Math.PI * 2);
    } else {
      // MISS — runner keeps running past
      runner.animState = "running";
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

  _loop(ts) {
    const dt = ts - this._lastT;
    this._lastT = ts;

    // Active runner movement & state transitions
    const r = this.s.currentRunner;
    if (r) {
      r.legPhase += dt / 80;
      r.stateTime += dt;
      if (r.animState === "running") {
        r.x -= this.s.runnerVelocity * (dt / 16);
        if (r.x < -60) {
          if (!r.thrown) {
            // Player exited and user never threw — count as MISS
            this.s.ratings.miss += 1;
            this.s.lastRating = "MISS";
            this.s.lastEarned = 0;
            this.s.ratingShownUntil = ts + 800;
          }
          this.s.ballsResolved += 1;
          this.s.currentRunner = null;
          this.s.nextRunnerAt = ts + 350;
        }
      } else if (r.animState === "caught") {
        // Player keeps running with ball
        r.x -= this.s.runnerVelocity * (dt / 16);
        if (r.x < -60) {
          this.s.ballsResolved += 1;
          this.s.currentRunner = null;
          this.s.nextRunnerAt = ts + 350;
        }
      } else if (r.animState === "injured") {
        if (r.stateTime > 1700) {
          this.s.ballsResolved += 1;
          this.s.currentRunner = null;
          this.s.nextRunnerAt = ts + 350;
        }
      }
    }

    // Spawn next runner
    if (!this.s.currentRunner && this.s.nextRunnerAt !== null && ts >= this.s.nextRunnerAt) {
      this.s.nextRunnerAt = null;
      this.spawnNextRunner();
    }

    // Throws
    for (const t of this.s.throws) {
      const before = t.progress;
      t.progress = Math.min(1, t.progress + dt / t.duration);
      if (before < 1 && t.progress >= 1) {
        // Ball just landed — resolve outcome
        this._resolveRunnerOutcome(t.rating, t.runner);
      }
    }
    this.s.throws = this.s.throws.filter((t) => t.progress < 1);

    // Sparkles
    for (const s of this.s.sparkles) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.18;
      s.life -= dt / 700;
    }
    this.s.sparkles = this.s.sparkles.filter((s) => s.life > 0);

    // End condition
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
    const H = this.canvas.height;

    Customize.drawBackground(ctx);

    // Catch-zone marker on the ground (ball-landing X)
    const groundY = H - 30;
    ctx.fillStyle = "rgba(252, 196, 25, 0.45)";
    ctx.fillRect(this.s.catchX - 22, groundY, 44, 16);
    ctx.strokeStyle = "rgba(252, 196, 25, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.s.catchX - 22, groundY, 44, 16);
    ctx.fillStyle = "#3d2914";
    ctx.font = "bold 11px Lilita One, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CATCH", this.s.catchX, groundY + 12);
    ctx.textAlign = "start";

    // Throw-timing marker (where player should be at moment of throw)
    const idealThrowX = this.s.catchX + 15 + this.s.runnerVelocity * this.s.ballFlightFrames;
    const blink = Math.abs(Math.sin(ts / 320));
    const inZone = this.s.currentRunner &&
                   this.s.currentRunner.animState === "running" &&
                   !this.s.currentRunner.thrown &&
                   Math.abs(this.s.currentRunner.x - idealThrowX) < 30;
    ctx.fillStyle = `rgba(94, 196, 132, ${0.18 + blink * 0.35})`;
    ctx.fillRect(idealThrowX - 30, groundY - 3, 60, 8);
    if (inZone) {
      ctx.fillStyle = "rgba(47, 158, 68, 0.85)";
      ctx.font = "bold 18px Lilita One, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("THROW NOW!", idealThrowX, groundY - 14);
      ctx.textAlign = "start";
    }

    // Coach + ball pile
    Customize.drawCoach(ctx, this.s.coachX, this.s.coachY, ts / 200, {
      moving: false,
      scale: this.s.coachScale,
    });
    Customize.drawBallPile(ctx, this.s.coachX - 50, this.s.coachY,
      Math.max(0, this.s.ballsTotal - this.s.ballsResolved - (this.s.throws.length > 0 ? 1 : 0)));

    // Active runner
    const eq = State.data.equipped;
    const jersey = Customize.jerseys[eq.jersey];
    const shoes = Customize.shoes[eq.shoes];
    const r = this.s.currentRunner;
    if (r) {
      const rs = this.s.runnerScale;
      if (r.animState === "injured") {
        // Player on the ground (rotated horizontal)
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

    // Active throws
    for (const t of this.s.throws) {
      const p = t.progress;
      const x = t.sx + (t.tx - t.sx) * p;
      const arc = Math.sin(p * Math.PI) * 160;
      const y = t.sy + (t.ty - t.sy) * p - arc;
      Customize.drawBall(ctx, x, y, 12);
    }

    // Sparkles
    for (const s of this.s.sparkles) {
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = "#fcc419";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

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

    // Throws-left readout (top right)
    const left = this.s.ballsTotal - this.s.ballsResolved;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W - 170, 80, 150, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Lilita One, sans-serif";
    ctx.fillText(`Throws left: ${left}`, W - 162, 105);
  },

  updateHUD() {
    const left = this.s.ballsTotal - this.s.ballsResolved;
    document.getElementById("bb-balls").textContent = left;
    document.getElementById("bb-coins").textContent = this.s.coins;
    document.getElementById("bb-best").textContent = this.s.lastRating || "-";
  },
};
