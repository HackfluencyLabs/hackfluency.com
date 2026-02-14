Minimal CTI Architecture — Signal/Assessment Separation + Quantified Risk Model
0. Objective

Build a minimal yet defensible Cyber Threat Intelligence (CTI) system capable of generating daily reports such as:

"Today we observed an increase in APT-related activity, correlated with exposed services identified via Shodan. The correlation strength is moderate (0.58), primarily driven by temporal proximity and service overlap. This pattern is consistent with opportunistic scanning rather than targeted exploitation."

The system must:

Separate raw signal from assessment

Quantify correlations numerically

Track baseline shifts

Score freshness

Expose risk computation logic

Classify threat type

Remain sequential and lightweight

1. Architectural Principles
Minimal Scope

Only:

X (social signal)

Shodan (infrastructure signal)

No external enrichment

No automatic CVE scraping beyond what appears in X posts

Sequential LLM Pipeline

Models process information in stages:

Collector → Signal LLM → Assessment LLM → Reporter LLM → Dashboard Formatter


LLMs may communicate in natural language internally.
Strict structured output is required only at final dashboard serialization.

2. Core Architectural Separation
2.1 Signal Layer (Immutable)

Signal contains raw and structured extraction only.

signals: {
  raw: {
    xPosts: [...],
    shodanResults: [...]
  },
  structured: {
    extractedCVE: [],
    domains: [],
    ips: [],
    ports: [],
    services: [],
    keywords: []
  }
}

Purpose

Preserve original data

Allow reassessment without re-collecting

Version analysis logic independently

2.2 Assessment Layer (Reprocessable)

Assessment operates strictly on signals.structured.

assessment: {
  correlation: {...},
  scoring: {...},
  baselineComparison: {...},
  freshness: {...},
  classification: {...},
  narrative: "..."
}

3. Baseline Comparison

Trend must be quantitative.

baselineComparison: {
  previousRiskScore: 72,
  delta: +16,
  anomalyLevel: "moderate"
}

Anomaly Level Logic (Example)
Delta	Level
< 5	stable
5–15	mild
15–30	moderate
> 30	severe
4. Quantified Correlation Model

Replace qualitative labels with numerical structure.

correlation: {
  score: 0.58,
  strength: "moderate",
  factors: {
    cveOverlap: 0.3,
    serviceMatch: 0.5,
    temporalProximity: 0.7
  }
}

Strength Mapping
Score	Label
< 0.3	weak
0.3–0.6	moderate
> 0.6	strong

This enables:

Reproducibility

Defensive explanation

Future ML substitution

5. Data Freshness Score

Critical for CTI validity.

dataFreshness: {
  socialAgeHours: 3.2,
  infraAgeHours: 1.1,
  freshnessScore: 0.87
}

Freshness Formula (Example)
freshnessScore = 1 - normalized_average(age)


Where:

< 6h → high freshness

6–24h → moderate

24h → stale

6. Indicator Statistics (Anti-Inflation Control)

Prevent LLM exaggeration.

iocStats: {
  uniqueCVECount: 15,
  uniqueDomainCount: 9,
  uniqueIPCount: 4,
  duplicationRatio: 0.18
}

Duplication Ratio
duplicationRatio = duplicates / totalIndicators


High duplication reduces confidence.

7. Risk Computation Transparency

Make scoring explainable and auditable.

riskComputation: {
  vulnerabilityRatioWeight: 0.4,
  socialIntensityWeight: 0.2,
  correlationWeight: 0.3,
  temporalWeight: 0.1,
  computedScore: 88
}

Example Score Formula
score =
  (vulnerabilityRatio * 0.4) +
  (socialIntensity * 0.2) +
  (correlationScore * 0.3) +
  (freshnessScore * 0.1)


This enables:

Academic publication

Monetization

Enterprise audit compliance

8. Threat Classification Layer

Currently your model implies:

Vulnerable infra + chatter = crisis

This must be formalized.

threatClassification: {
  type: "opportunistic" | "targeted" | "campaign",
  rationale: "..."
}

Classification Heuristics (Minimal)

Opportunistic

High exposed services

Low CVE specificity

Weak temporal alignment

Targeted

Specific CVE

Specific service

Strong correlation

Narrow infra scope

Campaign

Repeated signals

Strong temporal clustering

Multi-indicator overlap

Elevated delta vs baseline

9. Model Metadata Tracking

Necessary for benchmarking and credibility.

modelsUsed: {
  strategic: "model-name",
  technical: "model-name",
  quantization: "Q4_K_M"
}


Placed under:

ctiAnalysis: {
  generatedAt: "...",
  validUntil: "...",
  modelsUsed: {...}
}

10. Sequential LLM Responsibilities
10.1 Signal LLM

Input:

Raw X posts

Raw Shodan results

Output:

Structured extraction

No scoring

No conclusions

10.2 Assessment LLM

Input:

Structured signals

Previous baseline score

Output:

Correlation

Risk score

Classification

Narrative reasoning

10.3 Reporter LLM

Input:

Full assessment object

Output:

Human-readable CTI report

No new inference

Narrative only

10.4 Dashboard Serializer

Only here:

Enforce strict JSON schema

Validate fields

Attach metadata

Persist version

11. Context Optimization Strategy (20K Context Target)

To remain within ~20k tokens:

1. Compress X posts

Keep only:

Timestamp

Extracted CVEs

Extracted domains

Extracted keywords

Drop hashtags, emojis, filler text

2. Compress Shodan

Keep:

IP

Port

Service

Version

Drop banners unless CVE-related

3. Chunked Processing

Process X and Shodan separately

Merge only structured summaries

4. Avoid JSON Between LLMs

Natural language summaries reduce token overhead versus verbose schema enforcement mid-pipeline.

Strict schema is applied only at final output.

12. Final Report Structure (Dashboard Level)
{
  signals: {...},
  assessment: {
    correlation: {...},
    baselineComparison: {...},
    dataFreshness: {...},
    iocStats: {...},
    riskComputation: {...},
    threatClassification: {...},
    narrative: "..."
  },
  ctiAnalysis: {
    generatedAt: "...",
    validUntil: "...",
    modelsUsed: {...}
  }
}

13. What This Architecture Achieves

Signal preservation

Reprocessable intelligence

Numerical defensibility

Transparent scoring

Benchmark-ready metadata

Controlled LLM hallucination

Context-efficient execution

Minimal external dependency surface