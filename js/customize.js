// customize.js — visual catalog and figure-drawing helpers used by the
// store preview and the basketball mini-game.

const Customize = {
  jerseys: {
    classic_red:  { name: "Classic Red",   color: "#c92a2a", accent: "#fcc419", price: 0 },
    royal_blue:   { name: "Royal Blue",    color: "#1864ab", accent: "#ffffff", price: 250 },
    forest:       { name: "Forest Green",  color: "#2f9e44", accent: "#000000", price: 350 },
    sunset:       { name: "Sunset Orange", color: "#fd7e14", accent: "#ffffff", price: 500 },
    soft_pink:    { name: "Soft Pink",     color: "#f783ac", accent: "#ffffff", price: 600 },
    lavender:     { name: "Lavender",      color: "#b197fc", accent: "#ffffff", price: 700 },
    galaxy:       { name: "Galaxy Purple", color: "#5f3dc4", accent: "#fcc419", price: 1100 },
    obsidian:     { name: "Obsidian Gold", color: "#212529", accent: "#fcc419", price: 1800 },
  },

  shoes: {
    white:         { name: "Clean White",  color: "#f1f3f5", price: 0 },
    classic_black: { name: "Black-out",    color: "#1a1a1a", price: 200 },
    crimson:       { name: "Crimson",      color: "#c92a2a", price: 350 },
    cobalt:        { name: "Cobalt",       color: "#1864ab", price: 500 },
    rose:          { name: "Rose Quartz",  color: "#f783ac", price: 650 },
    neon:          { name: "Neon Splash",  color: "#94d82d", price: 850 },
    royal_gold:    { name: "Royal Gold",   color: "#fcc419", price: 1500 },
  },

  courts: {
    hardwood:  { name: "Hardwood Classic", floor: "#d4a056", stripe: "#fff",    wall: "#3d2914", price: 0 },
    outdoor:   { name: "Street Court",     floor: "#5e5d52", stripe: "#fff",    wall: "#1f3a5f", price: 600 },
    beach:     { name: "Beach Court",      floor: "#f5e6c8", stripe: "#1c7ed6", wall: "#9bd6f0", price: 1200 },
    spotlight: { name: "Stadium Lights",   floor: "#a0732e", stripe: "#fcc419", wall: "#0a0a0a", price: 2000 },
    space:     { name: "Lunar Court",      floor: "#393b56", stripe: "#fff",    wall: "#0d0e1c", price: 3500 },
  },

  mascots: {
    eagle:   { name: "Eagles",   emoji: "🦅", price: 0 },
    tiger:   { name: "Tigers",   emoji: "🐯", price: 350 },
    bear:    { name: "Bears",    emoji: "🐻", price: 600 },
    shark:   { name: "Sharks",   emoji: "🦈", price: 900 },
    cheetah: { name: "Cheetahs", emoji: "🐆", price: 1400 },
    rabbit:  { name: "Rabbits",  emoji: "🐇", price: 2200 },
    trees:   { name: "Trees",    emoji: "🌳", price: 4000 },
    robot:   { name: "Cyborgs",  emoji: "🤖", price: 5500 },
    beaver:  { name: "Beavers",  emoji: "🦫", price: 10000 },
  },

  // Render court background, banner, and team logo.
  drawBackground(ctx) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const eq = State.data.equipped;
    const court = this.courts[eq.court] || this.courts.hardwood;
    const jersey = this.jerseys[eq.jersey] || this.jerseys.classic_red;
    const mascot = this.mascots[eq.mascot] || this.mascots.eagle;

    // back wall
    ctx.fillStyle = court.wall;
    ctx.fillRect(0, 0, W, H * 0.16);

    // Floor
    ctx.fillStyle = court.floor;
    ctx.fillRect(0, H * 0.16, W, H * 0.84);

    // Wood plank lines (only on hardwood-ish floors)
    if (eq.court === "hardwood" || eq.court === "spotlight") {
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      for (let y = H * 0.22; y < H; y += 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // Court stripes
    ctx.strokeStyle = court.stripe;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H - 18);
    ctx.lineTo(W, H - 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H + 30, 90, Math.PI, 0, true);
    ctx.stroke();

    // Banner with team name + mascot
    ctx.fillStyle = jersey.color;
    ctx.fillRect(20, 10, W - 40, 50);
    ctx.fillStyle = jersey.accent;
    ctx.fillRect(20, 56, W - 40, 4);

    ctx.font = "32px serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = jersey.accent;
    ctx.fillText(mascot.emoji, 32, 35);

    ctx.font = "bold 22px Lilita One, sans-serif";
    ctx.fillStyle = jersey.accent;
    ctx.fillText(mascot.name.toUpperCase(), 72, 35);

    ctx.textBaseline = "alphabetic";
  },

  // Draw a player figure. (cx, footY) is the bottom-center point.
  // Optional opts.scale (default 1) scales the whole figure.
  drawPlayer(ctx, cx, footY, jersey, shoes, opts = {}) {
    const armsUp = !!opts.armsUp;
    const armsForward = !!opts.armsForward;
    const number = opts.number;
    const skin = opts.skin || "#e8c39e";
    const scale = opts.scale || 1;
    const legPhase = opts.legPhase || 0; // for running animation
    const running = !!opts.running;

    const S = (n) => n * scale;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, footY + S(4), S(22), S(5), 0, 0, Math.PI * 2);
    ctx.fill();

    // legs (shorts)
    const legSwing = running ? Math.sin(legPhase) * S(8) : 0;
    ctx.fillStyle = "#3d2914";
    ctx.fillRect(cx - S(14), footY - S(32), S(8), S(28) + legSwing);
    ctx.fillRect(cx + S(6),  footY - S(32), S(8), S(28) - legSwing);

    // shoes
    ctx.fillStyle = shoes.color;
    ctx.fillRect(cx - S(17), footY - S(8), S(14), S(8));
    ctx.fillRect(cx + S(3),  footY - S(8), S(14), S(8));
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(cx - S(16), footY - S(6), S(12), S(2));
    ctx.fillRect(cx + S(4),  footY - S(6), S(12), S(2));

    // jersey body
    ctx.fillStyle = jersey.color;
    ctx.fillRect(cx - S(19), footY - S(76), S(38), S(44));

    // jersey accent stripes
    ctx.fillStyle = jersey.accent;
    ctx.fillRect(cx - S(19), footY - S(70), S(38), S(3));
    ctx.fillRect(cx - S(19), footY - S(50), S(38), S(3));

    // arms
    ctx.fillStyle = jersey.color;
    if (armsUp) {
      ctx.fillRect(cx - S(24), footY - S(100), S(6), S(28));
      ctx.fillRect(cx + S(18), footY - S(100), S(6), S(28));
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(cx - S(21), footY - S(102), S(5), 0, Math.PI * 2);
      ctx.arc(cx + S(21), footY - S(102), S(5), 0, Math.PI * 2);
      ctx.fill();
    } else if (armsForward) {
      ctx.fillRect(cx - S(24), footY - S(70), S(28), S(6));
      ctx.fillRect(cx + S(18), footY - S(70), S(28), S(6));
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(cx - S(2), footY - S(67), S(5), 0, Math.PI * 2);
      ctx.arc(cx + S(44), footY - S(67), S(5), 0, Math.PI * 2);
      ctx.fill();
    } else {
      const armSwing = running ? Math.cos(legPhase) * S(6) : 0;
      ctx.fillRect(cx - S(24), footY - S(76) - armSwing, S(6), S(28));
      ctx.fillRect(cx + S(18), footY - S(76) + armSwing, S(6), S(28));
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(cx - S(21), footY - S(48) - armSwing, S(5), 0, Math.PI * 2);
      ctx.arc(cx + S(21), footY - S(48) + armSwing, S(5), 0, Math.PI * 2);
      ctx.fill();
    }

    // head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(cx, footY - S(90), S(11), 0, Math.PI * 2);
    ctx.fill();

    // hair
    ctx.fillStyle = "#3d2914";
    ctx.beginPath();
    ctx.arc(cx, footY - S(96), S(11), Math.PI, 2 * Math.PI);
    ctx.fill();

    // jersey number
    if (number !== undefined) {
      ctx.fillStyle = jersey.accent;
      ctx.font = `bold ${Math.round(S(13))}px Lilita One, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(String(number), cx, footY - S(58));
      ctx.textAlign = "start";
    }
  },

  // Draw an injured/dazed indicator (stars over a player's head)
  drawDazed(ctx, cx, headY, t) {
    const stars = 3;
    for (let i = 0; i < stars; i++) {
      const angle = (t / 600 + (i * Math.PI * 2) / stars) % (Math.PI * 2);
      const x = cx + Math.cos(angle) * 18;
      const y = headY - 6 + Math.sin(angle) * 6;
      ctx.fillStyle = "#fcc419";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⭐", x, y);
    }
    ctx.textAlign = "start";
  },

  // Draw the coach (different outfit + clipboard). walkPhase animates legs.
  drawCoach(ctx, cx, footY, walkPhase = 0, opts = {}) {
    const moving = opts.moving !== false;
    const swing = moving ? Math.sin(walkPhase * 2) * 5 : 0;
    const scale = opts.scale || 1;
    const S = (n) => n * scale;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, footY + S(4), S(26), S(6), 0, 0, Math.PI * 2);
    ctx.fill();

    // legs
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(cx - S(14), footY - S(32), S(9), S(28) + S(swing));
    ctx.fillRect(cx + S(5),  footY - S(32), S(9), S(28) - S(swing));

    // dress shoes
    ctx.fillStyle = "#000";
    ctx.fillRect(cx - S(16), footY - S(6), S(14), S(6));
    ctx.fillRect(cx + S(2),  footY - S(6), S(14), S(6));

    // jacket
    ctx.fillStyle = "#1f3a5f";
    ctx.fillRect(cx - S(21), footY - S(78), S(42), S(46));

    // shirt visible (V)
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(cx - S(7), footY - S(78));
    ctx.lineTo(cx, footY - S(56));
    ctx.lineTo(cx + S(7), footY - S(78));
    ctx.fill();

    // tie
    ctx.fillStyle = "#c92a2a";
    ctx.beginPath();
    ctx.moveTo(cx - S(3), footY - S(70));
    ctx.lineTo(cx + S(3), footY - S(70));
    ctx.lineTo(cx + S(4), footY - S(50));
    ctx.lineTo(cx, footY - S(44));
    ctx.lineTo(cx - S(4), footY - S(50));
    ctx.fill();

    // arms
    ctx.fillStyle = "#1f3a5f";
    ctx.fillRect(cx - S(27), footY - S(78), S(6), S(32));
    ctx.fillRect(cx + S(21), footY - S(78), S(6), S(28));

    // clipboard
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx + S(24), footY - S(60), S(14), S(20));
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + S(24), footY - S(60), S(14), S(20));
    ctx.fillStyle = "#999";
    ctx.fillRect(cx + S(28), footY - S(56), S(6), S(1.5));
    ctx.fillRect(cx + S(28), footY - S(52), S(6), S(1.5));
    ctx.fillRect(cx + S(28), footY - S(48), S(6), S(1.5));

    // head
    ctx.fillStyle = "#e8c39e";
    ctx.beginPath();
    ctx.arc(cx, footY - S(92), S(12), 0, Math.PI * 2);
    ctx.fill();

    // cap
    ctx.fillStyle = "#212529";
    ctx.beginPath();
    ctx.arc(cx, footY - S(96), S(12), Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.fillRect(cx - S(5), footY - S(100), S(16), S(4));

    // whistle
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - S(7), footY - S(82));
    ctx.lineTo(cx + S(4), footY - S(64));
    ctx.stroke();
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(cx + S(3), footY - S(65), S(5), S(4));
  },

  // Draw a stack of basketballs (ball pile next to coach)
  drawBallPile(ctx, cx, footY, count) {
    const positions = [
      [0, 0], [-12, 0], [12, 0],
      [-6, -10], [6, -10], [0, -20]
    ];
    for (let i = 0; i < Math.min(count, positions.length); i++) {
      const [dx, dy] = positions[i];
      this.drawBall(ctx, cx + dx, footY - 8 + dy, 9);
    }
    if (count > positions.length) {
      ctx.fillStyle = "#3d2914";
      ctx.font = "bold 12px Lilita One, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("×" + count, cx, footY - 38);
      ctx.textAlign = "start";
    }
  },

  drawBall(ctx, x, y, r) {
    ctx.fillStyle = "#e8773a";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3d2914";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.stroke();
  },

  // Render an entire team lineup with the current customizations.
  // Used by the menu so the player can show off their team.
  drawTeam(canvas, count = 6) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    this.drawBackground(ctx);

    const eq = State.data.equipped;
    const jersey = this.jerseys[eq.jersey];
    const shoes = this.shoes[eq.shoes];

    const margin = 60;
    const span = W - margin * 2;
    const step = count > 1 ? span / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const x = margin + step * i;
      this.drawPlayer(ctx, x, H - 20, jersey, shoes, {
        armsUp: false,
        number: 4 + i,
        scale: 1.05,
      });
    }

    // Coach at end
    this.drawCoach(ctx, margin - 30, H - 20, 0, { moving: false });
  },
};
