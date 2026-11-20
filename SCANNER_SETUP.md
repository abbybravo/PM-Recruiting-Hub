# Daily Opportunity Scanner Setup

The scanner runs daily at 14:00 UTC (8:00 AM Houston time during CST; 9:00 AM during daylight time).

## One-time setup

1. In the Claude Console, confirm API access and enable the web search tool for your organization.
2. In this GitHub repository, open Settings → Secrets and variables → Actions.
3. Select New repository secret.
4. Name it exactly ANTHROPIC_API_KEY and paste your Claude API key as the value. Never commit the key or paste it into source files.
5. Ensure GitHub Actions is enabled for the repository.

## How it works

- Claude Haiku searches for currently open student and early-career opportunities.
- The scanner prioritizes APM, Product Management, TPM, Program Management, and Product Operations, then includes relevant adjacent business and technical roles.
- It compares discoveries with existing JSON records, validates required fields, and writes only new records.
- If new records are found, GitHub Actions opens a draft pull request. It never writes directly to main.
- After you review and merge a PR, the existing Generate Opportunity Pages workflow updates the README and opportunity pages.

## Cost guardrails

Each daily scan allows at most five Claude web searches. Anthropic currently prices web search at $10 per 1,000 searches, in addition to model token usage. Web search is therefore capped at about $0.05 per daily run; model token costs are additional and usage varies. Review API usage in the Claude Console.

## Manual test

After adding the secret and merging the setup PR, open Actions → Daily Opportunity Scanner → Run workflow to trigger a one-off test. The first run may return no PR if it finds no new postings that pass the quality checks.
