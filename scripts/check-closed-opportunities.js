const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(process.cwd(), "data", "opportunities");
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";
const MAX_SEARCHES = 5;

function readRecords() {
  return fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).flatMap((file) => {
    try {
      const record = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
      return [{ file, record }];
    } catch (error) {
      console.warn("Skipping invalid JSON", file, error.message);
      return [];
    }
  });
}

async function checkStatuses(records) {
  const prompt = [
    "You are checking whether existing US student and early-career job postings in PM Recruiting Hub are still accepting applications.",
    "Review the official job links below. Use web search only when needed to find the exact posting or its official ATS listing. Do not infer closure from age, search-result absence, a temporary website error, a 403, a 404 by itself, a redirect, or a page that will not load.",
    "Return a status change ONLY when there is job-specific evidence:",
    "- Closed: the official job page or official employer/ATS page explicitly says the role is closed, filled, expired, no longer accepting applications, or the application is unavailable with a clear job-specific closure notice.",
    "- Needs Review: there is a job-specific signal suggesting closure (for example, the exact listing is removed from the employer's active jobs page) but no definitive closure notice. Do NOT use this for generic access failures.",
    "- Otherwise omit the record and leave its current status unchanged.",
    "Never mark a role closed based only on an expired-looking URL or lack of search results. Prefer false negatives over false positives.",
    "Return ONLY valid JSON: an array of objects with file, status (exactly Closed or Needs Review), and evidence (brief explanation, ideally identifying the official page text or signal). Only return records that should change from their current status.",
    "Records: " + JSON.stringify(records.map(({file,record}) => ({
      file, company:record.company, role:record.role, currentStatus:record.status, link:record.link
    })))
  ].join("\n");

  const messages = [{ role: "user", content: prompt }];
  let response;
  for (let i = 0; i < 4; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES }]
      })
    });
    const body = await res.json();
    if (!res.ok) throw new Error("Anthropic API " + res.status + ": " + JSON.stringify(body).slice(0, 1200));
    response = body;
    if (body.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: body.content });
  }

  const output = (response.content || []).filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
  const first = output.indexOf("[");
  const last = output.lastIndexOf("]");
  if (first < 0 || last < first) throw new Error("Claude did not return a JSON array: " + output.slice(0, 1000));
  return JSON.parse(output.slice(first, last + 1));
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY. Add it as a GitHub Actions repository secret.");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const records = readRecords().filter(({record}) => record.status === "🟢 Open" || record.status === "Open");
  console.log("Open records to review:", records.length);

  if (!records.length) {
    fs.writeFileSync("closure-pr-body.md", "# Opportunity status review\n\nNo open records were found.\n");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "has_changes=false\n");
    return;
  }

  const suggestions = await checkStatuses(records);
  if (!Array.isArray(suggestions)) throw new Error("Claude response was not an array.");

  const byFile = new Map(records.map((entry) => [entry.file, entry]));
  const accepted = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const suggestion of suggestions) {
    if (!suggestion || !byFile.has(suggestion.file)) continue;
    if (!["Closed", "Needs Review"].includes(suggestion.status)) continue;
    const { record } = byFile.get(suggestion.file);
    if (record.status !== "🟢 Open" && record.status !== "Open") continue;

    record.status = suggestion.status === "Closed" ? "🔴 Closed" : "🟡 Needs Review";
    record.statusCheckedDate = today;
    record.statusEvidence = String(suggestion.evidence || "").slice(0, 500);
    fs.writeFileSync(path.join(DATA_DIR, suggestion.file), JSON.stringify(record, null, 2) + "\n");
    accepted.push({ ...suggestion, company: record.company, role: record.role, link: record.link });
  }

  const lines = [
    "# Opportunity status review",
    "",
    "Review the proposed status updates below. Nothing changes on main until this PR is merged.",
    "",
    "| Proposed status | Company | Role | Evidence |",
    "|---|---|---|---|"
  ];
  for (const item of accepted) {
    lines.push("| " + item.status + " | " + item.company.replace(/\|/g, "\\|") + " | [" + item.role.replace(/\|/g, "\\|") + "](" + item.link + ") | " + String(item.evidence || "—").replace(/\|/g, "\\|") + " |");
  }
  if (!accepted.length) lines.push("", "No sufficiently supported status changes were identified.");
  fs.writeFileSync("closure-pr-body.md", lines.join("\n") + "\n");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, "has_changes=" + String(accepted.length > 0) + "\n");
  console.log("Status changes proposed:", accepted.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
