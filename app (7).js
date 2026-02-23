/* ============================================================
   app.js — OfferIQ Interface Logic
   All scoring/ranking logic is intentionally left as hooks.
   Replace the placeholder functions with your real engine.
   ============================================================ */

// ===== STATE =====
let offers = [];     // holds all added offers
let msgCount = 0;    // tracks chat message round-robin

// ===== CHAT CONFIG =====
// Replace these responses with real AI/backend responses
const AI_WELCOME_MESSAGES = [
  "Hello! I'm OfferIQ. I'll help you analyze and rank offers. Tell me about the offers you'd like to evaluate.",
  "You can also use the quick prompts below or fill out the form on the right to get a full ranking analysis.",
];

const AI_RESPONSE_MAP = {
  "ctc":          "CTC is normalized across all offers using min-max scaling — the highest CTC earns 25 pts, the lowest earns 0 pts, and others are scored proportionally in between.",
  "growth":       "Growth Potential is rated 1–5. Very High (5) = 28 pts, High (4) = 22 pts, Moderate (3) = 15 pts, Low (2) = 8 pts, Very Low (1) = 2 pts.",
  "work life":    "Work-Life Balance is rated 1–5. Excellent (5) = 20 pts, Good (4) = 16 pts, Average (3) = 11 pts, Below Average (2) = 6 pts, Poor (1) = 1 pt.",
  "wlb":          "Work-Life Balance is rated 1–5. Excellent (5) = 20 pts, Good (4) = 16 pts, Average (3) = 11 pts, Below Average (2) = 6 pts, Poor (1) = 1 pt.",
  "layoff":       "Layoff Rate is scored inversely (15 pts max). 0–5% = 15 pts, 6–15% = 11 pts, 16–30% = 7 pts, 31–50% = 3 pts, above 50% = 1 pt.",
  "bond":         "Bond Duration is scored inversely (10 pts max). No bond = 10 pts, 1–6 months = 8 pts, 7–12 months = 6 pts, 13–24 months = 3 pts, 24+ months = 1 pt.",
  "location":     "Location Preference is rated 1–5. Highly Preferred (5) = 2 pts, Preferred (4) = 1.5, Neutral (3) = 1, Slightly (2) = 0.5, Not Preferred (1) = 0 pts.",
};

// Fallback cycling replies when no keyword matches
const AI_DEFAULT_REPLIES = [
  "Could you share the company name and growth potential rating (1–5)?",
  "What's the work-life balance rating and layoff rate percentage for this offer?",
  "Please fill in the form on the right — the engine will score and rank the offer instantly.",
  "Once added via the form, I'll narrate the full score breakdown here.",
];

// ===== SCORING CONFIG =====
// 6 criteria, total max = 100 pts (capped).

const WEIGHTS = {
  ctc:              { label: "CTC",               maxPts: 25, color: "var(--gold)"    },
  growth_potential: { label: "Growth Potential",  maxPts: 28, color: "var(--accent3)" },
  wlb:              { label: "Work-Life Balance",  maxPts: 20, color: "var(--accent)"  },
  layoff_rate:      { label: "Layoff Rate",        maxPts: 15, color: "var(--accent2)" },
  bond_duration:    { label: "Bond Duration",      maxPts: 10, color: "#a0a0c0"        },
  location:         { label: "Location Pref.",     maxPts:  2, color: "#7070a0"        },
};

// ===== POINTWISE SCORING MAPS =====

// CTC (numeric) → pts (25 max) — normalized against peers via min-max
// Band scoring used as fallback for single-offer evaluation
const CTC_BANDS = [
  { min: 5000000, pts: 25 },
  { min: 3000000, pts: 20 },
  { min: 1500000, pts: 15 },
  { min:  800000, pts: 10 },
  { min:  300000, pts:  5 },
  { min:       0, pts:  2 },
];

// Growth Potential (1–5) → pts (28 max)
const GROWTH_SCORE = { 5: 28, 4: 22, 3: 15, 2: 8, 1: 2, 0: 0 };

// Work-Life Balance (1–5) → pts (20 max)
const WLB_SCORE = { 5: 20, 4: 16, 3: 11, 2: 6, 1: 1, 0: 0 };

