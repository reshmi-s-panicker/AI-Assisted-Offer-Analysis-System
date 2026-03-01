
# CareerOS: Deterministic Career Companion System
## Flask · Python · Vanilla JS · Modular Architecture
---
CareerOS is a deterministic career decision system that helps users compare job offers, assess placement readiness, generate personalized preparation roadmaps, and track applications.
It also includes structured interview preparation and a resume builder module, bringing offer analysis, strategy planning, and career execution into one unified platform.


---

## 🏗 Architecture

- Multi-page Flask application  
- Modular placement engine  
- Deterministic weighted scoring system  
- In-memory state management (v1)

---

## 🚀 Project Status

**Active Development**

- ✅ Version 1 Complete  
- 🔜 Version 2 Planned:
  - React frontend migration
  - Database integration
  - Authentication system
  - Persistent user state

## 1. Problem Understanding

Career decisions — choosing between job offers, building a placement strategy, or preparing for interviews — are among the highest-stakes choices a student or professional makes. Yet most tools either offer generic advice or leave individuals to make decisions based on gut feel.

CareerOS was built to solve three specific problems:
-	Offer comparison is intuitive, not structured — people pick offers based on CTC alone, ignoring WLB, layoff risk, bond clauses, and growth trajectory.
-	Placement preparation lacks personalization — generic advice does not adapt to remaining days, skill levels, target tier, or role.
-	Progress and pipeline tracking are scattered — applications, tasks, and readiness exist in different spreadsheets with no unified view.

CareerOS unifies these into a single deterministic, transparent, and data-driven system.

---
## 2. Assumptions Made


| Assumption | Rationale |
|------------|------------|
| Users are honest about their skill levels | Readiness scores and roadmap phases depend on self-reported DSA, System Design, Communication, and Resume ratings. |
| Scoring weights are universally applicable | Default weights (CTC=25, Growth=28, WLB=20, Layoff=15, Bond=10, Location=12) reflect common career priorities. Custom weight configuration is planned for future versions. |
| In-memory storage is acceptable for v1 | Applications and strategy data are session-scoped. A database-backed approach is planned for v2. |
| Users target one tier and role at a time | The placement engine generates a single focused roadmap. Multi-tier parallel planning is a future enhancement. |
| CTC is provided in INR | All formatting and normalization assume Indian currency. Multi-currency support may be added later. |
| One session = one user | No authentication is implemented in v1. Multi-user support with login and persistent accounts is planned for v2. |

## Why the solution structured this way

### 3.1 Separation of Concerns

Each module of CareerOS has a single responsibility:
- decision_engine.py — normalizes and scores job offers, returns ranked results
- placement/strategy_generator.py — master coordinator, determines mode and calls sub-engines
- placement/roadmap_builder.py — builds day-by-day phase plans and task lists
- placement/readiness_calculator.py — computes weighted skill readiness score
- placement/risk_assessor.py — evaluates placement risk based on time, tier, and gaps
- placement/task_pool_builder.py — generates role and tier-specific daily task pools
- placement/day_task_generator.py — picks contextual tasks for a specific day
- placement/application_tracker.py — CRUD operations for the job application pipeline

  
### 3.2 Deterministic over AI-driven

A fully AI-driven recommendation system was considered and rejected for three reasons: it behaves as a black box, career decisions require transparency and explainability, and deterministic scoring is reproducible and testable. The current system always shows exactly how a score was computed.



### 3.3  Multi-page Flask over Single-Page App

The initial prototype was a single HTML file with all modules. This was refactored into separate pages (index, offeriq, placement, interview, resume) because each module has independent logic, state, and JS requirements. Loading everything on one page was wasteful and harder to maintain.

 

## 4. Design Decisions and Trade-offs



| Decision | Why | Trade-off |
|-----------|------|-----------|
| Min-max CTC normalization | Enables fair relative comparison across multiple offers instead of relying on absolute salary thresholds | With only one offer, CTC score defaults to midpoint (12 pts equivalent) since no relative comparison is possible |
| Inverse scoring for layoff & bond | Higher layoff rate and longer bond duration are worse for the candidate, so scores are inverted | Uses linear inversion rather than a smooth penalty curve, reducing granularity |
| Mode-based day allocation | Four strategy modes (Deep / Balanced / Fast / Crash) adapt roadmap intensity based on days available | Hard cutoffs at 30/60/90 days — a user with 61 days receives different advice than one with 59 |
| Role-weighted readiness scores | Different roles require different strengths (e.g., resume weight higher for Data Analyst than DSA) | Weights are hardcoded per role and not yet customizable |
| In-memory application tracker | Simple implementation without database setup for v1 | All data resets on server restart or refresh |
| Separate Add + Analyze flow in OfferIQ | Allows multiple offers to be added before scoring, improving normalization accuracy | Slightly more steps compared to single-click analysis |


### 4.1. High-Level Architecture

OfferIQ is composed of the following modules:

1. Input Layer
2. AI-Assisted Insight Module
3. Normalization Module
4. Deterministic Scoring Engine
5. Ranking & Explanation Module


The system separates information gathering (AI) from decision logic (deterministic scoring).

---

## 5. Edge Cases Considered

