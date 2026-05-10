// store.js — locker room: jerseys, shoes, courts, mascots
const Store = {
  currentCat: "jersey",

  show() {
    document.getElementById("store-coins").textContent = State.data.coins;
    this._bindCats();
    this.renderCategory(this.currentCat);
    this.renderPreview();
  },

  _bindCats() {
    document.querySelectorAll(".cat-btn").forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll(".cat-btn").forEach((b) =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
        this.currentCat = btn.dataset.cat;
        this.renderCategory(this.currentCat);
      };
    });
  },

  _collection(cat) {
    return ({
      jersey: Customize.jerseys,
      shoes:  Customize.shoes,
      court:  Customize.courts,
      mascot: Customize.mascots,
    })[cat];
  },

  renderCategory(cat) {
    const grid = document.getElementById("item-grid");
    grid.innerHTML = "";
    const collection = this._collection(cat);
    const owned = State.data.inventory[cat] || [];
    const equipped = State.data.equipped[cat];

    for (const [key, item] of Object.entries(collection)) {
      const card = document.createElement("div");
      card.className = "item-card";
      const isOwned = owned.includes(key);
      const isEquipped = equipped === key;
      if (isEquipped) card.classList.add("equipped");

      // Swatch by category
      let swatch = "";
      if (cat === "mascot") {
        swatch = `<div class="swatch mascot" style="background:#f8f1dd">${item.emoji}</div>`;
      } else if (cat === "court") {
        swatch = `<div class="swatch court" style="background:${item.floor}">
          <span class="court-stripe" style="background:${item.stripe}"></span>
        </div>`;
      } else if (cat === "jersey") {
        swatch = `<div class="swatch" style="background:${item.color}">
          <span style="color:${item.accent};font-weight:800;font-size:24px;font-family:'Lilita One',sans-serif">23</span>
        </div>`;
      } else {
        swatch = `<div class="swatch" style="background:${item.color}">
          <span style="color:${getReadable(item.color)};font-size:11px;font-weight:700">SHOE</span>
        </div>`;
      }

      let action;
      if (!isOwned) {
        const cant = State.data.coins < item.price;
        action = `<button class="buy" data-key="${key}" ${cant ? "disabled" : ""}>
          Buy ${item.price.toLocaleString()} 🪙
        </button>`;
      } else if (isEquipped) {
        action = `<button disabled>✓ Equipped</button>`;
      } else {
        action = `<button class="equip" data-key="${key}">Equip</button>`;
      }

      card.innerHTML = `${swatch}<h4>${item.name}</h4>${action}`;
      grid.appendChild(card);
    }

    grid.querySelectorAll(".buy").forEach((btn) => {
      btn.onclick = () => this.buy(btn.dataset.key);
    });
    grid.querySelectorAll(".equip").forEach((btn) => {
      btn.onclick = () => this.equip(btn.dataset.key);
    });
  },

  buy(key) {
    const cat = this.currentCat;
    const item = this._collection(cat)[key];
    if (!item) return;
    if (State.data.coins < item.price) return;
    State.data.coins -= item.price;
    if (!State.data.inventory[cat].includes(key)) {
      State.data.inventory[cat].push(key);
    }
    State.data.equipped[cat] = key;
    State.save();
    this.show();
  },

  equip(key) {
    const cat = this.currentCat;
    if (!State.data.inventory[cat].includes(key)) return;
    State.data.equipped[cat] = key;
    State.save();
    this.show();
  },

  renderPreview() {
    const cv = document.getElementById("preview-canvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    Customize.drawBackground(ctx);
    const eq = State.data.equipped;
    const jersey = Customize.jerseys[eq.jersey];
    const shoes = Customize.shoes[eq.shoes];

    // Big player figure that takes up most of the canvas height
    const scale = 4.0;
    const footY = cv.height - 30;
    Customize.drawPlayer(ctx, cv.width / 2, footY, jersey, shoes, {
      armsForward: false,
      number: 23,
      scale,
    });

    // Ball at hip level
    const ballX = cv.width / 2 + 80;
    const ballY = footY - 60 * scale * 0.4;
    Customize.drawBall(ctx, ballX, ballY, 24);
  },
};

// Pick a readable text color for a given hex background.
function getReadable(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#1a1a1a" : "#fff";
}