// Layoff Rate (%) → pts (25 max) — inversely scored
const LAYOFF_BANDS = [
  { max:  5,  pts: 25 },
  { max: 15,  pts: 18 },
  { max: 30,  pts: 11 },
  { max: 50,  pts:  5 },
  { max: 100, pts:  1 },
];

// Bond Duration (months) → pts (15 max) — inversely scored
const BOND_BANDS = [
  { max:  0,  pts: 15 },
  { max:  6,  pts: 12 },
  { max: 12,  pts:  9 },
  { max: 24,  pts:  4 },
  { max: 999, pts:  1 },
];

// Location Preference (1–5) → pts (12 max)
const LOCATION_SCORE = { 5: 12, 4: 9, 3: 6, 2: 3, 1: 0, 0: 0 };

// ===== RANK COLORS =====
const RANK_COLORS = [
  "var(--gold)",
  "var(--accent)",
  "var(--accent3)",
  "var(--muted)",
  "var(--muted)",
];

// ============================================================
// HELPERS
// ============================================================
function bandScoreMax(value, bands) {
  for (const band of bands) {
    if (value <= band.max) return band.pts;
  }
  return bands[bands.length - 1].pts;
}

function bandScoreMin(value, bands) {
  for (const band of bands) {
    if (value >= band.min) return band.pts;
  }
  return bands[bands.length - 1].pts;
}

// CTC min-max normalization across all current offers → 0–25 pts
function normalizeCTC() {
  if (offers.length === 0) return;
  const ctcValues = offers.map(o => parseFloat(o.ctc) || 0);
  const min = Math.min(...ctcValues);
  const max = Math.max(...ctcValues);
  offers.forEach(o => {
    const val = parseFloat(o.ctc) || 0;
    if (max === min) {
      o.ctc_score = 15; // neutral when all same
    } else {
      o.ctc_score = Math.round(((val - min) / (max - min)) * 25);
    }
  });
}

// ============================================================
// SCORING ENGINE — 6 criteria, max 100 pts
// ============================================================
function scoreOffer(offer) {
  let score = 0;

  // 1. CTC — normalized across peers (25 pts max), band fallback for solo entry
  score += offer.ctc_score !== undefined
    ? offer.ctc_score
    : bandScoreMin(parseFloat(offer.ctc) || 0, CTC_BANDS);

  // 2. Growth Potential (1–5 → 28 pts max)
  score += GROWTH_SCORE[parseInt(offer.growth_potential)] ?? 0;

  // 3. Work-Life Balance (1–5 → 20 pts max)
  score += WLB_SCORE[parseInt(offer.wlb)] ?? 0;

  // 4. Layoff Rate (% → 15 pts max, inverse)
  score += bandScoreMax(parseFloat(offer.layoff_rate) || 0, LAYOFF_BANDS);

  // 5. Bond Duration (months → 10 pts max, inverse)
  score += bandScoreMax(parseFloat(offer.bond_duration) || 0, BOND_BANDS);

  // 6. Location Preference (1–5 → 2 pts max)
  score += LOCATION_SCORE[parseInt(offer.location)] ?? 0;

  return Math.min(Math.round(score), 100);
}

// ============================================================
// EXPLANATION ENGINE
// ============================================================
function explainTopOffer(topOffer) {
  const contributions = {
    "CTC":               topOffer.ctc_score ?? bandScoreMin(parseFloat(topOffer.ctc) || 0, CTC_BANDS),
    "Growth Potential":  GROWTH_SCORE[parseInt(topOffer.growth_potential)]           ?? 0,
    "Work-Life Balance": WLB_SCORE[parseInt(topOffer.wlb)]                           ?? 0,
    "Layoff Rate":       bandScoreMax(parseFloat(topOffer.layoff_rate)  || 0, LAYOFF_BANDS),
    "Bond Duration":     bandScoreMax(parseFloat(topOffer.bond_duration) || 0, BOND_BANDS),
    "Location":          LOCATION_SCORE[parseInt(topOffer.location)]                 ?? 0,
  };
  const topFactor = Object.entries(contributions).sort((a, b) => b[1] - a[1])[0][0];
  return `"${topOffer.name}" ranked #1 primarily due to strong performance in <strong>${topFactor}</strong>, which contributed the most points in the weighted decision model.`;
}

