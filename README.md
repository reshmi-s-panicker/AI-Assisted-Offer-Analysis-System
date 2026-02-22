
# OfferIQ : AI-Assisted Offer Analysis System
---
OfferIQ is a web-based decision support system designed to help users compare multiple job offers in a structured and transparent way.

It combines user-defined priorities with deterministic multi-criteria evaluation logic to generate a ranked recommendation.


## 1. Problem Understanding

Choosing between job opportunities is often challenging because each offer differs across several dimensions such as salary, growth potential, job stability, work-life balance, and long-term prospects. Additionally, different individuals prioritize these factors differently.

This is a structured multi-criteria decision problem with subjective weighting and mixed qualitative-quantitative attributes.
Without a structured approach, such decisions often rely on incomplete comparisons or emotional bias.

---
## 2. Introducing OfferIQ

OfferIQ addresses this complexity by combining user-defined priorities with a deterministic evaluation model. While AI may be used to gather contextual company insights, the final decision-making process is governed by transparent mathematical logic rather than black-box AI judgment.
This transforms an unstructured personal decision into a structured evaluation process.


The goal of OfferIQ is not to replace human decision-making, but to provide a structured framework that reduces bias, increases clarity, and supports rational career choices.

        
### 2.1  OfferIQ is intended for:

- Final-year students comparing placement offers  
- Professionals evaluating multiple job opportunities  
- Individuals seeking a structured approach to career decision-making  

It is particularly useful for users who want to reduce emotional bias and make rational decisions.

---
### 2.2 OfferIQ supports the decision:

> “Which job offer should I choose based on what matters most to me?”

Instead of focusing on a single factor (such as salary), it evaluates offers across multiple weighted criteria.

---


## 3. Scope Definition

### 3.1 In Scope
- Accepts multiple job offers as input
- Allows users to define decision criteria
- Allows users to assign importance (weights) to each criterion
- Uses AI to fetch structured company insights (optional)
- Applies deterministic weighted scoring
- Provides a ranked recommendation
- Explains why a particular offer ranks highest
  
### 3.2 Out of Scope
- It does not automatically make decisions for the user
- It does not rely entirely on AI-generated judgments
- It does not predict long-term career success
- It does not replace professional career counseling
---

## 4. System Overview

### 4.1. High-Level Architecture

OfferIQ is composed of the following modules:

1. Input Layer
2. AI-Assisted Insight Module
3. Normalization Module
4. Deterministic Scoring Engine
5. Ranking & Explanation Module


The system separates information gathering (AI) from decision logic (deterministic scoring).

---

### 4.2 Responsibility Separation
- AI handles contextual data retrieval
- Deterministic engine handles evaluation
- Output remains explainable
- The decision engine remains independent of the AI module.
---

## 5. AI Usage Justification

### 5.1 AI as Assistant
OfferIQ follows a hybrid approach:

- AI is used for contextual information retrieval.
- Deterministic logic is used for evaluation and ranking.
- The deterministic scoring engine ensures that the same input always produces the same output.
- AI assists — it does not decide.
- AI outputs are parsed and transformed into structured inputs before being passed to the scoring engine.
  
This ensures both intelligence and transparency in the decision-making process.

### 5.2 Why Not Fully AI?
The system does not rely entirely on AI because:

- AI responses may vary across calls  
- AI may provide incomplete or outdated information  
- AI-based decision-making can become a black box  
- Important career decisions require transparency and explainability  


---
## 6. Evaluation Criteria Definition

OfferIQ evaluates job offers using the following structured criteria. Each criterion is either quantitative (numeric) or qualitative (scaled 1–5) and is converted into a normalized scoring format before weighted evaluation.

---

### 6.1 CTC (Cost to Company) – Numeric

**Type:** Quantitative  
**Input Format:** Annual compensation (e.g., 10 LPA, 15 LPA)  
**Evaluation Method:** Min-max normalization across all offers  

CTC represents the total financial compensation offered by the company. Since compensation values vary widely across offers, CTC is normalized to a 1–5 scale to ensure fair comparison.

Higher CTC → Higher normalized score.

---

### 6.2 Growth Opportunity – 1 to 5 Scale

**Type:** Qualitative (User Scored)  
**Input Format:** Integer (1–5)  

Represents career progression potential, promotion opportunities, and long-term advancement within the organization.

Scale interpretation:

- 5 → Strong growth potential  
- 3 → Moderate growth  
- 1 → Limited growth  

Higher growth rating → Higher score.

