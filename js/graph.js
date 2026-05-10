// graph.js — coordinate-plane rendering helper for math problems
const Graph = {
  defaults: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },

  render(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const o = Object.assign({}, this.defaults, opts);
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    this._drawGrid(ctx, W, H, o);
    this._drawAxes(ctx, W, H, o);

    if (opts.lines) opts.lines.forEach((l) => this._drawLine(ctx, W, H, o, l));
    if (opts.points) opts.points.forEach((p) => this._drawPoint(ctx, W, H, o, p));
  },

  _gridToPixel(W, H, o, x, y) {
    return {
      px: ((x - o.xMin) / (o.xMax - o.xMin)) * W,
      py: H - ((y - o.yMin) / (o.yMax - o.yMin)) * H,
    };
  },

  pixelToGrid(canvas, opts, px, py) {
    const o = Object.assign({}, this.defaults, opts || {});
    const W = canvas.width;
    const H = canvas.height;
    return {
      x: Math.round((px / W) * (o.xMax - o.xMin) + o.xMin),
      y: Math.round(((H - py) / H) * (o.yMax - o.yMin) + o.yMin),
    };
  },

  _drawGrid(ctx, W, H, o) {
    ctx.strokeStyle = "#ece4d2";
    ctx.lineWidth = 1;
    for (let x = o.xMin; x <= o.xMax; x++) {
      const { px } = this._gridToPixel(W, H, o, x, 0);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (let y = o.yMin; y <= o.yMax; y++) {
      const { py } = this._gridToPixel(W, H, o, 0, y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }
  },

  _drawAxes(ctx, W, H, o) {
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    const origin = this._gridToPixel(W, H, o, 0, 0);
    ctx.beginPath();
    ctx.moveTo(0, origin.py);
    ctx.lineTo(W, origin.py);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(origin.px, 0);
    ctx.lineTo(origin.px, H);
    ctx.stroke();

    ctx.fillStyle = "#222";
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    const skip = (o.xMax - o.xMin) > 14 ? 2 : 1;
    for (let x = o.xMin; x <= o.xMax; x++) {
      if (x === 0) continue;
      if (Math.abs(x) % skip !== 0) continue;
      const { px, py } = this._gridToPixel(W, H, o, x, 0);
      ctx.fillText(String(x), px - 5, py + 13);
    }
    for (let y = o.yMin; y <= o.yMax; y++) {
      if (y === 0) continue;
      if (Math.abs(y) % skip !== 0) continue;
      const { px, py } = this._gridToPixel(W, H, o, 0, y);
      ctx.fillText(String(y), px + 4, py + 4);
    }
  },

  _drawLine(ctx, W, H, o, line) {
    ctx.strokeStyle = line.color || "#e8773a";
    ctx.lineWidth = line.width || 3;
    ctx.beginPath();
    if (line.vertical !== undefined) {
      const { px } = this._gridToPixel(W, H, o, line.vertical, 0);
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
    } else if (line.horizontal !== undefined) {
      const { py } = this._gridToPixel(W, H, o, 0, line.horizontal);
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
    } else {
      const x1 = o.xMin;
      const x2 = o.xMax;
      const y1 = line.m * x1 + line.b;
      const y2 = line.m * x2 + line.b;
      const p1 = this._gridToPixel(W, H, o, x1, y1);
      const p2 = this._gridToPixel(W, H, o, x2, y2);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    ctx.stroke();
  },

  _drawPoint(ctx, W, H, o, pt) {
    const { px, py } = this._gridToPixel(W, H, o, pt.x, pt.y);
    ctx.fillStyle = pt.color || "#1864ab";
    ctx.beginPath();
    ctx.arc(px, py, pt.r || 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (pt.label) {
      ctx.fillStyle = "#222";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(pt.label, px + 9, py - 7);
    }
  },

  // Public helpers used by interactive 'graph-click' problems
  drawClickPoint(canvas, opts, gp, color) {
    const ctx = canvas.getContext("2d");
    const o = Object.assign({}, this.defaults, opts || {});
    this._drawPoint(ctx, canvas.width, canvas.height, o, {
      x: gp.x,
      y: gp.y,
      color: color || "#1864ab",
    });
  },

  drawLineThroughPoints(canvas, opts, points, color) {
    if (points.length < 2) return;
    const ctx = canvas.getContext("2d");
    const o = Object.assign({}, this.defaults, opts || {});
    const dx = points[1].x - points[0].x;
    if (dx === 0) {
      this._drawLine(ctx, canvas.width, canvas.height, o, {
        vertical: points[0].x,
        color: color || "#1864ab",
        width: 2,
      });
      return;
    }
    const m = (points[1].y - points[0].y) / dx;
    const b = points[0].y - m * points[0].x;
    this._drawLine(ctx, canvas.width, canvas.height, o, {
      m, b, color: color || "#1864ab", width: 2,
    });
  },
};
