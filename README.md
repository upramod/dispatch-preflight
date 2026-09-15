# Dispatch Preflight

A safety-focused browser prototype for small plumbing, HVAC, and moving companies.

Dispatchers receive temporary street restrictions in messy municipal notices. Dispatch Preflight keeps the workflow explicit:

**Extract → Approve → Execute**

- AI-assisted extraction identifies street names, cross streets, dates, and time windows.
- A dispatcher reviews the extracted facts beside the source notice.
- Only approved restrictions can affect a job evaluation.
- Deterministic TypeScript maps declared test addresses to street segments and evaluates time overlap.

The overlap rule is:

```text
job_start < restriction_end AND job_end > restriction_start
```

The prototype returns **Potential overlap**, **No overlap found**, or **Cannot determine**. Missing or ambiguous information produces **Cannot determine** and requires manual review.

## Run locally

```bash
npm install
npm run dev
```

Run tests and a production build:

```bash
npm install
npm test
npm run build
```

## Scope and safety

This demo uses synthetic municipal notices, a fictional neighborhood, and declared address mappings. It does not provide routing, guarantee legal parking, invent alternate locations, infer missing addresses, or fill gaps in restriction information.

## Demo path

1. Review the synthetic municipal bulletin.
2. Approve the extracted Cedar Ave restriction.
3. Select each scheduled job.
4. Observe the deterministic result, including manual review for the unmapped address.
