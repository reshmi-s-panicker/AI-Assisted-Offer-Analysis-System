/* ══════════════════════════════════════════════
   PLACEMENT ENGINE 2.0 — UI ONLY
   All logic lives in placement_engine.py
══════════════════════════════════════════════ */

let placementState = null;
let plannerDay     = 1;
let applications   = [];

/* ══════════════
   GENERATE STRATEGY — calls backend
══════════════ */
function generateStrategy() {
  const days = parseInt(document.getElementById('sb-days').value) || 0;
  const tier = document.getElementById('sb-tier').value;
  const role = document.getElementById('sb-role').value;
  const dsa  = parseInt(document.getElementById('sb-dsa').value) || 1;
  const sd   = parseInt(document.getElementById('sb-sd').value) || 1;
  const type = document.getElementById('sb-type').value;
  const ctc  = document.getElementById('sb-ctc').value;
  const comm = parseInt(document.getElementById('sb-comm').value) || 1;
  const res  = parseInt(document.getElementById('sb-resume').value) || 1;

  if (!days || !tier || !role) {
    alert('Please fill in at least: Days Left, Target Tier, and Target Role.');
    return;
  }

  const btn = document.getElementById('sbGenerateBtn');
  btn.classList.add('loading');
  document.getElementById('sbGenerateLabel').textContent = '⚡ Generating...';

  fetch('/generate_placement_strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days, tier, role, dsa_level: dsa, sd_level: sd, comm_level:comm, resume_level: res, placement_type: type, ctc_range: ctc })
  })
  .then(res => res.json())
  .then(data => {
    placementState = data;
    renderMode(data);
    renderRisk(data);
    renderRoadmap(data);
    renderReadiness(data);
    buildDailyPlan(data);
    updateHeroStats(data);
    document.getElementById('placementTabs').style.display = 'flex';
    switchPTab('roadmap', document.querySelector('.ptab'));
    btn.classList.remove('loading');
    document.getElementById('sbGenerateLabel').textContent = '⚡ Regenerate Strategy';
    document.getElementById('modeBanner').scrollIntoView({ behavior: 'smooth', block: 'start' });
  })
  .catch(err => {
    console.error(err);
    btn.classList.remove('loading');
    document.getElementById('sbGenerateLabel').textContent = '⚡ Generate My Strategy';
    alert('Something went wrong. Please try again.');
  });
}

/* ══════════════
   RENDER FUNCTIONS — UI only
══════════════ */
function renderMode(p) {
  const b = document.getElementById('modeBanner');
  b.className = 'mode-banner active';
  document.getElementById('modeLabel').className = `mode-label ${p.modeColor}`;
  document.getElementById('modeIcon').textContent  = p.modeIcon;
  document.getElementById('modeLabel').textContent = p.modeLabel;
  document.getElementById('modeDesc').textContent  = p.modeDesc;
}

function renderRisk(p) {
  const r = p.risk;
  const b = document.getElementById('riskBanner');
  b.className = `risk-banner active ${r.cls}`;
  document.getElementById('riskIcon').textContent = r.icon;
  document.getElementById('riskText').innerHTML   = `<strong>${r.label}</strong> — ${r.text}`;
}

function renderRoadmap(p) {
  document.getElementById('roadmapDefault').style.display = 'none';
  document.getElementById('dynamicRoadmap').classList.add('active');
  document.getElementById('roadmapTitle').textContent = `${p.modeLabel} — ${p.days}-Day Custom Roadmap`;
  document.getElementById('roadmapPhases').innerHTML = p.phases.map(ph => `
    <div class="drm-phase">
      <div class="drm-dot"></div>
      <div class="drm-phase-label">${ph.label}</div>
      <div class="drm-phase-title">${ph.title}</div>
      <div class="drm-phase-days">📅 ${ph.days} · ${ph.end - ph.start + 1} days</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${ph.tags.map(t => `<span class="tag ${t}">${t.replace('tag-', '')}</span>`).join('')}
      </div>
      <div class="drm-tasks">
        ${ph.tasks.map(t => `<div class="drm-task">${t}</div>`).join('')}
      </div>
    </div>`).join('');
}

function renderReadiness(p) {
  const r = p.readiness;
  const scoreColor = r.overall >= 70 ? 'var(--accent3)' : r.overall >= 45 ? 'var(--gold)' : 'var(--accent2)';
  document.getElementById('readinessNumber').textContent = r.overall;
  document.getElementById('readinessNumber').style.color = scoreColor;
  document.getElementById('readinessBars').innerHTML = r.breakdown.map(b => `
    <div class="rs-row">
      <span class="rs-skill">${b.label}</span>
      <div class="rs-bar-bg"><div class="rs-bar-fill" style="background:${b.color};width:${b.pct}%"></div></div>
      <span class="rs-pct" style="color:${b.color}">${b.pct}%</span>
    </div>`).join('');
  const alert = document.getElementById('rsWeakAlert');
  alert.style.display = 'block';
  alert.innerHTML = `⚠️ &nbsp;Your biggest risk area is <strong>${r.weakest.label}</strong> at ${r.weakest.pct}%. Allocate extra time here immediately.`;
}

function updateHeroStats(p) {
  const ms = { deep: 'DEEP', balanced: 'BAL.', fast: 'FAST', crash: 'CRASH' };
  document.getElementById('pstat-mode').textContent  = ms[p.mode] || p.mode;
  document.getElementById('pstat-score').textContent = p.readiness.overall + '%';
}