- Single offer in OfferIQ — CTC normalization defaults to 12/25 pts (midpoint) since min-max cannot compare one value against itself.
- 0 days left — triggers Crash Mode with maximum urgency weighting and no system design phase.
- Expert DSA (level 5) targeting service company — tier modifiers reduce DSA days, roadmap shifts to core fundamentals and communication.
- All fields empty in placement form — validation blocks submission with specific error message listing required fields.
- Layoff rate = 0% — scores maximum 15 pts (safest possible). Layoff rate > 100% is capped at 100%.
- Bond duration = 0 months — scores maximum 10 pts (no lock-in penalty).
- Crash mode + high tier (FAANG) — risk assessor scores maximum risk and suggests switching to a safer tier.
- Day planner requested before strategy generated — returns empty state with prompt to generate strategy first.
- Deleting an application that no longer exists — server-side filter is idempotent, returns current list without error.
- Resume builder with all fields empty — preview shows placeholder text without breaking layout.



---
## 6. How to Run the Project

### Prerequisites
- Python 3.9+
- pip (Python package manager)
- Git (optional, for cloning)

### Setup
- 1. Clone or download the project
git clone <repo-url>
cd careeros
- 2. Install dependencies
pip install flask
- 3. Run the server
python app.py

### Folder Structure


```
careeros/
├── app.py                      → Flask application entry point
├── decision_engine.py          → OfferIQ weighted scoring engine
├── placement/                  → Placement Strategy Engine (modular)
│   ├── strategy_generator.py   → Core orchestrator
│   ├── readiness_calculator.py → Skill readiness scoring
│   ├── risk_assessor.py        → Risk evaluation logic
│   ├── roadmap_builder.py      → Phase construction
│   ├── task_pool_builder.py    → Task generation logic
│   ├── day_task_generator.py   → Daily planner logic
│   └── application_tracker.py  → In-memory tracker (CRUD)
├── templates/                  → Jinja2 HTML templates
└── static/                     → Frontend JS & CSS
```

### Test Routes(for development)


| Route            | What It Tests |
|------------------|--------------|
| `/test-score`    | Readiness calculator with sample skill inputs |
| `/test-risk`     | Risk assessor for FAANG tier with weak skill levels |
| `/test-strategy` | Full placement strategy generation (16-day example) |
| `/test-roadmap`  | Phase roadmap generation for crash mode scenario |
| `/test-taskpool` | Task pool generation for FAANG SDE role |
| `/test-day`      | Day 3 task generation for a 16-day strategy |

---


## 7. What I would Improve with more Time

### 7.1 Database + Multi-user Authentication

The highest priority improvement. Right now all data — applications, strategy, daily task progress — lives in memory and is lost on refresh. With a proper database (PostgreSQL or SQLite) and user login system, each user would have their own persistent account with:
- Personal application pipeline that survives sessions
- Daily task completion tracking with streaks and history
- Saved strategy with day-by-day progress checkpoints
- Multiple strategy versions (on-campus vs off-campus)


### 7.2 Interview and Resume Modules - Move to Backend

Currently the Interview Prep and Resume Builder pages are entirely JavaScript-driven with hardcoded content. Both would be significantly more powerful with backend support:
- Interview questions served from a database, filterable by role/company/difficulty
- Resume data saved per user and exportable as a proper PDF (not just text)
- Resume scoring against ATS keyword lists specific to target job descriptions
- Interview question contributions from community (crowdsourced question bank)


### 7.3 React migration

The current frontend is vanilla HTML/CSS/JS across 5 separate pages. A React migration would enable:
- Single-page application with proper routing (React Router)
- Shared state management across modules (Context API or Redux)
- Component reusability — the card, badge, tab, and form patterns repeat across all pages
- Much smoother animations, transitions, and real-time updates
- Better mobile responsiveness through component-level media queries

### 7.4 Product Deployment

The project is planned for deployment as a real product. The deployment roadmap includes:
- Containerize with Docker for consistent environments
- Deploy on Render, Railway, or AWS EC2 with a proper domain
- Add user waitlist and feedback loop from real users
- Monitor usage with analytics to understand which modules get the most use

### 7.5 OfferIQ - Customizable Weights 

The current scoring weights (CTC=25, Growth=28, etc.) are fixed. Some users prioritize stability over growth or location over salary. A weight customization panel would let users drag sliders to adjust how much each factor matters to them personally.

### 7.6 Placement Engine - ML Scoring Layer 

The current readiness and risk scoring is deterministic and rule-based. With enough user data, these scores could be trained on actual placement outcomes — whether users got offers after following the plan. This would make the scoring genuinely predictive rather than heuristic.

### 7.7 Notification and Reminder System

A daily email or push notification reminding users of their planned tasks for the day, along with follow-up reminders for applications older than 7 days, would significantly improve conversion from "planning" to "doing."

## Technical Notes 

Technical Notes
- All scoring in decision_engine.py uses min-max normalization scaled 1–5, then multiplied by criterion weights.
- The placement engine uses mode detection (Deep/Balanced/Fast/Crash) based on hard day thresholds before applying tier modifiers.
- Flask routes are kept thin — all business logic lives in the placement/ package and decision_engine.py.
- The frontend uses fetch() for all placement API calls with proper JSON headers and error handling.
- The OfferIQ page uses a two-step Add + Analyze flow to enable proper CTC normalization across all offers simultaneously.
- interview.js and resume.js are intentionally lightweight — they handle only UI interactions with no backend dependency.



