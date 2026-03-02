# Research Log — CareerOS: Deterministic Career Companion System

This document records all AI prompts used, reference material consulted, search queries made, and decisions about what was accepted, modified, or rejected from AI suggestions during the development of CareerOS.

---

## Prompt 1 — Initial Domain Exploration: Skincare System

**Prompt:**

I want to build something around decision-making. Maybe like a skincare recommendation system? Users input skin type and concerns, and it suggests products. How do I structure something like that logically?

**Search Queries Ran:**

- "skincare recommendation system logic structure"
- "decision system with qualitative inputs"

**References That Influenced the Approach:**

- Articles on rule-based recommendation systems for consumer products
- Reddit threads on skincare concern variability (acne, sensitivity, hormonal)

**What Was Accepted:**

- The core idea of breaking a decision into measurable components and scoring them

**What Was Modified:**

- Narrowed the domain to oily skin only to reduce scope — but this still proved too qualitative

**What Was Rejected:**

- The skincare domain entirely — medically sensitive, highly qualitative, and hard to quantify responsibly within time constraints. Risk of giving misleading recommendations was too high.

---

## Prompt 2 — Domain Pivot: Quantifiable Decision Problems

**Prompt:**

Okay this skincare idea is getting complicated. Even oily skin has acne, sensitivity, hormonal stuff… it's becoming too subjective. Can you suggest decision problems where the inputs are measurable and numeric? Something I can actually score properly?

**Search Queries Ran:**

- "decision problems with quantifiable numeric inputs"
- "weighted scoring system examples student projects"

**References That Influenced the Approach:**

- MCDM (Multi-Criteria Decision Making) theory articles on weighted scoring
- Examples of scoring systems in HR tech and financial comparison tools

**What Was Accepted:**

- The principle of choosing a domain where all inputs can be placed on a numeric scale
- Guidance to look for problems with clear cost-type and benefit-type criteria

**What Was Modified:**

- Explored college recommender as an intermediate option before landing on placements

**What Was Rejected:**

- College recommender system — required large-scale data collection (NAAC, NIRF, placement stats) that would shift the project from logic-building to data-engineering

---

## Prompt 3 — Placement Strategy Generator Concept

**Prompt:**

What if I build something for placements? Like a strategy generator based on days left, company type, role, skill level etc. Can this be turned into a weighted logic system?

**Search Queries Ran:**

- "placement preparation strategy generator logic"
- "weighted scoring system for skill-based roadmap"
- "study plan generator based on time and skill level"

**References That Influenced the Approach:**

- Articles on spaced repetition and adaptive learning systems
- Career blogs outlining FAANG vs service company preparation differences

**What Was Accepted:**

- Using tier (FAANG / Product / Service), role (SDE / ML / Analyst), skill levels, and days remaining as core inputs
- The idea of generating a personalized roadmap based on these variables

**What Was Modified:**

- Originally conceived as a single output (a static roadmap). Expanded to include readiness scoring, risk assessment, and a day-by-day task planner as the scope grew.

**What Was Rejected:**

- A purely time-table based approach (Day 1: do X, Day 2: do Y). Rejected because it ignored skill-level variability — a beginner and an expert with the same number of days need fundamentally different plans.

---

## Prompt 4 — Offer Scoring: Normalization and Weights

**Prompt:**

I want to score offers on: CTC, growth potential, work-life balance, layoff rate, bond duration, location preference. How do I normalize mixed numeric and rating values? And what weights make sense?

**Search Queries Ran:**

- "min-max normalization mixed numeric and rating values"
- "weighted sum model job offer comparison"
- "inverse scoring negative criteria normalization"

**References That Influenced the Approach:**

- Wikipedia: Min-Max feature scaling
- Towards Data Science: "Multi-Criteria Decision Making with WSM"
- HR tech articles on offer evaluation frameworks

**What Was Accepted:**

- Min-max normalization for CTC across all offers simultaneously
- Rating scaling: `score = (rating / 5) × weight` for Growth and WLB
- Inverse scoring for layoff rate and bond duration (higher = worse for candidate)
- The two-step Add + Analyze flow to prevent CTC normalization from recalculating on every add

**What Was Modified:**