---

### 6.3 Work-Life Balance – 1 to 5 Scale

**Type:** Qualitative (User Scored)  
**Input Format:** Integer (1–5)  

Represents expected workload, flexibility, stress level, and work-hour balance.

Scale interpretation:

- 5 → Excellent work-life balance  
- 3 → Moderate balance  
- 1 → Poor balance  

Higher work-life balance rating → Higher score.

---

### 6.4 Layoff Rate – Percentage (Inverse Scoring)

**Type:** Quantitative (Risk Indicator)  
**Input Format:** Percentage (%) or categorized risk level  

Represents recent workforce reduction trends in the company.

Since higher layoff rates indicate higher risk, scoring is inversely proportional.

Lower layoff rate → Higher score  
Higher layoff rate → Lower score  

If percentage-based, values are normalized and inverted before scoring.

---

### 6.5 Bond Duration – Months (Inverse Scoring)

**Type:** Quantitative (Constraint Indicator)  
**Input Format:** Number of months  

Represents the mandatory service period required before leaving the company.

Since longer bond durations reduce flexibility, scoring is inversely proportional.

Shorter bond duration → Higher score  
Longer bond duration → Lower score  

Bond duration is normalized and inverted before scoring.

---

### 6.6 Location Preference – 1 to 5 Scale

**Type:** Qualitative (User Preference)  
**Input Format:** Integer (1–5)  

Represents how desirable the job location is to the user.

Scale interpretation:

- 5 → Highly preferred location  
- 3 → Acceptable  
- 1 → Undesirable  

Higher preference rating → Higher score.

---

### Scoring Standardization

All criteria are converted to a unified 1–5 scoring scale before weighted evaluation. This ensures consistency and fairness across both quantitative and qualitative inputs.

The final ranking is computed using a deterministic weighted scoring model.

### Note on Criteria Scope

Due to time constraints and the scope of this implementation , the system currently evaluates a limited set of core criteria:

- CTC
- Growth Opportunity
- Work-Life Balance
- Layoff Rate
- Bond Duration
- Location Preference

These criteria were selected to balance decision relevance with implementation clarity.

The architecture of OfferIQ has been intentionally designed to be extensible. The deterministic scoring engine supports the addition of new criteria without structural modification to the core evaluation logic.

In future iterations, additional factors such as company culture, business model stability, role alignment, learning ecosystem, market positioning, and long-term career trajectory can be incorporated to make the system more comprehensive and robust.

The current implementation focuses on establishing a scalable and explainable decision framework, which can be expanded in subsequent versions.

## 7. Deterministic Decision Engine

### 7.1 Overview

The core of OfferIQ is a deterministic weighted scoring engine.  
The engine evaluates each job offer using normalized criteria values and user-defined importance weights.

The same input will always produce the same output, ensuring transparency and reproducibility.

---

### 7.2 Processing Flow

The engine follows these steps:

1. Extract numeric criteria (CTC, layoff rate, bond duration).
2. Apply min-max normalization to scale values between 1 and 5.
3. Invert risk-based criteria (layoff rate, bond duration).
4. Combine normalized values with qualitative ratings.
5. Apply weighted scoring using user-defined weights.
6. Rank offers based on total score.
7. Generate explanation based on contribution analysis.

---

### 7.3 Normalization Strategy

Numeric values are normalized using min-max scaling:

Score = 1 + ((value - min) / (max - min)) × 4

For risk-based criteria:

Score = 1 + (1 - normalized_value) × 4

This ensures:
- All criteria share a uniform 1–5 scale.
- Lower risk produces higher scores.
- Fair comparison across offers.

---

### 7.4 Weighted Scoring Model

The final score for each offer is calculated as:

Final Score = Σ (Criterion Score × Criterion Weight)

Where:
- Criterion Score ∈ [1, 5]
- Weight is user-defined importance
- Higher total score indicates stronger alignment with user priorities

---

### 7.5 Ranking Logic

Offers are ranked in descending order based on total score.

The ranking is fully deterministic and independent of AI output.

---

### 7.6 Explanation Generation

To improve transparency, the engine calculates contribution values for each criterion:

Contribution = Criterion Score × Weight

The highest contributing factor is identified and included in the final explanation.

This ensures the system remains interpretable and not a black-box evaluator.

---

### 7.7 Design Principles

- Deterministic computation
- Modular structure
- Scalable to additional criteria
- Clear separation from AI modules
- Transparent mathematical logic

More details will be added as development progresses.
