# BUILD_PROCESS.md

## 1. How I Started

The project began with a personal goal:  
I wanted to build a system that could help solve real-life decision-making problems in a structured way.

In daily life, I often struggled to make decisions when multiple factors were involved. I wanted to move away from intuition-based decisions and instead create a system that evaluates options using weighted, logical criteria.

My first idea was to build a **Skincare Companion System**, since choosing skincare products suitable for my skin type was difficult and overwhelming.

---

## 2. How My Thinking Evolved

### Phase 1: Skincare Companion (Too Broad)

I realized skincare is an extremely broad and sensitive domain:
- Multiple skin types
- Ingredient compatibility
- Allergies and medical considerations
- Environmental factors
- Seasonal variations

The problem was highly qualitative and medically dependent.  
Assigning reliable weights to such attributes would require deep domain research.

---

### Phase 2: Skincare for Oily Skin (Still Complex)

To reduce complexity, I narrowed it to skincare for oily skin.

However, even within oily skin:
- Severity differs
- Acne-prone vs non-acne-prone
- Sensitivity variations
- Hormonal and environmental impact

It became clear that even this reduced scope required complex qualitative evaluation. Quantifying these factors meaningfully within time constraints was unrealistic.

---

### Phase 3: College Recommender System

Next, I considered building a college recommender system.

This would require:
- NAAC accreditation data
- NIRF rankings
- Placement statistics
- Faculty ratios
- Infrastructure quality

The challenge was large-scale data collection and maintaining updated datasets. Due to time limitations and data dependency, I dropped this idea.

---

### Phase 4: Placement Strategy System

Then I thought of building a placement strategy system:
- Product-based companies → DSA focus
- Service-based companies → fundamentals + communication
- Startup roles → project depth

However, this required:
- Mapping hiring patterns
- Historical interview data
- Company-specific weighting logic

The factors were difficult to quantify objectively. It again leaned heavily on qualitative interpretation.

---

### Final Direction: Offer Analysis System (OfferIQ)

At this point, I identified the core theme across all ideas:

Structured decision-making using quantifiable weighted factors.

Job offer comparison was ideal because:
- Salary is numeric
- Layoff rate can be quantified
- Bond duration is measurable
- Growth potential and work-life balance can be scaled
- Location preference can be ranked

This domain allowed normalization, deterministic scoring, and transparent evaluation.

It was technically feasible within time constraints.

---

## 3. Alternative Approaches Considered

1. Fully AI-driven recommendation system  
   - Rejected because it would behave like a black box.
   - Career decisions require transparency.

2. Rule-based yes/no elimination model  
   - Too rigid.
   - Does not allow nuanced comparison.

3. Ranking without normalization  
   - Unfair comparisons (e.g., salary dominating everything).

4. Direct AI score prediction  
   - Lacked explainability.
   - Not deterministic.

Final choice:
Deterministic weighted scoring with normalization.

---

## 4. Refactoring Decisions

During development, several improvements were made:

- Separated normalization logic into `normalizer.py`
- Kept scoring logic inside `decision_engine.py`
- Refactored variable names for clarity (used `offer` instead of short forms)
- Implemented inverse scoring for risk-related attributes
- Converted from fixed two-offer comparison to dynamic multi-offer list
- Added explanation generation for the highest-ranked factor

This improved modularity, readability, and maintainability.

---

## 5. Mistakes and Corrections

- Used incorrect keyword (`invert` instead of `reverse`) in sorting — corrected.
- Faced static file loading issues in Flask — fixed project structure.
- Initially mixed logic and UI before modularizing backend.
- Overestimated complexity of early ideas (skincare, college recommender).
- Initially tried to include too many features before stabilizing core logic.

Each mistake helped clarify scope and improve structure.

---

## 6. What Changed During Development and Why

1. Scope Reduction  
   Moved from broad, domain-heavy systems to a structured, quantifiable problem.

2. Deterministic over AI-driven  
   Chosen to ensure transparency and explainability.

3. Modular Architecture  
   Separated backend logic from UI to maintain clean structure.

4. Multi-offer Support  
   Upgraded from static comparison to scalable ranking.

5. Explanation Layer  
   Added to improve interpretability of rankings.

The system evolved from an abstract “decision helper” concept to a focused, deterministic Offer Analysis Engine.

---

## Conclusion

The development process demonstrates iterative refinement, scope control, and engineering discipline.

The final system reflects:
- Clear quantification strategy
- Transparent scoring
- Structured architecture
- Practical decision support within realistic constraints