- AI initially suggested equal weights across all criteria. Adjusted to reflect real-world career priorities: Growth (28) > CTC (25) > WLB (20) > Layoff (15) > Location (12) > Bond (10).
- CTC normalization edge case for a single offer (defaults to midpoint 12/25 pts) was not in the original suggestion — added after identifying the edge case independently.

**What Was Rejected:**

- Suggestion to use logarithmic scaling for CTC. Rejected — added complexity without meaningful benefit for the dataset size.
- A single unified weight slider UI. Rejected to keep the system deterministic and non-technical-user-friendly.

---

## Prompt 5 — Flask Static Files Debugging

**Prompt:**

My CSS and JS are in the static folder but not loading. Getting 404. How exactly should I reference static files in Flask templates?

**Search Queries Ran:**

- "flask static files 404 error"
- "url_for static flask jinja2 template"
- "flask serve css js files correctly"

**References That Influenced the Approach:**

- Flask official documentation on static files and `url_for()`
- Stack Overflow threads on Flask 404 for static assets

**What Was Accepted:**

- Using `{{ url_for('static', filename='styles.css') }}` instead of relative paths in Jinja2 templates

**What Was Modified:**

- Reorganized static folder structure to separate CSS and JS into subfolders after fixing the initial 404

**What Was Rejected:**

- Suggestion to move static files to a CDN for serving. Rejected — unnecessary overhead for a local development project.

---

## Prompt 6 — OfferIQ UI Layout Design

**Prompt:**

Build the OfferIQ UI layout. Left: chat assistant panel. Right: offer input form. Below: ranked results. Make it structured and professional.

**Search Queries Ran:**

- "chat interface left panel right form layout CSS"
- "AI assistant UI design split panel"

**References That Influenced the Approach:**

- ChatGPT's own UI as the primary UX reference for the chat narration panel
- Dribbble designs for financial comparison dashboards

**What Was Accepted:**

- Three-zone layout: chat narration (left), offer input form (right), ranked results (below)
- Chat panel narrates the analysis as offers are added and scored

**What Was Modified:**

- AI suggested a static chat log. Changed to a dynamic, message-by-message rendering system so the OfferIQ assistant appears to "react" to each offer added.

**What Was Rejected:**

- Suggestion to use a modal popup for offer input. Rejected — inline form on the right panel keeps the experience faster and more focused.

---

## Prompt 7 — OfferIQ Two-Button Add + Analyze Flow

**Prompt:**

Right now when I click the button it adds and scores the offer at the same time. But the problem is if I add offers one by one the CTC normalization recalculates each time and the scores keep changing. Can I separate it into two buttons — one to just add the offer to a queue and another button called Analyze All that only appears after at least one offer is added and scores everything together at once?

**Search Queries Ran:**

- "deferred scoring queue pattern JavaScript"
- "analyze all button appears after items added UI pattern"

**References That Influenced the Approach:**

- UX patterns from e-commerce "cart then checkout" flows
- React state management docs on conditional rendering

**What Was Accepted:**

- Separated Add to Queue and Analyze All into two distinct actions
- Analyze All button renders conditionally only after at least one offer is queued
- All offers scored together in a single backend call to ensure normalization accuracy

**What Was Modified:**

- AI suggested keeping a running score preview while adding. Rejected in favour of a clean "reveal" moment when Analyze All is clicked, which creates a better UX.

**What Was Rejected:**

- Auto-analyzing on every add (original behavior). Rejected because CTC normalization requires the complete offer set to be meaningful.

---

## Prompt 8 — Dynamic Multi-Offer Support

**Prompt:**

Right now my code was only comparing two offers. I want it to work for any number of offers — like 3, 5, 10. The normalization should compare all of them together at the same time. How do I change the code to support a dynamic list instead of just two fixed offers?

**Search Queries Ran:**

- "dynamic array normalization Python min max"
- "variable number of items weighted scoring backend"

**References That Influenced the Approach:**

- Python documentation on list comprehensions for normalization
- Articles on scaling scoring functions from fixed-size to N inputs

**What Was Accepted:**

- Replaced all hardcoded two-offer comparisons with dynamic list iteration
- `min()` and `max()` computed across the full offers list at scoring time
- Backend now accepts any-length offers array via POST body

