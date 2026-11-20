const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = path.join(process.cwd(), "data", "opportunities");
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-5-5";
const MAX_SEARCHES = 5;

const normUrl = (value) => {
  try { const u = new URL(value); u.hash = ""; u.search = ""; return u.toString().replace(/\/$/, "").toLowerCase(); }
  catch { return String(value || "").trim().toLowerCase(); }
};
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "opportunity";

function readExisting() {
  return fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).flatMap((f) => {
    try { return [JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"))]; }
    catch (e) { console.warn("Skipping invalid JSON", f, e.message); return []; }
  });
}

async function discover(existing) {
  const known = existing.map(({company, role, link}) => ({company, role, link}));
  const prompt = [
    "You are researching opportunities for PM Recruiting Hub, a directory for US students and early-career professionals.",
    "Find currently open internships, co-ops, new-grad programs, and entry-level full-time jobs. Focus on US-based and US-remote opportunities.",
    "Prioritize: (1) APM, Product Management, Technical Product Management, TPM, Engineering Program Management, Product Operations; (2) Program Management, Product Development, Business Analyst, Business Operations; (3) Strategy, Corporate Strategy, Business Intelligence, Technical Business Analyst, and engineering/business hybrid roles when the work materially overlaps with product or cross-functional execution.",
    "Use up to five searches: APM/product management internships; TPM/program management internships; product operations/product development internships; business analyst/business operations/strategy early-career internships; new-grad and entry-level product/program/business roles.",
    "Only include roles that appear open now and suitable for students, recent graduates, or candidates with about 0-2 years of experience. Exclude senior roles, unrelated jobs, unpaid roles, aggregators, and generic careers pages.",
    "Use the direct official job application URL. Do not invent URLs, locations, dates, graduation requirements, or start terms. Be selective. Compare against the existing records to avoid duplicates.",
    "Return ONLY a valid JSON array with objects using this schema: " +
    '{"company":string,"role":string,"roleType":"APM"|"Product Management"|"Program Management"|"Product Operations"|"Product-Adjacent/Other","employmentType":"Internship"|"Co-op"|"New Grad"|"Full-time","locations":string[],"startTerm":string[],"link":"https://...","priority":"High"|"Medium"|"Low","matchReason":string}. ' +
    "High = first priority group; Medium = second; Low = third. Use [] for startTerm if not explicitly stated. Today's date is " + new Date().toISOString().slice(0,10) + ".",
    "Existing records (company, role, link): " + JSON.stringify(known)
  ].join("\n");

  const messages = [{role:"user",content:prompt}];
  let response;
  for (let i=0; i<4; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"content-type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:MODEL,max_tokens:6000,messages,tools:[{type:"web_search_20250305",name:"web_search",max_uses:MAX_SEARCHES}]})
    });
    const body = await res.json();
    if (!res.ok) throw new Error("Anthropic API " + res.status + ": " + JSON.stringify(body).slice(0,1200));
    response = body;
    if (body.stop_reason !== "pause_turn") break;
    messages.push({role:"assistant",content:body.content});
  }
  const output = (response.content || []).filter(b=>b.type==="text").map(b=>b.text).join("\n").trim();
  const first = output.indexOf("["); const last = output.lastIndexOf("]");
  if (first < 0 || last < first) throw new Error("Claude did not return a JSON array: " + output.slice(0,1000));
  return JSON.parse(output.slice(first,last+1));
}

function normalize(items, existing) {
  const urls = new Set(existing.map(x=>normUrl(x.link)));
  const titles = new Set(existing.map(x=>(String(x.company)+"|"+String(x.role)).toLowerCase().replace(/[^a-z0-9|]+/g,"")));
  const roleTypes = ["APM","Product Management","Program Management","Product Operations","Product-Adjacent/Other"];
  const employmentTypes = ["Internship","Co-op","New Grad","Full-time"];
  const today = new Date().toISOString().slice(0,10);
  const accepted = [];
  for (const x of items) {
    if (!x || !x.company || !x.role || !/^https:\/\//i.test(String(x.link||""))) continue;
    let u; try { u=new URL(x.link); } catch { continue; }
    if (!u.hostname.includes(".") || /(^|\.)(google|indeed|linkedin)\.com$/i.test(u.hostname)) continue;
    const urlKey=normUrl(x.link);
    const titleKey=(String(x.company)+"|"+String(x.role)).toLowerCase().replace(/[^a-z0-9|]+/g,"");
    if (urls.has(urlKey) || titles.has(titleKey)) continue;
    const item = {
      company:String(x.company).trim(), role:String(x.role).trim(),
      roleType:roleTypes.includes(x.roleType)?x.roleType:"Product-Adjacent/Other",
      employmentType:employmentTypes.includes(x.employmentType)?x.employmentType:"Internship",
      locations:Array.isArray(x.locations)&&x.locations.length?x.locations.map(String).slice(0,8):["Varies"],
      startTerm:Array.isArray(x.startTerm)?x.startTerm.map(String).slice(0,6):[],
      status:"🟢 Open", link:String(x.link).trim(), dateAdded:today,
      priority:["High","Medium","Low"].includes(x.priority)?x.priority:"Low",
      matchReason:String(x.matchReason||"").slice(0,400)
    };
    accepted.push(item); urls.add(urlKey); titles.add(titleKey);
  }
  return accepted;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY. Add it as a GitHub Actions repository secret.");
  fs.mkdirSync(DATA_DIR,{recursive:true});
  const existing=readExisting();
  console.log("Existing records:",existing.length);
  const found=await discover(existing);
  if (!Array.isArray(found)) throw new Error("Claude response was not an array.");
  const additions=normalize(found,existing);
  console.log("New records accepted:",additions.length);

  const body=["# Daily opportunity scan","","Scan date: "+new Date().toISOString().slice(0,10),"","Review these proposed records. Nothing is published until this PR is merged.","","| Priority | Company | Role | Category | Why it fits |","|---|---|---|---|---|"];
  for (const x of additions) {
    body.push("| "+x.priority+" | "+x.company.replace(/\|/g,"\\|")+" | ["+x.role.replace(/\|/g,"\\|")+"]("+x.link+") | "+x.roleType+" / "+x.employmentType+" | "+(x.matchReason||"—").replace(/\|/g,"\\|")+" |");
    const hash=crypto.createHash("sha1").update(x.link).digest("hex").slice(0,7);
    fs.writeFileSync(path.join(DATA_DIR,slug(x.company+"-"+x.role)+"-"+hash+".json"),JSON.stringify(x,null,2)+"\n");
  }
  fs.writeFileSync("scanner-pr-body.md",body.join("\n")+"\n");
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,"has_changes="+String(additions.length>0)+"\n");
  if (!additions.length) console.log("No PR needed today.");
}
main().catch(e=>{console.error(e);process.exit(1);});
