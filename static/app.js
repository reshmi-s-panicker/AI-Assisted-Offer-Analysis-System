/* ============================================================
   OfferIQ — Clean Frontend Logic
   Frontend = UI only
   Backend (Flask + decision_engine.py) handles scoring
   ============================================================ */

// ===== STATE =====
let offers = [];
let msgCount = 0;

// ===== CHAT CONFIG =====
const AI_WELCOME_MESSAGES = [
  "Hello! I'm OfferIQ. Add job offers using the form and I’ll rank them for you.",
  "The deterministic engine will evaluate each offer using weighted scoring."
];

const AI_DEFAULT_REPLIES = [
  "Please add offers using the form on the right.",
  "Once added, I will analyze and rank them instantly.",
  "The decision engine evaluates salary, growth, stability and more."
];

// ===== RANK COLORS =====
const RANK_COLORS = [
  "var(--gold)",
  "var(--accent)",
  "var(--accent3)",
  "var(--muted)",
  "var(--muted)"
];

// ============================================================
// CHAT
// ============================================================

function initChat() {
  AI_WELCOME_MESSAGES.forEach(msg => addMsg(msg, "ai"));
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const val = input.value.trim();
  if (!val) return;

  addMsg(val, "user");
  input.value = "";

  setTimeout(() => {
    const reply = AI_DEFAULT_REPLIES[msgCount % AI_DEFAULT_REPLIES.length];
    addMsg(reply, "ai");
    msgCount++;
  }, 800);
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

// ============================================================
// FORM → SEND TO BACKEND
// ============================================================

function addOffer() {

  const offer = {
    name: document.getElementById("offerName").value.trim(),
    ctc: Number(document.getElementById("ctc").value),
    growth: Number(document.getElementById("growth_potential").value),
    wlb: Number(document.getElementById("wlb").value),
    layoff: Number(document.getElementById("layoff_rate").value),
    bond: Number(document.getElementById("bond_duration").value),
    location: Number(document.getElementById("location").value),
  };

  if (!offer.name) {
    alert("Please enter a company name.");
    return;
  }

  offers.push(offer);

  // JUST CONFIRM ADDED
  addMsg(`Offer "${offer.name}" added. Total offers: ${offers.length}`, "ai");

  clearForm();
}
async function analyzeOffers() {

  if (offers.length < 2) {
    addMsg("Please add at least 2 offers before analyzing.", "ai");
    return;
  }

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ offers: offers })
    });

    const data = await response.json();

    offers = data.ranking;

    renderRankings();

    addMsg(data.explanation, "ai");

  } catch (error) {
    console.error(error);
    alert("Error analyzing offers.");
  }
}

function clearForm() {
  ["offerName", "ctc", "layoff_rate", "bond_duration"].forEach(id => {
    document.getElementById(id).value = "";
  });
  ["growth_potential", "wlb", "location"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

function clearAllOffers() {
  offers = [];
  renderRankings();
  addMsg("All offers cleared. You can start again.", "ai");
}

// ============================================================
// RENDER RANKINGS (Uses Backend Scores)
// ============================================================

function renderRankings() {
  const list = document.getElementById("rankingList");
  const meta = document.getElementById("resultsMeta");

  if (!offers || offers.length === 0) {
    list.innerHTML = `<div class="empty-state">No offers analyzed yet.</div>`;
    meta.textContent = "Awaiting analysis...";
    return;
  }

  meta.textContent = `${offers.length} offer(s) analyzed`;

  list.innerHTML = offers.map((o, i) => {
    const rank = i + 1;
    const color = RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];

    return `
      <div class="offer-rank">
        <div class="rank-num rank-${Math.min(rank, 5)}">${rank}</div>
        <div class="rank-info">
          <div class="rank-name">${o.name}</div>
          <div class="rank-tags">
            <span class="tag">CTC: ${o.ctc}</span>
            <span class="tag">Growth: ${o.growth}</span>
            <span class="tag">Work Life Balance: ${o.wlb}</span>
          </div>
        </div>
        <div class="rank-score">
          <div class="score-val" style="color:${color}">
            ${Math.round(o.total)}
          </div>
          <div class="score-label">Weighted Score</div>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initChat();
  renderRankings();

  document.getElementById("chatInput")
    .addEventListener("keydown", e => {
      if (e.key === "Enter") sendMessage();
    });
});