**What Was Modified:**

- AI's initial refactor still had a residual two-item assumption in the rank assignment. Fixed rank assignment to sort by descending score across N items.

**What Was Rejected:**

- Pagination of results for large offer lists. Rejected — unnecessary for realistic use (users rarely compare more than 6–8 offers).

---

## Prompt 9 — Placement Strategy Generator Backend

**Prompt:**

I want to build a placement strategy generator. The user fills in how many days are left, what tier of company they are targeting like FAANG or service or startup, their role like SDE or ML engineer, and their current skill levels for DSA, system design, communication and resume on a scale of 1 to 5. Based on all this it should generate a personalized study roadmap. How do I approach this?

**Search Queries Ran:**

- "personalized study plan generator weighted skill level algorithm"
- "placement preparation roadmap logic FAANG vs service"
- "adaptive learning system days remaining skill gap"

**References That Influenced the Approach:**

- Career prep blogs on FAANG study plans (NeetCode, TechInterview.pro)
- Academic articles on adaptive learning path generation

**What Was Accepted:**

- Mode-based approach: Deep (>90 days) / Balanced (>60) / Fast (>30) / Crash (≤30)
- Tier modifiers adjusting DSA, System Design, communication, and resume allocation weights
- Role-specific roadmap variation (SDE vs ML vs Analyst vs Consulting)

**What Was Modified:**

- AI initially proposed a linear day-by-day schedule. Replaced with a phase-based roadmap (Foundation → Core Practice → Mock Interviews) that groups days into meaningful blocks instead of listing tasks for every individual day.

**What Was Rejected:**

- Suggestion to use a decision tree structure for mode detection. Replaced with simple integer threshold comparisons — cleaner and more transparent for this use case.

---

## Prompt 10 — Weighted Readiness Score

**Prompt:**

I want to show the user how ready they are for placement as a percentage. It should be based on their 1–5 ratings for DSA, SD, communication and resume. But the weights of each skill should depend on the role — for consulting, communication matters more than DSA; for SDE it's the opposite. How do I implement this weighted readiness score?

**Search Queries Ran:**

- "role-based weighted skill score Python"
- "readiness percentage calculator skill gap formula"

**References That Influenced the Approach:**

- HR competency frameworks that assign different weights to skills by job function
- Academic papers on skill-gap analysis for hiring

**What Was Accepted:**

- Role-weight maps where each role defines different importance levels for DSA, SD, Communication, and Resume
- `readiness_score = Σ (skill_level_i / 5) × role_weight_i` formula
- Output as a percentage (0–100) with a descriptive label

**What Was Modified:**

- AI suggested a flat average across all skills as a fallback. Replaced with a default "balanced" weight map that applies when no specific role is matched, rather than a plain average.

**What Was Rejected:**

- Suggestion to show individual skill gap bars alongside the overall percentage. Deferred to a future UI enhancement — out of scope for v1.

---

## Prompt 11 — Moving Placement Logic from JS to Python

**Prompt:**

Right now all the placement engine logic is written in JavaScript inside placement.js. I want to move all the calculation logic to Python and just call it from JavaScript using fetch. How do I convert the JavaScript functions to Python Flask routes? And what should the request and response JSON look like for each route?

**Search Queries Ran:**

- "migrate JavaScript business logic to Python Flask API"
- "Flask REST API JSON request response structure"
- "fetch API call Flask backend JavaScript"

**References That Influenced the Approach:**

- Flask official documentation on `request.json` and `jsonify()`
- Articles on frontend-backend separation of concerns in full-stack apps

**What Was Accepted:**

- All scoring and roadmap logic moved to Python backend
- Frontend JavaScript now strictly handles UI rendering and `fetch()` API calls
- Clear JSON contracts defined for each route (inputs and outputs documented)

**What Was Modified:**

- AI suggested one large Flask route handling all placement logic. Split into separate routes (`/generate_placement_strategy`, `/get_day_tasks`) with dedicated Python modules for each concern.

**What Was Rejected:**

- Keeping any scoring logic as a JavaScript fallback. Rejected to ensure a single source of truth in the Python backend.

---

## Prompt 12 — Modular Python Package Architecture

**Prompt:**

