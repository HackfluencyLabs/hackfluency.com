# Hackfluency Research

**Website:** [hackfluency.com](https://www.hackfluency.com)

Propietary codebase for the Hackfluency Research website, including the LLM Behavioral Security Assessment Tool (HF-QA-2026-001), research publications, and consulting services.

## Repository Structure

```
src/
├── pages/
│   └── research/
│       └── security-qa/          # LLM Security Assessment Tool
│           ├── index.astro        # The questionnaire (public, freely usable)
│           ├── faq/index.astro    # FAQ + benchmarks (public with attribution)
│           └── report/index.astro # Research report (email-gated)
├── components/                    # Website UI components
├── layouts/                       # Page layouts
├── i18n/                          # Internationalization (EN/ES)
└── lib/                           # Utilities (Supabase, subscriptions)
```

## LLM Security Assessment Tool

The questionnaire at `/research/security-qa/` is intentionally public — it is designed to be shared, copied, and pasted into AI chat interfaces. This is the tool's core functionality.

**Usage:** Copy the questionnaire URL or plain text, paste into any LLM, observe the behavioral audit results.

**No data is collected.** The tool has no backend, no forms, no analytics.

## License

**All Rights Reserved** — see [LICENSE](./LICENSE).

- The website codebase, design, visual identity, and editorial content are proprietary.
- The LLM Security Assessment Tool (questionnaire text) is freely usable.
- Research content (FAQ, benchmarks, report) may be shared with attribution.
- Cloning, reproducing, or commercializing the website or its content without authorization is prohibited.

## Contact

[hackfluency.com](https://www.hackfluency.com)