// ============================================================
// CHAT
// ============================================================
function initChat() {
  AI_WELCOME_MESSAGES.forEach(msg => addMsg(msg, "ai"));
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const val   = input.value.trim();
  if (!val) return;

  addMsg(val, "user");
  input.value = "";

  setTimeout(showTyping, 400);
  setTimeout(() => {
    removeTyping();
    const key  = Object.keys(AI_RESPONSE_MAP).find(k => val.toLowerCase().includes(k));
    const reply = key
      ? AI_RESPONSE_MAP[key]
      : AI_DEFAULT_REPLIES[msgCount % AI_DEFAULT_REPLIES.length];
    addMsg(reply, "ai");
    msgCount++;
  }, 1600);
}

function sendQuick(text) {
  document.getElementById("chatInput").value = text;
  sendMessage();
}

function addMsg(text, type) {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.innerHTML = `
    <div class="msg-icon">${type === "ai" ? "IQ" : "👤"}</div>
    <div class="msg-bubble">${text}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "msg ai";
  div.id = "typingMsg";
  div.innerHTML = `
    <div class="msg-icon">IQ</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typingMsg");
  if (el) el.remove();
}

// ============================================================
// FORM — COLLECT & SUBMIT OFFER
// ============================================================
function addOffer() {
  const offer = {
    name:             document.getElementById("offerName").value.trim(),
    ctc:              document.getElementById("ctc").value,
    growth_potential: document.getElementById("growth_potential").value,
    wlb:              document.getElementById("wlb").value,
    layoff_rate:      document.getElementById("layoff_rate").value,
    bond_duration:    document.getElementById("bond_duration").value,
    location:         document.getElementById("location").value,
  };

  if (!offer.name) {
    alert("Please enter a company name.");
    return;
  }

  const btn = document.getElementById("analyzeBtn");
  btn.classList.add("loading");
  document.getElementById("analyzeLabel").textContent = "Analyzing...";

  setTimeout(() => {
    offers.push(offer);

    // Re-normalize CTC across ALL offers each time a new one is added
    normalizeCTC();

    // Re-score every offer after normalization
    offers.forEach(o => { o.score = scoreOffer(o); });
    offers.sort((a, b) => b.score - a.score);

    renderRankings();

    const rank = offers.findIndex(o => o.name === offer.name) + 1;
    const isFirst = offers.length === 1;
    const explanation = isFirst ? explainTopOffer(offers[0]) : "";

    addMsg(
      `Offer "${offer.name}" added. Score: <strong>${offer.score}/100</strong>. Ranked #${rank} of ${offers.length}. ${explanation}`,
      "ai"
    );

    // Show the "add next offer" hint after first submission
    showOfferHint(offers.length);

    btn.classList.remove("loading");
    document.getElementById("analyzeLabel").textContent = "+ Add & Analyze Offer";
    clearForm();
    animateBars();

    // Scroll form back into view so user can add next offer
    document.getElementById("analyzeBtn").scrollIntoView({ behavior: "smooth", block: "center" });
  }, 1000);
}

function showOfferHint(count) {
  const hint = document.getElementById("offerHint");
  const hintText = document.getElementById("offerHintText");
  hint.style.display = "flex";
  if (count === 1) {
    hintText.textContent = "✓ First offer added! Fill in the form again above to add your next offer and compare.";
  } else {
    hintText.textContent = `✓ ${count} offers added & ranked. Add more offers above — rankings update automatically.`;
  }
}

function clearAllOffers() {
  if (!confirm(`Remove all ${offers.length} offer(s) and start over?`)) return;
  offers = [];
  document.getElementById("rankingList").innerHTML = `<div class="empty-state">No offers analyzed yet. Add offers using the form above.</div>`;
  document.getElementById("resultsMeta").textContent = "Awaiting analysis...";
  document.getElementById("offerHint").style.display = "none";
  document.getElementById("offerCountBar").style.display = "none";
  document.getElementById("clearAllBtn").style.display = "none";
  addMsg("All offers cleared. You can start a fresh comparison.", "ai");
}