/* ══════════════
   DAILY PLANNER — calls backend per day
══════════════ */
function buildDailyPlan(p) {
  if (!p) return;
  plannerDay = 1;
  renderPlannerDay();
}

function renderPlannerDay() {
  if (!placementState) return;
  const p = placementState;

  document.getElementById('plannerDayLabel').textContent = `Day ${plannerDay} of ${p.days}`;
  document.getElementById('plannerDayCount').textContent = `Day ${plannerDay} / ${p.days}`;

  fetch('/get_day_tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day:      plannerDay,
      days:     p.days,
      phases:   p.phases,
      res:      p.res,
      taskPool: p.taskPool
    })
  })
  .then(r => r.json())
  .then(tasks => {
    const container = document.getElementById('plannerTasks');
    if (!tasks.length) {
      container.innerHTML = '<div class="planner-empty">No tasks for this day.</div>';
      return;
    }
    container.innerHTML = tasks.map(t => `
      <div class="pt-item" onclick="togglePTask(this)">
        <div class="pt-check"></div>
        <span class="pt-tag ${t.tag}">${t.tag}</span>
        <span class="pt-text">${t.text}</span>
      </div>`).join('');
  });
}

function togglePTask(el) {
  el.classList.toggle('done');
  el.querySelector('.pt-check').textContent = el.classList.contains('done') ? '✓' : '';
}

function plannerPrev() {
  if (!placementState || plannerDay <= 1) return;
  plannerDay--;
  renderPlannerDay();
}

function plannerNext() {
  if (!placementState || plannerDay >= placementState.days) return;
  plannerDay++;
  renderPlannerDay();
}

/* ══════════════
   TAB SWITCHING
══════════════ */
function switchPTab(name, btn) {
  document.querySelectorAll('.ptab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  document.getElementById('ptab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ══════════════
   APPLICATION TRACKER — calls backend
══════════════ */
function openModal() {
  document.getElementById('appModal').classList.add('active');
  ['m-company', 'm-role'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('m-referral').value = 'no';
  document.getElementById('m-status').value   = 'applied';
  document.getElementById('m-followup').value = '';
  document.getElementById('m-date').value     = new Date().toISOString().split('T')[0];
}

function closeModal() {
  document.getElementById('appModal').classList.remove('active');
}
function updateHeroApps() {
  document.getElementById('pstat-apps').textContent =
  Array.isArray(applications) ? applications.length : 0;
}

function saveApplication() {
  const company = document.getElementById('m-company').value.trim();
  if (!company) { alert('Please enter a company name.'); return; }

  fetch('/add_application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company,
      role:     document.getElementById('m-role').value.trim(),
      date:     document.getElementById('m-date').value,
      referral: document.getElementById('m-referral').value,
      status:   document.getElementById('m-status').value,
      followup: document.getElementById('m-followup').value,
    })
  })
  .then(r => r.json())
  .then(data => {
     applications = Array.isArray(data) ? data : [];
    closeModal();
    renderTracker();
    updateHeroApps();
  });
}

function deleteApplication(id) {
  fetch('/delete_application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  .then(r => r.json())
  .then(data => {
     applications = Array.isArray(data) ? data : [];
    renderTracker();
    updateHeroApps();
  });
}
function updateTrackerStats() {
  if (!Array.isArray(applications)) return;

  const c = s => applications.filter(a => a.status === s).length;

  document.getElementById('ts-applied').textContent   = c('applied');
  document.getElementById('ts-screening').textContent = c('screening');
  document.getElementById('ts-interview').textContent = c('interview');
  document.getElementById('ts-offer').textContent     = c('offer');
  document.getElementById('ts-rejected').textContent  = c('rejected');
}
function renderTracker() {
  const body = document.getElementById('trackerBody');
  if (!applications||!applications.length) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--muted);font-size:.72rem;">No applications tracked yet. Click "+ Add Application" to start.</td></tr>`;
    updateTrackerStats();
    return;
  }
  const sCls = { applied:'status-applied', screening:'status-screening', interview:'status-interview', offer:'status-offer', rejected:'status-rejected', followup:'status-followup' };
  const sLbl = { applied:'Applied', screening:'Screening', interview:'Interview', offer:'🎉 Offer', rejected:'Rejected', followup:'Follow-up' };
  body.innerHTML = applications.map((a, i) => `<tr>
    <td style="color:var(--muted)">${i + 1}</td>
    <td style="font-family:'Syne',sans-serif;font-weight:600">${a.company}</td>
    <td style="color:var(--muted)">${a.role || '—'}</td>
    <td style="color:var(--muted)">${a.date || '—'}</td>
    <td class="${a.referral === 'yes' ? 'ref-yes' : 'ref-no'}">${a.referral === 'yes' ? '✓ Yes' : 'No'}</td>
    <td><span class="status-pill ${sCls[a.status] || 'status-applied'}">${sLbl[a.status] || a.status}</span></td>
    <td style="color:var(--muted)">${a.followup || '—'}</td>
    <td><button class="tracker-del-btn" onclick="deleteApplication('${a.id}')">✕</button></td>
  </tr>`).join('');
  updateTrackerStats();
}




/* ══════════════
   INIT
══════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Close modal when clicking outside
  document.getElementById('appModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // 🔥 LOAD APPLICATIONS FROM BACKEND ON PAGE LOAD
  fetch('/get_applications')
    .then(r => r.json())
    .then(data => {
      applications = Array.isArray(data) ? data : [];
      renderTracker();
      updateHeroApps();
    })
    .catch(err => {
      console.error("Failed to load applications:", err);
      applications = [];
      renderTracker();
    });

});