I want to separate the placement Python code into different files instead of putting everything in one big file. Like one file for building the roadmap, one for calculating readiness, one for risk, one for daily tasks, one for tracking applications. How do I structure this as a Python package and import from one file into another?

**Search Queries Ran:**

- "Python package structure best practices Flask project"
- "modular Flask backend architecture"
- "__init__.py placement package Python"

**References That Influenced the Approach:**

- Python packaging documentation on `__init__.py` and relative imports
- Flask project structure guides (Application Factory pattern)

**What Was Accepted:**

- Created `placement/` as a Python package with a dedicated module for each concern:
  - `strategy_generator.py` (master coordinator)
  - `readiness_calculator.py`
  - `risk_assessor.py`
  - `roadmap_builder.py`
  - `task_pool_builder.py`
  - `day_task_generator.py`
  - `application_tracker.py`

**What Was Modified:**

- AI initially proposed a flat module structure with all files in the root directory. Moved all placement modules into a `placement/` subdirectory to keep the root clean and signal clear separation of concerns.

**What Was Rejected:**

- Suggestion to use a class-based architecture (e.g., `PlacementEngine` class). Rejected in favour of pure functions — simpler to test, easier to read, and no shared mutable state needed.

---

## Prompt 13 — Expanding OfferIQ into CareerOS

**Prompt:**

How do I convert OfferIQ into a full Career Companion System? Not just offer comparison. More like placement strategy, application tracking, daily planner, interview prep, resume assistant.

**Search Queries Ran:**

- "Career companion system"
- "job offer comparison site" (Google — to check existing systems)
- "job offer analysis system" (GitHub — checked for existing implementations)
- "Career OS product design"

**References That Influenced the Approach:**

- Existing career tools (LinkedIn, Notion career templates, Levels.fyi) reviewed for feature gap analysis
- GitHub repositories for job offer comparison apps reviewed for architecture patterns

**What Was Accepted:**

- Multi-page Flask architecture: index, offeriq, placement, interview, resume
- OfferIQ retained as a standalone module within the larger system
- Application Tracker as a new in-memory CRUD module
- Interview Prep and Resume Builder as lightweight JS-only modules for v1

**What Was Modified:**

- AI suggested a single-page application with tabs. Rejected in favour of separate Flask routes per module — each page has independent logic, state, and JS requirements.

**What Was Rejected:**

- Suggestion to integrate a third-party ATS (Applicant Tracking System) API. Rejected — the in-memory tracker covers the core need for v1 without external dependencies.

---

## Prompt 14 — Edge Case Identification

**Prompt:**

Can you go through the decision engine and the placement engine code and tell me what edge cases can break them? Like what happens if only one offer is added, what if someone has 5 days left and is targeting FAANG, what if all CTC values are the same. Give me the exact inputs and what the expected output should be. Also check if the task lists for each phase are fully written or if there are any gaps.

**Search Queries Ran:**

- "edge cases weighted normalization single value"
- "min max normalization all equal values"

**References That Influenced the Approach:**

- Software testing literature on boundary value analysis
- Personal review of each scoring formula for division-by-zero risks

**What Was Accepted:**

- Single offer → CTC defaults to midpoint (12/25 pts) since min-max cannot compare one value against itself
- All equal CTC values → each offer receives 12 pts (midpoint)
- days < 1 or days > 500 → validation error returned before processing
- Layoff rate outside 0–100 → backend rejects with error before scoring
- Bond duration = 0 → scores maximum 10 pts (no lock-in penalty)
- Expert DSA targeting service tier → roadmap shifts weight to communication and resume

**What Was Modified:**

- Some edge cases identified were already handled implicitly. Made handling explicit with clear validation error messages returned to the frontend.

**What Was Rejected:**

- Suggestion to add a "confidence score" alongside each result indicating how much the edge case affected the output. Rejected for scope — adds UI complexity without proportional user value in v1.

---

## Prompt 15 — Backend Integration Debugging

**Prompt:**

I'm getting a 500 error when generating strategy. Help me debug route existence, JSON mismatch, and KeyErrors. How can I verify whether the frontend, Flask backend, and decision engine are correctly integrated?

**Search Queries Ran:**

