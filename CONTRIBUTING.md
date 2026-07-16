# Contributing to PM Recruiting Hub

Thank you for helping keep this resource accurate and useful for the PM recruiting community! This repository only stays valuable because contributors like you add new listings, fix broken links, and remove expired postings.

You do **not** need to be a maintainer or an experienced open-source contributor to help. If you can fill out a Markdown table, you can contribute.

---

## Ways to Contribute

1. **Add a new opportunity** — a PM internship, APM program, TPM role, Product Ops role, or new grad position you found.
2. **Report an expired listing** — flag a row that no longer works so it can be removed or marked closed.
3. **Request a company** — ask the community to start tracking a company that isn't listed yet.
4. **Improve resources** — suggest edits to the recruiting timeline, resume guide, interview prep, or FAQ.
5. **Fix bugs** — broken links, formatting issues, typos, incorrect table structure.

---

## How to Submit an Opportunity

### Option A: Open an Issue (easiest, no Git required)

Use the [Add Opportunity issue template](.github/ISSUE_TEMPLATE/add-opportunity.md). Fill in the company, role, location, season, status, and link. A maintainer or contributor will open a PR to merge it in.

### Option B: Open a Pull Request (preferred for contributors comfortable with Git)

1. **Fork** this repository.
2. **Create a branch**: `git checkout -b add-<company>-<role>`
3. **Add your row** to the correct file(s) in `opportunities/` — see [Formatting Rules](#formatting-rules) below. A single opportunity typically belongs in:
   - The relevant **season** file (e.g. `summer-2027.md`)
   - The relevant **track** file (e.g. `product-management.md`, `apm-programs.md`, `technical-program-management.md`, `product-operations.md`, or `new-grad.md`)
4. **Commit** with a clear message: `Add Apple Product Manager Intern - Summer 2027`
5. **Open a pull request** using the [PR template](.github/pull_request_template.md).

---

## Formatting Rules

To keep tables clean and scannable, please follow these rules exactly:

- **One row per opportunity.** Do not combine multiple roles into a single row.
- **Columns, in order:** `Company | Role | Location | Recruiting Season | Application Status | Link`
- **Company names**: use the official company name (e.g. "Meta", not "Facebook").
- **Role titles**: use the exact title from the job posting when possible.
- **Location**: `City, State` for US roles, `City, Country` for international, or `Remote (Region)` for remote roles.
- **Recruiting Season**: one of `Fall 2026`, `Spring 2027`, `Summer 2027`, or `New Grad`.
- **Application Status**: use the emoji legend below — do not invent new symbols.

| Symbol | Meaning |
|---|---|
| 🟢 | Open |
| 🟡 | Opening Soon |
| ⚪ | Not Yet Open |
| 🔴 | Closed |

- **Link**: link directly to the official application page. If you don't have a working link, write `_add link_` as a placeholder — **never invent or guess a URL.**
- **Sort order**: keep tables alphabetized by Company name where possible.
- **No duplicate rows.** Search the relevant file before adding — if the opportunity already exists, update its status instead of adding a duplicate.

---

## Reporting Expired Listings

If you find a listing that no longer works:

1. Open a [Report Expired issue](.github/ISSUE_TEMPLATE/report-expired.md), **or**
2. Open a PR that changes the row's status to 🔴 **Closed**, or removes the row entirely if the recruiting cycle has fully ended.

Please do not silently delete rows without flagging them — leaving a 🔴 Closed status for a short period helps other contributors confirm the change.

---

## Pull Request Guidelines

- Keep PRs focused — one company/role addition or one clear fix per PR when possible. Batch PRs for multiple new listings are fine if each row is clearly separated.
- Use a descriptive title, e.g. `Add Stripe Product Manager Intern - Summer 2027` or `Fix broken link for Adobe PM Intern`.
- Fill out the [pull request template](.github/pull_request_template.md) completely.
- Double-check Markdown table formatting renders correctly (preview your changes before submitting).
- Be patient — this is a volunteer-maintained project, and review times may vary.

---

## Style & Tone

- Keep resource pages (timeline, resume, interview, networking, FAQ) practical and concise — favor bullet points over long paragraphs.
- Use emojis sparingly and only where they aid scanning (status indicators, section headers).
- Avoid promotional language for any single company, course, or paid service.
- Do not add referral links, affiliate links, or paid placements.

---

## Questions?

Open an issue with your question, or start a discussion if the repository has GitHub Discussions enabled. We're glad you're here — happy recruiting! 🚀