function clearForm() {
  ["offerName", "ctc", "layoff_rate", "bond_duration"].forEach(id => {
    document.getElementById(id).value = "";
  });
  ["growth_potential", "wlb", "location"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

// ============================================================
// RENDER RANKINGS
// ============================================================
function renderRankings() {
  const list = document.getElementById("rankingList");
  const meta = document.getElementById("resultsMeta");
  const countBar = document.getElementById("offerCountBar");
  const clearBtn = document.getElementById("clearAllBtn");
  const countSpan = document.getElementById("offerCount");

  meta.textContent = `${offers.length} offer${offers.length !== 1 ? "s" : ""} analyzed — sorted by score`;

  // Show / hide count bar and clear button
  if (offers.length > 0) {
    countBar.style.display = "flex";
    clearBtn.style.display = "inline-block";
    countSpan.textContent = offers.length;
  } else {
    countBar.style.display = "none";
    clearBtn.style.display = "none";
  }

  if (offers.length === 0) {
    list.innerHTML = `<div class="empty-state">No offers analyzed yet. Add offers using the form above.</div>`;
    return;
  }

  const GROWTH_LABEL   = { 5:"Growth: Very High", 4:"Growth: High", 3:"Growth: Moderate", 2:"Growth: Low", 1:"Growth: Very Low" };
  const WLB_LABEL      = { 5:"WLB: Excellent",   4:"WLB: Good",   3:"WLB: Average",     2:"WLB: Below Avg", 1:"WLB: Poor" };
  const LOCATION_LABEL = { 5:"Loc: Highly Pref", 4:"Loc: Preferred", 3:"Loc: Neutral",   2:"Loc: Slightly",  1:"Loc: Not Pref" };

  list.innerHTML = offers.map((o, i) => {
    const rank  = i + 1;
    const color = RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
    const gl = GROWTH_LABEL[parseInt(o.growth_potential)]   || "";
    const wl = WLB_LABEL[parseInt(o.wlb)]                   || "";
    const ll = LOCATION_LABEL[parseInt(o.location)]          || "";
    const ctcFmt = o.ctc ? `CTC: ${Number(o.ctc).toLocaleString()}` : "";
    return `
      <div class="offer-rank">
        <div class="rank-num rank-${Math.min(rank, 5)}">${rank}</div>
        <div class="rank-info">
          <div class="rank-name">${o.name}</div>
          <div class="rank-tags">
            ${ctcFmt         ? `<span class="tag tag-growth">${ctcFmt}</span>`                             : ""}
            ${gl             ? `<span class="tag tag-product">${gl}</span>`                                : ""}
            ${wl             ? `<span class="tag tag-location">${wl}</span>`                               : ""}
            ${o.layoff_rate  ? `<span class="tag tag-service">Layoff: ${o.layoff_rate}%</span>`           : ""}
            ${o.bond_duration? `<span class="tag tag-location">Bond: ${o.bond_duration}mo</span>`         : ""}
          </div>
        </div>
        <div class="rank-score">
          <div class="score-val" style="color:${color}">${o.score}</div>
          <div class="score-label">/ 100</div>
          <div class="score-bar">
            <div class="score-fill" style="background:${color}" data-w="${o.score}"></div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  setTimeout(animateBars, 100);
}

// ============================================================
// RENDER FACTOR WEIGHT BARS
// ============================================================
function renderFactorBars() {
  const totalPts = Object.values(WEIGHTS).reduce((s, c) => s + c.maxPts, 0); // 100
  const container = document.getElementById("factorBars");
  container.innerHTML = Object.entries(WEIGHTS).map(([key, cfg]) => `
    <div class="factor-row">
      <span class="factor-name">${cfg.label}</span>
      <div class="factor-bar-bg">
        <div class="factor-bar-fill"
             style="background:${cfg.color}"
             data-w="${cfg.maxPts}">
        </div>
      </div>
      <span class="factor-pct" style="color:${cfg.color}">${cfg.maxPts} pts</span>
    </div>
  `).join("");
}

// ============================================================
// ANIMATE SCORE / FACTOR BARS
// ============================================================
function animateBars() {
  document.querySelectorAll("[data-w]").forEach(el => {
    el.style.width = el.dataset.w + "%";
  });
}

// ============================================================
// SCROLL-TRIGGERED BAR ANIMATION
// ============================================================
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) animateBars();
  });
}, { threshold: 0.2 });

// ============================================================
// SMOOTH SCROLL
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll("a[href^='#']").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      document.querySelector(a.getAttribute("href"))
        ?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initChat();
  renderFactorBars();
  renderRankings();
  initSmoothScroll();

  document.querySelectorAll(".factors-card").forEach(el => barObserver.observe(el));

  // Enter key sends chat message
  document.getElementById("chatInput")
    .addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
});
