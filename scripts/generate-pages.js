const fs = require("fs");
const path = require("path");

const opportunitiesFolder = "./data/opportunities";

const opportunities = fs
  .readdirSync(opportunitiesFolder)
  .filter(file => file.endsWith(".json"))
  .map(file => {
    const filePath = path.join(opportunitiesFolder, file);

    return JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
  });

console.log(opportunities);

function generatePages() {

  const pages = {};

  function createTableRow(job) {
    const term = job.startTerm || "";

    return `| ${job.company} | ${job.role} | ${job.locations.join("; ")} | ${term} | ${job.status} | ${job.link} |`;
  }

  opportunities.forEach((job) => {

    const destinations = [
      job.roleType,
      job.employmentType
    ].filter(Boolean);

    destinations.forEach((page) => {

      if (!pages[page]) {
        pages[page] = [];
      }

      pages[page].push(createTableRow(job));

    });

  });

  console.log("FINAL PAGES:", JSON.stringify(pages, null, 2));
  Object.keys(pages).forEach((page) => {

    const filename = page
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll("/", "-");

    const content = `# ${page}

| Company | Role | Location | Start Term | Application Status | Link |
|---|---|---|---|---|---|
${pages[page].join("\n")}

---

⬅️ [Back to README](../README.md)
`;

    fs.writeFileSync(
      `./opportunities/${filename}.md`,
      content
    );

    console.log(`Generated ${filename}.md`);

  });
}

  generatePages();

console.log("DONE RUNNING GENERATOR");