- "Flask 500 error debug KeyError JSON"
- "Flask backend frontend integration testing checklist"
- "Python KeyError strategy generator fix"

**References That Influenced the Approach:**

- Flask debugging documentation
- Stack Overflow threads on `KeyError` in Python dict access vs `.get()`

**What Was Accepted:**

- Using `.get()` with fallback defaults instead of direct key access on dicts that may have missing fields
- Adding test routes (`/test-score`, `/test-risk`, `/test-strategy`, `/test-roadmap`, `/test-taskpool`, `/test-day`) to isolate each module and verify integration independently
- Console logging request payloads at each Flask route entry point during debugging

**What Was Modified:**

- AI suggested a single `/debug` endpoint. Instead, created individual test routes for each module so each component can be verified in isolation.

**What Was Rejected:**

- Suggestion to use Flask's built-in debugger PIN in production. Rejected — debug mode is for local development only; the fix was applied to the code logic, not left as a runtime debug dependency.

---

## Prompt 16 — Session and State Management

**Prompt:**

Can I use a database only for the Application Tracker module and daily planner? Can I use session memory to store the daily planner data so that it doesn't disappear on each refresh?

**Search Queries Ran:**

- "Flask session storage vs database"
- "SQLite Flask application tracker simple setup"
- "in-memory vs persistent storage Flask v1 trade-off"

**References That Influenced the Approach:**

- Flask documentation on `session` object and server-side session storage
- Articles on progressive architecture: in-memory → SQLite → PostgreSQL upgrade path

**What Was Accepted:**

- In-memory storage accepted for v1 as a deliberate architectural decision — applications and strategy data are session-scoped
- Decision documented explicitly as a known limitation with a v2 upgrade path (SQLite or PostgreSQL + authentication)

**What Was Modified:**

- AI suggested Flask's client-side `session` cookie for daily planner data. Rejected in favour of passing strategy state back to the frontend as JSON and storing it in JS variables — avoids cookie size limits and keeps the backend stateless.

**What Was Rejected:**

- Partial database integration (database only for tracker, memory for the rest). Rejected to keep the architecture consistent — mixing storage strategies in v1 adds complexity without enough benefit to justify it.

---

## Summary Table

| Prompt | Topic | Accepted | Modified | Rejected |
|--------|-------|----------|----------|----------|
| 1 | Skincare System Exploration | Core scoring concept | Narrowed to oily skin | Skincare domain entirely |
| 2 | Domain Pivot | Quantifiable criteria principle | Explored college recommender | College recommender (data-heavy) |
| 3 | Placement Strategy Concept | Tier + role + days model | Expanded to readiness + risk + tasks | Static timetable approach |
| 4 | Offer Normalization + Weights | WSM + min-max + inverse scoring | Adjusted weight distribution | Log normalization, weight sliders |
| 5 | Flask Static Files Fix | `url_for()` pattern | Reorganized static folder | CDN for static files |
| 6 | OfferIQ UI Layout | Three-zone layout | Dynamic chat narration | Modal popup for offer input |
| 7 | Add + Analyze Two-Button Flow | Deferred scoring queue | Removed running score preview | Auto-analyze on every add |
| 8 | Dynamic Multi-Offer Support | N-item normalization | Fixed rank assignment | Pagination of results |
| 9 | Placement Roadmap Generator | Mode + tier + phase structure | Phase-based roadmap over daily list | Decision tree mode detection |
| 10 | Weighted Readiness Score | Role-weight maps + formula | Added balanced fallback weight map | Per-skill gap bars in UI |
| 11 | JS → Python Logic Migration | Full backend migration | Split into separate routes | JS scoring fallback |
| 12 | Modular Python Package | `placement/` package structure | Moved to subdirectory | Class-based architecture |
| 13 | OfferIQ → CareerOS Expansion | Multi-page Flask + modules | Multi-page over SPA | Third-party ATS integration |
| 14 | Edge Case Identification | 6 edge cases handled | Made handling explicit | Confidence score output |
| 15 | 500 Error Debugging | `.get()` + test routes | Individual test routes over `/debug` | Debug mode in production |
| 16 | Session + State Management | In-memory for v1, v2 upgrade path | JSON state over Flask session cookie | Mixed storage strategy |

