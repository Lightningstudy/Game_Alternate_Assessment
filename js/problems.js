// problems.js — math problem generators per level
// All generators return:
//   { prompt, inputType, correct, options?, displayCorrect?, explanation, graph? }

(function () {
  // ---------- helpers ----------
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function nonZero(min, max) {
    let v = rand(min, max);
    while (v === 0) v = rand(min, max);
    return v;
  }
  function shuffle(arr) {
    return arr
      .map((v) => [Math.random(), v])
      .sort((a, b) => a[0] - b[0])
      .map((p) => p[1]);
  }

  function fmtCoef(c, varName) {
    if (c === 0) return "0";
    if (c === 1) return varName;
    if (c === -1) return "-" + varName;
    return c + varName;
  }

  function fmtLinearEq(m, b) {
    if (m === 0) return `y = ${b}`;
    let mPart;
    if (m === 1) mPart = "x";
    else if (m === -1) mPart = "-x";
    else mPart = `${m}x`;
    let bPart = "";
    if (b > 0) bPart = ` + ${b}`;
    else if (b < 0) bPart = ` - ${Math.abs(b)}`;
    return `y = ${mPart}${bPart}`;
  }

  function fmtStandardA(A, C) {
    let aPart = fmtCoef(A, "x");
    if (A === 0) aPart = "";
    let yPart = (A === 0) ? "y" : " + y";
    return `${aPart}${yPart} = ${C}`;
  }

  function fmtAxPlusB(a, b) {
    const aPart = fmtCoef(a, "x");
    if (b === 0) return aPart;
    return `${aPart} ${b > 0 ? "+ " + b : "- " + Math.abs(b)}`;
  }

  function makeMC(correct, distractors) {
    const out = [correct];
    for (const d of distractors) {
      if (out.length >= 4) break;
      if (!out.includes(d)) out.push(d);
    }
    while (out.length < 4) {
      const filler = String(rand(-9, 9));
      if (!out.includes(filler)) out.push(filler);
    }
    return shuffle(out);
  }

  // ---------- EASY ----------
  function pSlope() {
    const m = nonZero(-6, 6);
    const b = rand(-9, 9);
    return {
      prompt: `What is the <strong>slope</strong> of the line<br><span class="eq">${fmtLinearEq(m, b)}</span>?`,
      inputType: "mc",
      correct: String(m),
      options: makeMC(String(m), [String(b), String(-m), String(m + 1)]),
      displayCorrect: `m = ${m}`,
      explanation: `In y = mx + b, the coefficient of x is the slope. Here m = ${m}.`,
    };
  }

  function pIntercept() {
    const m = nonZero(-6, 6);
    const b = rand(-9, 9);
    return {
      prompt: `What is the <strong>y-intercept</strong> of the line<br><span class="eq">${fmtLinearEq(m, b)}</span>?`,
      inputType: "mc",
      correct: String(b),
      options: makeMC(String(b), [String(m), String(-b), String(b + 1)]),
      displayCorrect: `b = ${b}`,
      explanation: `In y = mx + b, the constant term is the y-intercept. Here b = ${b}, so the line crosses the y-axis at (0, ${b}).`,
    };
  }

  function pRewrite() {
    const A = nonZero(-5, 5);
    const C = rand(-10, 10);
    const correctEq = fmtLinearEq(-A, C);
    return {
      prompt: `Rewrite this equation in slope-intercept form (y = mx + b):<br><span class="eq">${fmtStandardA(A, C)}</span>`,
      inputType: "mc",
      correct: correctEq,
      options: makeMC(correctEq, [
        fmtLinearEq(A, C),
        fmtLinearEq(-A, -C),
        fmtLinearEq(A, -C),
      ]),
      displayCorrect: correctEq,
      explanation: `Subtract ${fmtCoef(A, "x")} from both sides: y = ${fmtCoef(-A, "x")} ${C >= 0 ? "+ " + C : "- " + Math.abs(C)}.`,
    };
  }

  function pSlopeSign() {
    const types = ["positive", "negative", "zero", "undefined"];
    const type = types[rand(0, 3)];
    let line;
    if (type === "positive") line = { m: nonZero(1, 4), b: rand(-3, 3) };
    else if (type === "negative") line = { m: -nonZero(1, 4), b: rand(-3, 3) };
    else if (type === "zero") line = { horizontal: rand(-5, 5) };
    else line = { vertical: rand(-5, 5) };
    line.color = "#e8773a";
    line.width = 4;
    return {
      prompt: `What kind of slope does this line have?`,
      graph: { lines: [line], width: 360, height: 300 },
      inputType: "mc",
      correct: type,
      options: shuffle(["positive", "negative", "zero", "undefined"]),
      displayCorrect: type,
      explanation: ({
        positive: "A line that goes up from left to right has a positive slope.",
        negative: "A line that goes down from left to right has a negative slope.",
        zero: "A horizontal line has a slope of 0 (no rise).",
        undefined: "A vertical line has an undefined slope (no run, division by zero).",
      })[type],
    };
  }

  function makeIntersection() {
    let m1, m2;
    do {
      m1 = rand(-3, 3);
      m2 = rand(-3, 3);
    } while (m1 === m2);
    const x0 = rand(-5, 5);
    const y0 = rand(-5, 5);
    const b1 = y0 - m1 * x0;
    const b2 = y0 - m2 * x0;
    return { m1, m2, b1, b2, x0, y0 };
  }

  function pIntersectionGraph() {
    const { m1, m2, b1, b2, x0, y0 } = makeIntersection();
    const correct = `(${x0}, ${y0})`;
    return {
      prompt: `At what point do these two lines intersect?`,
      graph: {
        width: 400,
        height: 320,
        lines: [
          { m: m1, b: b1, color: "#e8773a", width: 3 },
          { m: m2, b: b2, color: "#1864ab", width: 3 },
        ],
      },
      inputType: "mc",
      correct,
      options: makeMC(correct, [
        `(${x0 + 1}, ${y0})`,
        `(${x0}, ${y0 + 1})`,
        `(${-x0}, ${y0})`,
      ]),
      displayCorrect: correct,
      explanation: `Read where the two lines cross: x = ${x0}, y = ${y0}.`,
    };
  }

  // ---------- MEDIUM ----------
  function pSolveX() {
    const x = rand(-8, 8);
    const a = nonZero(-5, 5);
    const b = rand(-9, 9);
    const c = a * x + b;
    return {
      prompt: `Solve for x:<br><span class="eq">${fmtAxPlusB(a, b)} = ${c}</span>`,
      inputType: "mc",
      correct: String(x),
      options: makeMC(String(x), [String(x + 1), String(x - 1), String(-x)]),
      displayCorrect: `x = ${x}`,
      explanation: `${b >= 0 ? "Subtract " + b + " from" : "Add " + Math.abs(b) + " to"} both sides → ${fmtCoef(a, "x")} = ${c - b}. Divide by ${a}: x = ${x}.`,
    };
  }

  function pSolveXTyped() {
    let a, c;
    do {
      a = nonZero(-5, 5);
      c = nonZero(-5, 5);
    } while (a === c);
    const x = rand(-8, 8);
    const b = rand(-9, 9);
    const d = a * x + b - c * x;
    return {
      prompt: `Solve for x. Type the value below.<br><span class="eq">${fmtAxPlusB(a, b)} = ${fmtAxPlusB(c, d)}</span>`,
      inputType: "numeric",
      label: "x =",
      correct: x,
      displayCorrect: `x = ${x}`,
      explanation: `Move the x-terms to one side: ${fmtCoef(a - c, "x")} = ${d - b}. Divide: x = ${x}.`,
    };
  }

  function pPlotPoints() {
    const m = nonZero(-3, 3);
    const b = rand(-5, 5);
    return {
      prompt: `Click <strong>two integer points</strong> on the graph that lie on the line:<br><span class="eq">${fmtLinearEq(m, b)}</span>`,
      graph: { width: 400, height: 320 },
      inputType: "graph-click",
      correct: { m, b },
      displayCorrect: `Any two points on ${fmtLinearEq(m, b)} (e.g. (0, ${b}) and (1, ${m + b}))`,
      explanation: `Pick any x and compute y = ${m}x + ${b}. For example, (0, ${b}) and (1, ${m + b}) both lie on this line.`,
    };
  }

  function pIntersectionMC() {
    const { m1, m2, b1, b2, x0, y0 } = makeIntersection();
    const correct = `(${x0}, ${y0})`;
    return {
      prompt: `Find the intersection of these two lines:<br><span class="eq">${fmtLinearEq(m1, b1)}</span><br><span class="eq">${fmtLinearEq(m2, b2)}</span>`,
      inputType: "mc",
      correct,
      options: makeMC(correct, [
        `(${x0 + 1}, ${y0 - 1})`,
        `(${-x0}, ${y0})`,
        `(${x0}, ${-y0})`,
      ]),
      displayCorrect: correct,
      explanation: `Set the right-hand sides equal: ${m1}x + ${b1} = ${m2}x + ${b2}. Solving gives x = ${x0}, then y = ${y0}.`,
    };
  }

  // ---------- HARD ----------
  function pEqFromGraph() {
    const m = nonZero(-4, 4);
    const b = rand(-6, 6);

    // Pick TWO points to highlight that are visible on the graph.
    // Avoid always showing (0, b). Sometimes still include the y-intercept,
    // but more often pick two arbitrary integer x's with both points on screen.
    const picks = [];
    const tryX = shuffle([-4, -3, -2, -1, 1, 2, 3, 4]);
    for (const x of tryX) {
      const y = m * x + b;
      if (Math.abs(y) > 8) continue;
      picks.push({ x, y });
      if (picks.length === 2) break;
    }
    // Fall back to (0, b) and (1, m+b) only when two non-y-intercept picks fail.
    let pts;
    if (picks.length === 2) pts = picks;
    else pts = [{ x: 0, y: b }, { x: 1, y: m + b }];

    // Decide whether to bias toward the y-intercept (occasionally) just so
    // students still see that pattern. ~25% chance of using (0, b) as one point.
    if (Math.random() < 0.25) {
      pts[0] = { x: 0, y: b };
      // Find a second integer point != (0,b) within range
      for (const x of tryX) {
        const y = m * x + b;
        if (Math.abs(y) > 8) continue;
        if (x === 0) continue;
        pts[1] = { x, y };
        break;
      }
    }

    return {
      prompt: `Find the equation of this line in <strong>y = mx + b</strong> form. Enter the values for m and b.`,
      graph: {
        width: 400,
        height: 320,
        lines: [{ m, b, color: "#e8773a", width: 4 }],
        points: [
          { x: pts[0].x, y: pts[0].y, color: "#1864ab", label: `(${pts[0].x}, ${pts[0].y})` },
          { x: pts[1].x, y: pts[1].y, color: "#1864ab", label: `(${pts[1].x}, ${pts[1].y})` },
        ],
      },
      inputType: "graph-equation",
      correct: { m, b },
      displayCorrect: fmtLinearEq(m, b),
      explanation: `Slope = (rise)/(run) between two points. Y-intercept is where x = 0. Here m = ${m} and b = ${b}, so ${fmtLinearEq(m, b)}.`,
    };
  }

  function pIntersectionTyped() {
    const { m1, m2, b1, b2, x0, y0 } = makeIntersection();
    return {
      prompt: `Solve this system. Type the x and y values of the intersection.<br><span class="eq">${fmtLinearEq(m1, b1)}</span><br><span class="eq">${fmtLinearEq(m2, b2)}</span>`,
      inputType: "numeric-pair",
      correct: { x: x0, y: y0 },
      displayCorrect: `(${x0}, ${y0})`,
      explanation: `Set them equal: ${m1}x + ${b1} = ${m2}x + ${b2} → ${m1 - m2}x = ${b2 - b1} → x = ${x0}. Substitute back: y = ${y0}.`,
    };
  }

  // ---------- export ----------
  const Problems = {
    // Base point value per question, by level
    basePoints: { easy: 10, medium: 25, hard: 50 },
    // Streak bonus tiers. Returns extra points awarded on top of the base.
    streakBonus(streak) {
      if (streak >= 10) return 25;
      if (streak >= 5) return 10;
      if (streak >= 3) return 5;
      return 0;
    },

    byLevel: {
      easy:   [pSlope, pIntercept, pRewrite, pSlopeSign, pIntersectionGraph, pSlope, pIntercept],
      medium: [pSolveX, pSolveXTyped, pPlotPoints, pIntersectionMC, pSolveXTyped, pIntersectionMC, pSlope, pRewrite],
      hard:   [pEqFromGraph, pIntersectionTyped, pEqFromGraph, pIntersectionTyped, pSolveXTyped, pPlotPoints, pIntersectionMC, pIntercept],
    },

    generate(level) {
      const list = this.byLevel[level] || this.byLevel.easy;
      const fn = list[Math.floor(Math.random() * list.length)];
      const p = fn();
      p.level = level;
      p.basePoints = this.basePoints[level];
      return p;
    },

    checkNumeric(input, expected) {
      if (input === undefined || input === null) return false;
      const s = String(input).trim();
      if (s === "") return false;
      let v;
      if (/^-?\d+\s*\/\s*-?\d+$/.test(s)) {
        const [a, b] = s.split("/").map((p) => parseFloat(p.trim()));
        if (!b) return false;
        v = a / b;
      } else {
        v = parseFloat(s);
        if (Number.isNaN(v)) return false;
      }
      return Math.abs(v - expected) < 0.01;
    },
  };

  window.Problems = Problems;
})();
